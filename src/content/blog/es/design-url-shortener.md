---
title: "Diseña un acortador de URL: codificación, almacenamiento, caché, redirecciones y escala"
description: "Un diseño de acortador de URL listo para producción: cálculo de capacidad, IDs por bloques arrendados con mezcla Feistel, códigos Base62, una ruta de redirección que prioriza la caché, el dilema 301 frente a 302, analítica de clics asíncrona, controles contra abusos y los modos de fallo que de verdad te despiertan."
date: "2026-04-02"
tags: [Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/design-url-shortener.webp
previewImage: /assets/images/design-url-shortener.webp
---

> **TL;DR**
> * **El problema:** Un acortador son dos rutas con formas muy distintas: una ruta de creación poco frecuente y de escritura, y una ruta de lectura que puede ser 100 veces más caliente, sensible a la latencia y lo único que los usuarios notan de verdad.
> * **El diseño:** Generar IDs a partir de bloques arrendados de 1M, mezclarlos con una red Feistel, codificarlos en 7 caracteres Base62, guardar `code -> url` en un almacén particionado por código y servir las redirecciones desde CDN y Redis, con la base de datos como ruta de fallo de caché. La analítica de clics sale de la ruta caliente a través de una cola.
> * **El resultado:** Una escritura en base de datos por cada millón de enlaces para asignar IDs, un p99 de redirección por debajo de 20 ms en el borde, una analítica que puede retrasarse o perder eventos sin frenar nunca una redirección, y una respuesta clara para cada modo de fallo.

Todas las listas de entrevistas de diseño de sistemas tienen un acortador de URL cerca del principio, y la mayoría de artículos lo tratan como un calentamiento. No lo es. Es uno de los ejemplos más limpios de un sistema donde **la ruta de lectura y la de escritura merecen arquitecturas distintas**, y donde decisiones pequeñas (qué código de redirección usar, dónde vive un contador) deciden si el sistema sobrevive a un enlace que se vuelve viral.

Este artículo lo diseña como lo haría para producción y luego señala qué cambia en una entrevista.

---

## Requisitos y las cifras que los moldean

**Funcionales**

1. `POST /links` recibe una URL larga y devuelve una corta. Alias personalizado y caducidad opcionales.
2. `GET /{code}` redirige a la URL larga, o devuelve 404 si el código no existe, ha caducado o se ha retirado.
3. Los propietarios pueden ver el número de clics. Aproximado y con algo de retraso es aceptable.

**No funcionales**

* Las redirecciones deben ser rápidas y muy disponibles. Un enlace corto roto lo ve todo el que hace clic.
* Cuando una creación devuelve `201`, la asignación no puede perderse jamás. El usuario ya ha pegado el enlace en algún sitio.
* Los códigos no deben poder enumerarse trivialmente.

**Cálculo rápido**

| Supuesto | Valor | Derivado |
| --- | --- | --- |
| Enlaces nuevos al mes | 100M | ~40 escrituras/s de media, ~400/s en un pico de 10x |
| Relación lectura:escritura | 100:1 | ~4.000 redirecciones/s de media, ~40.000/s en pico |
| Tamaño de fila (código, URL, propietario, fechas, estado) | ~500 bytes | ~50 GB/mes, ~3 TB en 5 años |
| Conjunto caliente | ~20% de los enlaces recibe ~80% de los clics | Unos pocos GB de `code -> url` caben de sobra en Redis |
| Espacio de códigos con 7 caracteres Base62 | 62^7 ≈ 3,5 billones | Margen para siglos a 100M al mes |

De esta tabla salen dos cosas de inmediato. El almacenamiento no es lo difícil: 3 TB es una base de datos modesta. Y la ruta de redirección es mucho más un problema de caché que de base de datos.

---

## La arquitectura

![Arquitectura de alto nivel del acortador: clientes que hacen clic y que crean enlaces, CDN y API gateway, servicios de redirección y creación, caché Redis, base de datos de asignaciones particionada, cola de eventos de clic y agregados de analítica](/assets/images/hld/design-url-shortener-architecture.webp)

Recórrela de izquierda a derecha.

* **Quien hace clic / quien crea.** Dos clientes muy distintos. Quienes hacen clic son anónimos, globales e impacientes. Quienes crean son usuarios autenticados o integraciones de API, muchos menos.
* **CDN Edge.** Termina TLS cerca del usuario y puede cachear las respuestas de redirección de los códigos populares. Con un enlace viral, la mayoría de los clics no deberían llegar nunca a tu origen.
* **API Gateway.** Autentica a quienes crean, aplica límites de creación por usuario y por IP y rechaza cargas enormes o malformadas antes de que cuesten nada.
* **Redirect Service.** Un servicio diminuto y sin estado con un único trabajo: resolver un código y devolver una redirección. Lee primero Redis, recurre a la base de datos si falla la caché y lanza un evento de clic sin esperarlo.
* **Create API.** Valida la URL (lista blanca de esquemas, límite de longitud, comprobación de listas negras), toma el siguiente ID de su bloque arrendado, lo codifica e inserta la asignación.
* **ID Range Allocator.** Reparte bloques de un millón de IDs a los pods de Create API. Se toca una vez por cada millón de enlaces, así que puede ser una sola fila en una base relacional aburrida.
* **Redis (`code -> url`).** La caché caliente. Las entradas tienen TTL, y los resultados "no encontrado" se cachean brevemente para que los escáneres no machaquen la base de datos.
* **Mappings DB.** La fuente de verdad, particionada por código. Cada búsqueda de redirección es una lectura por clave primaria sobre `code`, el único patrón de acceso que este sistema debe abaratar.
* **Click Events, Rollup Workers, Click Counts.** Las redirecciones emiten eventos a un log (Kafka, Kinesis o similar). Los workers los agregan en recuentos por enlace y día en un almacén OLAP. Si todo este bloque se incendia, las redirecciones siguen funcionando.

La nota verde del diagrama es el contrato: menos de 20 ms de p99 en el borde y menos de 50 ms cuando la petición tiene que ir a Redis o a la base de datos.

---

## Generar códigos: bloques arrendados, mezcla Feistel y Base62

Hay tres formas habituales de producir un código corto:

| Enfoque | Cómo funciona | Ventaja | Inconveniente |
| --- | --- | --- | --- |
| Hash de la URL | SHA-256 de la URL, tomar los primeros 40 bits, pasarlos a Base62 | La misma URL puede dar el mismo código | Las colisiones exigen reintentos; dos usuarios compartiendo código mezclan propiedad y analítica |
| Código aleatorio | 7 caracteres Base62 aleatorios, inserción con restricción única | Imposible de adivinar | Reintentos por colisión; cada creación es una comprobación de unicidad contra toda la tabla |
| Contador + codificación | Entero único y luego Base62 | Sin colisiones ni reintentos | Los códigos secuenciales se pueden enumerar si no se mezclan |

Prefiero el contador, con dos mejoras.

![Asignación de IDs: un contador de bloques arrienda rangos de un millón de IDs a los pods de creación, que pasan por una mezcla Feistel y una codificación Base62 para producir un código de 7 caracteres](/assets/images/hld/design-url-shortener-id-blocks.webp)

**Bloques arrendados.** Un único contador global sería una fila caliente. En su lugar, cada pod de Create API arrienda un bloque de un millón de IDs (`UPDATE counter SET next = next + 1000000 RETURNING next`) y los reparte desde memoria. Es una escritura en base de datos por cada millón de enlaces. Si un pod se cae, el resto de su bloque simplemente no se usa. Los huecos están bien; los duplicados no.

**Mezcla Feistel.** Los IDs secuenciales producen códigos secuenciales, lo que hace trivial enumerar todos los enlaces. Una red Feistel es una permutación reversible con clave sobre un ancho de bits fijo: cada entrada de 40 bits se corresponde con exactamente una salida de 40 bits, así que se conserva la unicidad, pero los vecinos dejan de parecer vecinos. No es secreto criptográfico. Es una ofuscación barata que elimina el ataque de scraping más sencillo.

**Base62.** `0-9a-zA-Z` es seguro en URL sin escapar. Un espacio de 40 bits (unos 1,1 billones de IDs, unos 900 años a 100M de enlaces al mes) cabe en 7 caracteres Base62, porque 62^7 es unos 3,5 billones. Un espacio de 42 bits no cabría: 2^42 es unos 4,4 billones, y su cuarto superior se desbordaría a 8 caracteres.

```python
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
HALF_BITS, MASK = 20, (1 << 20) - 1  # 40-bit permutation, always < 62**7

def feistel(n: int, keys=(0x5bd1e, 0x1b873, 0x2f1d3)) -> int:
    left, right = n >> HALF_BITS, n & MASK
    for k in keys:
        left, right = right, left ^ (((right * 0x9E3779B1) ^ k) & MASK)
    return (left << HALF_BITS) | right

def encode(n: int, width: int = 7) -> str:
    out = []
    while n:
        n, r = divmod(n, 62)
        out.append(ALPHABET[r])
    return "".join(reversed(out)).rjust(width, "0")

code = encode(feistel(8_000_123))  # 7 chars, unique per ID
```

**Los alias personalizados** van a la misma columna `code` con la misma restricción única, tras comprobar palabras reservadas (`api`, `admin`, `login`, `health`) y pasar un filtro de lenguaje ofensivo y suplantación.

---

## Almacenamiento

El esquema es aburrido a propósito:

| Columna | Tipo | Notas |
| --- | --- | --- |
| `code` | `varchar(16)` clave primaria | Clave de partición; cada redirección es una lectura puntual sobre ella |
| `long_url` | `text` | Validada al crear, nunca reescrita al leer |
| `owner_id` | `bigint` | Índice secundario para los paneles de "mis enlaces" |
| `created_at`, `expires_at` | marcas de tiempo | `expires_at` nulo significa para siempre |
| `status` | enum: active, disabled, taken_down | Permite matar un enlace sin borrar su historial |

**¿SQL o clave-valor?** Ambos sirven. Un almacén clave-valor gestionado (DynamoDB, Cassandra, Bigtable) hace que la lectura puntual escale trivialmente y tiene TTL nativo para enlaces que caducan. Postgres con particionado por hash de `code` sobra hasta varios terabytes y te da gratis transacciones para el asignador y consultas por propietario. La elección equivocada es cualquiera que haga que `GET por código` sea más de un viaje de ida y vuelta.

**Particiona por código, no por propietario.** Particionar por propietario pondría los enlaces de una celebridad en un único fragmento caliente. Particionar por hash del código reparte la carga, y el panel del propietario puede usar un índice secundario o una tabla aparte.

**Nunca pongas contadores en la fila de la asignación.** `UPDATE links SET clicks = clicks + 1` en cada redirección convierte tu lectura más caliente en una escritura disputada sobre una sola fila. Un enlace viral derretirá esa fila. Los recuentos pertenecen al pipeline de analítica.

---

## La ruta de redirección, con precisión

1. El CDN mira su caché. Si acierta, devuelve la redirección cacheada. Fin.
2. Redirect Service mira Redis. Si acierta, responde.
3. Si falla, lee la base de datos de asignaciones por clave primaria. Si la fila no existe, ha caducado o no está activa, cachea brevemente un "no encontrado" y devuelve 404. Si no, rellena Redis y responde.
4. Lanza un evento de clic al log de forma asíncrona. Si el log va lento, descarta el evento. Nunca bloquees la redirección.

**¿Qué código de estado?** Esta decisión tiene consecuencias reales:

| Estado | Semántica (RFC 9110) | Caché | Úsalo cuando |
| --- | --- | --- | --- |
| 301 Moved Permanently | Permanente | Navegadores y proxies cachean de forma agresiva | Quieres la mínima carga en origen y no necesitas recuentos de clics precisos |
| 302 Found | Temporal | No se cachea por defecto | Necesitas que cada clic te llegue para la analítica, o los enlaces pueden cambiar |
| 307 / 308 | Temporal / permanente, conserva el método | Como arriba | Raro en acortadores; importa si se redirigen peticiones que no son GET |

Mi opción por defecto es **302 con un `Cache-Control: max-age` corto y explícito** en el CDN (por ejemplo, de 60 a 300 segundos). Los enlaces populares se sirven desde el borde, la analítica sigue siendo razonablemente honesta (cuenta también los logs del CDN) y una retirada se propaga en minutos en lugar de vivir para siempre en la caché del navegador de alguien.

**Estampida de caché.** Cuando un enlace frío se vuelve viral de golpe, miles de fallos de caché simultáneos pueden golpear la base de datos por la misma clave. Usa coalescencia de peticiones (una lectura, muchos que esperan) en Redirect Service o un bloqueo corto en Redis.

---

## El abuso es una funcionalidad central, no un añadido

Un acortador presta la reputación de tu dominio a cualquier URL que alguien pegue. Eso lo convierte en una herramienta de phishing si no lo diseñas en contra.

* **Comprueba los destinos al crear** contra una fuente de reputación como Google Safe Browsing, y vuelve a escanear periódicamente los enlaces populares, porque los destinos cambian después de crearse.
* **Limita la creación** por cuenta, por IP y por dominio de destino.
* **Ofrece una página de vista previa** (`sho.rt/aB3xY9q+` en la convención de Bitly) para que los usuarios prudentes vean el destino antes de visitarlo.
* **Haz rápida la retirada:** pon `status = taken_down`, borra la clave de Redis y purga la ruta del CDN. Con 302 y un TTL de borde corto, son minutos, no días.
* **Limita las redirecciones por IP** para frenar la enumeración, incluso con códigos mezclados.

---

## Modos de fallo y qué debería pasar

| Fallo | Comportamiento esperado |
| --- | --- |
| Redis caído | Las redirecciones caen a la base de datos. Sube la latencia, se mantiene la corrección. Recorta carga en el borde si la base de datos se acerca a su límite |
| Un fragmento de la base de datos caído | Fallan los códigos de ese fragmento; todo lo demás funciona. Las réplicas deberían tomar el relevo en segundos |
| Log de clics no disponible | Las redirecciones continúan; los eventos se descartan o se guardan en un búfer local. Los recuentos quedarán por debajo durante esa ventana |
| Asignador de IDs no disponible | Los pods siguen generando desde su bloque actual. Con bloques de 1M, eso son horas de margen |
| Despliegue defectuoso de Redirect Service | El radio de impacto es cada enlace. Despliega en canario sobre una porción pequeña de tráfico y mantén el servicio diminuto para que la vuelta atrás sea rápida |
| Un enlace se vuelve viral | El CDN absorbe la mayor parte; la coalescencia de peticiones protege la base de datos de la primera tormenta de fallos de caché |

---

## Qué cambia en una entrevista

No tendrás tiempo para redes Feistel ni para afinar TTL de CDN en 45 minutos. Prioriza:

1. Enuncia la relación lectura:escritura y el cálculo de capacidad en dos frases.
2. Dibuja las dos rutas por separado.
3. Elige contador más Base62 y menciona la enumeración y la solución de la mezcla.
4. Explica por qué los contadores de clics no viven en la fila de la asignación.
5. Ten una opinión sobre 301 frente a 302.

Eso basta para demostrar criterio. El resto es conversación.

---

## Lista de comprobación para producción

- [ ] Cálculo de capacidad por escrito, con relación lectura:escritura y multiplicador de pico
- [ ] IDs arrendados por bloques; el asignador sobrevive a reinicios; los huecos están documentados como aceptables
- [ ] Códigos mezclados antes de codificar; los alias personalizados comparten la restricción única
- [ ] Lista blanca de esquemas, límite de longitud y comprobación de reputación al crear
- [ ] Ruta de redirección: CDN, luego Redis con TTL y caché negativa, luego base de datos por clave primaria
- [ ] Coalescencia de peticiones para estampidas de claves frías
- [ ] 302 más TTL de borde corto, o una razón escrita para usar 301
- [ ] Eventos de clic asíncronos, descartables y nunca en la fila de la asignación
- [ ] La retirada limpia estado en la base de datos, Redis y CDN en una sola operación
- [ ] Paneles: p99 de redirección, tasa de aciertos de caché, tasa de 404, tasa de creación por cuenta

---

## Lo que queda

Lo interesante de este sistema no es el truco de codificación. Es la disciplina de mantener aburrida la ruta de redirección. Cada petición de funcionalidad (recuentos en tiempo real, destinos A/B, enrutamiento geográfico) intentará meter lógica en ella.

Di que no a la mayoría. El enlace que alguien pegó en un chat de grupo hace tres años debería seguir funcionando mañana por la mañana, antes de tu café y antes de que nadie recuerde que existe.

---

## Fuentes

* [RFC 9110: HTTP Semantics, sección 15.4 (Redirection 3xx)](https://www.rfc-editor.org/rfc/rfc9110#section-15.4)
* [Google Safe Browsing API](https://developers.google.com/safe-browsing)
* [Amazon DynamoDB: Time to Live](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
* [Luby y Rackoff, "How to Construct Pseudorandom Permutations from Pseudorandom Functions" (redes Feistel)](https://doi.org/10.1137/0217022)
* Relacionado en esta serie: [Diseña un generador de IDs únicos](/blog/es/design-unique-id-generator), [Diseña un limitador de tasa](/blog/es/design-a-rate-limiter), [Estimaciones de servilleta](/blog/es/design-back-of-envelope-estimation)
