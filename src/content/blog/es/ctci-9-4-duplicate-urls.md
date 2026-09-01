---
title: "URLs Duplicadas: Deduplicación de 10.000 Millones de URLs a Gran Escala (CTCI 9.4)"
description: "Disena algoritmos escalables para detectar URLs duplicadas entre 10.000 millones de registros usando particionamiento en disco, MapReduce y filtros de Bloom."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-4-duplicate-urls.webp
previewImage: /assets/images/ctci-9-4-duplicate-urls.webp
---

> **TL;DR**
> * **El Problema del Libro:** Tienes una lista de 10.000 millones de URLs. ¿Como detectas las URLs duplicadas?
> * **La Solución Óptima:** Tres Enfoques según Restricciones de Hardware: (1) **Filtro de Bloom en RAM**: Con una tasa de error del 0,1%, requiere $18\text{ GB}$ de RAM, encajando en un solo servidor de 32 GB; (2) **Particionamiento en Disco (Hashing Externo)**: Divide las URLs en 4.000 archivos de 250 MB mediante `hash(URL) % 4000`, procesando cada fragmento en un `HashSet` en memoria; (3) **Cluster Distribuido MapReduce**: Mapea a `(hash(url), url)` y consolida en la fase Reduce.
> * **Realidad en Producción:** Deduplicacion en rastreadores de motores de busqueda y pipelines de telemetria en Snowflake / BigQuery.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 9.4), se nos plantea:

*"Describe tecnicas escalables para identificar y eliminar duplicados en una coleccion de 10.000 millones de URLs."*

## 2. Estimación de Escala y Recursos

* **Total de URLs:** $10^{10}$.
* **Longitud Media:** 100 bytes.
* **Tamano Total:** $10^{10} \times 100\text{ bytes} = 1\text{ TB}$.

Dado que 1 TB excede la RAM de un servidor estandar (32-64 GB), analizamos las soluciones optimas.

---

### Solución 1: Particionamiento Externo en Disco
1. Recorrer el archivo de 1 TB secuencialmente.
2. Calcular $k = \text{hash}(\text{URL}) \pmod{4000}$.
3. Escribir la URL en el archivo intermedio $F_k$ ($\approx 250\text{ MB}$).
4. Cargar cada archivo $F_k$ en un `HashSet<String>` en memoria para descartar duplicados.

---

### Solución 2: MapReduce Distribuido
* **Map:** Emite `(hash(url), url)`.
* **Shuffle:** Redirige todas las URLs identicas al mismo Reducer.
* **Reduce:** Descarta duplicados y emite los registros unicos.

---

### Solución 3: Filtro de Bloom Probabilístico
Para $10^{10}$ elementos con error del 0,1%:
$$m \approx 14,4 \times 10^{10}\text{ bits} \approx 18\text{ GB RAM}$$

Permite comprobaciones en microsegundos dentro de un unico servidor.

## Implementación de Producción

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

public class DuplicateUrlDetector {
    private static final int NUM_BUCKETS = 4000;

    public static void splitIntoBuckets(String inputFilePath, String tempDir) throws IOException {
        BufferedWriter[] writers = new BufferedWriter[NUM_BUCKETS];
        for (int i = 0; i < NUM_BUCKETS; i++) {
            writers[i] = new BufferedWriter(new FileWriter(new File(tempDir, "bucket_" + i + ".txt")));
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(inputFilePath))) {
            String url;
            while ((url = reader.readLine()) != null) {
                int bucketIndex = Math.abs(url.hashCode() % NUM_BUCKETS);
                writers[bucketIndex].write(url);
                writers[bucketIndex].newLine();
            }
        } finally {
            for (BufferedWriter w : writers) {
                if (w != null) w.close();
            }
        }
    }

    public static void processBuckets(String tempDir, BufferedWriter outputWriter) throws IOException {
        for (int i = 0; i < NUM_BUCKETS; i++) {
            File bucketFile = new File(tempDir, "bucket_" + i + ".txt");
            if (!bucketFile.exists()) continue;

            Set<String> uniqueUrls = new HashSet<>();
            try (BufferedReader reader = new BufferedReader(new FileReader(bucketFile))) {
                String url;
                while ((url = reader.readLine()) != null) {
                    if (uniqueUrls.add(url)) {
                        outputWriter.write(url);
                        outputWriter.newLine();
                    }
                }
            }
            bucketFile.delete();
        }
    }
}
```

## Análisis de Complejidad y Arquitectura

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| E/S en Disco (1 Máquina) | `O(N)` | 2 pasadas secuenciales sobre el disco. |
| Tiempo MapReduce | `O(N / M)` | Escalable linealmente con $M$ nodos trabajadores. |
| Memoria Filtro de Bloom | `18 GB` | Cabe integramente en 32 GB de memoria RAM. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores de Deduplicación

1. **Ingestión de Logs en Data Warehouses (Snowflake):** Algoritmos de agrupacion externa para filtrar eventos duplicados.
2. **Listas Negras de DNS:** Comprobaciones instantaneas en filtros de Bloom antes de consultar bases de datos en disco.

## Casos Límite y Robustez en Producción

1. **Desbalance de Claves:** Si un particionado supera 500 MB, se aplica un subparticionado recursivo.
