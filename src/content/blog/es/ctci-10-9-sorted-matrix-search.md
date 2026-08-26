---
title: "Sorted Matrix Search: Buscar en Matriz Ordenada M x N (CTCI 10.9)"
description: "Problema CTCI 10.9 en Java: busca un elemento en una matriz M x N ordenada por filas y columnas en O(M + N)."
date: "2026-04-29"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
previewImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.9 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.9 en Java: busca un elemento en una matriz M x N ordenada por filas y columnas en O(M + N).
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.9**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.9 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.9:** Problema CTCI 10.9 en Java: busca un elemento en una matriz M x N ordenada por filas y columnas en O(M + N).

---

## 3. Enfoque óptimo e implementación

```java
public class SortedMatrixSearch {
    public static boolean findElement(int[][] matrix, int elem) {
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

---

## 4. Complejidad Temporal y Espacial

| Métrica | Complejidad | Explicación |
| --- | --- | --- |
| Complejidad Temporal | O(N) / O(log N) | Recorrido óptimo de datos |
| Complejidad Espacial | O(1) / O(N) | Memoria acotada |

---

## 5. Casos Límite y Resumen

Verifica siempre condiciones de borde, valores nulos y límites de tamaño en entrevistas técnicas.