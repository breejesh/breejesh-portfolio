---
title: "Diseñar un acortador de URL: codificación, almacenamiento, caché, redirecciones y escala"
description: "Diseño de un acortador de URL explicado para principiantes: códigos de guardarropa, recorrido de creación y redirección, Base62, almacenamiento, caché y cómo escalar paso a paso."
date: "2026-04-02"
tags: [Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/design-url-shortener.webp
previewImage: /assets/images/design-url-shortener.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Diseño de un acortador de URL explicado para principiantes: códigos de guardarropa, recorrido de creación y redirección, Base62, almacenamiento, caché y cómo escalar paso a paso.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Un acortador de URL convierte una dirección web larga en una corta y, cuando alguien hace clic, envía el navegador a la página original. Productos como TinyURL y bit.ly hacen esto. También los enlaces cortos de casi cualquier app que usas.

Piensa en un guardarropa. Entregas un abrigo largo y pesado. El encargado te da un número pequeño en un papel. Después muestras el número y recuperas el mismo abrigo. El número no es el abrigo. Es un ticket que apunta a dónde está guardado.

Una URL corta es la misma idea en internet:

- La URL larga es el abrigo (la dirección completa).
- El código corto es el número del guardarropa (o un apodo para esa dirección larga).
- El acortador es el encargado que mantiene la lista: número → abrigo.

Este post enseña el diseño como en una primera clase. Sin jerga asumida. Recorremos una creación, un clic, y luego codificación, almacenamiento, caché y escala.

---

## ¿Qué problema resolvemos?

Las URL largas son feas y difíciles de compartir:

```
https://shop.example.com/products/category/electronics/laptops/2026/model-x?utm_source=newsletter&ref=homepage
```

Un acortador las convierte en algo como:

```
https://sho.rt/aB3xY9q
```

Dos trabajos importan:

1. **Crear:** aceptar una URL larga, inventar un código corto, recordar el mapeo, devolver el enlace corto.
2. **Redirigir:** cuando alguien abre el enlace corto, buscar la URL larga y enviar el navegador allí.

Todo lo demás (estadísticas de clics, nombres personalizados, caducidad) es extra. Primero haz bien crear y redirigir.

---

## El guardarropa en un dibujo

```
Camino de creación (entregar el abrigo)
  Tú → API del acortador → elegir un código → guardar "código → URL larga" → devolver enlace corto

Camino de redirección (reclamar el abrigo)
  Un amigo hace clic → el acortador busca el código → responde "ve a la URL larga"
  → el navegador abre la página real
```

El dominio corto (`sho.rt`) es el mostrador del guardarropa. La parte después de la barra (`aB3xY9q`) es el número de tu ticket.

---

## Recorrido: crear un enlace corto

Imagina que quieres compartir la página de un producto. Llamas a la API de creación.

**Petición (simplificada)**

```http
POST /api/v1/links
Content-Type: application/json

{
  "url": "https://shop.example.com/products/laptops/model-x"
}
```

**Lo que hace el servidor, paso a paso**

1. **Comprobar la URL.** Solo permitir enlaces web normales (`http` o `https`). Rechazar esquemas raros que puedan ser peligrosos. Limitar la longitud para que nadie pegue una novela.
2. **Crear un código corto.** Por ejemplo `aB3xY9q`. Cómo se inventa va en la sección de codificación. Por ahora, trátalo como un número de ticket único.
3. **Guardar el mapeo** en una base de datos:

| code | long_url |
| --- | --- |
| aB3xY9q | https://shop.example.com/products/laptops/model-x |

4. **Devolverte la URL corta:**

```http
201 Created
{
  "code": "aB3xY9q",
  "short_url": "https://sho.rt/aB3xY9q",
  "long_url": "https://shop.example.com/products/laptops/model-x"
}
```

Pegas `https://sho.rt/aB3xY9q` en un chat. Listo. Crear es el camino raro. La mayor parte del tráfico son clics, no creaciones.

Extras opcionales al crear:

- **Alias personalizado:** pides `launch` en lugar de un código aleatorio. El sistema comprueba que el nombre esté libre y no sea reservado (`api`, `health`, etc.).
- **TTL (tiempo de vida):** el enlace muere tras un tiempo, como un ticket de guardarropa temporal.

---

## Recorrido: un clic de usuario (redirección)

Tu amigo toca el enlace corto. Sigue el viaje completo.

```
1. El navegador pide: GET https://sho.rt/aB3xY9q
2. La petición llega a un balanceador y luego a un servicio de redirección.
3. El servicio pregunta a la caché: "¿Conoces aB3xY9q?"
   - Acierto: usa la URL larga guardada al momento.
   - Fallo: pregunta a la base de datos y rellena la caché para la próxima vez.
4. El servicio responde con una redirección HTTP:
   estado 302 (o 301)
   cabecera Location: https://shop.example.com/products/laptops/model-x
5. El navegador sigue Location y carga la página real.
6. Opcionalmente, el servicio deja un evento "alguien hizo clic" en una cola lateral para analítica.
   Ese trabajo no debe ralentizar la redirección.
```

Si el código es desconocido, ha caducado o está desactivado, devuelve **404**, no una adivinanza.

### 301 vs 302 en palabras simples

| Estado | Significado | Por qué importa |
| --- | --- | --- |
| **301** | "Este traslado es permanente." | Navegadores y CDN pueden recordarlo con fuerza. Menos hits en tus servidores. Los conteos de clics pueden quedar por debajo de los clics reales. |
| **302** | "Este traslado es temporal." | Los clientes preguntan más a tu servicio. Mejor si te importan analíticas de clics precisas. |

Por defecto en entrevista cuando importan las analíticas: **302**. Si solo te importa redirigir barato y conteos aproximados, **301** vale. Los productos reales eligen según necesidades, no por moda.

---

## Codificación: cómo inventamos códigos cortos

Necesitas un alfabeto pequeño y seguro en URLs. La elección habitual es **Base62**:

```
0-9  a-z  A-Z
```

Son 62 símbolos. Sin `+` ni `/` que Base64 obliga a escapar.

### ¿Cuántos códigos obtenemos?

| Longitud del código | Capacidad aproximada |
| --- | --- |
| 6 caracteres | unos 57 mil millones |
| 7 caracteres | unos 3,5 billones |
| 8 caracteres | unos 218 billones |

Siete caracteres es la elección común en entrevistas: corto para compartir, grande para crecer mucho.

### Tres formas de crear un código

**A. Contador y luego codificar (máquina de guardarropa)**

1. Toma el siguiente número global: 1, 2, 3, … (secuencia de BD, Redis `INCR`, o un ID distribuido).
2. Convierte ese número a caracteres Base62.
3. Esa cadena es tu código.

Pros: sin colisión accidental si el contador es único. Historia simple.

Contras: los códigos pueden ser adivinables si van `…9`, `…a`, `…b` en orden. Mitigaciones: empezar alto, revolver bits antes de codificar, o barajar el alfabeto. Aun así trata los códigos como tickets públicos, no secretos.

Imagen mental mínima de encode Base62:

```
Número 125 → dividir por 62, guardar restos → mapear restos al alfabeto → "21" (forma de ejemplo)
```

**B. Hash de la URL larga**

Hashea la URL (SHA-256 o similar), toma un prefijo, pásalo a Base62, comprueba que esté libre. Si hay colisión, toma más bits o añade sal y reintenta.

Pros: la misma URL larga puede mapear siempre al mismo código corto si quieres esa regla de producto.

Contras: las colisiones piden un bucle de reintento. Dos usuarios distintos puede que no quieran compartir un código para el mismo destino (propiedad y analítica se complican).

**C. Códigos aleatorios**

Elige 7 caracteres Base62 al azar. Inserta con restricción de unicidad. Si está ocupado, elige otra vez.

Pros: difíciles de adivinar. Código simple.

Contras: reintentos cuando el espacio se llena (con 7 caracteres estás bien mucho tiempo). Usa un buen generador aleatorio si importa resistir adivinanzas.

**Por defecto práctico en entrevistas y muchos productos:** ID único (contador o estilo Snowflake) → revuelto opcional → Base62. Los alias personalizados viven en la misma columna única `code` (o en una columna de alias única).

---

## Almacenamiento: dónde vive la lista de abrigos

En el fondo es un **mapa clave-valor**: código corto → URL larga, más un poco de metadatos.

### Tabla SQL simple

| Columna | Rol |
| --- | --- |
| `code` | Clave primaria. El número del ticket. |
| `long_url` | El destino real. |
| `user_id` | Quién posee el enlace (opcional). |
| `created_at` | Cuándo se creó. |
| `expires_at` | Cuándo muere (null = para siempre). |
| `is_active` | Borrado suave o interrupción por abuso. |

Las búsquedas en redirección son siempre "buscar por código". Ese patrón es perfecto para una clave primaria o un almacén clave-valor.

### Opción NoSQL / clave-valor

Almacenes como DynamoDB o Cassandra brillan aquí:

- Clave de partición: `code`
- Atributos: URL larga y metadatos
- TTL nativo para caducidad cuando el producto lo necesita

La redirección es una sola búsqueda por clave. "Listar todos los enlaces del usuario X" necesita un índice secundario o otra tabla.

### No pongas contadores de clics en la fila caliente

Actualizar `clicks = clicks + 1` en cada redirección convierte un camino de lectura en una pelea de escritura. Un enlace viral machaca una sola fila.

Mejor:

1. La redirección solo **lee** el mapeo.
2. Emite un evento de clic a una cola (asíncrono).
3. Workers agregan conteos fuera de línea.

Para un MVP pequeño: Redis `INCR` para un contador en vivo está bien si aceptas alguna pérdida y haces snapshot a almacenamiento durable después.

---

## Caché: la nota adhesiva del encargado

La mayoría de los clics caen en un conjunto pequeño de códigos populares. Leer la base de datos cada vez es más lento y caro de lo necesario.

**Tres capas de las que se habla:**

1. **CDN** delante del dominio corto (buena latencia global; puede complicar analítica exacta).
2. **Redis (o Memcached)** cerca de la app: `code → long_url` con un TTL.
3. **Base de datos** como fuente de verdad.

**Redirección con caché, flujo simple:**

```
preguntar a Redis por el código
si está y sigue válido → redirigir
si no
  preguntar a la BD
  si falta / inactivo / caducado → 404 (y quizás recordar "no existe" un rato)
  si no, escribir en Redis con TTL → redirigir
también encolar analítica (mejor esfuerzo)
```

**Por qué ayuda la caché:** las lecturas en memoria son rápidas. Los tickets populares se quedan en la nota adhesiva. Los raros siguen yendo a la sala de abrigos (la BD).

**Cuidados:**

- **Avalancha de fallos de caché:** muchas peticiones fallan a la vez para un código popular frío. Coalescer el trabajo (un fetch, muchos esperan) o un bloqueo corto.
- **Caché negativa:** recordar un momento "este código no existe" para que los escáneres no golpeen la BD.
- **Takedown:** al desactivar un enlace, borra o sobrescribe la entrada de caché para que el Location viejo no quede.

---

## Camino de escala, paso a paso

No empieces con un diagrama de 40 cajas. Crece con el dolor.

### Etapa 1: Una app, una base de datos

Suficiente para un side project o un producto temprano.

```
Cliente → App (crear + redirigir) → BD
```

### Etapa 2: Separar un poco crear y redirigir, añadir caché

Las redirecciones dominan. Pon Redis delante de las búsquedas. Mantén create en la BD primaria.

```
Crear     → API → BD
Redirigir → API → Redis → (fallo) BD
```

### Etapa 3: Muchos servidores de redirección detrás de un balanceador

Los handlers de redirección se quedan **sin estado**. Escale horizontalmente. Caché y BD guardan el estado.

```
Cliente → LB → Pod de redirección 1..N → Redis → BD
```

### Etapa 4: Trucos de base de datos con muchas lecturas

- Réplicas de lectura para fallos de caché si hace falta.
- Mantén la analítica fuera de la tabla de mapeos.
- Particiona (shard) la tabla de mapeos por hash del código cuando una primaria no aguante datos e índices.

### Etapa 5: Camino de escritura con mucho volumen de create

Las creaciones suelen ser muchas menos que las redirecciones. Cuando crecen:

- Usa un generador de IDs sólido (bloques, IDs estilo Snowflake).
- Mantén una restricción de unicidad en `code`.
- En multi-región, controla creates para que dos regiones no inventen el mismo código.

### Etapa 6: Reglas de fiabilidad que importan

| Regla | Por qué |
| --- | --- |
| Redirigir importa más que crear | Quien hace clic debe ganar sobre quien crea enlaces nuevos. |
| Nunca pierdas un mapeo después de devolver 201 | El cliente ya compartió el enlace corto. |
| La analítica puede caer bajo carga extrema | Mejor un evento de clic perdido que una redirección lenta. |
| Si Redis cae, cae a la BD | Más latencia, sigue siendo correcto. |
| Fallo abierto en métricas, cerrado en códigos desconocidos | Código desconocido → 404, no una página incorrecta. |

**Intuición de capacidad (di esto en voz alta en entrevistas):**

- Creates pueden ser miles por segundo en pico.
- Redirects pueden ser 100x o más.
- Cada fila de mapeo suele estar por debajo de 1 KB con metadatos.
- 100 millones de filas son decenas de GB, no petabytes. El sharding es por crecimiento y QPS, no pánico el día uno.

---

## Seguridad y abuso (lista corta)

Los códigos cortos son tickets públicos. Espera:

1. **Adivinar códigos** recorriendo el espacio. Rate limit. Prefiere códigos más largos o revueltos.
2. **Phishing** con tu dominio corto de confianza. Escanea o bloquea destinos malos. Ofrece denuncia y takedown.
3. **Spam de creates** llenando almacenamiento. Auth, cuotas, CAPTCHA, planes de pago.
4. **Open redirects** solo si en algún momento dejas la URL larga controlada por el usuario en el momento del clic (normalmente la fijas al crear y solo sirves ese valor guardado).

Nunca pongas secretos en una URL corta y asumas que nadie los encontrará.

---

## Diseño de punta a punta que puedes defender

**Requisitos de ejemplo:** códigos Base62 de 7 caracteres, alias y TTL opcionales, clics bastante precisos, alto QPS de redirección, multi-AZ.

**Piezas:**

1. Servicio API para create / list / delete (con auth).
2. Servicio de redirección delgado (el camino caliente se queda ligero).
3. Generador de IDs para números únicos.
4. Almacén primario de mapeos (SQL o estilo DynamoDB).
5. Redis para `code → url`.
6. Cola + workers para eventos de clic y agregados.

**Create:** validar → mint código → insertar → devolver URL corta.

**Redirect:** caché → BD → 302 + Location → evento de clic asíncrono.

**Trade-offs para decir en voz alta:**

- El encoding por contador es simple y sin colisiones; random y hash necesitan comprobaciones de unicidad.
- 301 ahorra carga en origen; 302 mantiene la analítica más honesta.
- Contadores de clics en la fila de mapeo se derriten con tráfico viral.
- La corrección de la redirección gana a la analítica global perfecta.

---

## Resumen que puedes contar a un amigo

Un acortador de URL es un guardarropa para direcciones web.

Entregas un abrigo largo (URL larga). El encargado te da un número pequeño (código corto) y lo anota en un libro (base de datos). Cuando alguien muestra el número, el encargado busca y lo apunta al perchero (redirección con cabecera `Location`). Para números populares, el encargado guarda una nota adhesiva (caché) para no ir al trastero cada vez.

La codificación es cómo imprimes números de ticket a partir de contadores, hashes o dados. El almacenamiento es la lista durable. La caché es velocidad. Escalar significa muchos encargados en el mostrador, un libro más grande cuando haga falta, y nunca dejar que el contador de clics congele la fila.

Si recuerdas una lección de producción: **protege el camino de redirección como un servicio de edge**, y trata la analítica como una conversación lateral, no como un paso que deba terminar antes de dejar pasar al usuario.

---

## Checklist de producción

- [ ] Alfabeto y longitud de código elegidos con matemáticas de crecimiento
- [ ] Códigos únicos (contador o restricción de unicidad)
- [ ] Validación de URL y lista de esquemas permitidos
- [ ] Palabras reservadas para alias personalizados
- [ ] Caché Redis con TTL y caché negativa
- [ ] Decisión 301 vs 302 documentada para producto y analítica
- [ ] Analítica fuera del camino caliente
- [ ] Caducidad y takedown limpian la caché
- [ ] Rate limits en create y en volumen sospechoso de redirección
- [ ] Load test de clave caliente, fría, fallo de caché, failover de BD
- [ ] Dashboards: QPS de create, QPS de redirect, ratio de aciertos de caché, latencia p99 de redirect, tasa de 404

