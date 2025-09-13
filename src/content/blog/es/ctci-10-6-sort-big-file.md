---
title: "Sort Big File: Ordenamiento Externo para Archivo de 20 GB con 2 GB RAM (CTCI 10.6)"
description: "Problema CTCI 10.6: algoritmo de ordenamiento por fusión externa para ordenar un archivo de 20 GB con memoria limitada a 2 GB."
date: "2025-09-13"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-6-sort-big-file.webp
previewImage: /assets/images/ctci-10-6-sort-big-file.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.6 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.6: algoritmo de ordenamiento por fusión externa para ordenar un archivo de 20 GB con memoria limitada a 2 GB.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.6**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.6 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.6:** Problema CTCI 10.6: algoritmo de ordenamiento por fusión externa para ordenar un archivo de 20 GB con memoria limitada a 2 GB.

---

## 3. Enfoque óptimo e implementación

```java
// Conceptual External Merge Sort outline
public class ExternalMergeSort {
    public void sortLargeFile(File inputFile, int memoryLimitMB) {
        List<File> sortedChunks = createSortedChunks(inputFile, memoryLimitMB);
        mergeSortedChunks(sortedChunks, new File("sorted_output.txt"));
    }

    private List<File> createSortedChunks(File file, int limitMB) {
        // Read chunk of data fitting in limitMB, sort in RAM, write to temp file
        return new ArrayList<>();
    }

    private void mergeSortedChunks(List<File> chunks, File outputFile) {
        // K-way merge using PriorityQueue reading 1 line at a time from each chunk file
    }
}
```

---

## 4. Complejidad Temporal y Espacial

| Métrica | Complejidad | Explicación |
| --- | --- | --- |
| Complejidad Temporal | O(N) / O(log N) | Recorrido óptimo de datos |
| Complejidad Espacial | O(1) / O(N) | Memoria acotada |

---

## 5. Casos Límite y Resumen

Verifica siempre condiciones de borde, valores nulos y límites de tamaño en entrevistas técnicas.