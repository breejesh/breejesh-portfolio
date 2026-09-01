---
title: "Intercambio de Números: Intercambio en el Lugar con XOR y Aritmética (CTCI 16.1)"
description: "Intercambia dos variables sin memoria temporal utilizando XOR a nivel de bits y diferencias aritmeticas, previniendo desbordamientos y aliasing."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-1-number-swapper.webp
previewImage: /assets/images/ctci-16-1-number-swapper.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe una funcion para intercambiar dos numeros en el lugar (in-place), es decir, sin utilizar variables temporales adicionales.
> * **Las Soluciones Óptimas:**
>   1. **XOR a Nivel de Bits (Inmune a Desbordamientos)**:
>      * `a = a ^ b;`
>      * `b = a ^ b;` (evalua a `(a ^ b) ^ b = a`)
>      * `a = a ^ b;` (evalua a `(a ^ b) ^ a = b`)
>   2. **Diferencia Aritmética (Riesgo de Desbordamiento con Signo)**:
>      * `a = a - b;`
>      * `b = a + b;` (evalua a `a`)
>      * `a = b - a;` (evalua a `b`)
>   3. Se ejecuta en **tiempo $O(1)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Instruccion de hardware `XCHG` en ensamblador x86.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.1), se nos plantea:

*"Intercambia el contenido de dos variables numericas sin reservar memoria para variables auxiliares."*

## 2. Demostración Matemática con XOR

El operador XOR es conmutativo, asociativo y autoinverso ($x \oplus x = 0$).
1. $a_1 = a \oplus b$
2. $b_1 = a_1 \oplus b = (a \oplus b) \oplus b = a$
3. $a_2 = a_1 \oplus b_1 = (a \oplus b) \oplus a = b$

## Implementación de Producción

```java
public class NumberSwapper {

    public static void swapXor(int[] pair) {
        if (pair == null || pair.length < 2) return;
        pair[0] = pair[0] ^ pair[1];
        pair[1] = pair[0] ^ pair[1];
        pair[0] = pair[0] ^ pair[1];
    }
}
```

```c
void swap_xor(int *a, int *b) {
    if (a != b) { // Guarda de aliasing: evita poner a cero la memoria si apuntan al mismo sitio
        *a ^= *b;
        *b ^= *a;
        *a ^= *b;
    }
}
```

## Análisis de Complejidad y Seguridad

| Método | Complejidad Temporal | Espacio Auxiliar | Riesgo de Overflow |
|---|---|---|---|
| **XOR Bit a Bit** | `O(1)` | `O(1)` | **Nulo** (Operación por bits) |
| **Diferencia Aritmética** | `O(1)` | `O(1)` | **Alto** (Desbordamiento de enteros con signo) |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: La Trampa del Aliasing de Punteros

1. **Punteros Idénticos:** Si `swap_xor(&x, &x)` se invoca sobre la misma direccion de memoria, `*x ^= *x` evalua a cero, destruyendo el dato.
2. **Optimizaciones del Compilador:** Los compiladores modernos traducen el intercambio clasico con variable temporal directamente a la instruccion de hardware `XCHG`.

## Casos Límite y Robustez en Producción

1. **Direcciones Coincidentes:** Protegido con `if (a != b)`.
