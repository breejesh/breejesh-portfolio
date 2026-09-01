---
title: "Árbol Mínimo: Construir un Árbol Binario de Búsqueda de Altura Mínima (CTCI 4.2)"
description: "Construye un arbol binario de busqueda con altura minima a partir de un arreglo ordenado utilizando divide y venceras en tiempo O(N) y espacio O(log N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-2-minimal-tree.webp
previewImage: /assets/images/ctci-4-2-minimal-tree.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un arreglo ordenado (en orden creciente) con elementos enteros unicos, escribe un algoritmo para crear un arbol binario de busqueda con altura minima.
> * **La Solución Óptima:** Utiliza **Divide y Vencerás**: El elemento del medio del arreglo se convierte en la raiz. Construye recursivamente el subarbol izquierdo desde la mitad izquierda y el subarbol derecho desde la mitad derecha en tiempo $O(N)$ y espacio de pila $O(\log N)$.
> * **Realidad en Producción:** Carga masiva de paginas de indice B-Tree en motores de bases de datos y arboles KD en motores graficos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 4.2), se nos plantea:

*"Dado un arreglo ordenado (orden creciente) con elementos enteros unicos, escribe un algoritmo para crear un arbol binario de busqueda con altura minima."*

**Fundamento Matemático:**
Para minimizar la altura, la cantidad de nodos en el subarbol izquierdo debe ser lo mas cercana posible a la del subarbol derecho. Por tanto, la raiz de cada subarbol debe ser siempre el **elemento del medio** del subarreglo correspondiente.

## 2. Mecánica Recursiva Divide y Vencerás

Dado el subarreglo `arr[start ... end]`:
1. Caso base: Si `end < start`, retornar `null`.
2. Punto medio: `mid = (start + end) / 2`.
3. Crear nodo raiz: `TreeNode n = new TreeNode(arr[mid])`.
4. Construir subarbol izquierdo: `n.left = createMinimalBST(arr, start, mid - 1)`.
5. Construir subarbol derecho: `n.right = createMinimalBST(arr, mid + 1, end)`.
6. Retornar `n`.

## Implementación de Producción

```java
public class MinimalTree {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;

        public TreeNode(int x) {
            this.val = x;
        }
    }

    /**
     * Construye un BST de altura minima desde un arreglo ordenado.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(log N) en la pila de recursion
     */
    public static TreeNode createMinimalBST(int[] array) {
        if (array == null || array.length == 0) return null;
        return createMinimalBST(array, 0, array.length - 1);
    }

    private static TreeNode createMinimalBST(int[] arr, int start, int end) {
        if (end < start) {
            return null;
        }

        int mid = (start + end) / 2;
        TreeNode n = new TreeNode(arr[mid]);
        n.left = createMinimalBST(arr, start, mid - 1);
        n.right = createMinimalBST(arr, mid + 1, end);
        return n;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Cada elemento del arreglo se transforma en nodo exactamente una vez. |
| Espacio Auxiliar | `O(log N)` | Profundidad de la pila de recursion igual a $\lceil \log_2 N \rceil$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Carga Masiva de Índices

1. **Carga Masiva de B-Trees (PostgreSQL):** La division por medianas construye indices perfectamente balanceados sin necesidad de rotaciones dinamicas.
2. **Arboles KD en Renderizado Gráfico:** Division espacial de geometrias para consultas de interseccion de rayos en $O(\log N)$.

## Casos Límite y Robustez en Producción

1. **Arreglo vacío o nulo:** Retorna `null` en $O(1)$.
2. **Arreglo de un solo elemento:** Retorna un nodo hoja.
3. **Cantidad par de elementos:** La division entera toma la mediana inferior manteniendo balance estricto.
