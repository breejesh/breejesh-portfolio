---
title: "Buscar en Arreglo Rotado: Búsqueda Binaria con Invariantes de Rotación (CTCI 10.3)"
description: "Encuentra un elemento en un arreglo ordenado rotado en un pivote desconocido usando busqueda binaria adaptada para duplicados en tiempo O(log N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
previewImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un arreglo ordenado de $n$ enteros que ha sido rotado un numero desconocido de veces, escribe codigo para encontrar un elemento en el arreglo.
> * **La Solución Óptima:** Búsqueda Binaria Modificada: (1) Al menos una mitad ($[left, mid]$ o $[mid, right]$) siempre estara estrictamente ordenada; (2) Si $A[left] < A[mid]$, la mitad izquierda esta ordenada: si el objetivo $x \in [A[left], A[mid]]$, busca a la izquierda, sino a la derecha; (3) Si $A[mid] < A[left]$, la mitad derecha esta ordenada; (4) Si $A[left] == A[mid]$ (duplicados), busca en ambos lados si es necesario; (5) Se ejecuta en **tiempo promedio $O(\log N)$** y peor caso $O(N)$.
> * **Realidad en Producción:** Busqueda de registros en buffers circulares (Apache Kafka) y particiones rotativas en bases de datos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.3), se nos plantea:

*"Encuentra la posicion de un elemento en un arreglo ordenado que ha sido rotado un numero desconocido de posiciones."*

## 2. Invariante de Mitad Ordenada

En cualquier subdivision:
* Si $A[left] < A[mid]$, la mitad izquierda esta en orden ascendente normal.
* Si $A[mid] < A[left]$, la mitad derecha esta en orden ascendente normal (el pivote esta en la izquierda).
* Si $A[left] == A[mid]$, la presencia de duplicados requiere verificar $A[right]$ o explorar ambas ramas.

## Implementación de Producción

```java
public class SearchInRotatedArray {
    /**
     * Busca x en un arreglo rotado.
     * Complejidad Temporal: O(log N) promedio, O(N) peor caso.
     * Complejidad Espacial: O(log N)
     */
    public static int search(int[] a, int left, int right, int x) {
        if (right < left) return -1;

        int mid = left + (right - left) / 2;
        if (a[mid] == x) {
            return mid;
        }

        // Caso 1: Mitad izquierda normalmente ordenada
        if (a[left] < a[mid]) {
            if (x >= a[left] && x < a[mid]) {
                return search(a, left, mid - 1, x);
            } else {
                return search(a, mid + 1, right, x);
            }
        }
        // Caso 2: Mitad derecha normalmente ordenada
        else if (a[mid] < a[left]) {
            if (x > a[mid] && x <= a[right]) {
                return search(a, mid + 1, right, x);
            } else {
                return search(a, left, mid - 1, x);
            }
        }
        // Caso 3: Duplicados en extremos
        else {
            if (a[mid] != a[right]) {
                return search(a, mid + 1, right, x);
            } else {
                int result = search(a, left, mid - 1, x);
                if (result == -1) {
                    return search(a, mid + 1, right, x);
                }
                return result;
            }
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Caso | Complejidad Temporal | Espacio Auxiliar | Detalle Técnico |
|---|---|---|---|
| Enteros Distintos | `O(log N)` | `O(log N)` | Búsqueda binaria estándar descartando la mitad. |
| Con Duplicados (Peor Caso) | `O(N)` | `O(log N)` | Ocurre con arreglos de elementos idénticos ($[2, 2, 2, 2]$). |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Búsqueda en Buffers Circulares

1. **Buffers de Red (DPDK / Kafka):** Los cursores de lectura y escritura rotan de forma continua; la busqueda de marcas de tiempo utiliza variantes binarias rotadas sin realinear la memoria.
2. **Tablas Particionadas:** Localizacion de particiones activas en almacenes distribuidos.

## Casos Límite y Robustez en Producción

1. **Elemento Inexistente:** Retorna `-1` de forma segura.
2. **Arreglo No Rotado:** Se ejecuta como busqueda binaria clasica.
