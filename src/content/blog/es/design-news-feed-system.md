---
title: "Diseñar un sistema de news feed (guía para principiantes): fan-out, ranking y caché"
description: "Guía en lenguaje claro del news feed social: fan-out en escritura vs lectura como rellenar buzones vs revisar el tablón, ranking, caché y el problema de las celebridades."
date: "2025-10-05"
tags: [Diseño de Sistemas y Arquitectura, Backend y Bases de Datos]
coverImage: /assets/images/design-news-feed-system.webp
previewImage: /assets/images/design-news-feed-system.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Guía en lenguaje claro del news feed social: fan-out en escritura vs lectura como rellenar buzones vs revisar el tablón, ranking, caché y el problema de las celebridades.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Abres Instagram, X o Facebook. No te dan una página en blanco y una tarea de investigación. Te dan una lista: amigos, fotos, chistes, noticias. Esa lista es el **news feed** (a veces **home timeline**).

En entrevistas de diseño de sistemas el enunciado suena enorme: "Diseña el feed de Facebook" o "Diseña el timeline de Twitter." No es enorme si empiezas por la vida cotidiana. Un feed se parece más a un **tablón del barrio** y a una **ruta de reparto de periódicos** que a magia.

Este post enseña ese diseño desde cero. Sin jerga previa. Cuando aparece un término, lo definimos primero.

---

## La imagen de todos los días

Imagina que en la esquina de tu calle hay un tablón de corcho.

- Los vecinos clavan notas: "Venta de garaje el sábado," "Gato perdido," "Panadería nueva."
- Tú te acercas, lees lo que te importa y vuelves a casa.

Ahora escala eso a millones de personas, cada una con su propio tablón, cada una siguiendo a cientos de "vecinos." Aparecen dos preguntas duras:

1. **Cuándo** ponemos una nota nueva en el tablón de cada quien?
2. Cómo mantenemos la apertura de la app **rápida** cuando el barrio es enorme?

Esas dos preguntas son toda la entrevista, vestidas de ingeniería.

---

## Qué necesita de verdad el producto

Antes de la arquitectura, fija el producto. Las entrevistas premian a quien aclara, no a quien inventa Kafka primero.

**Debe funcionar**

1. Un usuario puede **publicar** un post (texto; fotos y vídeo suelen guardarse en otro sitio y enlazarse por URL).
2. Un usuario puede **seguir** a personas (o ser amigo) y ver sus posts en el feed de inicio.
3. El home feed muestra historias recientes, normalmente las más nuevas primero en la primera versión.
4. Opciones después: likes, comentarios, mute, amigos cercanos, ranking más inteligente.

**Números de ejemplo para acordar en voz alta** (ejemplos, no ley)

| Objetivo | Meta de ejemplo |
| --- | --- |
| Usuarios activos diarios | Unos 10 millones |
| Follows de una persona normal | Hasta unos pocos miles |
| Follows de celebridad | Millones de followers |
| Tráfico de publicación | Miles de posts por segundo en pico |
| Abrir el feed | Mucho más alto que publicar; este es el camino ocupado |
| Sensación del feed | Primera página en unos cientos de milisegundos |
| Frescura | Posts nuevos visibles en segundos para cuentas normales |

**Normalmente fuera de alcance salvo que lo pidan:** subasta completa de ads, vídeo en vivo, Stories, Explore de "gente que no sigues," cifrado de extremo a extremo. Di qué *no* estás construyendo para que la hora se quede en armar el feed.

Dos flujos importan más que todo lo demás:

1. **Publish (camino de escritura):** alguien publica; el sistema lo guarda y lo acerca a los feeds de los followers.
2. **Home feed (camino de lectura):** alguien abre la app; el sistema devuelve una página de historias lista para mostrar.

---

## Fan-out: la idea que lo decide todo

**Fan-out** significa: "este post único tiene que volverse visible para mucha gente."

Un autor. Muchos followers. Cómo repartes la noticia?

Hay dos estrategias clásicas. Recuérdalas con el periódico y el tablón.

