---
title: "Estimación back-of-the-envelope para entrevistas de system design"
description: "Aprende math de capacidad a ojo para entrevistas: QPS, almacenamiento, ancho de banda y latencia con analogías cotidianas, un ejemplo resuelto paso a paso y un resumen para un amigo."
date: "2026-02-13"
tags: [Diseño de sistemas]
coverImage: /assets/images/design-back-of-envelope-estimation.webp
previewImage: /assets/images/design-back-of-envelope-estimation.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Aprende math de capacidad a ojo para entrevistas: QPS, almacenamiento, ancho de banda y latencia con analogías cotidianas, un ejemplo resuelto paso a paso y un resumen para un amigo.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Organizas una fiesta para unas 30 personas. No necesitas una hoja de cálculo de catering. Preguntas: ¿Cuántos vendrán de verdad? ¿Cuántas porciones come cada uno? ¿Beben más refresco o agua? Con eso compras pizza y bebidas. Puede que te falte o te sobre un par de pizzas. Está bien. Comprar 3 pizzas para 30 adultos con hambre es un desastre. Comprar 40 es un desperdicio, pero se sobrevive.

O piensa en la compra semanal. Miras la nevera, estimas cuántas comidas cocinarás, añades un poco de margen y sales. No pesas cada tomate. Haces planificación de **órdenes de magnitud** para no quedarte sin comida a mitad de semana ni llenar el carrito de cosas que se van a pudrir.

La **estimación back-of-the-envelope** es el mismo hábito aplicado al software. Antes de dibujar veinte cajas en la pizarra, preguntas: ¿Cuántas peticiones nos llegan por segundo? ¿Cuántos datos guardamos? ¿Qué tan pesadas son las respuestas que salen por la red? Las respuestas aproximadas moldean el diseño. Equivocarte por un factor de 2 suele estar bien. Equivocarte por 100 (olvidar picos, o mezclar megabytes con gigabytes) es lo que hace que el entrevistador se encoja.

Este post enseña esa habilidad desde cero. Sin asumir que ya dominas entrevistas. Empezamos por el *por qué*, luego nombramos los cuatro números con analogías de cocina y tráfico, luego recorremos un ejemplo de app de fotos despacio, con la aritmética escrita, y cerramos con un resumen del tipo "explícaselo a un amigo".

---

## Por qué importa el math grueso antes de cualquier fórmula

En una entrevista de system design la sala no puntúa la división larga. La sala comprueba:

1. **¿Dejas que la escala moldee la arquitectura?** Un feed con 50 peticiones por segundo y otro con 50.000 son productos distintos, aunque ambos sean "un timeline".
2. **¿Separas media y pico?** La hora de comida y el día de lanzamiento no son la media diaria.
3. **¿Mantienes las unidades honestas?** "Unos 5" no dice nada. "Unos 5 TB al año de fotos" sí.
4. **¿Puedes hablar mientras calculas?** La entrevista es narración más números, no trabajo silencioso con calculadora.

Si saltas la estimación, a menudo sobre-diseñas (microservicios y multi-región para una herramienta con 200 usuarios) o infra-diseñas (una sola base de datos para cada vista de foto del mundo). Cinco minutos de math grueso evitan ambos.

**No** estás haciendo un plan de capacidad de finanzas. Enuncia supuestos en voz alta. Redondea con agresividad. Sigue adelante cuando el orden de magnitud baste para elegir una dirección de arquitectura.

---

## Los cuatro números, en lenguaje simple

Memoriza los nombres. Las fórmulas vienen después de que puedas *sentirlos*.

### QPS (queries per second): el tráfico en la puerta

**QPS** es cuántas peticiones maneja tu sistema en un segundo.

Imagen de cocina: un food truck. Si 3.600 clientes piden en una hora y llegan de forma uniforme, eso es cerca de 1 cliente por segundo. Si termina un concierto y se alinean 30 a la vez, tu tasa de *pico* es mucho mayor que la *media*.

Imagen de tráfico: coches por un peaje. La media de coches por segundo en un día es tranquila. El pico del viernes por la tarde es lo que dimensiona los carriles.

En entrevistas:

