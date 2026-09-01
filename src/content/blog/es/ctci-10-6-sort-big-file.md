---
title: "Ordenar Archivo Gigante: Ordenamiento por Fusión Externa para Datos Masivos (CTCI 10.6)"
description: "Ordena un archivo de 20 GB con memoria RAM limitada mediante ordenamiento por fusion externa (External Merge Sort) y un monticulo Min-Heap en tiempo O(N log N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-6-sort-big-file.webp
previewImage: /assets/images/ctci-10-6-sort-big-file.webp
---

> **TL;DR**
> * **El Problema del Libro:** Imagina que tienes un archivo de 20 GB con una cadena de texto por linea. Explica como ordenarias el archivo.
> * **La Solución Óptima:** **Ordenamiento por Fusión Externa con Min-Heap de K Vías**: (1) Divide el archivo de 20 GB en $K = 20$ bloques de 1 GB (que caben comodamente en RAM); (2) Carga cada bloque en memoria, ordenalo con Quicksort/TimSort y guardalo como archivo temporal ordenado en disco (`chunk_0.txt` ... `chunk_19.txt`); (3) Abre lectores con buffer para los 20 archivos e inserta sus primeras lineas en un Min-Heap (`PriorityQueue`) de tamano $K$; (4) Extrae iterativamente la cadena menor, escribela en el archivo final y lee la siguiente linea del bloque correspondiente; (5) Se ejecuta en **tiempo $O(N \log N)$** y **espacio $O(M)$ en RAM**.
> * **Realidad en Producción:** Motores de ordenacion externa en PostgreSQL / MySQL y fase de sort en Apache Hadoop.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.6), se nos plantea:

*"Explica como ordenar un archivo de 20 GB que contiene una cadena por linea en un entorno con memoria RAM restringida."*

## 2. Arquitectura de External Merge Sort

Dado que el archivo (20 GB) supera la memoria disponible para el proceso, se procesa en dos fases:

1. **Fase de División:** Se leen bloques de 1 GB en RAM, se ordenan y se escriben como 20 archivos intermedios en disco.
2. **Fase de Fusión en K Vías:** Un montículo mínimo (`PriorityQueue`) de tamaño 20 mantiene el menor elemento de cada bloque abierto en streaming, emitiendo el archivo final ordenado en solo 2 pasadas de disco.

## Implementación de Producción

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;
import java.util.PriorityQueue;

public class ExternalMergeSort {
    public static class HeapEntry implements Comparable<HeapEntry> {
        public final String value;
        public final int chunkIndex;

        public HeapEntry(String v, int idx) {
            this.value = v;
            this.chunkIndex = idx;
        }

        @Override
        public int compareTo(HeapEntry other) {
            return this.value.compareTo(other.value);
        }
    }

    public static void mergeSortedChunks(List<File> chunkFiles, File outputFile) throws IOException {
        int k = chunkFiles.size();
        BufferedReader[] readers = new BufferedReader[k];
        PriorityQueue<HeapEntry> minHeap = new PriorityQueue<>(k);

        try {
            for (int i = 0; i < k; i++) {
                readers[i] = new BufferedReader(new FileReader(chunkFiles.get(i)), 65536);
                String line = readers[i].readLine();
                if (line != null) {
                    minHeap.add(new HeapEntry(line, i));
                }
            }

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile), 65536)) {
                while (!minHeap.isEmpty()) {
                    HeapEntry entry = minHeap.poll();
                    writer.write(entry.value);
                    writer.newLine();

                    String nextLine = readers[entry.chunkIndex].readLine();
                    if (nextLine != null) {
                        minHeap.add(new HeapEntry(nextLine, entry.chunkIndex));
                    }
                }
            }
        } finally {
            for (BufferedReader r : readers) {
                if (r != null) r.close();
            }
            for (File f : chunkFiles) {
                f.delete();
            }
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Fase | Complejidad Temporal | Memoria RAM Auxiliar | E/S en Disco |
|---|---|---|---|
| División y Ordenamiento | `O(N log(N / K))` | `O(M)` (1 GB) | 1 lectura + 1 escritura de 20 GB. |
| Fusión en K Vías | `O(N log K)` | `O(K * 64KB)` ($\approx 1.3\text{ MB}$) | 1 lectura + 1 escritura de 20 GB. |
| **Total Pipeline** | **$O(N \log N)$** | **$O(M)$** | **2 Pasadas Secuenciales** |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Ordenación en Bases de Datos

1. **Desbordamiento de `work_mem` en PostgreSQL:** Cuando una consulta `ORDER BY` excede la memoria asignada, el motor vuelca particiones temporales a disco y ejecuta una fusion externa.
2. **Procesamiento Distribuido (Hadoop / Spark):** Los nodos ejecutores ordenan localmente bloques de particion antes de enviarlos por red.

## Casos Límite y Robustez en Producción

1. **Límite de Descriptores de Archivos:** Si $K > 1024$, se ejecutan fusiones jerarquicas en cascada (fusionar de 32 en 32).
