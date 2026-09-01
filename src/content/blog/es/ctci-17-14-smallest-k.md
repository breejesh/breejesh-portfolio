---
title: "K Menores Elementos: Quickselect Lineal vs Montículo Máximo Acotado (CTCI 17.14)"
description: "Encuentra los K elementos mas pequenos en un array utilizando Quickselect de Hoare en tiempo lineal esperado O(N) y monticulos acotados en O(N log K)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-14-smallest-k.webp
previewImage: /assets/images/ctci-17-14-smallest-k.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena un algoritmo para encontrar los $k$ numeros mas pequenos en un array desordenado de longitud $n$.
> * **La Solución Óptima:**
>   1. **Quickselect (Algoritmo de Selección de Hoare)**:
>      * Particionar el array sobre un pivote.
>      * Si `pivotIndex == k`, los $k$ menores ya residen en `array[0..k-1]`.
>      * Si $k < \text{pivotIndex}$, recursar solo a la izquierda; si no, a la derecha.
>      * Se ejecuta en **tiempo lineal esperado $O(N)$** y **espacio $O(1)$**.
>   2. **Montículo Máximo Acotado (Max-Heap)**:
>      * Mantener un Max-Heap de tamano $k$. Insertar elementos menores a la raiz desalojando el maximo.
>      * Se ejecuta en **tiempo $O(N \log K)$** y **espacio $O(K)$** (ideal para streaming).
> * **Realidad en Producción:** Consultas `ORDER BY col LIMIT K` en PostgreSQL y recopilacion de Top-K resultados en Elasticsearch.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.14), se nos plantea:

*"Extrae los k valores minimos de un array de tamano n sin incurrir en el coste de ordenar la totalidad del conjunto."*

## 2. Reducción por Partición

Al particionar el array, se descarta una mitad en cada paso, convergiendo en una serie geometrica de tiempo lineal $O(N)$.

## Implementación de Producción

```java
import java.util.*;

public class SmallestK {

    public static int[] smallestKQuickselect(int[] array, int k) {
        if (array == null || k <= 0 || k > array.length) return new int[0];

        quickselect(array, 0, array.length - 1, k);

        int[] result = new int[k];
        System.arraycopy(array, 0, result, 0, k);
        return result;
    }

    private static void quickselect(int[] arr, int left, int right, int k) {
        if (left >= right) return;

        int pivotIndex = partition(arr, left, right);

        if (pivotIndex == k) {
            return;
        } else if (k < pivotIndex) {
            quickselect(arr, left, pivotIndex - 1, k);
        } else {
            quickselect(arr, pivotIndex + 1, right, k);
        }
    }

    private static int partition(int[] arr, int left, int right) {
        int pivot = arr[right];
        int i = left;

        for (int j = left; j < right; j++) {
            if (arr[j] <= pivot) {
                swap(arr, i, j);
                i++;
            }
        }
        swap(arr, i, right);
        return i;
    }

    private static void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    public static int[] smallestKHeap(int[] array, int k) {
        if (array == null || k <= 0 || k > array.length) return new int[0];

        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(k, Collections.reverseOrder());

        for (int x : array) {
            if (maxHeap.size() < k) {
                maxHeap.add(x);
            } else if (x < maxHeap.peek()) {
                maxHeap.poll();
                maxHeap.add(x);
            }
        }

        int[] result = new int[k];
        for (int i = 0; i < k; i++) {
            result[i] = maxHeap.poll();
        }
        return result;
    }
}
```

## Análisis de Complejidad

| Estrategia | Complejidad Temporal | Espacio Auxiliar | Mutación In-Place | Flujo Streaming |
|---|---|---|---|---|
| **Quickselect** | **Esperado $O(N)$** | **$O(1)$** | **Sí** | No |
| **Max-Heap Acotado** | **$O(N \log K)$** | **$O(K)$** | **No** | **Sí** |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Optimización Top-N en SQL

1. **Top-N Sort en PostgreSQL:** Los optimizadores de bases de datos evitan merges en disco manteniendo un monticulo en memoria RAM acotado a K registros.
2. **Elasticsearch TopDocs:** Agregacion distribuida de los 10 mejores resultados de busqueda.

## Casos Límite y Robustez en Producción

1. **$k \ge n$:** Retorna copia completa del array en $O(N)$.
2. **$k \le 0$:** Retorna array vacio de forma segura.