- **QPS medio** = carga base para servidores, bases de datos y rate limits.
- **QPS de pico** = para lo que dimensionas (a menudo 2x a 5x la media; di tu factor en voz alta).
- **QPS de lectura vs escritura** = suelen ser distintos. Las apps sociales suelen ser read-heavy (muchas vistas, menos posts).

Ejemplo pequeño, escrito:

- 1.000.000 de personas usan la app cada día (1M DAU).
- Cada una hace 1 petición al día.
- Un día tiene unos 100.000 segundos (redondeamos 86.400; más abajo).
- QPS medio ≈ 1.000.000 ÷ 100.000 = **10 QPS**.

Eso es un sistema pequeño. No necesitas un clúster enorme para 10 QPS de peticiones simples.

### Almacenamiento: la despensa y el almacén

**Almacenamiento** es cuánto disco (u object storage) necesitas para guardar datos el tiempo que el producto exige.

Imagen de cocina: el tamaño de la despensa depende del tamaño del paquete × cuántos paquetes compras × cuánto tiempo guardas sobras. Un bote de especias es minúsculo. Un congelador lleno de helado no.

En software:

- Una fila de metadata de chat puede ser unos cientos de bytes.
- Una foto puede ser 0,5 MB tras compresión.
- Un vídeo puede ser cientos de MB.

Separa siempre **metadata** (filas pequeñas: quién, cuándo, título) de **blobs** (fotos, vídeos, archivos). Viven en sistemas distintos y dominan el coste de formas distintas.

### Ancho de banda: el ancho de la tubería

**Ancho de banda** es cuántos datos se mueven por segundo (o por día) dentro o fuera de un servicio.

Imagen de cocina: el ancho del desagüe del fregadero. Un hilo de agua va bien. Vaciar un cubo de golpe inunda la encimera.

Imagen de tráfico: una carretera de 2 carriles frente a 8. Los mismos "coches", distinta capacidad si cada coche es un camión lleno de vídeo.

En entrevistas, un chequeo clásico es:

`QPS de lectura de pico × tamaño medio de respuesta ≈ ancho de banda de pico`

Si ese número es enorme, a menudo necesitas un CDN (caché en el edge cerca de los usuarios) o payloads más pequeños, no un servidor de app más grande.

### Latencia: cuánto tarda un pedido

**Latencia** es cuánto espera una petición de principio a fin (o cuánto tarda un paso dentro del sistema).

Imagen de cocina: tiempo desde "pedí" hasta "plato en la mano". Un paso lento (horno frío, repartidor atascado) arruina la experiencia aunque la cocina sea enorme.

Imagen de tráfico: tiempo de un coche de casa al trabajo. Añadir más coches (más QPS) no arregla un puente que siempre tarda 2 horas en cruzarse.

Intuición gruesa que conviene guardar (órdenes de magnitud, no ficha de hardware de 2026):

| Tipo de trabajo | Sensación aproximada |
| --- | --- |
| Leer de memoria / caché | muy rápido |
| Leer de SSD local | sigue siendo rápido en entrevista |
| Seek aleatorio en disco mecánico | notablemente más lento |
| Red dentro de un datacenter | a menudo por debajo de 1 ms de orden |
| Red entre continentes | decenas a cientos de ms |

Qué te da: no pongas "escribir cada evento a disco mecánico antes de responder" en el hot path sin motivo. No digas "replicamos en todas partes" sin admitir que la latencia multi-región es real.

---

## Unidades que no inventas bajo presión

Todo empieza en **bytes**. La gente se congela al mezclar KB, MB, GB, TB.

Tabla útil (potencias de dos, aproximadas):

| Potencia de 2 | Aprox. | Nombre | Sensación cotidiana |
| --- | --- | --- | --- |
| 10 | ~1 mil | 1 KB | texto corto, ids, headers |
| 20 | ~1 millón | 1 MB | foto pequeña, clip corto |
| 30 | ~1 mil millones | 1 GB | RAM de portátil, logs diarios grandes |
| 40 | ~1 billón (US) | 1 TB | trozo grande de DB o media |
| 50 | ~1 mil billones | 1 PB | archivos multimedia multi-año a gran escala |

Atajos para el math de entrevista:

- 1 día = 86.400 segundos ≈ **100.000** segundos (10^5). Suficiente.
- 1 mes ≈ 2,5 millones de segundos.
- Un millón de usuarios × 1 acción al día ≈ **10 QPS** medio (1.000.000 ÷ 100.000).

Si dudas, redondea hacia potencias de diez fáciles. 86.400 pasa a 100.000. 365 días puede pasar a 400 si necesitas almacenamiento multi-año rápido y solo te importa el orden de magnitud.

---

## Disponibilidad en un minuto (los "nines")

A veces preguntan cuánto puede estar caído el sistema. Los "nines" son porcentajes de uptime:

| Disponibilidad | Downtime aproximado al año |
| --- | --- |
| 99% (dos nines) | unos 3,65 días |
| 99,9% (tres nines) | unas 8,8 horas |
| 99,99% (cuatro nines) | unos 53 minutos |
| 99,999% (cinco nines) | unos 5 minutos |

Imagen de cocina: un café "abierto el 99% del año" sigue cerrado varios días. Un sistema de pagos suele apuntar más alto que una wiki interna.

No inventes un SLA dramático para sonar senior. Elige un objetivo acorde al producto y diseña para eso.

---

## Receta de QPS (escríbela en la pizarra)

1. Obtén el **DAU** (usuarios activos diarios), o estímalo desde el MAU (mensuales).
2. Obtén **acciones por usuario al día** en el endpoint caliente (uploads, vistas, posts).
3. QPS medio ≈ `(DAU × acciones por día) / 100.000`.
4. QPS de pico ≈ media × factor de pico (a menudo **2x a 5x**; pregunta o di 3x).
5. Separa **lecturas** y **escrituras**. Un solo número de "tráfico" esconde el cuello de botella real.

De QPS a servidores (solo sanity check muy grueso):

Si una instancia de app aguanta unos 1.000 QPS simples con latencia aceptable (depende mucho del trabajo por petición):

`servidores ≈ QPS de pico / QPS por instancia`

Añade holgura (digamos 2x) para deploys y fallos. No es una orden de compra. Es un chequeo de que "una máquina" o "una flota pequeña" es plausible.

---

## Receta de almacenamiento

Almacenamiento ≈ **tamaño del objeto × escrituras por día × días retenidos**, luego multiplica por réplicas, índices y desperdicio.

1. **Tamaño medio de payload** (texto, metadata, media). Cap y media por separado si hay media.
2. **Escrituras al día** desde DAU y tasa de create.
3. **Retención** (¿30 días? ¿5 años? ¿para siempre?).
4. Multiplicadores: réplica (3x es un default habitual en entrevista), índices (quizá 20% a 50% extra en algunas tablas), logs, versiones.

La media domina cuando existe. Una foto media de 1 MB a 1.000.000 uploads/día es **1 TB/día** antes de thumbnails y cachés CDN. Separa siempre tamaño de la base de metadata del object store.

---

## Receta de ancho de banda

1. **Tamaño de respuesta × QPS** en el hot path de lectura.
2. O **bytes escritos al día / 100.000** para ingreso sostenido de escritura.
3. Ancho de banda de pico ≈ QPS de pico × bytes por respuesta.

Fragmento de ejemplo:

- 50.000 QPS de lectura
- 2 KB de respuesta media

`50.000 × 2 KB = 100.000 KB/s = 100 MB/s`

100 MB/s es unos **0,8 Gbps**. Ese único número dice si la tarjeta de red de una máquina es absurda, si hace falta edge CDN, y si respuestas más pequeñas (paginación, menos campos) forman parte del diseño.

---

## Ejemplo resuelto: app de fotos (paseo lento)

Usa números inventados pero coherentes. Di que son supuestos. Escríbelos.

**Supuestos:**

- 200 millones de usuarios activos mensuales (MAU)
- La mitad usa la app un día dado → **100 millones de DAU**
- Cada usuario diario sube **0,2** fotos al día de media (unas 1 foto cada 5 días)
- Cada usuario diario ve **20** fotos al día
- Foto media almacenada: **0,5 MB** tras compresión
- Thumbnail del feed: **20 KB**
- Metadata por foto: **200 bytes**
- Conservar originales **5 años**
- Factor de pico en vistas: **3x**

### Paso 1: QPS de escritura (uploads)