### Fan-out en escritura: rellenar de antemano el buzón de cada uno

Piensa en un repartidor de periódicos a las 5 de la mañana.

Cuando publicas, unos workers buscan tus followers y **dejan una copia de la noticia en el buzón de cada follower** (en software: en la lista de feed prearmada de cada uno). Cuando un follower abre la app, su feed ya está esperando. Abrir el buzón es barato.

En jerga esto es **fan-out on write**, también llamado **modelo push**.

**Por qué se siente genial**

- Las lecturas del home feed son simples: "dame la siguiente página de mi lista."
- Para cuentas normales (cientos o unos pocos miles de followers), se siente casi en vivo.

**Por qué duele**

- El costo escala con el número de followers. Un post de alguien con 10 millones de followers intenta actualizar 10 millones de buzones.
- La gente que nunca abre la app igual recibe correo. Trabajo desperdiciado.
- Las cuentas superpopulares crean una **tormenta de escrituras**.

### Fan-out en lectura: revisar el barrio cuando abres la app

Ahora invierte el diseño.

Cuando publicas, solo clavas tu nota en **tu propio** tablón (guardas un post). Cuando un follower abre la app, el sistema recorre a todos a quienes sigue, recoge notas recientes y las fusiona en una lista temporal para esa visita.

En jerga esto es **fan-out on read**, también llamado **modelo pull**.

**Por qué se siente genial al publicar**

- Publicar es barato: escribes un post y listo.
- No hay trabajo desperdiciado en usuarios inactivos.

**Por qué duele al leer**

- Abrir la app hace trabajo pesado: muchas fuentes que traer y fusionar.
- Si sigues a cientos de personas activas, el costo de fusión y la latencia suben.
- Cumplir un presupuesto de "se siente instantáneo" necesita caché cuidadosa.

### Comparación en una frase

| Estilo | Imagen cotidiana | Momento duro |
| --- | --- | --- |
| Fan-out en escritura | Rellenar cada buzón al publicar | Una celebridad publica |
| Fan-out en lectura | Recorrer el tablón de cada vecino al abrir la app | El usuario sigue muchas cuentas activas |

La mayoría de sistemas reales acaban en un **híbrido**. Lo vemos después del problema de las celebridades, porque el híbrido existe sobre todo para resolverlo.

---

## El problema de las celebridades (con calma)

Una **cuenta de celebridad** no es "alguien famoso." En este diseño significa **una cuenta con un número enorme de followers**: un cantante, un equipo, una marca de noticias, una página de memes virales.

Vuelve al repartidor de periódicos.

- Tu prima publica una foto. Tiene 80 followers. Rellenar 80 buzones está bien.
- Una celebridad publica una foto. Tiene 20 millones de followers. Rellenar 20 millones de buzones por una foto es como pedir a un solo repartidor que entregue el periódico de la ciudad puerta por puerta **ahora mismo**, cada vez que esa persona estornuda en internet.

Qué falla si solo usas fan-out en escritura para celebridades?

1. **Publicar se siente lento o la cola explota.** Se acumulan millones de actualizaciones pequeñas.
2. **Las máquinas de caché se derriten.** Claves calientes y amplificación de escritura concentran el dolor.
3. **Usuarios quietos igual reciben correo.** La mayoría de esos 20 millones no están en línea en este segundo.

Por eso los sistemas de producción tratan distinto a las celebridades. **No** rellenan cada buzón para mega-cuentas. Guardan el post de la celebridad una vez (o en una lista de "posts de este autor") y lo **traen al leer** cuando un follower abre el feed.

No es descortesía hacia la gente famosa. Es física: el costo de escritura no puede crecer sin límite por una sola acción.

Una regla simple que gusta en entrevistas:

- Followers por debajo de un umbral (digamos 10.000): push a las timelines de los followers.
- Followers por encima del umbral: escribe el post, marca al autor como **fuente pull**, fusiona al leer.

Puedes mover el umbral después de medir el retraso de fan-out y la latencia del home feed. La idea importa más que el número exacto.

