---
title: "Embeddings vectoriales explicados: lo que de verdad necesita un ingeniero"
description: "Qué codifican los embeddings, cómo funciona la similitud, qué compran las dimensiones, cómo los usan búsqueda y RAG, y los errores que rompen la calidad de retrieval en silencio."
date: "2026-08-01"
tags: [IA y Machine Learning]
coverImage: /assets/images/vector-embeddings-explained.webp
previewImage: /assets/images/vector-embeddings-explained.webp
---

La mayoría de los equipos conoce los embeddings el día que alguien dice "métele un vector DB y listo." Ese atajo sirve para un demo. También esconde lo único que importa: un embedding es un **resumen numérico de longitud fija del significado**, y todo sistema de retrieval solo es tan bueno como lo que ese resumen guarda y lo que tira.

Este post es la versión de ingeniero. No es un survey de investigación. Qué son los embeddings, cómo se comparan, qué significan las dimensiones en la práctica, cómo los usan búsqueda y RAG, y los errores que aparecen cuando ya estás en producción.

El conocimiento aquí está enmarcado a principios de 2026. Los nombres de modelos cambian. La geometría y los modos de fallo se quedan.

---

## La versión en una línea

Un **embedding vectorial** es una lista de números (un vector) que coloca texto, una imagen, audio u otro ítem en un espacio de alta dimensión de forma que **ítems similares queden cerca**.

"Cerca" no es poesía. Es una distancia o un ángulo que calculas con matemáticas simples. Buscar se convierte en "embebe la query, encuentra los vectores guardados más cercanos, devuelve sus payloads."

```
"refund policy for annual plans"
        |
   [embedding model]
        |
  [0.12, -0.44, 0.08, ..., 0.31]   // p. ej. 768 o 1536 floats
        |
  compara con cada vector de chunk
        |
  top-k chunks más cercanos → contexto de la respuesta
```

Ese es todo el truco de producto. El resto es qué modelo eliges, cómo troceas, cómo indexas, y si pretendes que los vectores puros arreglen problemas de keywords que no pueden ver.

---

## Qué codifica un embedding de verdad

Un modelo de embeddings se entrena para que ítems que deben tratarse como relacionados terminen con vectores parecidos. En texto, "relacionado" suele ser una mezcla de:

* **Paráfrasis semántica:** "cancelar mi suscripción" y "cómo paro la renovación automática" quedan cerca aunque compartan pocas palabras.
* **Tema / dominio:** dos párrafos sobre redes de Kubernetes se agrupan frente a recetas de cocina.
* **Señal de tarea (a veces):** modelos entrenados para retrieval suelen atraer **queries** hacia **documentos que las responden**, no solo hacia documentos que repiten la query.

Lo que los embeddings **no** codifican por magia:

* Identificadores exactos que te importan al pie de la letra (SKU `AB-4419`, código de error `E_TIMEOUT_92`, un UUID).
* Restricciones lógicas estrictas ("todas las facturas de más de $10k en Q3 impagadas").
* Hechos frescos que el modelo no vio si esperas que el **embedding solo** "sepa" eso (eso es retrieval + generador, no el vector).
* Geometría entre modelos. El vector A del modelo X no es comparable al vector B del modelo Y. Espacios distintos.

Piensa el vector como una **compresión con pérdida del significado para búsquedas de vecinos cercanos**, no como una fila de base de datos ni como el estado interno completo de un LLM.

### Embeddings de token vs embeddings de documento

Dos cosas comparten la palabra "embedding" y confunden a la gente:

| Tipo | Qué es | Dónde lo ves |
| --- | --- | --- |
| **Embedding de token** | Vector aprendido para una pieza del vocabulario dentro de un transformer | Internos de LLM, diagramas de entrenamiento |
| **Embedding de frase / documento** | Un vector para toda una cadena (o chunk), suele ser pooling o un encoder dedicado | Búsqueda, clustering, RAG, recomendaciones |

Este post habla del segundo tipo: los vectores que guardas y consultas en sistemas de producto. (Los embeddings de token siguen importando por debajo. Casi nunca guardas un vector por token para RAG.)

---

## Similitud: coseno, producto punto, L2

Comparas dos vectores con un score. Los tres que verás en cada vector DB y SDK:

### Similitud coseno

Mide el **ángulo** entre vectores. Importa más la dirección que la longitud.

```
cosine(a, b) = (a · b) / (||a|| * ||b||)
```

El rango es más o menos -1 a 1 para embeddings reales (muchos modelos de texto viven en una banda positiva más estrecha tras el entrenamiento). Más alto significa más similar cuando ordenas por coseno.

**Por qué los equipos lo usan por defecto:** la longitud del documento y la magnitud del embedding varían; el coseno ignora la escala pura. Si **normalizas L2** los vectores primero, el ranking por coseno equivale al ranking por **producto punto**, que en muchos índices es más rápido.

