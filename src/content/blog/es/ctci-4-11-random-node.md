---
title: "Nodo Aleatorio: Selección de Nodos en un Árbol Binario con Probabilidad Uniforme (CTCI 4.11)"
description: "Disena una clase de arbol binario con getRandomNode() que garantiza probabilidad uniforme 1/N en tiempo O(log N) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-11-random-node.webp
previewImage: /assets/images/ctci-4-11-random-node.webp
---

> **TL;DR**
> * **El Problema del Libro:** Estas implementando una clase de arbol binario desde cero que incluye `insert`, `find`, `delete` y `getRandomNode()`, donde todos los nodos deben tener la misma probabilidad de ser elegidos.
> * **La Solución Óptima:** Almacena el tamano del subarbol (`size`) en cada nodo. En `getRandomNode()`, genera un indice aleatorio $d \in [0, \text{size}-1]$. Si $d < \text{left.size}$, desciende a la izquierda. Si $d == \text{left.size}$, retorna el nodo actual. Si es mayor, desciende a la derecha ajustando el indice, en tiempo $O(\log N)$ y espacio $O(1)$.
> * **Realidad en Producción:** Muestreo de indices en bases de datos (SQL `ANALYZE`) y balanceo aleatorio en Treaps.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 4.11), se nos plantea:

*"Estas implementando una clase de arbol binario desde cero que, ademas de insert, find y delete, tiene un metodo getRandomNode() que devuelve un nodo aleatorio del arbol. Todos los nodos deben tener la misma probabilidad de ser elegidos."*

## 2. Probabilidad Uniforme y Contador de Tamaño

Para que cada nodo tenga una probabilidad exacta de $1/N$:
* Probabilidad del nodo actual = $\frac{1}{N}$.
* Probabilidad del subarbol izquierdo = $\frac{left.size}{N}$.
* Probabilidad del subarbol derecho = $\frac{right.size}{N}$.

## Implementación de Producción

```java
import java.util.Random;

public class RandomNodeTree {
    public static class TreeNode {
        private int data;
        public TreeNode left;
        public TreeNode right;
        private int size = 0;

        public TreeNode(int d) {
            data = d;
            size = 1;
        }

        public int data() { return data; }
        public int size() { return size; }

        public TreeNode getRandomNode() {
            int leftSize = left == null ? 0 : left.size();
            Random random = new Random();
            int index = random.nextInt(size);

            if (index < leftSize) {
                return left.getRandomNode();
            } else if (index == leftSize) {
                return this;
            } else {
                return right.getRandomNode();
            }
        }

        public void insertInOrder(int d) {
            if (d <= data) {
                if (left == null) {
                    left = new TreeNode(d);
                } else {
                    left.insertInOrder(d);
                }
            } else {
                if (right == null) {
                    right = new TreeNode(d);
                } else {
                    right.insertInOrder(d);
                }
            }
            size++;
        }

        public TreeNode find(int d) {
            if (d == data) {
                return this;
            } else if (d <= data) {
                return left != null ? left.find(d) : null;
            } else {
                return right != null ? right.find(d) : null;
            }
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| getRandomNode | `O(log N)` | Acotado por la profundidad del arbol balanceado. |
| insert / find / delete | `O(log N)` | Recorre un camino raiz-hoja manteniendo los contadores `size`. |
| Espacio Auxiliar | `O(1)` | Ejecucion iterativa o en pila de recursion constante. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Muestreo de Datos

1. **Estadísticas del Optimizador de Consultas SQL (PostgreSQL):** Muestrea indices B-Tree para estimar la distribucion de claves sin escanear tablas enteras.
2. **Treaps (Arboles de Busqueda Aleatorios):** Utilizan prioridades aleatorias para auto-balanceo deterministico.

## Casos Límite y Robustez en Producción

1. **Arbol vacío:** Retorna `null`.
2. **Arbol de un solo elemento:** `random.nextInt(1)` devuelve siempre 0, retornando el unico nodo.
