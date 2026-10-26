---
title: "Diseña una plataforma de vídeo a escala YouTube: subidas reanudables, transcodificación en paralelo, ABR y el CDN"
description: "Cómo funcionan las plataformas de vídeo de principio a fin: cálculo de capacidad, subidas por fragmentos reanudables, un DAG de transcodificación que divide los vídeos en segmentos y codifica una escalera de bitrates en paralelo, empaquetado HLS y DASH, reproducción con bitrate adaptativo, caché CDN en varios niveles cerca de los espectadores y en qué se va realmente el dinero."
date: "2025-09-29"
tags: [Diseño de Sistemas y Arquitectura, Backend y Bases de Datos]
coverImage: /assets/images/design-youtube-streaming.webp
previewImage: /assets/images/design-youtube-streaming.webp
---

> **TL;DR**
> * **El problema:** Aceptar ficheros enormes de creadores con conexiones poco fiables, convertir cada uno en docenas de formatos y calidades rápidamente y emitirlos a espectadores con todo tipo de dispositivos y redes sin cortes, a una escala en la que el ancho de banda es el mayor coste del negocio.
> * **El diseño:** Subidas por fragmentos reanudables a almacenamiento de objetos; un DAG de transcodificación dirigido por eventos que divide cada vídeo en segmentos cortos y codifica una escalera de bitrates en muchos workers en paralelo; empaquetado en HLS y DASH; reproducción mediante manifiestos firmados, un CDN de varios niveles con cachés dentro o cerca de los proveedores de internet y un reproductor que elige el bitrate de cada segmento.
> * **El resultado:** Una subida de diez minutos en 4K se puede ver en minutos en lugar de horas, la inmensa mayoría de los bytes se sirve desde cachés a pocos saltos de red del espectador y la calidad se adapta de forma continua en lugar de pararse.

YouTube ha dicho que cada minuto se suben más de 500 horas de vídeo y, ya en 2017, que la gente veía más de mil millones de horas al día. Esas dos cifras definen el sistema. El lado de escritura es un gigantesco pipeline de procesamiento por lotes. El lado de lectura es uno de los mayores problemas de distribución de contenido de internet. No comparten casi nada salvo el almacenamiento que hay en medio.

Este artículo diseña los dos lados.

---

## Requisitos y cifras

**Funcionales:** subir vídeos; procesarlos a formatos reproducibles por streaming; reproducirlos en móviles, navegadores y televisores; adaptar la calidad a la red; mostrar miniaturas y metadatos.

**No funcionales:** las subidas sobreviven a las conexiones cortadas; los vídeos nuevos se pueden ver en minutos; la reproducción arranca en un segundo más o menos y casi nunca se queda cargando; disponibilidad global.

| Magnitud | Valor | Implicación |
| --- | --- | --- |
| Subidas | ~500 horas por minuto | ~720.000 horas de vídeo nuevo al día |
| Versiones por vídeo | ~6 resoluciones x 2 o 3 códecs | Cada hora subida se convierte en muchas horas codificadas |
| Almacenamiento codificado | Del orden de varios GB por hora en toda la escalera | Petabytes de almacenamiento nuevo al día |
| Tiempo de visionado | Más de 1.000 millones de horas al día (cifra de 2017) | A ~2,5 Mbps de media, del orden de un exabyte de salida al día |

La última fila explica por qué el CDN, y no el transcodificador, domina el coste y la arquitectura. Ahorrar un 10% de bitrate con una mejor codificación ahorra un 10% de la factura más grande que tienes.

---

## El pipeline de subida y procesamiento

![Pipeline de subida de vídeo: el creador sube fragmentos a través de una API de subida reanudable a un almacenamiento de objetos en bruto, un evento VideoUploaded dispara un orquestador de transcodificación en DAG que divide el vídeo en fragmentos de cuatro segundos, los reparte a una flota de codificadores que produce una escalera de bitrates en varios códecs, un empaquetador escribe segmentos y manifiestos HLS y DASH, mientras miniaturas y comprobaciones de seguridad se ejecutan en paralelo y marcan los metadatos como listos](/assets/images/hld/design-video-upload-pipeline.webp)

