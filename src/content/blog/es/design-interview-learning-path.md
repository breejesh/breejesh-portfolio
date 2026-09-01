---
title: "Sigue aprendiendo system design: bloques, orden de práctica y esta serie"
description: "Después de los diseños clásicos de entrevista, aprende los bloques reutilizables en lenguaje claro, sigue un orden de práctica para principiantes y usa esta serie del blog como mapa de estudio."
date: "2026-01-30"
tags: [Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/design-interview-learning-path.webp
previewImage: /assets/images/design-interview-learning-path.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Después de los diseños clásicos de entrevista, aprende los bloques reutilizables en lenguaje claro, sigue un orden de práctica para principiantes y usa esta serie del blog como mapa de estudio.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Terminaste la lista. Rate limiter. Acortador de URL. Feed. Chat. Drive. Video. Se siente como la meta.

Luego llega un prompt nuevo con otro nombre de producto, y las mismas pocas ideas vuelven a la sala. Eso no es un fracaso. Esa es la lección.

**Los diseños fueron problemas de práctica. Los bloques de construcción son el curso de verdad.**

Este post es un plan de estudio para después de ese primer pase. Lo mantendré simple. Una frase por bloque. Un orden de práctica que se acumula. Enlaces a esta serie para que siempre sepas qué abrir después. Piensa en un profesor paciente: sin hype, solo un mapa que sí puedes seguir.

Si el proceso de entrevista aún se siente borroso, empieza por el [framework de entrevista](/blog/es/design-interview-framework) y la [estimación back-of-the-envelope](/blog/es/design-back-of-envelope-estimation). Si nunca has llevado un solo servidor a un boceto multi-región, haz [escalar de cero a millones](/blog/es/design-scale-zero-to-millions) una vez con temporizador.

---

## Qué significa "listo" de verdad

No estás listo porque puedes redibujar una arquitectura de memoria. Estás en buen lugar cuando puedes:

1. **Nombrar los bloques** que un diseño necesita antes de dibujar cajas.
2. **Explicar por qué** un bloque entra o sale para este producto.
3. **Cambiar herramientas** (Redis vs Memcached, Kafka vs SQS, hash vs range shard) sin reescribir toda la historia.
4. **Estimar a grosso modo** (QPS, almacenamiento, ancho de banda) antes de inventar servicios.
5. **Defender dos o tres trade-offs** en voz alta con un poco de presión.

Las entrevistas premian ese músculo. El trabajo real de on-call lo premia más.

---

## Bloques de construcción (una frase clara cada uno)

La mayoría de los diseños de producto son remixes de un conjunto pequeño de ideas. Apréndelos en frío. Cada prompt nuevo se acorta.

### Balanceador de carga

Un **balanceador de carga** se pone delante de muchos servidores y envía cada petición a uno sano para que ninguna máquina tenga que absorber todo el tráfico.

### Caché

Una **caché** guarda una copia caliente de los datos cerca de la app para que la mayoría de las lecturas no toquen la base de datos primaria lenta.

### Shard

Un **shard** es una rebanada del dataset (o de la carga de escritura) para que muchas máquinas compartan un trabajo que una sola nunca podría sostener para siempre.

### Cola

Una **cola** guarda trabajo para más tarde para que la petición del usuario no espere al email, la codificación, el fan-out, el crawl o una API externa inestable.

### Réplica

Una **réplica** es una copia extra de los datos que se usa para failover y a menudo para más capacidad de lectura cuando una sola copia no basta.

### Idea extra: consistencia vs disponibilidad

Cuando la red se rompe entre máquinas, a menudo no puedes prometer acuerdo perfecto y uptime perfecto en el mismo camino al mismo tiempo, así que eliges por función qué dolor aceptas.

No necesitas eslóganes del teorema CAP en cada diapositiva. Necesitas una frase calmada: "Para el checkout prefiero consistencia más fuerte. Para un feed social puedo vivir con un retraso corto."

---

## Cómo aparecen los bloques en la serie

No necesitas llenar cada celda en la pizarra. Necesitas saber qué celdas cargan el peso del prompt que tienes delante.

| Diseño | Balanceo | Caché | Shard | Cola | Réplica |
| --- | --- | --- | --- | --- | --- |
| [Acortador de URL](/blog/es/design-url-shortener) | capa de redirect | códigos calientes | por código | analytics después | store de mapeo |
| [Rate limiter](/blog/es/design-a-rate-limiter) | gateway | estado en Redis | por clave | raro | HA de Redis |
| [News feed](/blog/es/design-news-feed-system) | API + workers | timeline | por usuario | jobs de fan-out | grafo + posts |
| [Chat](/blog/es/design-chat-system) | servidores de conexión | presencia | por conversación | push offline | store de mensajes |
| [Autocomplete de búsqueda](/blog/es/design-search-autocomplete) | capa de query | caché de prefijos | diccionario | rebuilds | copias del índice |
| [Estilo YouTube](/blog/es/design-youtube-streaming) | CDN + API | thumbs, manifests | video / usuario | transcode | object store |
| [Estilo Google Drive](/blog/es/design-google-drive) | bordes de upload | metadata | por dueño / archivo | scan, index | metadata + blobs |

Patrones más profundos por bloque:

- Caché: [patrones de caché con Redis](/blog/es/redis-caching-patterns)
- Trabajo async: [arquitectura event-driven](/blog/es/event-driven-architecture-intro)
- Conexiones en vivo: [bases de WebSockets](/blog/es/websockets-realtime-basics)

---

## Orden de práctica para principiantes

Saltar al azar se siente productivo hasta que deja de serlo. Este orden construye prerequisitos primero. Ajústalo si una sección ya es fuerte para ti.

### Fase 0: Proceso y números (1 a 2 sesiones)

1. [Framework de entrevista](/blog/es/design-interview-framework): requisitos, API, datos, alto nivel, detailed technical breakdowns, cierre.
2. [Estimación back-of-the-envelope](/blog/es/design-back-of-envelope-estimation): QPS, almacenamiento, ancho de banda, conteo aproximado de máquinas sin precisión falsa.
3. [Escalar de cero a millones](/blog/es/design-scale-zero-to-millions): escala vertical, balanceador, caché, réplica, shard como una sola historia.

### Fase 1: Bloques del data plane (3 a 5 sesiones)

4. [Consistent hashing](/blog/es/design-consistent-hashing)
5. [Key-value store](/blog/es/design-key-value-store)
6. [Generador de IDs únicos](/blog/es/design-unique-id-generator)
7. [Rate limiter](/blog/es/design-a-rate-limiter)
8. [Acortador de URL](/blog/es/design-url-shortener)

Por qué este orden: hashing y key-value reaparecen todo el tiempo. Los IDs salen en casi cada ruta de escritura. El rate limiting enseña contadores compartidos con relojes imperfectos. El acortador de URL es el primer producto completo que aún cabe en 45 minutos.

### Fase 2: Async y grafos sociales (4 a 6 sesiones)

9. [Web crawler](/blog/es/design-web-crawler)
10. [Sistema de notificaciones](/blog/es/design-notification-system)
11. [News feed](/blog/es/design-news-feed-system)
12. [Sistema de chat](/blog/es/design-chat-system)
13. [Autocomplete de búsqueda](/blog/es/design-search-autocomplete)

Aquí las colas, el fan-out, la presencia y las estructuras de prefijo dejan de ser abstractas. Empareja el chat con [bases de WebSockets](/blog/es/websockets-realtime-basics) si el estado de conexión aún se siente mágico.

### Fase 3: Media pesada y archivos (2 a 3 sesiones)

14. [Streaming estilo YouTube](/blog/es/design-youtube-streaming)
15. [Google Drive](/blog/es/design-google-drive)

Estos fuerzan pensar en CDN, object storage, upload por chunks, pipelines de encode y consistencia de metadata. Hazlos cuando ya puedas contar una historia limpia sobre colas y replicación.

---

## Cómo practicar cada diseño

Usa el mismo bucle cada vez. Los bucles aburridos ganan.

1. **Temporizador puesto** (35 a 45 minutos). Habla en voz alta aunque estés solo.
2. **Requisitos primero.** ¿Qué entra en scope? ¿Qué queda fuera?
3. **Números temprano.** Incluso los aproximados cambian el diseño.
4. **Un diagrama de alto nivel.** Luego deep-dive solo en dos o tres puntos calientes.
5. **Escribe tres trade-offs** al final, no diez.
6. **Al día siguiente, redibuja en blanco** sin notas. Los huecos son tu lista de estudio.

Estiramiento opcional: construye una versión mínima de un bloque (token bucket en Redis, un servicio de códigos cortos, un worker simple de fan-out). Las entrevistas cuidan más el juicio que el código, pero entregar un bloque una vez elimina mucha mano alzada.

---

## Mapa de la serie (este blog)

| Orden | Tema | Enlace |
| --- | --- | --- |
| 1 | Escalar de cero a millones | [design-scale-zero-to-millions](/blog/es/design-scale-zero-to-millions) |
| 2 | Estimación back-of-the-envelope | [design-back-of-envelope-estimation](/blog/es/design-back-of-envelope-estimation) |
| 3 | Framework de entrevista | [design-interview-framework](/blog/es/design-interview-framework) |
| 4 | Rate limiter | [design-a-rate-limiter](/blog/es/design-a-rate-limiter) |
| 5 | Consistent hashing | [design-consistent-hashing](/blog/es/design-consistent-hashing) |
| 6 | Key-value store | [design-key-value-store](/blog/es/design-key-value-store) |
| 7 | Generador de IDs únicos | [design-unique-id-generator](/blog/es/design-unique-id-generator) |
| 8 | Acortador de URL | [design-url-shortener](/blog/es/design-url-shortener) |
| 9 | Web crawler | [design-web-crawler](/blog/es/design-web-crawler) |
| 10 | Sistema de notificaciones | [design-notification-system](/blog/es/design-notification-system) |
| 11 | News feed | [design-news-feed-system](/blog/es/design-news-feed-system) |
| 12 | Sistema de chat | [design-chat-system](/blog/es/design-chat-system) |
| 13 | Autocomplete de búsqueda | [design-search-autocomplete](/blog/es/design-search-autocomplete) |
| 14 | Streaming estilo YouTube | [design-youtube-streaming](/blog/es/design-youtube-streaming) |
| 15 | Google Drive | [design-google-drive](/blog/es/design-google-drive) |
| 16 | Este learning path | [design-interview-learning-path](/blog/es/design-interview-learning-path) |

Posts de apoyo que afilan los bordes:

- [Cómo funciona DNS](/blog/es/how-dns-works-for-engineers)
- [Cómo funcionan HTTPS y TLS](/blog/es/how-https-tls-works)
- [OAuth 2.0 para desarrolladores](/blog/es/oauth2-for-developers)
- [Patrones de caché con Redis](/blog/es/redis-caching-patterns)
- [Arquitectura event-driven](/blog/es/event-driven-architecture-intro)
- [WebSockets para apps en tiempo real](/blog/es/websockets-realtime-basics)

---

## Un plan semanal simple

Si tienes poco tiempo, no pulas el plan. Ejecuta el plan.

| Día | Foco | Entregable |
| --- | --- | --- |
| Lun | Un bloque a fondo (caché o cola o shard) | Una página de notas + modos de fallo |
| Mié | Un diseño completo de la serie | Pizarra o doc con tiempo |
| Vie | Redibujar el diseño anterior en frío | Solo lista de huecos |
| Fin de semana (opcional) | Un eng blog real de una empresa | Tres ideas reutilizables |

Cuatro semanas firmes ganan a doce fines de semana de video pasivo.

---

## Cómo seguir aprendiendo después de la serie

Los drills de pizarra se estancan. Estira en tres direcciones tranquilas.

**1. Lee una arquitectura real por semana.** Pregunta solo: ¿qué bloques usaron, qué falló a la escala anterior y qué se negaron a hacer?

**2. Compara dos diseños que comparten un bloque.** Rate limiter vs generador de IDs ambos necesitan cuidado en escrituras multi-nodo. Fan-out de feed vs fan-out de notificaciones ambos necesitan colas e idempotencia, pero con presupuestos de latencia distintos. Escribe cinco viñetas sobre qué se transfiere y qué no.

**3. Añade un poco de profundidad operativa.** Métricas (QPS, p99, lag de cola, hit ratio de caché), drills simples de fallo (matar un nodo de caché, frenar un consumer) y coste (cuándo la CDN gana al código ingenioso).

Enseñar a otra persona es la auditoría más rápida. Si no puedes explicar consistent hashing sin mirar un diagrama, aún no lo posees. Está bien. Eso es información.

---

## Resumen para un amigo

Si tuvieras que mandar esto en un mensaje:

Terminaste un montón de problemas de system design. Esas fueron repeticiones, no el temario. El temario son cinco bloques: el balanceador reparte tráfico, la caché acelera lecturas calientes, el shard parte datos entre máquinas, la cola aplaza trabajo lento, la réplica copia datos para seguridad y lecturas. Aprende los bloques, practica diseños en orden desde proceso y números hasta sistemas de media, y mantén un bucle semanal corto de estudio, diseño con tiempo y redibujo en frío. La serie de este blog es un camino completo por ese plan.

---

## Cierre

La habilidad de system design no es "me aprendí YouTube de memoria". Es "puedo armar balanceo, caché, sharding, colas, replicación y elecciones honestas de consistencia bajo una historia de producto nueva".

Empieza donde eres débil. Si los números te asustan, haz estimación. Si el async te confunde, haz crawler y notificaciones antes de Drive. Si te congelas en la estructura, corre el post del framework dos veces con temporizador.

Luego sigue. La práctica constante basta. No hace falta ser dramático. Solo hay que aparecer a la siguiente sesión.

