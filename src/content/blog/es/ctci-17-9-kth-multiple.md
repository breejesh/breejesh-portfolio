---
title: "K-ésimo Múltiplo: Generación de Factores Primos 3, 5 y 7 en Tiempo O(K) (CTCI 17.9)"
description: "Genera el k-esimo numero cuyos unicos factores primos son 3, 5 y 7 utilizando programacion dinamica y tres punteros con deduplicacion en tiempo O(K)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-9-kth-multiple.webp
previewImage: /assets/images/ctci-17-9-kth-multiple.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena un algoritmo para encontrar el $k$-esimo numero cuyos unicos factores primos sean 3, 5 y 7 ($1, 3, 5, 7, 9, 15, 21, 25, 27, 35, \dots$).
> * **La Solución Óptima:** **Programación Dinámica con Tres Punteros**:
>   1. Inicializar `dp[0] = 1` y tres punteros $p_3 = 0, p_5 = 0, p_7 = 0$.
>   2. En cada iteracion $i \in [1, k-1]$:
>      * Evaluar candidatos: $v_3 = 3 \cdot dp[p_3], v_5 = 5 \cdot dp[p_5], v_7 = 7 \cdot dp[p_7]$.
>      * Elegir el minimo: $dp[i] = \min(v_3, v_5, v_7)$.
>      * Avanzar todos los punteros que igualen el minimo para deduplicar productos compartidos (ej. $15 = 3 \times 5 = 5 \times 3$).
>   3. Se ejecuta en **tiempo $O(K)$** y **espacio $O(K)$**.
> * **Realidad en Producción:** Numeros suaves (*Smooth Numbers*) en la transformada rapida de Fourier (FFT) y criptografia.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.9), se nos plantea:

*"Genera el k-esimo entero positivo cuyos factores primos esten restringidos estrictamente a los numeros 3, 5 y 7."*

## 2. Dinámica de los Tres Punteros

Al generar cada numero multiplicando un valor previo por 3, 5 o 7, los tres punteros aseguran un orden monotonico sin huecos ni duplicados.

## Implementación de Producción

```java
public class KthMultiple {

    public static long getKthMultiple(int k) {
        if (k <= 0) return 0;

        long[] dp = new long[k];
        dp[0] = 1;

        int p3 = 0, p5 = 0, p7 = 0;

        for (int i = 1; i < k; i++) {
            long next3 = dp[p3] * 3;
            long next5 = dp[p5] * 5;
            long next7 = dp[p7] * 7;

            long minVal = Math.min(next3, Math.min(next5, next7));
            dp[i] = minVal;

            if (minVal == next3) p3++;
            if (minVal == next5) p5++;
            if (minVal == next7) p7++;
        }

        return dp[k - 1];
    }
}
```

## Análisis de Complejidad

| Algoritmo | Complejidad Temporal | Espacio Auxiliar | Deduplicación |
|---|---|---|---|
| **Tres Punteros DP** | **$O(K)$** | **$O(K)$** | **Inmanente (Avanza Punteros Compartidos)** |
| **Montículo Mínimo (Heap)** | $O(K \log K)$ | $O(K)$ | Requiere HashSet auxiliar |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: FFT y Números Suaves

1. **Transformada Rápida de Fourier (FFTW):** Los algoritmos de Cooley-Tukey descomponen transformadas de Fourier con maxima eficiencia cuando los vectores de datos tienen longitudes suaves (*5-Smooth Numbers*).
2. **Criptoanálisis:** Criba cuadratica en la factorizacion de claves RSA.

## Casos Límite y Robustez en Producción

1. **Enteros de 64 bits (`long`):** Previene desbordamientos aritmeticos para $k > 1.000$.
2. **$k = 1$:** Retorna correctamente $1$.
