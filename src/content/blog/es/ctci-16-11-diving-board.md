---
title: "Trampolín: Generación Combinatoria de Longitudes en Tiempo Lineal (CTCI 16.11)"
description: "Genera todas las longitudes posibles de un trampolin construido con K tablas cortas y largas mediante una formula combinatoria cerrada en tiempo O(K)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-11-diving-board.webp
previewImage: /assets/images/ctci-16-11-diving-board.webp
---

> **TL;DR**
> * **El Problema del Libro:** Estas construyendo un trampolin colocando exactamente $K$ tablas de madera una tras otra. Hay dos tipos de tablas: cortas ($s$) y largas ($l$). Escribe un metodo para generar todas las posibles longitudes del trampolin.
> * **La Solución Óptima:** **Fórmula Combinatoria Cerrada e Iteración Lineal**:
>   1. Cualquier combinacion valida contiene $i$ tablas cortas y $(K - i)$ tablas largas ($0 \le i \le K$).
>   2. La longitud total es:
>      $$\text{Longitud}(i) = i \times s + (K - i) \times l$$
>   3. Si $s == l$, solo existe $1$ longitud posible ($K \times s$).
>   4. Si $s \ne l$, variar $i$ de $0$ a $K$ produce exactamente **$K + 1$ longitudes unicas**.
>   5. Se ejecuta en **tiempo $O(K)$** y **espacio $O(K)$**.
> * **Realidad en Producción:** Asignacion de bloques de memoria en jemalloc y problemas de cambio de monedas.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.11), se nos plantea:

*"Genera todas las posibles longitudes totales unicas de un trampolin formado por exactamente K tablas de longitudes corta y larga."*

## 2. Por qué Existen Exactamente $K + 1$ Valores

Como la suma es conmutativa, el orden de las tablas no altera la longitud final; solo importa la cantidad de tablas cortas $i \in [0, K]$.

## Implementación de Producción

```java
public class DivingBoard {

    public static int[] allLengths(int k, int shorter, int longer) {
        if (k <= 0) return new int[0];
        if (shorter == longer) return new int[] { k * shorter };

        int[] lengths = new int[k + 1];

        for (int i = 0; i <= k; i++) {
            int nShorter = i;
            int nLonger = k - i;
            lengths[i] = nShorter * shorter + nLonger * longer;
        }

        return lengths;
    }
}
```

## Análisis de Complejidad

| Enfoque | Complejidad Temporal | Espacio Auxiliar | Sobrecarga de Estructuras |
|---|---|---|---|
| **Fórmula Cerrada** | **$O(K)$** | **$O(K)$** | **Ninguna** |
| **Recursión con Memoización** | $O(K^2)$ | $O(K^2)$ | HashSet + Pila |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Clases de Tamaño en Asignadores de Memoria

1. **Alineación de Bloques:** Asignadores como jemalloc o TCMalloc calculan rangos de memoria mediante progresiones aritmeticas lineales para evitar busquedas dinamicas en tiempo de ejecucion.

## Casos Límite y Robustez en Producción

1. **$K \le 0$:** Retorna array vacio.
2. **Tablas Idénticas ($s = l$):** Retorna array de un solo elemento ($K \times s$).
