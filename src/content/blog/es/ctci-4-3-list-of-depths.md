---
title: "Lista de Profundidades: Crear Listas Enlazadas de Nodos en Cada Nivel (CTCI 4.3)"
description: "Disena un algoritmo para crear una lista enlazada de todos los nodos en cada profundidad de un arbol binario usando recorrido por niveles en tiempo O(N) y espacio O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-3-list-of-depths.webp
previewImage: /assets/images/ctci-4-3-list-of-depths.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un arbol binario, disena un algoritmo que cree una lista enlazada de todos los nodos en cada nivel de profundidad (por ejemplo, si el arbol tiene profundidad $D$, tendras $D$ listas enlazadas).
> * **La Solución Óptima:** Utiliza **BFS Iterativo por Niveles**: Manten `ArrayList<LinkedList<TreeNode>>`. Para el nivel $i+1$, itera sobre los nodos de la lista del nivel $i$ y agrega sus hijos no nulos a una nueva lista en tiempo $O(N)$ y espacio $O(N)$ sin necesidad de una cola externa.
> * **Realidad en Producción:** Composicion de capas en el DOM de navegadores y alcance de simbolos en compiladores (AST).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 4.3), se nos plantea:

*"Dado un arbol binario, disena un algoritmo que cree una lista enlazada de todos los nodos en cada profundidad (si tienes un arbol con profundidad D, tendras D listas enlazadas)."*

## 2. Recorrido por Niveles (BFS sin Cola Externa)

Dado que la lista del nivel $i$ contiene todos los padres del nivel $i+1$:
1. Inicializar `current = new LinkedList<TreeNode>()` conteniendo la raiz.
2. Mientras `current` no este vacio:
   * Agregar `current` a `result`.
   * Crear nueva lista vacia para el siguiente nivel.
   * Para cada nodo `parent` en `current`:
     * Si `parent.left != null`, agregar al nuevo nivel.
     * Si `parent.right != null`, agregar al nuevo nivel.
   * Reemplazar `current` con la lista de hijos.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class ListOfDepths {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Crea listas enlazadas de nodos por nivel de profundidad.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(N)
     */
    public static List<LinkedList<TreeNode>> createLevelLinkedList(TreeNode root) {
        List<LinkedList<TreeNode>> result = new ArrayList<>();
        if (root == null) return result;

        LinkedList<TreeNode> current = new LinkedList<>();
        current.add(root);

        while (!current.isEmpty()) {
            result.add(current); // Agregar nivel previo
            LinkedList<TreeNode> parents = current;
            current = new LinkedList<>();

            for (TreeNode parent : parents) {
                if (parent.left != null) {
                    current.add(parent.left);
                }
                if (parent.right != null) {
                    current.add(parent.right);
                }
            }
        }

        return result;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Cada nodo se visita y se agrega a una lista exactamente una vez. |
| Espacio Auxiliar | `O(N)` | La estructura de listas resultante almacena los $N$ nodos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Composicion de Capas Jerarquicas

1. **Composicion de Capas en Renderizado Web (Chromium):** Agrupa capas del DOM segun profundidad de apilamiento para rasterizacion acelerada en GPU.
2. **Tablas de Simbolos en Compiladores:** Agrupamiento de identificadores segun nivel de anidamiento lexico.

## Casos Límite y Robustez en Producción

1. **Arbol vacío:** Retorna una lista vacia.
2. **Arbol desbalanceado (lineal):** Genera $N$ listas de 1 elemento en $O(N)$.
