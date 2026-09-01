---
title: "Conteo de Doses: Análisis Combinatorio por Posición Decimal (CTCI 17.6)"
description: "Cuenta la cantidad total de apariciones del digito 2 entre 0 y N analizando la contribucion matematica de cada posicion decimal en tiempo O(log10 N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-6-count-of-2s.webp
previewImage: /assets/images/ctci-17-6-count-of-2s.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un metodo para contar la cantidad de veces que aparece el digito 2 en todos los numeros entre 0 y $n$ (inclusive).
> * **La Solución Óptima:** **Descomposición por Valor Posicional**:
>   1. Para cada potencia de 10 ($d = 1, 10, 100, \dots \le n$), aislar:
>      $$\text{superior} = \lfloor n / (10d) \rfloor,\quad \text{digito} = \lfloor n/d \rfloor \pmod{10},\quad \text{inferior} = n \pmod d$$
>   2. **Tres Casos Posicionales**:
>      * $\text{digito} < 2 \implies \text{cuenta} += \text{superior} \times d$
>      * $\text{digito} == 2 \implies \text{cuenta} += (\text{superior} \times d) + \text{inferior} + 1$
>      * $\text{digito} > 2 \implies \text{cuenta} += (\text{superior} + 1) \times d$
>   3. Se ejecuta en **tiempo $O(\log_{10} n)$** (maximo 10 pasos para 32 bits) y **espacio $O(1)$**.
> * **Realidad en Producción:** Analisis de distribucion de claves primarias en bases de datos y Ley de Benford.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.6), se nos plantea:

*"Calcula cuantas veces figura el digito 2 en la totalidad de enteros de 0 a n en tiempo sub-microsegundo."*

## 2. Casos Combinatorios

Al evaluar cada posicion (unidades, decenas, centenas) por separado, se reemplaza la busqueda exhaustiva por formulas aritmeticas cerradas.

## Implementación de Producción

```java
public class CountOf2s {

    public static int count2sInRange(int n) {
        if (n < 2) return 0;

        int count = 0;
        int len = String.valueOf(n).length();

        for (int digit = 0; digit < len; digit++) {
            count += count2sAtDigit(n, digit);
        }

        return count;
    }

    private static int count2sAtDigit(int number, int d) {
        int powerOf10 = (int) Math.pow(10, d);
        int nextPowerOf10 = powerOf10 * 10;
        int right = number % powerOf10;

        int roundDown = number - (number % nextPowerOf10);
        int roundUp = roundDown + nextPowerOf10;

        int digit = (number / powerOf10) % 10;

        if (digit < 2) {
            return roundDown / 10;
        } else if (digit == 2) {
            return roundDown / 10 + right + 1;
        } else {
            return roundUp / 10;
        }
    }
}
```

## Análisis de Complejidad

| Algoritmo | Complejidad Temporal | Pasos para $N = 10^9$ | Espacio Auxiliar |
|---|---|---|---|
| **Matemática Posicional** | **$O(\log_{10} N)$** | **10 iteraciones** | **$O(1)$** |
| **Fuerza Bruta** | $O(N \log_{10} N)$ | $9 \times 10^9$ operaciones | $O(1)$ |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Distribución de Claves

1. **Particionamiento en Spanner / CockroachDB:** Estimacion de la densidad de claves en rangos B-Tree sin necesidad de realizar escaneos completos de tablas en disco.
2. **Auditoría Forense con Ley de Benford:** Validacion de frecuencias de digitos en sistemas bancarios.

## Casos Límite y Robustez en Producción

1. **$N < 2$:** Retorna 0 de forma inmediata.
2. **Valores Frontera ($N = 222$):** Incorpora con exactitud los residuos inferiores.
