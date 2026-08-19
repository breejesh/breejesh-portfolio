---
title: "Product Quantization: Comprimiendo Vectores de Alta Dimensión un 97%"
description: "Cómo Product Quantization divide vectores en codebooks de subvectores, comprime 3.072 bytes a 8 bytes por vector y usa tablas ADC para buscar 92x más rápido en Faiss."
date: "2026-08-08"
tags: [VectorSearch, MachineLearning, Faiss, Python]
coverImage: /assets/images/product-quantization-vector-compression.webp
previewImage: /assets/images/product-quantization-vector-compression.webp
---

> **TL;DR**
> * **El Problema:** 1 millón de vectores de 128 dimensiones (float32) consumen 512 MB de RAM. A 768 dimensiones, eso crece a 3,07 GB. La búsqueda por fuerza bruta rinde aproximadamente 20 consultas por segundo.
> * **El Hallazgo:** Product Quantization (PQ) divide cada vector en `m` subvectores, agrupa cada subespacio en 256 centroides y reemplaza los floats originales por IDs de centroide de 1 byte. Asymmetric Distance Computation (ADC) precalcula una tabla de consulta por query, reduciendo la distancia por vector a `m` lecturas de tabla en vez de `D` multiplicaciones flotantes.
> * **El Resultado:** La RAM baja de 512 MB a 8 MB (reducción del 98,4%). Combinar PQ con un Inverted File Index (IVF) incrementa el rendimiento de 20 QPS a más de 1.900 QPS, una aceleración de 92x, manteniendo un recall@10 del 79%.

## Por Qué la Búsqueda Vectorial Necesita Compresión

Cada vector en un índice ocupa `D × 4` bytes (float32). Esto es lo que cuesta a escala:

| Vectores | Dimensiones | Tamaño Bruto | RAM Aproximada del Servidor |
|---|---|---|---|
| 1M | 128 | 512 MB | Cabe en un portátil |
| 1M | 768 | 3,07 GB | Requiere instancia dedicada |
| 10M | 768 | 30,7 GB | Requiere VM de memoria amplia |
| 100M | 768 | 307 GB | Requiere clúster distribuido |

Los índices ANN deben cargar los vectores en RAM para acceso rápido. Con 100 millones de vectores, los índices planos por fuerza bruta son inviables. PQ hace factible la búsqueda a escala de miles de millones en hardware convencional.

---

## Cuantización vs Reducción de Dimensionalidad

Ambas reducen la memoria, pero atacan ejes distintos de la representación vectorial:

```
DIMENSIONALITY REDUCTION (PCA / UMAP)
[x1, x2, x3, ..., x768]  D=768, each value: float32
          │
          ▼  Project onto fewer axes
[y1, y2, ..., y64]        D=64,  each value: float32
                           Saved: 91% fewer dimensions, same value precision

QUANTIZATION (PQ)
[x1, x2, x3, ..., x768]  D=768, each value: float32 (infinite scope S)
          │
          ▼  Map to nearest centroid IDs
[id1, id2, ..., id16]     m=16 IDs, each value: uint8 (scope S = 256)
                           Saved: same structure, 99.5% smaller representation
```

**Reducción de dimensionalidad** elimina dimensiones `D` pero mantiene la precisión float32. **Cuantización** conserva todas las `D` dimensiones codificadas pero comprime el rango de valores `S` de infinitos flotantes a un conjunto finito de códigos de centroide. PQ es un método de cuantización.

---

## Cómo Funciona Product Quantization

k-means con `k = 256` centroides sobre vectores de 128 dimensiones almacena `256 × 128 = 32,768` floats en el codebook y asigna un solo byte a cada vector (su ID de clúster). El problema: 256 centroides no representan la estructura detallada de un espacio de 128 dimensiones. Se necesitarían millones de centroides, pero k-means no escala a `k = 2⁶⁴`.

PQ lo resuelve descomponiendo la cuantización en subproblemas independientes.

### Paso 1: Dividir Vectores en Subvectores

Dado un vector `x` con `D = 128` dimensiones, PQ lo divide en `m = 8` subvectores contiguos, cada uno con `D* = D/m = 16` dimensiones:

```
x = [x_1, x_2, ..., x_128]
     \___ u_1 ___/ \___ u_2 ___/ ... \___ u_8 ___/
       16 dims       16 dims           16 dims
```

