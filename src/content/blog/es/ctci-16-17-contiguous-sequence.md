---
title: "Secuencia Contigua: Suma Máxima de Subarrays con el Algoritmo de Kadane (CTCI 16.17)"
description: "Calcula la suma contigua maxima en un array de enteros positivos y negativos mediante programacion dinamica y el algoritmo de Kadane en tiempo lineal O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-17-contiguous-sequence.webp
previewImage: /assets/images/ctci-16-17-contiguous-sequence.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un array de enteros (positivos y negativos), encuentra la secuencia contigua con la mayor suma y devuelve dicha suma (ej. `[2, -8, 3, -2, 4, -10]` $\to$ `5` de `[3, -2, 4]`).
> * **La Solución Óptima:** **Algoritmo de Kadane (Programación Dinámica)**:
>   1. Mantener `maxSum = 0` y `runningSum = 0`.
>   2. Para cada elemento $x$:
>      * Acumular `runningSum += x;`.
>      * Actualizar `maxSum = Math.max(maxSum, runningSum);`.
>      * Si `runningSum < 0`, reiniciar `runningSum = 0;` (un prefijo negativo perjudica cualquier subarray futuro).
>   3. Se ejecuta en **tiempo $O(N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Analisis de maximo beneficio en trading de alta frecuencia y deteccion de rafagas de senales de audio.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.17), se nos plantea:

*"Determina la suma maxima alcanzable por cualquier subarray contiguo en una secuencia de enteros con signos mixtos."*

## 2. Ecuación de Estado de Kadane

$$DP[i] = \max(A[i], DP[i-1] + A[i])$$

Cualquier prefijo acumulado con valor neto negativo se descarta inmediatamente reiniciando el acumulador a cero.

## Implementación de Producción

```java
public class ContiguousSequence {

    public static int getMaxSum(int[] array) {
        if (array == null || array.length == 0) return 0;

        int maxSum = 0;
        int runningSum = 0;

        for (int x : array) {
            runningSum += x;
            if (runningSum > maxSum) {
                maxSum = runningSum;
            } else if (runningSum < 0) {
                runningSum = 0;
            }
        }

        return maxSum;
    }

    public static int getMaxSumNonEmpty(int[] array) {
        if (array == null || array.length == 0) {
            throw new IllegalArgumentException("Array no debe ser vacio");
        }

        int maxSoFar = array[0];
        int currentMax = array[0];

        for (int i = 1; i < array.length; i++) {
            currentMax = Math.max(array[i], currentMax + array[i]);
            maxSoFar = Math.max(maxSoFar, currentMax);
        }

        return maxSoFar;
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Unico recorrido lineal de $N$ elementos. |
| Espacio Auxiliar | `O(1)` | Dos registros enteros escalares. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Trading de Alta Frecuencia

1. **Monitoreo de Volatilidad en Streaming:** Kadane procesa flujos de precios en tiempo real para identificar la mayor ganancia potencial en ventanas temporales continuas.
2. **Segmentación de Señales:** Deteccion de picos de energia en procesado digital de audio.

## Casos Límite y Robustez en Producción

1. **Arrays con Todos los Números Negativos:** La variante estandar de CTCI retorna `0` (subarray vacio), mientras que la variante no vacia retorna el numero menos negativo.
