---
title: "Diseñar un crawler web: frontera, cortesía, fetch, dedup y escala"
description: "Cómo funciona un crawler web en lenguaje sencillo: seeds, cola frontier, cortesía, fetch, parse, store y dedup. Un recorrido de una página por el pipeline y un resumen para un amigo."
date: "2025-10-30"
tags: [Diseño de sistemas]
coverImage: /assets/images/design-web-crawler.webp
previewImage: /assets/images/design-web-crawler.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Cómo funciona un crawler web en lenguaje sencillo: seeds, cola frontier, cortesía, fetch, parse, store y dedup. Un recorrido de una página por el pipeline y un resumen para un amigo.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Imagina a un bibliotecario que quiere una ficha de cada libro público del planeta, solo que los "libros" son páginas web y aparecen otras nuevas cada segundo. O imagina un robot aspirador que debe visitar cada habitación de un edificio del tamaño de una ciudad: necesita una lista de habitaciones por limpiar, no puede golpear la misma puerta cien veces y debe recordar cuáles ya limpió para no girar en bucle para siempre.

Un **crawler web** es ese bibliotecario y ese robot juntos en software. Los motores de búsqueda, los archivos, los monitores de precios y las herramientas de investigación usan alguna forma de esto. El crawler de Google es famoso, pero la idea es la misma a cualquier tamaño: empezar en algún sitio, descargar una página, encontrar enlaces, visitarlos después, guardar lo encontrado y evitar repetir el mismo trabajo.

Este post es para principiantes absolutos. Nombraremos cada pieza con palabras sencillas, seguiremos una página por todo el pipeline y terminaremos con un resumen que podrías contarle a un amigo con un café.

---

## ¿Qué problema resolvemos?

La web pública es un grafo enorme. Cada página es un nodo. Cada hipervínculo es una arista dirigida de una página a otra. Nadie te entrega un mapa completo. Solo recibes unas pocas direcciones de partida y los enlaces escritos en cada página que visitas.

Así que el crawler debe:

1. Empezar con una lista corta de direcciones conocidas y fiables.
2. Mantener una lista de tareas de páginas que aún faltan por visitar.
3. Descargar cada página con cuidado para no aplastar un sitio.
4. Leer el HTML, sacar texto útil y enlaces.
5. Guardar la página en un sitio durable.
6. Detectar duplicados para no malgastar disco ni tiempo.
7. Repetir hasta que se acabe el presupuesto o la cola.

Si solo recuerdas el bucle: **descubrir → descargar → entender → guardar → descubrir más.**

---

## El reparto (en palabras llanas)

| Nombre | Qué significa en la vida real |
| --- | --- |
| **Seed URLs** | Las primeras puertas que abres a propósito |
| **Frontier (cola)** | La lista de notas adhesivas de "visitar después" |
| **Cortesía (politeness)** | No martillees un solo sitio; espera tu turno por host |
| **Fetch** | Descargar de verdad la página por HTTP |
| **Parse** | Leer el HTML, encontrar enlaces y contenido |
| **Store** | Guardar el cuerpo de la página y metadatos en disco u object storage |
| **Dedup** | Saltar direcciones y cuerpos que ya trataste |

En entrevistas se dice "URL frontier", "fetcher", "content store" y "URL seen". Son solo nombres profesionales del mismo reparto.

---

## Seed URLs: dónde empieza el crawl

Una **seed** es una URL que metes en el sistema a mano (o desde una lista de confianza) antes de que empiece el descubrimiento. El crawler no puede inventar la primera página de la nada. Las seeds son las puertas de entrada.

Buenas seeds parecen:

- Homepages conocidas (noticias, portales gubernamentales, raíces de universidades).
- Hubs temáticos si solo te importan compras, deportes o documentación.
- Sitemaps o "mejores hosts del crawl del mes pasado" cuando reinicias.

Malas seeds te atrapan. Si cada seed es un blog minúsculo que solo se enlaza a sí mismo, el robot aspirador nunca sale de un pasillo. Para un crawl amplio quieres **muchos barrios distintos**, no un solo grupo denso.

Las seeds entran primero a la frontier. Después, casi cada URL nueva sale de enlaces hallados en páginas ya descargadas.

---

## La frontier: la lista de tareas de internet

La **URL frontier** es la cola de páginas que esperan ser descargadas. Piénsala como la lista del robot de habitaciones todavía sucias, o la pila del bibliotecario de libros aún sin revisar.

Hábitos importantes de esa lista:

1. **Primero en entrar, primero en salir es la historia simple.** Breadth-first search (BFS) significa: visita primero lo cercano a las seeds y luego expande. Encaja con "limpia todas las habitaciones de este piso antes de bajar a un sótano sin fin."
2. **Depth-first es un mal valor por defecto.** Seguir una sola cadena de enlaces para siempre puede atraparte en calendarios, ids de sesión o trucos de rutas infinitas.
3. **La prioridad ayuda.** La homepage de un gran periódico suele merecer atención antes que un hilo de comentarios al azar. Los sistemas de producción mantienen varias colas frontales (alta, media, baja prioridad) y eligen con sesgo hacia el trabajo importante sin dejar morir del todo el resto.
4. **La lista es enorme.** Cientos de millones de URLs pendientes no caben a gusto en la RAM de un portátil. Las frontiers reales viven en colas respaldadas en disco, a menudo repartidas entre máquinas por nombre de host.

Un truco estructural más: muchos diseños usan **front queues** para prioridad y **back queues** por host del sitio. La prioridad decide *qué tipo* de trabajo está listo; la cola por host decide *cuándo* se puede contactar otra vez a ese host. Esa división es cómo conviven cortesía y orden útil en el mismo sistema.

```
nueva URL → puntuar prioridad → front queues → enrutar por host → back queue por host → worker
```

---

## Cortesía: no martillees un solo sitio

Si tu robot encuentra 500 enlaces en `example.com` y abre 500 conexiones a la vez, no estás haciendo crawl. Estás atacando. Los sitios se ralentizan, devuelven errores o banean tu IP. Un buen crawler trata cada host como el mostrador de una biblioteca compartida: una petición cuidadosa a la vez (o un límite pequeño y documentado), luego una pausa corta.

La **cortesía** suele significar:

- Como máximo una descarga activa por host (a veces por IP, porque muchos sitios comparten máquina).
- Un retraso entre visitas al mismo host (por ejemplo un segundo o dos, o lo que pida el sitio).
- Leer primero **`robots.txt`**. Es un archivo pequeño que los dueños publican en `https://host/robots.txt` para decir "puedes rastrear aquí" y "no entres en `/admin`."
- Un **User-Agent** claro con una página de contacto, para que los humanos sepan quién eres.
- Retroceder con más fuerza cuando el sitio devuelve `429` (demasiadas peticiones) o `503` (no disponible).

Si solo te quedas con una regla de producción de este post: **nunca dejes que el crawl en paralelo se convierta en un denegación de servicio contra un solo host.** Importa el rendimiento en toda la web. La cortesía por host no se negocia.

---

## Fetch: descargar la página

**Fetch** es el momento en que el worker dice de verdad "dame esta URL" por la red.

Un camino de fetch cuidadoso se ve así:

1. Tomar la siguiente URL permitida de la frontier (respetando el retraso del host).
2. Normalizarla (host en minúsculas, quitar fragmentos inútiles como `#section`; las formas relativas se arreglan al parsear).
3. Comprobar las reglas robots de ese host (desde caché si ya las bajaste).
4. Resolver DNS (con caché local para no esperar la resolución de nombre cada vez).
5. HTTP GET con timeouts cortos, un tamaño máximo de cuerpo y un presupuesto limitado de redirecciones.
6. Pasar el cuerpo de la respuesta al parser, o registrar el fallo y seguir.

Detalles prácticos que un principiante aún debería oír:

| Preocupación | Regla simple |
| --- | --- |
| Timeouts | Fallar en segundos, no en minutos |
| Archivos enormes | Limitar tamaño para que una descarga gigante no frene al worker |
| Redirecciones | Limitar saltos; tratar un salto a otro host bajo la cortesía de ese host |
| Compresión | Aceptar gzip; ahorrar ancho de banda |
| Recrawl | Usar `If-None-Match` / `If-Modified-Since` cuando ya tienes una copia |

A escala ejecutas muchos fetchers en muchas máquinas, normalmente **particionados por host** para que el candado de cortesía de `example.com` viva junto a los workers que hablan con `example.com`.

---

## Parse: leer HTML y encontrar las siguientes puertas

**Parse** significa: mirar dentro de los bytes descargados y entenderlos lo bastante para guardar contenido y extraer enlaces.

Para HTML eso suele significar:

1. Confirmar que es más o menos HTML (no un binario al azar que no querías).
2. Extraer el texto principal y metadatos útiles (título, pistas de idioma, URL canónica si existe).
3. Encontrar cada enlace `a href="..."`.
4. Convertir enlaces relativos (`/about`) en absolutos (`https://example.com/about`) usando la URL final tras redirecciones.
5. Limpiar la URL: quitar `#fragmentos`, a veces tirar basura de tracking si el producto lo permite.

Luego un **filtro de URL** tira el trabajo que te niegas a hacer:

- Esquemas `mailto:`, `javascript:`, `data:`.
- Tipos de archivo que no quieres (`.zip`, `.mp4`) salvo que el producto diga lo contrario.
- URLs absurdamente largas que parecen trampas de araña.
- Hosts en lista negra.

Lo que sobrevive pasa por **dedup de URL** (abajo) y, si es nueva, vuelve a la frontier.

A pequeña escala, el parse puede vivir en la misma máquina que el fetch. A gran escala, workers de descarga y de parse son etapas separadas para que un parser lento no bloquee la red.

---

## Store: guardar lo que pagaste por descargar

**Store** es la memoria durable del crawl: el cuerpo de la página más suficientes metadatos para usarla después (indexarla, archivarla, compararla la semana que viene).

División típica:

- **Blob / object storage** para el HTML (o HTML comprimido). Grande, con muchas escrituras, tiers baratos con el tiempo.
- **Base de metadatos** para hechos pequeños: URL, hora de fetch, código de estado, content type, hash de contenido, tamaño.

Guardas metadatos para responder sin releer cada blob: "¿Cuándo la bajamos por última vez?" "¿Fue un 404?" "¿Este hash ya se conoce?"

La política de recrawl vive cerca. Las páginas importantes cambian a menudo; la cola larga puede esperar más. Un recrawl ciego de toda la web es caro, así que los sistemas aprenden ritmos de cambio y gastan presupuesto donde la frescura importa.

---

## Dedup: saltar trabajo ya hecho

La web adora las copias. El mismo artículo puede aparecer en `www` y en el dominio desnudo. Los espejos reimprimen el mismo cuerpo bajo URLs nuevas. Sin **deduplicación**, quemas disco y CPU en deja vu.

Hay dos capas, y un principiante debe quedarse con ambas:

| Capa | Pregunta | Analogía cotidiana |
| --- | --- | --- |
| **URL seen** | ¿Ya programamos o descargamos esta dirección? | ¿Ya escribimos este número de habitación en la lista de limpieza? |
| **Content seen** | ¿Ya guardamos este cuerpo de página (o un gemelo exacto)? | ¿Ya archivamos este texto de libro exacto bajo otra signatura? |

**Dedup de URL** evita que la frontier explote con el mismo enlace hallado en mil páginas. Las implementaciones van desde un conjunto simple en base de datos hasta un filtro de Bloom delante de un almacén durable. Los filtros de Bloom ahorran memoria pero a veces pueden decir "visto" cuando la URL era nueva (pierdes un poco de cobertura). Los almacenes exactos cuestan más memoria o disco.

**Dedup de contenido** hace hash del cuerpo (copias exactas). Si el hash ya existe, no escribes otro blob completo, o solo guardas un puntero a la primera copia. La detección de casi-duplicados (el mismo artículo con anuncios distintos) es un sistema posterior y más pesado. El hash exacto es el valor por defecto en entrevista.

Ambas capas importan por fallos distintos:

- Dos URLs, un cuerpo → el dedup de contenido ahorra almacenamiento.
- URLs únicas infinitas con basura en la query → filtros de URL, límites de ruta y presupuestos por host salvan la frontier.

---

## Imagen de alto nivel

```
Seed URLs
    │
    ▼
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│ URL Frontier│────►│ Fetcher      │────►│ Parser         │
│ (prioridad +│     │ DNS, robots, │     │ enlaces + body │
│  cortesía)  │     │ HTTP GET     │     └────────┬───────┘
└──────▲──────┘     └──────────────┘              │
       │                                          ▼
       │                                 ¿hash de contenido nuevo?
       │                                    │         │
       │                                   sí        no → descartar o solo enlace
       │                                    ▼
       │                                 content store
       │                                    ▼
       │                                 extraer enlaces
       │                                    ▼
       │                                 filtrar + ¿URL seen?
       │                                    │
       └────────────── solo URLs nuevas ────┘
```

---

## Recorrido de una página por el pipeline

Sigamos una sola página para que las piezas dejen de sentirse abstractas.

**Preparación.** Las seeds incluyen `https://news.example/`. La frontier está vacía salvo esa seed. La cortesía dice: un fetch a la vez por host, con un retraso corto.

1. **Carga de seed.** `https://news.example/` entra a la frontier con alta prioridad porque es una homepage.

2. **Dequeue con cortesía.** Un worker saca esa URL. No hay otro fetch a `news.example` en curso. Las reglas robots se cargan desde `https://news.example/robots.txt` y se cachean. La ruta `/` está permitida.

3. **Fetch.** DNS resuelve `news.example`. El worker envía HTTP GET con un User-Agent claro y un timeout de 10 segundos. Estado 200. El cuerpo son unos 80 KB de HTML.