---

## Híbrido: el diseño que la mayoría de equipos envía

| Tipo de cuenta | Qué pasa al publicar | Qué pasa cuando un follower abre el feed |
| --- | --- | --- |
| Normal | Fan-out en escritura a las listas-buzón de los followers | Leer la lista prearmada |
| Celebridad / mega | Guardar el post; no hacer push masivo | Fusionar la lista prearmada **con** posts recientes de celebridades seguidas |

Esquema de fusión en lectura (conceptual):

```
normal_ids   = últimos ítems de mi timeline prearmada
celeb_ids    = posts recientes de cada celebridad que sigo
merged       = ordenar ambos por tiempo (más nuevo primero)
page         = tomar los primeros N ítems, recordar un cursor para "siguiente página"
```

Ese híbrido mantiene acotado el trabajo cotidiano de publicar y ligero el de abrir la app, y aún así muestra posts de celebridades sin rellenar el planeta entero.

---

## Quién sigue a quién: el grafo

Necesitas una lista fiable de relaciones:

- Quién me sigue? (hace falta para fan-out en escritura)
- A quién sigo? (hace falta para fan-out en lectura / fusión de celebridades)
- Silencié o bloqueé a alguien? (filtra escritura y lectura)

Llámale **grafo de follows** o grafo social. Puede vivir en una base relacional con buenos índices, una base de grafos o un almacén de columnas anchas. Detalle de entrevista que importa:

- Cachea listas calientes de followers y followees.
- Aplica mute, block y privacidad (por ejemplo solo amigos cercanos) **antes** del fan-out, para no escribir posts en timelines que nunca deberían verlos.

Piensa el grafo como la **libreta de direcciones del reparto de periódicos**. Direcciones malas significan buzones equivocados.

---

## Qué guardas en un "buzón" (timeline)

**No** copies el cuerpo completo del post en la lista de cada follower. Copia un **puntero**: normalmente el id del post y una puntuación (a menudo el tiempo).

Por qué?

- Un pie de foto gracioso no necesita vivir en 50.000 copias de texto.
- Los cuerpos viven una vez en el almacén de posts (y en la caché de posts). Las timelines solo guardan ids.

Modelo mental estilo Redis para una timeline empujada:

```
timeline del usuario U = lista ordenada de post_ids (lo más nuevo arriba)
guarda solo los últimos cientos o miles de ids
la historia más vieja puede caer a un almacén durable o reconstruirse si hace falta
```

La timeline es una **vista derivada**, como un índice personalizado. La tabla de posts es la fuente de verdad del contenido.

---

## Caché en lenguaje simple

Una **caché** es un estante rápido de respuestas que esperas necesitar otra vez pronto. El disco y los joins pesados son el almacén de atrás. El camino del feed quiere el estante.

Estantes útiles para un feed:

| Estante | Qué hay | Por qué |
| --- | --- | --- |
| Caché de timeline | Ids de post ordenados por usuario | Abrir home no debería reconstruir desde cero |
| Caché de posts | Texto, enlaces de media, id de autor | Muchos usuarios ven el mismo post viral |
| Caché de usuarios | Nombre, avatar | El mismo autor aparece en muchas tarjetas |
| Caché del grafo | Followers / followees / mutes | El fan-out y la fusión los necesitan rápido |
| Contadores | Likes y comentarios | Números baratos que cambian a menudo |

La **CDN** (red de distribución de contenido) está fuera de esos estantes para los **bytes** reales de foto y vídeo. Tu API de feed debe devolver URLs, no transmitir megabytes de vídeo por los servidores de la app.

Truco de memoria: timelines solo de ids mantienen la RAM cerca de `usuarios × longitud_timeline`, no de `usuarios × tamaño_cuerpo_post`. Los cuerpos se comparten.

Si quieres un kit más profundo de caché después de este post, mira [patrones de caché Redis](/blog/es/redis-caching-patterns).

---

## Ranking: primero cronológico, luego más listo