Uploads diarios:

`100.000.000 DAU × 0,2 fotos = 20.000.000 fotos al día`

QPS medio de escritura (usando 100.000 segundos por día):

`20.000.000 ÷ 100.000 = 200 QPS`

QPS de pico de escritura (si también peakes uploads a 3x, o al menos mencionas el burst):

`200 × 3 = 600 QPS`

**Significado en palabras:** unas 200 peticiones de subida por segundo en un segundo normal. Es trabajo real, pero no es el número aterrador de este producto.

### Paso 2: QPS de lectura (vistas)

Vistas diarias:

`100.000.000 × 20 = 2.000.000.000 vistas al día`

QPS medio de vista:

`2.000.000.000 ÷ 100.000 = 20.000 QPS`

QPS de pico de vista:

`20.000 × 3 = 60.000 QPS`

**Significado:** las lecturas son unas 100× las escrituras (20.000 vs 200 de media). El problema de escala es **ver**, no subir.

### Paso 3: Almacenamiento de objetos (las fotos en sí)

Volumen diario de media:

`20.000.000 fotos × 0,5 MB = 10.000.000 MB al día`

10.000.000 MB = **10.000 GB** = **10 TB al día**

Cinco años (usa 365 días por año):

`10 TB/día × 365 días/año × 5 años`

Primero: `10 × 365 = 3.650 TB por año`

Luego: `3.650 × 5 = 18.250 TB`

1.000 TB ≈ 1 PB, así que 18.250 TB ≈ **18 PB** raw de una copia.

Si guardas 3 copias por durabilidad (modelo simple de entrevista), planifica del orden de **decenas de petabytes**. Thumbnails y transcodes suman; menciónalos aunque no calcules cada variante.

### Paso 4: Almacenamiento de metadata (filas pequeñas de cada foto)

Metadata diaria:

`20.000.000 × 200 bytes = 4.000.000.000 bytes`

4.000.000.000 bytes = **4 GB al día** (porque 1 GB es unos 1.000 millones de bytes en este math grueso)

Cinco años:

`4 GB/día × 365 × 5`

`4 × 365 = 1.460 GB por año`

`1.460 × 5 = 7.300 GB` ≈ **7,3 TB** raw

**Significado:** la metadata son unos terabytes en años. Puede vivir en un tier normal de base de datos. Las **fotos** son el problema multi-petabyte. Sistemas de almacenamiento distintos para trabajos distintos.

### Paso 5: Ancho de banda si el origin sirviera cada thumbnail

Supón que cada vista bajara un thumbnail de 20 KB desde tu origin (sin CDN):

Pico:

`60.000 QPS × 20 KB = 1.200.000 KB/s`

1.200.000 KB/s = **1.200 MB/s** = **1,2 GB/s**

1,2 GB/s × 8 bits/byte ≈ **9,6 Gbps**, a menudo se dice unos **10 Gbps**.

**Significado:** servir cada imagen caliente desde el tier de app o el path de origin duele. Es un argumento fuerte a favor de **CDN + caché en el edge** para imágenes populares.

### Qué le dices al entrevistador (el punto del math)

"Las escrituras son modestas, unos 200 QPS de media. Las lecturas son el problema de escala, unos 20.000 de media y 60.000 de pico. La metadata en cinco años son solo unos terabytes. Las fotos originales son multi-petabyte. Así que el diseño se centra en object storage, un CDN para media caliente y un path de metadata que se quede simple."

Ese párrafo es por lo que hicimos el math del envelope. Los números te dijeron *dónde* gastar tiempo de diseño.

---

## Tamaño de caché (pasada rápida)

Regla gruesa de entrevista: cachea el **working set** (datos calientes), no todo el almacén.

Imagen de cocina: dejas los ingredientes de esta noche en la encimera, no el supermercado entero en la cocina.

Si el 20% de las keys se lleva el 80% del tráfico:

- 10 millones de objetos activos
- 20% calientes = 2 millones de objetos
- 2 KB cada uno

`2.000.000 × 2 KB = 4.000.000 KB = 4 GB` de caché útil antes de overhead y réplicas.

Enuncia el supuesto 80/20. Si el entrevistador da otro hit rate, recalcula.

---

## Consejos para una pizarra limpia