4. **Parse.** El parser lee el título "Example News," el texto principal del artículo y encuentra enlaces:
   - `https://news.example/politics/bill-42`
   - `https://news.example/sports/final`
   - `https://other-site.org/op-ed`
   - `mailto:tips@news.example` (se filtra)
   - `/local/weather` (se convierte en `https://news.example/local/weather`)

5. **Dedup de contenido.** El hash del HTML es nuevo. Escribe el cuerpo en object storage. Escribe metadatos: URL, hora, 200, hash, tamaño.

6. **Filtro de URL y URL seen.**  
   - `mailto:` se descarta.  
   - Los tres enlaces http(s) se normalizan.  
   - Ninguno estaba en el conjunto URL-seen, así que los tres se marcan como vistos y se encolan.  
   - `other-site.org` va a una back queue distinta de `news.example`.

7. **Ciclos siguientes.**  
   - El worker debe esperar el retraso de cortesía antes de la siguiente URL de `news.example`.  
   - Otro worker puede bajar `https://other-site.org/op-ed` de inmediato si ese host está libre.  
   - Cuando más tarde se baje `politics/bill-42`, su cuerpo puede ser único, o coincidir con un espejo ya guardado (dedup de contenido).  
   - Los enlaces hallados allí rellenan otra vez la frontier.

8. **Camino de fallo (misma idea de página).** Si el fetch hace timeout, el sistema registra el fallo, quizá reintenta con backoff, y no finge que la página se guardó. Si robots prohíbe `/admin`, esa URL nunca sale del paso "comprobar robots."

Tras una página ya practicaste cada idea importante: seed, frontier, cortesía, fetch, parse, store, doble dedup y planificación multi-host.

---

## Unas notas de escala (aún en lenguaje sencillo)

Cuando alguien dice "diseña un crawler para mil millones de páginas al mes," la forma se mantiene. Los muebles se hacen más grandes.

- **Ritmo aproximado:** 1 mil millones de páginas / 30 días / 86.400 segundos ≈ 400 páginas por segundo de media. El pico puede ser más alto.
- **Almacenamiento:** Si el HTML medio son cientos de kilobytes, los datos crudos mensuales son cientos de terabytes. Compresión y retención de varios años convierten esto en un diseño de almacenamiento de verdad, no en una carpeta lateral.
- **Particionar por host:** Mantén rebanadas de frontier, estado de cortesía y a menudo workers de fetch agrupados por hash de host para que una máquina posea un conjunto de sitios.
- **Trampas de araña:** Calendarios infinitos, ids de sesión y rutas recursivas intentan dejar al robot en un pasillo para siempre. Limita longitud de URL, profundidad de ruta y páginas por host y día. Ten un interruptor humano de emergencia.
- **Sitios con mucho JS:** Algunos enlaces solo aparecen después de que un navegador ejecuta JavaScript. Renderizar todo es caro. Úsalo en hosts de alto valor, no en cada página al azar el primer día.

No necesitas construir el crawler de Google en una entrevista. Necesitas mostrar que entiendes el bucle, la cortesía y los dos tipos de dedup.

---

## Resumen para un amigo

Un crawler web es software que cataloga la web pública como un bibliotecario cataloga libros y un robot aspirador visita habitaciones.

Empiezas con unas **seed URLs**, las puertas que eliges a propósito. Esas entran en una **frontier**, una gran cola de tareas de páginas aún por visitar. Los workers sacan de esa cola, pero se mantienen **corteses**: una petición cuidadosa a la vez por sitio web, con retrasos, y respetan `robots.txt` para que los dueños puedan decir "no entres en este pasillo."

**Fetch** descarga la página. **Parse** lee el HTML, guarda el texto útil y encuentra enlaces nuevos. **Store** guarda la página y sus metadatos. **Dedup** trabaja dos veces: una para no encolar la misma URL para siempre, y otra para no guardar el mismo cuerpo de artículo bajo diez direcciones.

Luego los enlaces nuevos vuelven a la frontier y el robot sigue caminando. Todo el diseño es ese bucle, hecho seguro para los sitios que visitas y barato de ejecutar a escala de internet.

---

## Cierre

Si en una entrevista dibujas un solo diagrama, dibuja el bucle: frontier → fetch cortés → parse → content store → extracción de enlaces → filtro de URL y seen → de vuelta a la frontier. Etiqueta las seeds en la entrada. Di en voz alta que la prioridad y la cortesía viven en la frontier, no como un añadido tardío.

La web siempre será desordenada: HTML roto, trampas, duplicados, hosts lentos. Un buen diseño de crawler espera ese desorden. Es paciente por host, agresivo en no repetirse, y honesto sobre cuánto de internet puede limpiar hoy.