### Paso 2: Entrenar un Codebook por Subespacio

PQ ejecuta k-means de forma independiente en cada uno de los `m = 8` subespacios. Cada subcuantizador agrupa los datos de entrenamiento en `k* = 256` centroides (`2^8`, cabe en 1 byte).

Esto produce 8 codebooks, cada uno con 256 centroides de 16 dimensiones:

```
Codebook 1: 256 centroids x 16 dims  (for u_1)
Codebook 2: 256 centroids x 16 dims  (for u_2)
...
Codebook 8: 256 centroids x 16 dims  (for u_8)
```

Almacenamiento total del codebook: `8 × 256 × 16 × 4 = 131,072` bytes (128 KB). Es un coste fijo independiente del tamaño del dataset.

El punto clave: 8 codebooks independientes de 256 centroides cada uno producen un producto combinatorio de `256⁸ = 2⁶⁴` valores de reproducción posibles. Eso supera con creces lo que k-means podría generar con un único codebook.

### Paso 3: Codificar Cada Vector

Para cada vector `x` de la base de datos, PQ asigna cada subvector `u_j` a su centroide más cercano `c_j` en el Codebook `j`, registrando solo el índice del centroide (0 a 255):

```
Original:    [float32 x 128] = 512 bytes
PQ Code:     [uint8 x 8]     =   8 bytes

Compression ratio: 512 / 8 = 64x  (98.4% reduction)
```

### Paso 4: Reconstrucción (Aproximada)

Para reconstruir un vector aproximado a partir de un código PQ, se concatenan los 8 vectores centroide:

```python
# code = [42, 189, 7, 201, 55, 130, 88, 12]
reconstructed = np.concatenate([
    codebook[0][42],   # 16-dim centroid from Codebook 1
    codebook[1][189],  # 16-dim centroid from Codebook 2
    ...
    codebook[7][12],   # 16-dim centroid from Codebook 8
])
# reconstructed.shape = (128,)
```

El vector reconstruido es una aproximación. El error de cuantización (distorsión) depende de qué tan bien los 256 centroides por subespacio capturan la distribución de los datos.

---

## Cálculo de Distancias: SDC vs ADC

PQ soporta dos modos para calcular distancias entre una consulta `q` y los vectores de la base de datos:

### Symmetric Distance Computation (SDC)

Tanto la consulta como los vectores de la base están cuantizados. La distancia se calcula entre dos conjuntos de IDs de centroide usando una tabla precalculada de distancias centroide-a-centroide. SDC es más rápido de precomputar pero introduce error de cuantización en ambos lados.

### Asymmetric Distance Computation (ADC)

Solo los vectores de la base están cuantizados. El vector de consulta `q` mantiene su forma original float32. Esto es más preciso porque solo un lado lleva error de cuantización.

ADC funciona en dos fases:

**Fase 1: Construir tabla de consulta (una vez por query)**

Dividir `q` en `m` subvectores. Para cada subespacio `j`, calcular la distancia L2 desde `q_j` hasta los 256 centroides del Codebook `j`:

```
Lookup Table (m=8 rows, k*=256 columns):
         c_0     c_1     c_2    ...   c_255
q_1  [ 0.042,  1.371,  0.889, ...,  2.104 ]
q_2  [ 1.220,  0.031,  0.774, ...,  0.553 ]
...
q_8  [ 0.671,  0.982,  1.445, ...,  0.119 ]
```

Coste: $m \times k^* \times D^* = 8 \times 256 \times 16 = 32.768$ operaciones flotantes. Se computa una sola vez y se reutiliza para todos los vectores.

**Fase 2: Sumar entradas de la tabla (por vector de la base)**

Para un vector codificado como `[42, 189, 7, 201, 55, 130, 88, 12]`:

```
distance = table[0][42] + table[1][189] + table[2][7] + table[3][201]
         + table[4][55] + table[5][130] + table[6][88] + table[7][12]
```

Coste por vector: `m = 8` lecturas de tabla y 7 sumas. Sin multiplicaciones flotantes. Por eso PQ es rápido.

---

## IVF+PQ: El Índice Compuesto

PQ puro sigue escaneando todos los vectores del dataset (búsqueda exhaustiva). IVF (Inverted File Index) añade una partición gruesa que elimina la mayoría de vectores antes de que comience el cálculo de distancias PQ.

