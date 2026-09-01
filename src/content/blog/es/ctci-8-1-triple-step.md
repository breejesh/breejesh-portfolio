---
title: "Triple Paso: Conteo de Caminos en Escalera con Programación Dinámica (CTCI 8.1)"
description: "Cuenta las formas posibles en que un nino puede subir n escalones dando saltos de 1, 2 o 3 pasos mediante programacion dinamica en tiempo O(N) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-1-triple-step.webp
previewImage: /assets/images/ctci-8-1-triple-step.webp
---

> **TL;DR**
> * **El Problema del Libro:** Un nino sube una escalera de $n$ escalones y puede dar saltos de 1, 2 o 3 escalones a la vez. Implementa un metodo para contar de cuantas formas puede subir la escalera.
> * **La Solución Óptima:** Recurrencia Tribonacci: Las formas de llegar al escalon $n$ equivalen a $W(n) = W(n - 1) + W(n - 2) + W(n - 3)$ con casos base $W(0) = 1, W(1) = 1, W(2) = 2$. Usar 3 variables rotativas evita asignar arreglos, logrando tiempo $O(N)$ y espacio $O(1)$.
> * **Realidad en Producción:** Modelado de estados discretos en cadenas de Markov y control de desbordamiento de enteros (overflow).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.1), se nos plantea:

*"Un nino sube una escalera de n escalones y puede dar saltos de 1, 2 o 3 escalones a la vez. Cuenta cuantas formas posibles existen para llegar a la cima."*

## 2. Relación de Recurrencia y Variables Rotativas

Para llegar al escalón $n$, el salto final debió originarse en:
* Escalón $n - 1$ (salto de 1)
* Escalón $n - 2$ (salto de 2)
* Escalón $n - 3$ (salto de 3)

$$W(n) = W(n - 1) + W(n - 2) + W(n - 3)$$

**Casos Base:**
* $W(0) = 1$
* $W(1) = 1$
* $W(2) = 2$
* $W(3) = 4$

## Implementación de Producción

```java
public class TripleStep {
    /**
     * Cuenta las formas de subir n escalones con saltos de 1, 2 o 3 en O(1) de memoria.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(1)
     */
    public static int countWays(int n) {
        if (n < 0) return 0;
        if (n == 0 || n == 1) return 1;
        if (n == 2) return 2;

        int a = 1; // W(0)
        int b = 1; // W(1)
        int c = 2; // W(2)

        for (int i = 3; i <= n; i++) {
            int d = a + b + c;
            a = b;
            b = c;
            c = d;
        }

        return c;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Bucle lineal con sumas de enteros en tiempo constante. |
| Espacio Auxiliar | `O(1)` | Tres variables enteras en registros. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Desbordamiento de Enteros

1. **Desbordamiento Aritmético:** La secuencia crece como $O(1.839^n)$, desbordando enteros de 32 bits a partir de $n = 37$. En sistemas de produccion se emplean tipos de 64 bits (`long`) o aritmetica modular.
2. **Exponenciación Matricial:** Permite calcular $W(n)$ en tiempo $O(\log N)$ para valores masivos de $N$.

## Casos Límite y Robustez en Producción

1. **$n = 0$:** Retorna 1.
2. **$n < 0$:** Retorna 0.