### Producto punto (inner product)

```
dot(a, b) = sum_i a_i * b_i
```

Si los vectores están normalizados, el ranking es el mismo que con coseno. Si no, los vectores más largos pueden dominar. Algunos dual-encoders se entrenan para maximum inner product search (MIPS). Ajusta la métrica a cómo se entrenó el modelo. No asumas.

### Distancia euclídea (L2)

```
L2(a, b) = sqrt(sum_i (a_i - b_i)^2)
```

Más pequeño es más cerca. En altas dimensiones, con vectores normalizados, los vecinos por L2 y por coseno suelen coincidir bastante. Aun así: elige una métrica, configura el índice para ella y manténla en query time.

| Métrica | Ordenar por | Buen default cuando |
| --- | --- | --- |
| Coseno | Más alto mejor | Búsqueda de texto general, la mayoría de APIs SaaS de embeddings |
| Producto punto | Más alto mejor | La ficha del modelo dice MIPS / inner product; vectores normalizados |
| L2 | Más bajo mejor | Algunos pipelines clásicos de CV; cuando el producto lo usa por defecto |

**Regla práctica:** lee la ficha del modelo de embeddings para la distancia prevista. Normaliza si usas coseno. Nunca mezcles métricas entre build y query.

---

## Dimensiones: qué te compra el número

Tamaños habituales en stacks de producto en 2025-2026: **384, 512, 768, 1024, 1536, 3072** (y rarezas por modelo). La dimensión es la longitud de la lista de floats.

### Qué suelen implicar más dimensiones

* **Más capacidad** para separar matices finos (en teoría).
* **Más almacenamiento y RAM** por vector (y overhead del grafo ANN).
* **Un poco más de cómputo** por distancia (casi nunca es el primer cuello de botella; índice + I/O sí lo son).
* **No es un upgrade gratis de calidad.** Un buen modelo open de 768-d puede ganar a un uso flojo de un vector comercial más grande si tus chunks y tu eval son mejores.

### Matryoshka y truncado

Algunos modelos se entrenan para que las **primeras N dimensiones** sigan siendo un embedding usable (estilo Matryoshka). Eso permite guardar 256-d para candidatos baratos y la dim completa para rerank, o recortar almacenamiento sin reentrenar del todo. Solo trunca si la documentación lo soporta. Cortar un modelo al azar por la mitad no es el mismo truco.

### Cuentas rápidas de almacenamiento

Bytes aproximados por vector (float32, sin overhead de índice):

```
bytes ≈ dimensions * 4
```

Ejemplos para **1 millón** de chunks:

| Dims | Vectores crudos (aprox.) | Realidad con HNSW / metadata |
| --- | --- | --- |
| 384 | ~1.5 GB | A menudo varios GB una vez indexado |
| 768 | ~3 GB | Planifica varios GB de RAM/disco |
| 1536 | ~6 GB | Aparecen almacenamiento y p95 de latencia |
| 3072 | ~12 GB | Bien para corpus pequeños; doloroso a escala enorme sin cuantización |

La cuantización (int8, binaria, product quant) cambia calidad por memoria. Mide en **tu** set de eval antes de celebrar el ratio de compresión.

---

## Cómo usan los embeddings la búsqueda y el RAG

### Búsqueda semántica / vectorial

1. Trocea y embebe el corpus offline (o al escribir).
2. Guarda vectores en un índice ANN (HNSW, IVF, variantes en disco, vector DBs gestionados).
3. En query time, embebe la query del usuario con el **mismo** modelo (o el encoder de query emparejado si es asimétrico).
4. Recupera top-k vecinos, adjunta texto y metadata originales, devuelve o pasa aguas abajo.

ANN significa nearest neighbor **aproximado**. Cambias un poco de recall por velocidad a escala. En la mayoría de corpus de producto ese cambio es correcto. En corpus minúsculos, la búsqueda exacta vale y se razona mejor.

### RAG (retrieval-augmented generation)

RAG es búsqueda vectorial (a menudo **más** búsqueda por keywords) alimentando un LLM:

```
Pregunta del usuario
    → embebe la query
    → recupera top-k chunks (dense ± sparse)
    → rerank opcional
    → mete chunks en el prompt
    → el LLM responde con ese contexto
```

El modelo de embeddings no "responde." **Selecciona evidencia.** Si el chunk correcto nunca entra en el top-k, el generador improvisa con mejor prosa.

El retrieval híbrido es el default aburrido de las apps serias: vectores densos para paráfrasis, BM25/sparse para tokens exactos y términos raros, luego fusión (por ejemplo Reciprocal Rank Fusion) y a veces rerank con un cross-encoder.

### Otros usos de producto (misma geometría)

