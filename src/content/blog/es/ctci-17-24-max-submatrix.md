---
title: "Submatriz Máxima: Algoritmo de Kadane Extendido a 2D para el Rectángulo de Suma Máxima (CTCI 17.24)"
description: "Encuentra la submatriz con la mayor suma en una matriz MxN de enteros colapsando filas en sumas 1D y aplicando el algoritmo de Kadane sobre todos los pares de filas en tiempo O(N^2 * M)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-24-max-submatrix.webp
previewImage: /assets/images/ctci-17-24-max-submatrix.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una matriz $M \times N$ de enteros (posiblemente negativos), encuentra la submatriz con la mayor suma posible.
> * **La Solución Óptima:** **Kadane 2D via Colapso de Suma de Columnas por Par de Filas**:
>   1. Fijar una fila superior `r1` y una inferior `r2`. Para cada columna `c`, calcular `colSum[c] = sum(matrix[r1..r2][c])`.
>   2. Aplicar **Kadane 1D** a `colSum[]` para encontrar los limites optimos de columna izquierda y derecha.
>   3. Iterar sobre todos los $O(M^2)$ pares de filas, aplicando Kadane $O(N)$ por par.
>   4. Tiempo: **$O(M^2 \cdot N)$**. Espacio: **$O(N)$** para las sumas de columnas colapsadas.
> * **Realidad en Producción:** Extraccion de rectangulo de ganancia maxima en mapas de calor P&L financieros.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.24), se nos plantea:

*"Escribe un algoritmo para encontrar la submatriz con la mayor suma posible."*

## 2. Mecánica del Kadane 2D

Al colapsar cualquier par de filas en un vector 1D de sumas de columnas, el problema se reduce al clasico subarray de suma maxima 1D, resolvible en $O(N)$ con Kadane.

## Implementación de Producción

```java
public class MaxSubmatrix {

    public static int[] maxSubmatrix(int[][] matrix) {
        int rows = matrix.length, cols = matrix[0].length;
        int[] best = {Integer.MIN_VALUE, 0, 0, 0, 0};

        for (int r1 = 0; r1 < rows; r1++) {
            int[] colSum = new int[cols];
            for (int r2 = r1; r2 < rows; r2++) {
                for (int c = 0; c < cols; c++) colSum[c] += matrix[r2][c];
                int[] kadane = kadane(colSum, cols);
                if (kadane[0] > best[0]) best = new int[]{kadane[0], r1, kadane[1], r2, kadane[2]};
            }
        }
        return best;
    }

    private static int[] kadane(int[] arr, int n) {
        int maxSum = Integer.MIN_VALUE, current = 0;
        int start = 0, end = 0, tempStart = 0;
        for (int i = 0; i < n; i++) {
            current += arr[i];
            if (current > maxSum) { maxSum = current; start = tempStart; end = i; }
            if (current < 0) { current = 0; tempStart = i + 1; }
        }
        return new int[]{maxSum, start, end};
    }
}
```

## Análisis de Complejidad

| Fase | Complejidad Temporal | Espacio |
|---|---|---|
| Iteracion de Pares de Filas | $O(M^2)$ | — |
| Actualizacion de Suma + Kadane | $O(N)$ por par | $O(N)$ |
| **Total** | **$O(M^2 \cdot N)$** | **$O(N)$** |

## Discusión de Ingeniería de Sistemas en Producción

1. **Mapas de Calor P&L Financieros:** Identificacion de ventanas rectangulares de maxima ganancia en matrices de retornos de activos.
2. **Regiones de Brillo en Imagen Medica:** Deteccion de la region de mayor intensidad en cortes de CT/PET para puntuacion de densidad de lesiones.

## Casos Límite y Robustez

1. **Todos Negativos:** Retorna la celda menos negativa (Kadane lo maneja).
2. **Fila / Columna Unica:** Se reduce limpiamente al Kadane 1D.