**Ranking** significa elegir el orden. Los principiantes pueden empezar con honestidad:

### Versión 1: reverse chronological

Lo más nuevo primero. Fácil de explicar. Fácil de guardar (score = tiempo). Buen v1 de entrevista.

### Versión 2: ranking con puntuación

Las apps en producción a menudo reordenan con señales:

- Qué tan reciente es?
- Qué tan cerca está el espectador del autor? (afinidad)
- El post está recibiendo engagement?
- Es un tipo que al espectador le gusta (foto vs enlace)?
- Penalizaciones: ya visto, temas silenciados, patrones de spam

Forma de fórmula mínima (no ML de producción):

```
score = recencia + afinidad + engagement - penalizaciones
```

Dónde suele correr el ranking:

- **No** del todo al publicar para cada espectador (aún no conoces el contexto de cada uno).
- **A menudo** al leer: toma una ventana candidata de ids recientes, re-puntúa, aplica diversidad ligera (no muestres cinco posts de la misma persona seguidos), devuelve una página.

Para entrevistas: di recuperación cronológica primero, luego re-rank opcional sobre un conjunto pequeño de candidatos. El ranking completo con machine learning es otra carrera; nómbralo, no te ahogues.

---

## Camino de publish, paso a paso

1. Comprueba auth y rate limits (que un usuario no inunde la red).
2. Valida texto e ids de media.
3. Crea un post id y **guarda el post de forma durable** (base de datos). Esa es la línea de fiabilidad.
4. Pon el objeto del post en la caché de posts.
5. Encola trabajo de fan-out (async). Responde éxito al cliente **después del guardado durable**, no después de rellenar cada buzón.
6. Los workers cargan followers elegibles del grafo (filtros de privacidad aplicados).
7. Para followers normales, añaden el post id en cada caché de timeline.
8. Para autores celebridad, saltan el push masivo; mantienen una lista "posts por autor" para pull.
9. Opcional: encolar notificaciones ("Asha publicó") en un camino aparte.

Por qué fan-out async? Los usuarios aceptan "tu post está guardado, los amigos lo verán en un segundo." No aceptan un spinner de 30 segundos porque se actualiza un grafo a escala de celebridad.

Ese traspaso async es la misma familia de pensamiento que [arquitectura event-driven](/blog/es/event-driven-architecture-intro).

---

## Camino del home feed, paso a paso

1. Auth, luego servicio de feed.
2. Carga ids candidatos de `timeline:{me}`.
3. Si el usuario sigue celebridades, fusiona posts recientes de celebridades.
4. Pagina con un cursor (token opaco que significa "continúa después de este score").
5. **Hidrata**: carga en lote cuerpos de post y perfiles de autor (multi-get, no una query por tarjeta).
6. Adjunta contadores si hace falta.
7. Pase opcional de ranking.
8. Devuelve JSON. El cliente carga media desde la CDN con las URLs del JSON.

La hidratación es donde mueren en silencio las implementaciones de principiante: un bucle "trae este post, luego aquel" crea una tormenta N+1. Siempre en lote.

---

## Esbozo simple del modelo de datos

**Posts**

| Campo | Rol |
| --- | --- |
| post_id | Clave primaria |
| author_id | Quién lo escribió |
| text | Tamaño limitado |
| media_ids | Enlaces al servicio de media / CDN |
| visibility | public / followers / close friends |
| created_at | Orden temporal y paginación |
| deleted_at | Soft delete |

**Edges (follows)**

| Campo | Rol |
| --- | --- |
| follower_id | Quién sigue |
| followee_id | A quién se sigue |
| state | active / muted / flags de bloqueo |

Par único `(follower_id, followee_id)`. Índice en ambas direcciones para responder "followers de A" y "followees de B" sin escanear la tabla entera.

---

## Cosas que salen mal (y arreglos tranquilos)