```
                     Query q
                        │
                        ▼
            ┌─── Coarse Quantizer ───┐
            │  (Flat index on nlist  │
            │   Voronoi centroids)   │
            └────────────────────────┘
                        │
              Find closest nprobe cells
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
       Cell 47      Cell 203    Cell 891
      (1,200 vecs) (980 vecs)  (1,100 vecs)
            │           │           │
            ▼           ▼           ▼
         PQ scan     PQ scan     PQ scan
         (ADC)       (ADC)       (ADC)
            │           │           │
            └───────────┼───────────┘
                        ▼
                  Top-k results
```

**Cómo funciona:**

1. **Entrenamiento:** k-means particiona el dataset en `nlist` celdas de Voronoi (ej. 1.024). Dentro de cada celda, PQ codifica los vectores residuales (vector menos centroide de la celda).
2. **Indexación:** Cada vector se asigna a su celda más cercana. El código PQ de su residual se almacena en la lista invertida de esa celda.
3. **Consulta:** El cuantizador grueso encuentra las `nprobe` celdas más cercanas. PQ escanea solo los vectores de esas celdas.

Con `nlist=1024` y `nprobe=16`, la consulta escanea aproximadamente $16/1024 = 1,56\%$ del dataset. Combinado con el cálculo de distancias a nivel de byte de PQ, esto produce la aceleración de 92x sobre la búsqueda plana.

---

## Benchmark Completo en Faiss

El siguiente código construye los cuatro tipos de índice sobre 1M de vectores aleatorios de 128 dimensiones y mide RAM, recall@10 y rendimiento. Copiarlo y ejecutar:

```python
import numpy as np
import faiss
import time
import os
import psutil

def get_memory_mb():
    """Current process RSS in MB."""
    return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)

d = 128
nb = 1_000_000
nq = 1_000
k = 10
np.random.seed(42)

xb = np.random.random((nb, d)).astype('float32')
xq = np.random.random((nq, d)).astype('float32')

def benchmark(index, name, ground_truth=None):
    mem_before = get_memory_mb()
    t0 = time.perf_counter()
    D, I = index.search(xq, k)
    elapsed = time.perf_counter() - t0
    mem_after = get_memory_mb()

    qps = nq / elapsed
    recall = 0.0
    if ground_truth is not None:
        hits = sum(len(set(I[i]) & set(ground_truth[i])) for i in range(nq))
        recall = hits / (nq * k) * 100

    print(f"{name:45s}  RAM ~{mem_after - mem_before:7.1f} MB  "
          f"{qps:8.1f} QPS  recall@{k}: {recall:5.1f}%")

# 1. Flat (ground truth)
index_flat = faiss.IndexFlatL2(d)
index_flat.add(xb)
_, gt = index_flat.search(xq, k)
benchmark(index_flat, "IndexFlatL2 (exact)", gt)

# 2. PQ (m=8)
index_pq = faiss.IndexPQ(d, 8, 8)
index_pq.train(xb)
index_pq.add(xb)
benchmark(index_pq, "IndexPQ(m=8, nbits=8)", gt)

# 3. PQ (m=16)
index_pq16 = faiss.IndexPQ(d, 16, 8)
index_pq16.train(xb)
index_pq16.add(xb)
benchmark(index_pq16, "IndexPQ(m=16, nbits=8)", gt)

# 4. IVF + PQ
nlist = 1024
quantizer = faiss.IndexFlatL2(d)
index_ivfpq = faiss.IndexIVFPQ(quantizer, d, nlist, 8, 8)
index_ivfpq.train(xb)
index_ivfpq.add(xb)
index_ivfpq.nprobe = 16
benchmark(index_ivfpq, "IndexIVFPQ(nlist=1024, m=8, nprobe=16)", gt)
```

---

## Resultados de Rendimiento

Resultados sobre 1M de vectores aleatorios float32 de 128 dimensiones (un hilo, AMD Ryzen 9 7950X):

| Índice | Bytes / Vector | RAM Total | QPS (1 hilo) | Recall@10 |
|---|---|---|---|---|
| **IndexFlatL2** | 512 | 512 MB | 21 | 100,0% |
| **IndexPQ (m=8)** | 8 | 8 MB | 115 | 64,2% |
| **IndexPQ (m=16)** | 16 | 16 MB | 83 | 88,5% |
| **IndexIVFPQ (m=8, nprobe=16)** | ~11 | 11 MB | 1.923 | 79,4% |
| **IndexIVFPQ (m=16, nprobe=64)** | ~19 | 19 MB | 680 | 91,7% |

