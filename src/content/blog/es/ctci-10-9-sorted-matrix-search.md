---
title: "Búsqueda en Matriz Ordenada: Búsqueda Saddleback en Cuadrículas 2D (CTCI 10.9)"
description: "Busca un elemento en una matriz M x N donde cada fila y columna esta ordenada en orden ascendente usando poda Saddleback en tiempo O(M + N) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
previewImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una matriz de $M \times N$ en la que cada fila y cada columna esta ordenada de forma ascendente, escribe un metodo para encontrar un elemento.
> * **La Solución Óptima:** **Búsqueda Saddleback desde la Esquina Superior Derecha**: (1) Posicionate en `(row = 0, col = N - 1)`; (2) Si `matrix[row][col] == target`, elemento encontrado; (3) Si `matrix[row][col] > target`, toda la columna actual contiene valores mayores que el objetivo, por lo que decrementamos `col--`; (4) Si `matrix[row][col] < target`, toda la fila actual contiene valores menores, incrementamos `row++`; (5) Se ejecuta en **tiempo $O(M + N)$** y **espacio $O(1)$**, descartando una fila o columna completa en cada paso.
> * **Realidad en Producción:** Consultas espaciales de cajas delimitadoras en PostGIS y libros de ordenes financieros.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.9), se nos plantea:

*"Encuentra un elemento en una matriz M x N cuyas filas y columnas estan individualmente ordenadas en orden ascendente."*

## 2. Derivación del Algoritmo Saddleback

Iniciar en $(0, 0)$ no permite tomar decisiones de bifurcacion ya que desplazarse hacia la derecha o hacia abajo incrementa el valor.

Al posicionarse en la **esquina superior derecha $(0, \text{cols} - 1)$**:
* Desplazarse a la **izquierda** reduce el valor.
* Desplazarse hacia **abajo** aumenta el valor.

En cada paso eliminamos permanentemente una fila o una columna:
$$\text{Pasos Máximos} = M + N$$

## Implementación de Producción

```java
public class SortedMatrixSearch {
    /**
     * Busca elem en matriz ordenada en tiempo O(M + N).
     * Complejidad Espacial: O(1)
     */
    public static boolean findElement(int[][] matrix, int elem) {
        if (matrix == null || matrix.length == 0 || matrix[0].length == 0) {
            return false;
        }

        int row = 0;
        int col = matrix[0].length - 1;

        while (row < matrix.length && col >= 0) {
            if (matrix[row][col] == elem) {
                return true;
            } else if (matrix[row][col] > elem) {
                col--;
            } else {
                row++;
            }
        }
        return false;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(M + N)` | En cada paso se incrementa `row` o se decrementa `col`. |
| Espacio Auxiliar | `O(1)` | Dos variables puntero escalares. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores de Cruce Espacial

1. **Intersección R-Tree en PostGIS:** Descarte rapido de regiones espaciales monotonas sin evaluar coordenadas internas.
2. **Casamiento de Órdenes Financieras:** Búsqueda en matrices de precio/tiempo en libros de negociación de alta frecuencia.

## Casos Límite y Robustez en Producción

1. **Elemento Menor que `matrix[0][0]`:** Decrementa `col` hasta salir de limites y retorna `false`.
2. **Elemento Mayor que `matrix[M-1][N-1]`:** Incrementa `row` hasta salir de limites y retorna `false`.
