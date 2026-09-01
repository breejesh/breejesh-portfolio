---
title: "Picos y Valles: Ordenamiento de Subsecuencias Alternantes en Tiempo Lineal (CTCI 10.11)"
description: "Reorganiza un arreglo de enteros en una secuencia alternada de picos y valles mediante intercambios locales en tiempo O(N) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
previewImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
---

> **TL;DR**
> * **El Problema del Libro:** En un arreglo de enteros, un "pico" es un elemento $\ge$ a sus vecinos adyacentes, y un "valle" es un elemento $\le$ a sus vecinos. Dado un arreglo de enteros, ordenalo en una secuencia alternada de picos y valles.
> * **La Solución Óptima:** **Intercambio Voraz de Máximos Locales**: (1) En lugar de ordenar en $O(N \log N)$, iteramos sobre los indices impares `for (int i = 1; i < array.length; i += 2)` designando a $i$ como un pico; (2) Evaluamos la ventana de 3 elementos $\{A[i-1], A[i], A[i+1]\}$; (3) Identificamos el valor maximo del trio y lo intercambiamos a la posicion $i$; (4) Intercambiar el maximo nunca rompe la condicion del pico anterior $A[i-2]$; (5) Se ejecuta en **tiempo $O(N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Procesamiento de senales digitales (DSP) y trazado de graficos de velas e indicadores ZigZag.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.11), se nos plantea:

*"Reorganiza un arreglo de enteros en una secuencia alternada donde cada pico sea mayor o igual que sus vecinos contiguos y cada valle menor o igual."*

## 2. Invariante Voraz en Tiempo Lineal

Ordenar el arreglo en $O(N \log N)$ y permutar elementos adyacentes es subóptimo.

Examinando la ventana de 3 elementos $\{A[i-1], A[i], A[i+1]\}$ en cada paso impar:
* Al colocar el mayor de los 3 en $A[i]$, se garantiza que $A[i] \ge A[i-1]$ y $A[i] \ge A[i+1]$.
* Como el valor original en $A[i-1]$ solo puede disminuir tras el intercambio, la propiedad del pico anterior $A[i-2] \ge A[i-1]$ se preserva estrictamente.

## Implementación de Producción

```java
public class PeaksAndValleys {
    /**
     * Reorganiza el arreglo en picos y valles alternantes.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(1)
     */
    public static void sortValleyPeak(int[] array) {
        for (int i = 1; i < array.length; i += 2) {
            int biggestIndex = maxIndex(array, i - 1, i, i + 1);
            if (i != biggestIndex) {
                swap(array, i, biggestIndex);
            }
        }
    }

    private static int maxIndex(int[] array, int a, int b, int c) {
        int len = array.length;
        int aValue = a >= 0 && a < len ? array[a] : Integer.MIN_VALUE;
        int bValue = b >= 0 && b < len ? array[b] : Integer.MIN_VALUE;
        int cValue = c >= 0 && c < len ? array[c] : Integer.MIN_VALUE;

        int max = Math.max(aValue, Math.max(bValue, cValue));
        if (aValue == max) return a;
        if (bValue == max) return b;
        return c;
    }

    private static void swap(int[] array, int left, int right) {
        int temp = array[left];
        array[left] = array[right];
        array[right] = temp;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | $N / 2$ evaluaciones de ventanas e intercambios in-place. |
| Espacio Auxiliar | `O(1)` | Cero memoria adicional sobre el arreglo fuente. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Filtrado de Series Temporales

1. **Filtrado de Ondas Digitales:** Deteccion de crestas y valles para compresion de senales acusticas o sismicas.
2. **Indicadores Financieros (ZigZag):** Supresion de ruido en graficos bursatiles mediante puntos de inflexion locales.

## Casos Límite y Robustez en Producción

1. **Arreglos Cortos ($N \le 2$):** Gestionados sin excepciones de indices.
2. **Arreglos con Valores Idénticos:** Se preservan sin intercambios superfluos.
