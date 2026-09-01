---
title: "Dos Números Faltantes: Ecuaciones de Suma Gaussiana y Suma de Cuadrados (CTCI 17.19)"
description: "Encuentra dos numeros faltantes en un array de 1 a N resolviendo un sistema de ecuaciones algebraicas en tiempo O(N) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-19-missing-two.webp
previewImage: /assets/images/ctci-17-19-missing-two.webp
---

> **TL;DR**
> * **El Problema del Libro:** Un array que originalmente contenía los enteros del 1 al N tiene dos números eliminados. Encuéntralos en tiempo $O(N)$ y espacio $O(1)$.
> * **La Solución Óptima:** **Sistema de Ecuaciones: Suma y Suma de Cuadrados**:
>   1. Calcular los deficits:
>      $$x + y = \frac{N(N+1)}{2} - \sum arr$$
>      $$x^2 + y^2 = \frac{N(N+1)(2N+1)}{6} - \sum arr_i^2$$
>   2. Derivar $xy = \frac{(x+y)^2 - (x^2+y^2)}{2}$ y resolver la ecuacion cuadratica.
>   3. Se ejecuta en **tiempo $O(N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Reconciliacion de libros contables distribuidos e integridad de flujos de sensores IoT.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.19), se nos plantea:

*"Se te da un array con numeros del 1 al N (N maximo 32000). El array puede tener duplicados y estar faltan algunos numeros. Encuentra los dos numeros faltantes."*

## 2. Derivacion Algebraica

Mediante identidades gaussianas y pitagoricas, se plantea un sistema de dos ecuaciones con dos incógnitas resolvible en tiempo lineal.

## Implementación de Producción

```java
public class MissingTwo {

    public static int[] missingTwo(int[] array) {
        int n = array.length + 2;

        long sumN = (long) n * (n + 1) / 2;
        long sumSqN = (long) n * (n + 1) * (2 * n + 1) / 6;

        long actualSum = 0;
        long actualSumSq = 0;
        for (int v : array) {
            actualSum += v;
            actualSumSq += (long) v * v;
        }

        long s1 = sumN - actualSum;
        long s2 = sumSqN - actualSumSq;
        long xy = (s1 * s1 - s2) / 2;

        long discriminant = s1 * s1 - 4 * xy;
        long sqrtD = (long) Math.round(Math.sqrt(discriminant));

        int x = (int) ((s1 + sqrtD) / 2);
        int y = (int) ((s1 - sqrtD) / 2);

        return new int[]{x, y};
    }
}
```

## Análisis de Complejidad

| Enfoque | Complejidad Temporal | Espacio | Riesgo de Desbordamiento |
|---|---|---|---|
| **Suma + Suma de Cuadrados** | **$O(N)$** | **$O(1)$** | Usar `long` para N hasta 32000. |
| Marcado con BitSet | $O(N)$ | $O(N/8)$ | Ninguno. |
| Ordenamiento | $O(N \log N)$ | $O(1)$ | Ninguno. |

## Discusión de Ingeniería de Sistemas en Producción

1. **Reconciliacion Contable:** Verificacion nocturna de numeros de secuencia de transacciones sin duplicados ni faltantes.
2. **Calidad de Sensores IoT:** Deteccion de lecturas perdidas en flujos de muestras industriales.

## Casos Límite y Robustez

1. **Desbordamiento Entero:** Usar `long`; para $N \le 32000$, $\sum N^2 \approx 10^{10}$, dentro del rango de `long`.
