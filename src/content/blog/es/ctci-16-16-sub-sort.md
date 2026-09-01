---
title: "Subordenación: Ventana Mínima Desordenada en Tiempo Lineal (CTCI 16.16)"
description: "Encuentra los indices minimos [m, n] que al ser ordenados ordenan el array completo mediante dos barridos lineales de extremos en tiempo O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-16-sub-sort.webp
previewImage: /assets/images/ctci-16-16-sub-sort.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un array de enteros, encuentra los indices $m$ y $n$ tales que si ordenas los elementos de $m$ a $n$, el array entero queda ordenado. Minimiza la distancia $n - m$.
> * **La Solución Óptima:** **Doble Barrido de Extremos (Máximos y Mínimos Acumulados)**:
>   1. **Límite Derecho ($n$)**: Recorrer de izquierda a derecha ($0 \to N-1$) manteniendo `maxVisto`. El ultimo elemento donde $A[i] < \text{maxVisto}$ define $n$.
>   2. **Límite Izquierdo ($m$)**: Recorrer de derecha a izquierda ($N-1 \to 0$) manteniendo `minVisto`. El primer elemento donde $A[j] > \text{minVisto}$ define $m$.
>   3. Si no hay elementos fuera de orden, el array ya esta ordenado ($[-1, -1]$).
>   4. Se ejecuta en **tiempo $O(N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Compactacion de tablas SSTable en RocksDB y reordenamiento de paquetes TCP desordenados.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.16), se nos plantea:

*"Halla la subsecuencia contigua mas pequena [m, n] cuya ordenacion asegura que toda la coleccion quede ordenada."*

## 2. Invariantes de Partición

El array se descompone en tres secciones:
`[Izquierda Ordenada] | [Ventana Desordenada [m, n]] | [Derecha Ordenada]`

## Implementación de Producción

```java
public class SubSort {

    public static class Range {
        public final int start, end;
        public Range(int start, int end) {
            this.start = start;
            this.end = end;
        }
    }

    public static Range findUnsortedSequence(int[] array) {
        if (array == null || array.length <= 1) {
            return new Range(-1, -1);
        }

        int n = array.length;
        int rightIndex = -1;
        int maxSeen = array[0];

        for (int i = 1; i < n; i++) {
            if (array[i] < maxSeen) {
                rightIndex = i;
            } else {
                maxSeen = array[i];
            }
        }

        if (rightIndex == -1) return new Range(-1, -1);

        int leftIndex = -1;
        int minSeen = array[n - 1];

        for (int j = n - 2; j >= 0; j--) {
            if (array[j] > minSeen) {
                leftIndex = j;
            } else {
                minSeen = array[j];
            }
        }

        return new Range(leftIndex, rightIndex);
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Dos recorridos lineales simples. |
| Espacio Auxiliar | `O(1)` | Memoria constante para extremos acumulados. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Compactación en Motores LSM

1. **RocksDB / Cassandra:** Los motores LSM-Tree identifican rangos de claves no superpuestos para fusionar unicamente los segmentos desordenados, reduciendo el trafico de E/S en disco.
2. **Reensamblado TCP:** Procesamiento de segmentos desfasados en buffers de recepcion.

## Casos Límite y Robustez en Producción

1. **Array Ya Ordenado:** Retorna `[-1, -1]`.
2. **Array Invertido Total:** Retorna `[0, N-1]`.
