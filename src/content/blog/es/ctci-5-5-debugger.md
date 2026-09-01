---
title: "Depurador: Comprender ((n & (n - 1)) == 0) y Detección de Potencias de Dos (CTCI 5.5)"
description: "Explica la mecanica a nivel de bits de la expresion ((n & (n - 1)) == 0) y como detecta potencias de dos y cero en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-5-debugger.webp
previewImage: /assets/images/ctci-5-5-debugger.webp
---

> **TL;DR**
> * **El Problema del Libro:** Explica que hace el siguiente codigo: `((n & (n - 1)) == 0)`.
> * **La Explicación Óptima:** Restar 1 a $n$ invierte el bit 1 menos significativo a `0` y todos los ceros posteriores a `1`. Si $n$ tiene exactamente un bit 1 (es decir, es una potencia de dos), $n$ y $n - 1$ no comparten ningun bit 1 en comun, haciendo que $n \ \& \ (n - 1)$ sea igual a `0`. Por lo tanto, `((n & (n - 1)) == 0)` comprueba si $n$ es una **potencia de dos** (o $0$) en tiempo $O(1)$ y espacio $O(1)$.
> * **Realidad en Producción:** Mascaras de ajuste en tablas hash (Java `HashMap`) y calculo de indices en buffers circulares (Ring Buffers).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 5.5), se nos plantea:

*"Explica que hace el siguiente codigo: `((n & (n - 1)) == 0)`"*

## 2. Demostración a Nivel de Bits

Al restar 1 a un numero $n$:
1. **$n$ termina en 1:**
   * $n = \text{abc}1$
   * $n - 1 = \text{abc}0$
   * $n \ \& \ (n - 1) = \text{abc}0$ (limpia el bit 1 mas bajo).
2. **$n$ termina en ceros:**
   * $n = \text{abc}1000$
   * $n - 1 = \text{abc}0111$
   * $n \ \& \ (n - 1) = \text{abc}0000$.

La operacion $n \ \& \ (n - 1)$ **siempre apaga el bit 1 menos significativo** de $n$.

### ¿Cuándo Da Cero?
Da `0` unicamente cuando no existen otros bits 1 superiores ($\text{abc} = 0$), lo que significa que $n$ tiene **a lo sumo un bit 1**:
* Si $n = 0$: $0 \ \& \ -1 = 0 \implies \text{true}$.
* Si $n = 2^k$ (potencia de 2): el unico bit 1 se apaga $\implies \text{true}$.
* Si $n$ tiene 2 o mas bits 1: $\text{false}$.

Por tanto:
$$\text{esPotenciaDeDos}(n) \iff n > 0 \text{ y } ((n \ \& \ (n - 1)) == 0)$$

## Implementación de Producción

```java
public class Debugger {
    /**
     * Comprueba si un entero positivo es una potencia exacta de dos.
     * Complejidad Temporal: O(1)
     * Complejidad Espacial: O(1)
     */
    public static boolean isPowerOfTwo(int n) {
        return n > 0 && ((n & (n - 1)) == 0);
    }

    /**
     * Limpia el bit 1 mas bajo (algoritmo de Brian Kernighan).
     */
    public static int clearLowestSetBit(int n) {
        return n & (n - 1);
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(1)` | Resta y operacion AND a nivel de registros (1 ciclo CPU). |
| Espacio Auxiliar | `O(1)` | Cero asignacion de memoria. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Optimización por Potencias de Dos

1. **Buffers Circulares (Netty / Ring Buffer):** Si la capacidad $C = 2^k$, el calculo `index % C` se reemplaza por el rapido `index & (C - 1)`.
2. **Tablas Hash (Java `HashMap`):** Fuerza que la capacidad sea potencia de dos para calcular el bucket directamente mediante mascara de bits.

## Casos Límite y Robustez en Producción

1. **$n = 0$:** `(0 & -1) == 0` es `true`. Debe protegerse con `n > 0`.
2. **Números negativos:** `Integer.MIN_VALUE` contiene un solo bit 1; la guarda `n > 0` evita falsos positivos.
