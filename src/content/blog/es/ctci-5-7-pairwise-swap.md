---
title: "Intercambio por Pares: Intercambiar Bits Pares e Impares con Mínimas Instrucciones (CTCI 5.7)"
description: "Escribe un programa para intercambiar bits pares e impares en un entero de 32 bits con el minimo de instrucciones usando mascaras en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-7-pairwise-swap.webp
previewImage: /assets/images/ctci-5-7-pairwise-swap.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un programa para intercambiar los bits pares e impares en un entero con la menor cantidad de instrucciones posible (por ejemplo, el bit 0 con el bit 1, el 2 con el 3, etc.).
> * **La Solución Óptima:** Mascara y Desplazamiento: (1) Extrae los bits pares con `0xAAAAAAAA` y desplaza a la derecha con `>>> 1`; (2) Extrae los bits impares con `0x55555555` y desplaza a la izquierda con `<< 1`; (3) Combina con OR bit a bit: `((x & 0xAAAAAAAA) >>> 1) | ((x & 0x55555555) << 1)` en tiempo $O(1)$ y espacio $O(1)$.
> * **Realidad en Producción:** Curvas de orden Z (Morton Codes) para indices espaciales y transposicion de bits SIMD.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 5.7), se nos plantea:

*"Escribe un programa para intercambiar bits pares e impares en un entero con tantas pocas instrucciones como sea posible."*

## 2. Mecánica de Máscaras

En un entero de 32 bits:
* **Bits pares** ($30, 28, \dots, 0$): Mascara hexadecimal `0xAAAAAAAA` ($10101010\dots_2$).
* **Bits impares** ($31, 29, \dots, 1$): Mascara hexadecimal `0x55555555` ($01010101\dots_2$).

Operaciones:
1. Aislar bits pares y desplazar a la derecha: `(x & 0xaaaaaaaa) >>> 1`.
2. Aislar bits impares y desplazar a la izquierda: `(x & 0x55555555) << 1`.
3. Unir mediante OR (`|`).

## Implementación de Producción

```java
public class PairwiseSwap {
    /**
     * Intercambia bits pares e impares en un entero de 32 bits.
     * Complejidad Temporal: O(1)
     * Complejidad Espacial: O(1)
     */
    public static int swapOddEvenBits(int x) {
        int evenShifted = (x & 0xaaaaaaaa) >>> 1;
        int oddShifted = (x & 0x55555555) << 1;
        return evenShifted | oddShifted;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(1)` | Exactamente 3 instrucciones de maquina a nivel de bits. |
| Espacio Auxiliar | `O(1)` | Ejecucion directa en registros de CPU. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Códigos Morton y Permutaciones

1. **Curvas de Orden Z (Morton Codes en Gráficos 3D):** Intercala bits de coordenadas X e Y para almacenar texturas en memoria con alta localidad espacial.
2. **Criptografía de Alto Rendimiento (AES):** Permutaciones paralelas de matrices de bits en registros vectoriales SIMD.

## Casos Límite y Robustez en Producción

1. **Desplazamiento Lógico vs Aritmético:** El uso de `>>>` previene extension de signo no deseada en el bit mas significativo.
2. **Entrada cero o -1:** Preservadas de forma coherente.