| Problema | Arreglo tranquilo |
| --- | --- |
| Publicar de celebridad derrite el fan-out | Pull híbrido; nunca push a millones de timelines en el hilo de la request |
| Post borrado sigue como id | Flag de soft-delete; la hidratación lo descarta; scrub de fondo opcional |
| Unfollow pero quedan posts viejos | Aceptar hasta que hagan scroll, o quitar en background a ese autor de la timeline |
| Mute / block ignorados | Filtrar al elegir destinos y al leer |
| Estampida de caché en post viral | Carga single-flight del objeto post; calentar caché al publicar |
| Retraso de fan-out | Vigilar profundidad de cola y tiempo hasta entregar; sumar workers |
| Complejidad multi-región | Posts durables se replican; timelines a menudo regionales con failover cuidadoso |

La consistencia de feeds suele ser **eventual** en la entrega: la fila del post es sólida; las timelines se ponen al día. No prometes que cada follower vea el mismo milisegundo en todo el mundo.

---

## Intuición mínima de capacidad (dila en voz alta)

Con unos 10 millones de usuarios activos diarios:

- Si la gente abre la app a menudo y cada apertura muestra muchas tarjetas, **domina el camino de lectura**.
- Pull puro para todos los que siguen a cientos de autores activos se encarece rápido. Push ayuda en el caso común.
- La memoria de timelines es grande incluso solo con ids: muchos usuarios × cientos de ids × bytes por entrada. Limita la longitud. Fragmenta la caché.

Son números de conversación, no un plan financiero. Ajusta con el entrevistador.

---

## Qué vigilar en producción

- Éxito de publish y tiempo hasta escritura durable.
- Retraso de la cola de fan-out, sobre todo por tramos de tamaño de followers.
- Latencia del home feed (mediana y cola lenta) y tasas de acierto de caché.
- Misses de hidratación que golpean la base de datos.
- Porcentaje de páginas pure-push vs fusión híbrida.
- Tasa de ids faltantes o borrados en el feed (debe quedarse baja).

Protege el publish con límites para que un spammer no queme la flota de fan-out. Ver [diseñar un rate limiter](/blog/es/design-a-rate-limiter).

---

## Resumen para un amigo

Si tuvieras treinta segundos en un café:

Un news feed es la lista personalizada de historias de cada persona, de la gente a la que sigue. La decisión dura es **cuándo** armar esa lista.

**Fan-out en escritura** es rellenar de antemano el buzón de cada follower cuando alguien publica. Abrir la app es fácil; los posts de celebridad pueden hacer explotar la oficina de correos.

**Fan-out en lectura** es guardar el post una sola vez y luego reunir de todos a quienes sigues al abrir la app. Publicar es fácil; listas de follows muy activas hacen lenta la apertura.

**Híbrido** hace push para cuentas normales y pull para celebridades para que ningún camino se derrita.

La **caché** guarda timelines, posts y perfiles calientes en un estante rápido. El **ranking** puede empezar por lo más nuevo primero y luego re-puntuar un conjunto pequeño de candidatos. Las timelines guardan **ids**, no copias completas de cada pie de foto. Publicar debe tener éxito cuando el post está guardado, mientras el relleno de buzones sigue en segundo plano.

Ese es todo el diseño, sin niebla de buzzwords.

---

## Cierre de entrevista

Una respuesta sólida tiene:

1. Alcance de producto claro.
2. Dos flujos: publish y home.
3. Una decisión nítida de **push vs pull vs híbrido**, con el problema de las celebridades nombrado con calma.
4. Un grafo de follows.
5. Timelines solo de ids, hidratación multi-get y un mapa de caché.
6. Ranking cronológico primero, ranking con puntuación como extensión.

Si sobra tiempo: escala horizontal del web tier, sharding de posts, réplicas de lectura multi-región, y por qué el feed es un índice derivado y no un join SQL gigante de "todo lo que escribieron mis amigos."

Relacionado en este blog: [patrones de caché Redis](/blog/es/redis-caching-patterns), [arquitectura event-driven](/blog/es/event-driven-architecture-intro), [diseñar un rate limiter](/blog/es/design-a-rate-limiter).

