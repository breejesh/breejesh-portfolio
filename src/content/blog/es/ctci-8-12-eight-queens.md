---
title: "Ocho Reinas: Backtracking del Problema de las N-Reinas e Invariantes Diagonales (CTCI 8.12)"
description: "Coloca ocho reinas en un tablero de ajedrez de 8x8 sin que compartan fila, columna o diagonal usando backtracking con representacion 1D en tiempo O(8!)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-12-eight-queens.webp
previewImage: /assets/images/ctci-8-12-eight-queens.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un algoritmo para imprimir todas las formas de colocar ocho reinas en un tablero de ajedrez de $8 \times 8$ de tal modo que ninguna de ellas comparta la misma fila, columna o diagonal.
> * **La Solución Óptima:** Backtracking con Arreglo 1D: (1) Dado que cada fila contiene exactamente una reina, representamos el tablero mediante `Integer[] columns` donde `columns[fila] = col`; (2) Avanzamos fila por fila; (3) Comprobamos conflictos de columna (`col1 == col2`) y de diagonal ($|col_2 - col_1| == row_1 - row_2$); (4) Encuentra las **92 soluciones validas** en tiempo $O(8!)$ y memoria auxiliar $O(1)$.
> * **Realidad en Producción:** Problemas de Satisfaccion de Restricciones (CSP) en solucionadores SAT (Z3) y planificadores de tareas en clusters (Kubernetes).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.12), se nos plantea:

*"Imprime todas las combinaciones validas de disposicion de 8 reinas en un tablero de ajedrez de 8x8 sin conflictos de fila, columna o diagonal."*

## 2. Invariante de Conflicto Diagonal y Representación 1D

### Representación Compacta
Eliminamos los conflictos de fila por definicion: la fila $r$ contiene la reina $r$. El arreglo `columns[r] = c` registra en que columna se ubica la reina de la fila $r$.

### Invariante de Diagonal
Dos reinas en $(r_1, c_1)$ y $(r_2, c_2)$ colisionan diagonalmente si y solo si:
$$|c_2 - c_1| == |r_2 - r_1|$$

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.List;

public class EightQueens {
    private static final int GRID_SIZE = 8;

    /**
     * Encuentra las 92 soluciones de las 8 reinas.
     * Complejidad Temporal: O(GRID_SIZE!)
     * Complejidad Espacial: O(GRID_SIZE)
     */
    public static List<Integer[]> placeQueens() {
        List<Integer[]> results = new ArrayList<>();
        Integer[] columns = new Integer[GRID_SIZE];
        placeQueensHelper(0, columns, results);
        return results;
    }

    private static void placeQueensHelper(int row, Integer[] columns, List<Integer[]> results) {
        if (row == GRID_SIZE) {
            results.add(columns.clone());
            return;
        }

        for (int col = 0; col < GRID_SIZE; col++) {
            if (checkValid(columns, row, col)) {
                columns[row] = col;
                placeQueensHelper(row + 1, columns, results);
            }
        }
    }

    private static boolean checkValid(Integer[] columns, int row1, int col1) {
        for (int row2 = 0; row2 < row1; row2++) {
            int col2 = columns[row2];

            // Conflicto de columna
            if (col1 == col2) return false;

            // Conflicto diagonal
            int columnDistance = Math.abs(col2 - col1);
            int rowDistance = row1 - row2;
            if (columnDistance == rowDistance) return false;
        }
        return true;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N!)` | La poda temprana explora solo ramas validas, encontrando las 92 soluciones. |
| Espacio Auxiliar | `O(N)` | Arreglo 1D de 8 enteros y 8 niveles de recursion. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Solucionadores CSP

1. **Solucionadores SMT (Z3 de Microsoft):** Verificacion formal de software y compiladores mediante reduccion a restricciones logicas podadas por backtracking.
2. **Orquestadores de Contenedores (Kubernetes Scheduler):** Asignacion de pods con reglas de anti-afinidad y distribucion en zonas de disponibilidad.

## Casos Límite y Robustez en Producción

1. **Total de Soluciones:** Produce exactamente las 92 configuraciones validas para $N = 8$.