* **Creator.** Sube desde un móvil en el tren o desde la conexión de un estudio. El fichero puede pesar gigabytes.
* **Upload API (reanudable).** Divide la subida en fragmentos (por ejemplo de 8 a 16 MB) con un ID de sesión, para que una conexión cortada se reanude desde el último fragmento confirmado en lugar de empezar de cero. Los clientes suelen subir directamente al almacenamiento de objetos con URLs prefirmadas; la API solo gestiona la sesión.
* **Subidas en bruto (almacenamiento de objetos).** Se conserva el fichero original. Cada pocos años aparecen codificadores mejores, y recodificar los vídeos populares a partir del original es como las plataformas reducen después el bitrate.
* **Evento VideoUploaded.** Desacopla la subida del procesamiento. Un pico de subidas encola trabajo en lugar de hacer fallar peticiones.
* **Orquestador de transcodificación en DAG.** El procesamiento es un grafo acíclico dirigido de tareas: analizar, dividir, codificar cada segmento en cada versión, unir, empaquetar, miniaturas y comprobaciones de seguridad. El orquestador sigue el estado de cada tarea y reintenta los fallos de forma individual.
* **Dividir en fragmentos.** Cortar el vídeo en fotogramas clave en segmentos de pocos segundos es la clave de la velocidad. Cada segmento se codifica de forma independiente, así que un vídeo de 10 minutos se convierte en cientos de pequeños trabajos en paralelo.
* **Flota de codificadores (escalera x códecs).** Produce todas las versiones, normalmente H.264 por compatibilidad más VP9 o AV1 por eficiencia. Codificar consume tanta CPU que Google construyó un chip propio de transcodificación de vídeo (el VCU Argos, descrito en 2021) para YouTube.
* **Packager (HLS / DASH).** Envuelve los segmentos codificados en los formatos que esperan los reproductores y escribe los manifiestos con todas las versiones. CMAF permite que HLS y DASH compartan los mismos segmentos multimedia, lo que reduce a la mitad el almacenamiento de la salida empaquetada.
* **Segmentos codificados y manifiestos.** La fuente de verdad del lado de lectura, normalmente en almacenamiento de objetos detrás del CDN.
* **Miniaturas y comprobaciones de seguridad.** Se ejecutan en paralelo: extracción de miniaturas, detección de derechos de autor y clasificadores de políticas. Un vídeo puede ser reproducible para quien lo subió mientras sigue en revisión para su publicación.
* **Base de datos de metadatos del vídeo.** Título, propietario, estado, versiones disponibles y estado del procesamiento.

La nota verde es la recompensa: dividir convierte el tiempo de codificación de "proporcional a la duración del vídeo" en "proporcional a la duración del vídeo dividida por el tamaño de la flota".

**Una escalera de bitrates (ilustrativa, H.264):**

| Versión | Resolución | Bitrate típico |
| --- | --- | --- |
| 240p | 426 x 240 | ~0,4 Mbps |
| 360p | 640 x 360 | ~0,8 Mbps |
| 480p | 854 x 480 | ~1,4 Mbps |
| 720p | 1280 x 720 | ~2,8 Mbps |
| 1080p | 1920 x 1080 | ~5 Mbps |
| 2160p (4K) | 3840 x 2160 | ~15 a 20 Mbps |

Las plataformas modernas no usan una escalera fija. Netflix popularizó en 2015 la **codificación por título**: unos dibujos animados con colores planos necesitan muchos menos bits que una película de acción con grano para la misma calidad percibida, así que cada título tiene su propia escalera.

---

## Reproducción y el CDN

![Ruta de reproducción de vídeo: el reproductor del espectador obtiene primero una URL de manifiesto firmada de la API de reproducción, que comprueba derechos y región contra metadatos y permisos, y luego pide segmentos a una caché de borde cerca o dentro del proveedor de internet, que recurre a una caché regional intermedia y a un escudo de origen delante de los segmentos codificados; el reproductor mide rendimiento y búfer para elegir el bitrate de cada segmento](/assets/images/hld/design-video-playback-cdn.webp)

1. **Primero el manifiesto.** El reproductor llama a la Playback API, que comprueba permisos y reglas regionales y devuelve una URL firmada de vida corta al manifiesto.
2. **Segmentos desde el borde.** El reproductor pide los segmentos uno a uno a la caché de borde más cercana. Los vídeos populares casi siempre están ahí.
3. **Fallos por niveles.** Si falla, el borde pregunta a una caché regional intermedia, que pregunta a un escudo de origen situado delante del almacenamiento. Cada nivel agrupa muchos fallos en una sola petición hacia arriba, así que el origen ve una fracción ínfima del tráfico.
4. **Bitrate adaptativo.** Tras cada segmento, el reproductor actualiza su estimación del rendimiento y mira su búfer, y elige la versión del siguiente segmento. Un túnel corto te baja a 480p unos segundos en lugar de congelar el vídeo.