1. **Redondea y aproxima.** 99.987 ÷ 9,1 es "unos 100.000 ÷ 10". Nadie puntúa la división larga.
2. **Escribe los supuestos.** DAU, acciones por día, tamaño de objeto, retención, factor de pico. Revísalos cuando cambie el diseño.
3. **Etiqueta las unidades siempre.** "5" no sirve. "5 MB/s" o "5 TB/año" sí.
4. **Separa paths de lectura y escritura.** Un solo número de tráfico esconde el cuello de botella.
5. **Separa metadata y media.** Bytes en un almacén de filas y bytes en object storage responden preguntas distintas.
6. **Di cuándo la precisión sobra.** Si el diseño necesita sharding de todos modos, no gastes cinco minutos afinando 12.400 vs 15.000 QPS.
7. **Ofrece el cálculo, no lo fuerces.** Algunos quieren arquitectura primero. Pregunta: "¿Quieres un chequeo rápido de capacidad antes de bajar al detalle?"

---

## Cómo practicar

Los ensayos secos ganan a releer tablas.

1. Memoriza la tabla de unidades hasta que KB → MB → GB → TB → PB sea automático.
2. Elige un producto (chat, acortador de URLs, news feed, drive) y estima QPS + almacenamiento en 10 minutos con temporizador.
3. Cambia un supuesto (10× DAU, añade vídeo, retención 30 días) y recalcula solo lo que se rompe.
4. Explica en voz alta. La entrevista es habla más números.
5. Usa una cheatsheet de una página mientras aprendes y luego retírala.
6. Comprueba contra blogs de ingeniería públicos cuando puedas. El mismo orden de magnitud gana a clavar su cifra exacta.

Practica un sistema **read-heavy** (news feed) y un path **write-heavy** (ingest de métricas, mensajes de chat) para no reutilizar siempre la misma plantilla.

---

## Dónde encaja en la entrevista

El math del envelope suele ser un tramo corto:

1. Aclarar requisitos y supuestos de escala.
2. Diseño de alto nivel.
3. **Chequeo de capacidad** (este post) si la escala no es trivial.
4. Detalle (API, modelo de datos, cuellos de botella, modos de fallo).

Si tus números dicen que una primary de base de datos aguanta la metadata y el object storage aguanta los blobs, dilo y sigue. Si el QPS de lectura de pico son seis cifras y cada lectura pega a disco, arregla el diseño antes de dibujar cajas bonitas de features que nadie pidió.

Posts relacionados: [Diseñar un limitador de tasa](/blog/design-a-rate-limiter), [Diseñar un acortador de URLs](/blog/design-url-shortener), [Patrones de caché Redis](/blog/redis-caching-patterns).

---

## Explícaselo a un amigo

Si un amigo pregunta "¿qué es la estimación back-of-the-envelope en system design?", di esto:

"Es planificar una fiesta, pero para servidores. Calculas cuánta gente viene, cuánto come cada uno y cuánta sobra queda. En software esas conjeturas son **QPS** (peticiones por segundo), **almacenamiento** (cuántos datos guardas), **ancho de banda** (qué tan ancha debe ser la tubería) y **latencia** (cuánto espera una petición). Redondeas fuerte, dices tus supuestos y usas las respuestas aproximadas para elegir arquitectura: una base de datos, una caché, un CDN, sharding, lo que empujen los números. Fallar por un factor de 2 es normal. Mezclar unidades u olvidar picos es el error de verdad."

Luego dales las fórmulas de una línea:

| Necesitas | Fórmula aproximada |
| --- | --- |
| Segundos por día | unos 100.000 (10^5) |
| QPS medio | DAU × acciones por día ÷ 100.000 |
| QPS de pico | media × 2 a 5 (di tu factor) |
| Almacenamiento | tamaño × escrituras/día × días guardados × réplicas |
| Ancho de banda | QPS × bytes por respuesta |
| Caché | working set caliente, no el dataset completo |

La estimación back-of-the-envelope es una herramienta de comunicación. Muestras que las restricciones de escala moldean la arquitectura, y que puedes hacer math grueso honesto sin falsa precisión. Practica las recetas hasta que resulten aburridas. Aburrido es lo que quieres cuando corre el reloj.