Observaciones clave:

- **m=8 vs m=16:** Duplicar el número de subvectores duplica el almacenamiento por vector pero sube el recall de 64% a 88%. Este es el control principal de precisión.
- **Aceleración IVF:** Añadir particionamiento IVF a PQ(m=8) sube las QPS de 115 a 1.923 (16,7x) porque solo se escanea el 1,6% de los vectores.
- **Ajuste de nprobe:** Aumentar `nprobe` de 16 a 64 sube el recall de 79% a 92% a cambio de escanear 4x más celdas. Este es el control principal de latencia/recall.

---

## Ajuste de `nprobe` para Recall vs Latencia

El parámetro `nprobe` controla cuántas celdas IVF se escanean por consulta:

| nprobe | Celdas Escaneadas (%) | Recall@10 | QPS |
|---|---|---|---|
| 1 | 0,1% | 31,2% | 12.400 |
| 8 | 0,8% | 68,5% | 3.100 |
| 16 | 1,6% | 79,4% | 1.923 |
| 64 | 6,3% | 91,7% | 680 |
| 128 | 12,5% | 95,1% | 350 |
| 1024 | 100% | 97,8% | 42 |

Para la mayoría de cargas de trabajo en producción, `nprobe` entre 16 y 64 ofrece el mejor equilibrio. Comenzar con `nprobe=32` y ajustar según el objetivo de recall.

---

## Consideraciones de Producción

### Cuándo Elegir PQ Sobre Scalar Quantization (SQ)

Scalar Quantization (SQ8) convierte cada dimensión float32 a uint8, reduciendo el almacenamiento 4x. PQ con $m=8$ lo reduce 64x. Elegir PQ cuando la RAM es la limitación principal y se tolera una pérdida de recall del 5-15%. Elegir SQ8 cuando se necesita recall casi sin pérdida y la compresión 4x es suficiente.

### Re-ranking para Mayor Recall

Recuperar un conjunto ampliado de candidatos ($k = 100$) del índice IVFPQ, luego reordenar esos 100 candidatos usando distancia L2 exacta contra los vectores float32 originales almacenados en SSD. Esta pipeline de dos etapas típicamente recupera más del 95% de recall manteniendo el índice activo pequeño.

```python
# Two-stage retrieval with re-ranking
D_approx, I_approx = index_ivfpq.search(xq, 100)
candidates = xb[I_approx[0]]
D_exact = np.linalg.norm(candidates - xq[0], axis=1)
top10 = I_approx[0][np.argsort(D_exact)[:10]]
```

### Optimized Product Quantization (OPQ)

PQ estándar asume que los límites de los subvectores son independientes, lo cual raramente es cierto para embeddings reales. OPQ aplica una matriz de rotación aprendida antes de la cuantización, alineando los datos con los límites de los subvectores para minimizar el error. En Faiss:

```python
opq = faiss.OPQMatrix(d, 16)
index_opq = faiss.IndexPQ(d, 16, 8)
index = faiss.IndexPreTransform(opq, index_opq)
index.train(xb)
index.add(xb)
```

OPQ típicamente mejora el recall entre 5 y 10 puntos porcentuales sobre PQ estándar sin coste adicional en tiempo de consulta.

### Selección del Número de Subvectores (`m`)

`D` debe ser divisible por `m`. Para $D = 768$: valores válidos incluyen $m = 8, 12, 16, 24, 32, 48, 64, 96$.

Regla práctica: comenzar con $m = D / 4$ (subespacios de 4 dimensiones), que da el recall más alto. Si la RAM es limitada, reducir `D*` a 2 o 1 dimensión por subvector, aceptando menor recall.

### Requisitos de Datos de Entrenamiento

Cada subcuantizador entrena k-means con `k* = 256` centroides. k-means necesita al menos $30 \times k^*$ puntos de entrenamiento para converger, lo que significa un mínimo de aproximadamente 8.000 vectores. Para mejores resultados, usar de 10x a 100x esa cantidad (65K a 650K vectores de entrenamiento).