* **Deduplicación / near-duplicates** de tickets, listados o macros de soporte
* **Clustering** de feedback o notas de incidentes
* **Recomendaciones** ("más como esto")
* **Enrutado de moderación** (embebe texto, bucket de política más cercano)

Mismas advertencias: métrica, versión del modelo y evaluación deciden si es útil o teatro.

---

## Elegir y operar un modelo

Checklist que sobrevive al churn de vendors:

* **Mismo modelo (y versión) para índice y query**, salvo que uses a propósito un par asimétrico entrenado así.
* **Longitud máxima de entrada** ≥ tamaño de tus chunks. La truncación silenciosa es un bug de calidad silencioso.
* **Cobertura de idiomas** de tus usuarios, no solo benchmarks en inglés.
* **Encaje de dominio.** Código, legal y biomédico suelen necesitar embedders especializados o fine-tuned.
* **Latencia y coste** a tu QPS, incluidos cold starts si self-hosteas.
* **Fija la versión.** "Latest" en producción es una migración sorpresa de re-embed.
* **Guarda el texto crudo junto al vector.** Lo necesitas para prompts, citas, debug y reindexar.

Re-embeber es una **migración**: dual-write o índice blue/green, backfill, cambiar lecturas, borrar el espacio viejo. Presupuéstalo como un cambio de schema, no como un flip de config.

---

## Errores comunes (los que queman sprints)

### 1. Chunks malos, culpa al modelo

Los embeddings puntúan la unidad que guardaste. Cortes a mitad de frase, tablas hechas pedazos y blobs de 4k tokens producen vecinos flojos. Arregla chunking y metadata antes de cambiar de proveedor.

### 2. Un modelo en docs, otro en el path de query

Staging usó el modelo A. Producción aún tenía el modelo B de un spike. Los scores parecen aleatorios. Fija el model id en config y assertea al arrancar.

### 3. Métrica de similitud incorrecta

Índice construido para coseno, queries puntuadas como L2 sin la normalización adecuada (o al revés). El ranking se mueve de formas que parecen "ANN está roto."

### 4. Solo vectores para IDs exactos

Los usuarios buscan `INC-20481` o un nombre de función. El retrieval denso parafrasea; no garantiza hits léxicos. Añade keyword/sparse o filtros estructurados.

### 5. Ignorar filtros y ACLs

El vecino más cercano de todo el corpus devuelve el doc correcto del tenant incorrecto. Los filtros de metadata (tenant, versión de producto, idioma, ACL) van en el plan de retrieval, no como ocurrencia tardía en el prompt.

### 6. Cargo cult de top-k

`k=5` para siempre. A veces necesitas 20 candidatos hacia un reranker. A veces 3 chunks finos ganan a 15 ruidosos que llenan la ventana de contexto. Ajusta con un set de eval, no con vibes.

### 7. Sin harness de evaluación

Sin queries etiquetadas (o al menos un golden set fijo), cada cambio es storytelling. Sigue métricas de retrieval (recall@k, MRR) y calidad de respuesta end-to-end por separado. El retrieval puede estar bien y la generación mal, y al revés.

### 8. Tratar la dimensión como dial de calidad

Duplicar dimensiones sin medir no arregla soporte bilingüe, docs obsoletos ni ACLs que faltan. Mide.

### 9. Olvidar normalización y vectores duplicados

Setups de coseno sin normalizar, o el mismo párrafo embebido diez veces por un ingest malo, ensucian la lista de vecinos. Dedup al escribir. Normaliza cuando tu métrica lo espera.

### 10. Esperar que los embeddings sustituyan features de ranking

Click-through, recencia, autoridad y reglas de negocio siguen importando. Los vectores son una señal. Los stacks de búsqueda de producción las mezclan a propósito.

---

## Un modelo mental mínimo que puedes quedarte

1. **Embed** = mapear ítems a un espacio vectorial compartido.
2. **Similitud** = ángulo o distancia en ese espacio (elige una, sé consistente).
3. **Dimensión** = palanca de capacidad y coste, no un score mágico de calidad.
4. **Búsqueda / RAG** = vecinos cercanos como evidencia candidata, casi siempre híbrido, a menudo con rerank.
5. **Calidad** = chunking + modelo + métrica + filtros + eval. Falla una y el demo sigue viéndose bien hasta que llegan usuarios reales.

Si solo recuerdas una frase: **los embeddings convierten "encontrar significado relacionado" en geometría, y tu sistema aún tiene que elegir las unidades correctas, la métrica correcta y los candidatos correctos antes de que cualquier LLM escriba una respuesta pulida.**

Eso basta para diseñar un path de retrieval, leer la ficha de un modelo sin desconectarte, y empujar cuando alguien trate una base vectorial como sustituto de pensar en producto.