**Cachés dentro de los proveedores de internet.** Las plataformas más grandes colocan servidores de caché directamente dentro de las redes de los proveedores: los appliances Open Connect de Netflix y la Global Cache de Google son los ejemplos conocidos. Así los bytes nunca cruzan la parte cara de internet. El proveedor ahorra costes de tránsito, la plataforma ahorra salida y el espectador tiene menos latencia.

La nota verde fija el objetivo operativo: el nivel de borde debe servir la inmensa mayoría de los bytes.

---

## En qué se va el dinero

| Coste | Origen | Palanca |
| --- | --- | --- |
| Entrega (salida del CDN) | Tiempo de visionado x bitrate | Mejores códecs (AV1), escaleras por título, cachés dentro de los proveedores |
| Cómputo de codificación | Horas subidas x versiones | Codificar la cola larga de forma perezosa; gastar más cómputo solo en los vídeos populares |
| Almacenamiento | Versiones x retención | Eliminar versiones altas que casi no se ven; guardar los originales en almacenamiento frío |
| Moderación | Volumen de subidas | Primero clasificadores automáticos, revisión humana donde importa |

La cola larga importa aquí. La mayoría de los vídeos subidos se ven poco. Una estrategia común es codificar una escalera mínima al subir y generar las versiones premium (4K, AV1) solo cuando el vídeo demuestra ser popular, porque el coste de codificar solo compensa si llegan los ahorros de entrega.

---

## Modos de fallo

| Fallo | Comportamiento esperado |
| --- | --- |
| La conexión de subida se corta al 80% | Se reanuda desde el último fragmento confirmado |
| Falla una tarea de codificación | El orquestador reintenta solo ese segmento; el resto del DAG sigue |
| Atasco de codificadores durante un pico | La cola crece; se priorizan las subidas cortas y populares; se publican primero las versiones bajas |
| Cae un nodo de caché de borde | El tráfico pasa a los vecinos; el nivel intermedio absorbe los fallos extra |
| Vídeo viral con cachés frías | La agrupación de peticiones en cada nivel evita una estampida sobre el origen |
| La red del espectador empeora | El ABR baja la calidad en lugar de quedarse cargando |

---

## Lista de comprobación para producción

- [ ] Subidas por fragmentos reanudables con URLs prefirmadas directas al almacenamiento
- [ ] Originales conservados para futuras recodificaciones
- [ ] DAG dirigido por eventos con reintentos por tarea y salidas idempotentes
- [ ] División alineada con fotogramas clave para codificar en paralelo
- [ ] Escaleras por título o según el contenido; códecs modernos para el contenido popular
- [ ] HLS y DASH a partir de segmentos CMAF compartidos
- [ ] URLs de manifiesto firmadas y de vida corta; comprobación de permisos y región
- [ ] CDN de varios niveles con agrupación de peticiones y escudo de origen
- [ ] Métricas del reproductor: tiempo de arranque, proporción de recargas, bitrate medio, cambios de calidad
- [ ] Paneles de coste: salida por nivel, horas de codificación por versión, almacenamiento por antigüedad

---

## Lo que queda

Cada vídeo de estas plataformas existe en docenas de copias, de distintos tamaños y calidades, repartidas por miles de máquinas, la mayoría en edificios que pertenecen al proveedor de internet de otro.

El espectador no ve nada de eso. Ve un vídeo que empieza y una etiqueta de calidad que parpadea de 1080p a 720p cuando el tren entra en un túnel y vuelve cuando sale. Ese parpadeo es todo el sistema funcionando.

---

## Fuentes

* [Blog oficial de YouTube: estadísticas de la plataforma (horas subidas por minuto)](https://blog.youtube/press/)
* [Netflix Tech Blog: Per-Title Encode Optimization](https://netflixtechblog.com/per-title-encode-optimization-7e99442b62a2)
* [Netflix Open Connect: descripción general](https://openconnect.netflix.com/en/)
* [Ranganathan et al., "Warehouse-Scale Video Acceleration: Co-design and Deployment in the Wild" (ASPLOS 2021)](https://dl.acm.org/doi/10.1145/3445814.3446723)
* [RFC 8216: HTTP Live Streaming](https://www.rfc-editor.org/rfc/rfc8216)
* [Alliance for Open Media: AV1](https://aomedia.org/av1-features/)
* Relacionado en esta serie: [Diseña Google Drive](/blog/es/design-google-drive), [Escala de cero a millones](/blog/es/design-scale-zero-to-millions), [Estimaciones de servilleta](/blog/es/design-back-of-envelope-estimation)
