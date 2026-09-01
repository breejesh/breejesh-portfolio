---
title: "Sucesor: Encontrar el Sucesor In-Order en un BST (CTCI 4.6)"
description: "Escribe un algoritmo para encontrar el sucesor in-order de un nodo en un arbol binario de busqueda con punteros al padre en tiempo O(H) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-6-successor.webp
previewImage: /assets/images/ctci-4-6-successor.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un algoritmo para encontrar el nodo siguiente (sucesor in-order) de un nodo dado en un arbol binario de busqueda. Puedes asumir que cada nodo tiene un enlace a su padre.
> * **La Solución Óptima:** (1) Si el nodo tiene hijo derecho, el sucesor es el **nodo mas a la izquierda del subarbol derecho**; (2) Si no tiene hijo derecho, asciende por los punteros al padre hasta encontrar un nodo que sea el **hijo izquierdo** de su padre en tiempo $O(H)$ y espacio $O(1)$.
> * **Realidad en Producción:** Iteradores de cursor en motores de bases de datos B-Tree (`cursor.next()`) e iteradores ordenados en librerias estandar.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 4.6), se nos plantea:

*"Escribe un algoritmo para encontrar el siguiente nodo (sucesor in-order) de un nodo dado en un arbol binario de busqueda con punteros al padre."*

## 2. Análisis de Casos y Mecánica Algorítmica

Existen dos casos fundamentales:

### Caso 1: El Nodo Tiene Subárbol Derecho
Si `node.right != null`, el sucesor es el valor mas pequeno del subarbol derecho:
* Avanzar a la derecha: `curr = node.right`.
* Avanzar a la izquierda todo lo posible: `while (curr.left != null) curr = curr.left;`.

### Caso 2: El Nodo No Tiene Subárbol Derecho
Si `node.right == null`, debemos buscar entre los ancestros:
* Subimos por la cadena de padres hasta encontrar un nodo que sea el **hijo izquierdo** de su padre.
* Si alcanzamos la raiz sin cumplir la condicion, el nodo era el maximo del arbol y no existe sucesor (`null`).

## Implementación de Producción

```java
public class Successor {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode parent;

        public TreeNode(int x) {
            this.val = x;
        }
    }

    /**
     * Encuentra el sucesor in-order de un nodo en un BST.
     * Complejidad Temporal: O(H) donde H es la altura del arbol.
     * Complejidad Espacial: O(1)
     */
    public static TreeNode inorderSucc(TreeNode n) {
        if (n == null) return null;

        // Caso 1: Tiene hijo derecho -> nodo mas a la izquierda del subarbol derecho
        if (n.right != null) {
            return leftMostChild(n.right);
        } else {
            // Caso 2: Subir hasta estar a la izquierda del padre
            TreeNode q = n;
            TreeNode x = q.parent;

            while (x != null && x.left != q) {
                q = x;
                x = x.parent;
            }
            return x;
        }
    }

    private static TreeNode leftMostChild(TreeNode n) {
        if (n == null) return null;
        while (n.left != null) {
            n = n.left;
        }
        return n;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(H)` | Desciende hasta la hoja mas a la izquierda o asciende por la cadena de ancestros acotada por la altura $H$. |
| Espacio Auxiliar | `O(1)` | Recorrido iterativo sin recursion ni memoria extra. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Cursores B-Tree

1. **Escaneos de Rango en Motores de Bases de Datos:** Consultas con limites ejecutan busquedas sucesoras continuas entre bloques de indices.
2. **Iteradores C++ (`std::map::iterator++`):** Recorrido secuencial sobre arboles rojinegros en tiempo amortizado $O(1)$ por paso.

## Casos Límite y Robustez en Producción

1. **Elemento máximo del BST:** El bucle de ancestros alcanza la raiz (`x == null`) retornando `null`.
2. **Nodo raíz:** Si tiene hijo derecho retorna el menor del subarbol derecho; si no, retorna `null`.
