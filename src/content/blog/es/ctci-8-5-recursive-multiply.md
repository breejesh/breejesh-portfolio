---
title: "Multiplicación Recursiva: Multiplicar por Duplicación de Bits sin Operadores (CTCI 8.5)"
description: "Multiplica dos enteros positivos sin usar los operadores * ni / mediante recursion divide y venceras y desplazamiento de bits en tiempo O(log S)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-5-recursive-multiply.webp
previewImage: /assets/images/ctci-8-5-recursive-multiply.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe una funcion recursiva para multiplicar dos enteros positivos sin usar el operador `*` (ni `/`). Puedes usar suma, resta y desplazamiento de bits, minimizando las operaciones.
> * **La Solución Óptima:** Division y Duplicacion por Bits: (1) Identifica el menor $S$ y el mayor $B$; (2) Divide $S$ a la mitad con `S >> 1` y calcula el producto de la mitad recursivamente; (3) Si $S$ es par retorna `half + half`, si es impar retorna `half + half + B`. Al reutilizar el calculo de la mitad, se ejecuta en **$O(\log S)$ tiempo** y **$O(\log S)$ espacio**.
> * **Realidad en Producción:** Multiplicadores por hardware en ALUs y criptografia de enteros gigantes (Karatsuba / RSA).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.5), se nos plantea:

*"Multiplica dos enteros positivos sin utilizar los operadores * ni /, minimizando la cantidad de operaciones aritmeticas."*

## 2. Fundamento Matemático

Sea $S \le B$:
1. $S = 0 \implies 0$.
2. $S = 1 \implies B$.
3. Se calcula una sola vez $H = \lfloor S / 2 \rfloor \times B$.
4. Si $S$ es par: $S \times B = H + H$.
5. Si $S$ es impar: $S \times B = H + H + B$.

En cada paso $S$ se reduce a la mitad, ejecutando $\lfloor \log_2 S \rfloor$ llamadas recursivas.

## Implementación de Producción

```java
public class RecursiveMultiply {
    /**
     * Multiplica dos enteros positivos sin operadores * ni /.
     * Complejidad Temporal: O(log(min(a, b)))
     * Complejidad Espacial: O(log(min(a, b)))
     */
    public static int minProduct(int a, int b) {
        int bigger = a < b ? b : a;
        int smaller = a < b ? a : b;
        return minProductHelper(smaller, bigger);
    }

    private static int minProductHelper(int smaller, int bigger) {
        if (smaller == 0) return 0;
        if (smaller == 1) return bigger;

        int s = smaller >> 1;
        int halfProd = minProductHelper(s, bigger);

        if (smaller % 2 == 0) {
            return halfProd + halfProd;
        } else {
            return halfProd + halfProd + bigger;
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(log S)` | Donde $S = \min(a, b)$. Divide $S$ a la mitad en cada llamada. |
| Espacio Auxiliar | `O(log S)` | Pila de llamadas acotada por los bits de $S$ ($\le 31$). |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: ALUs de Hardware

1. **Circuitos Multiplicadores de Silicio (Algoritmo de Booth):** Las unidades aritmetico-logicas implementan multiplicacion rapida mediante desplazamientos y sumas de productos parciales.
2. **Criptografía de Clave Pública (RSA):** La multiplicacion de enteros gigantes utiliza divisiones recursivas de extremidades binarias.

## Casos Límite y Robustez en Producción

1. **Multiplicación por 0:** Retorna 0 de inmediato.
2. **Multiplicación por 1:** Retorna `bigger`.
