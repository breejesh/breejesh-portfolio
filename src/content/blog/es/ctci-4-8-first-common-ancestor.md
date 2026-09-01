---
title: "Primer Ancestro Común: Ancestro Común Más Cercano en un Árbol Binario (CTCI 4.8)"
description: "Disena un algoritmo para encontrar el primer ancestro comun (LCA) de dos nodos en un arbol binario sin estructuras adicionales en tiempo O(N) y espacio O(H)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-8-first-common-ancestor.webp
previewImage: /assets/images/ctci-4-8-first-common-ancestor.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena un algoritmo para encontrar el primer ancestro comun de dos nodos en un arbol binario (no necesariamente un arbol binario de busqueda) sin almacenar nodos en estructuras de datos adicionales.
> * **La Solución Óptima:** Utiliza **Recorrido Post-Orden**: Un nodo $r$ es el ancestro comun si $p$ se encuentra en un subarbol y $q$ en el otro subarbol, o si $r$ es uno de los nodos y el otro es su descendiente. Si las llamadas recursivas izquierda y derecha devuelven nodos no nulos, el nodo actual es el LCA en tiempo $O(N)$ y espacio $O(H)$.
> * **Realidad en Producción:** Propagacion de eventos en el DOM (bubbling) y resolucion de ancestros en taxonomias jerarquicas.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 4.8), se nos plantea:

*"Disena un algoritmo y escribe codigo para encontrar el primer ancestro comun de dos nodos en un arbol binario. Evita almacenar nodos adicionales en estructuras de datos. NOTA: Este arbol no es necesariamente un BST."*

## 2. Mecánica Algorítmica (Recursión Post-Orden)

1. Caso base: Si `root == null`, retornar `null`.
2. Si `root == p || root == q`, retornar `root`.
3. Recorrer la rama izquierda y derecha.
4. Evaluar los resultados:
   * Si ambos lados retornan un valor no nulo, $p$ y $q$ estan en subarboles opuestos y `root` es el Ancestro Comun Mas Cercano (LCA).
   * Si solo un lado retorna un nodo, ambos se encuentran en ese mismo subarbol.
   * Si ambos retornan `null`, ninguno de los nodos fue encontrado.

## Implementación de Producción

```java
public class FirstCommonAncestor {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;

        public TreeNode(int x) {
            this.val = x;
        }
    }

    /**
     * Encuentra el primer ancestro comun (LCA) de p y q.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(H) donde H es la altura del arbol.
     */
    public static TreeNode commonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (!covers(root, p) || !covers(root, q)) {
            return null;
        }
        return ancestorHelper(root, p, q);
    }

    private static TreeNode ancestorHelper(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) {
            return root;
        }

        boolean pIsOnLeft = covers(root.left, p);
        boolean qIsOnLeft = covers(root.left, q);

        if (pIsOnLeft != qIsOnLeft) {
            return root;
        }

        TreeNode childSide = pIsOnLeft ? root.left : root.right;
        return ancestorHelper(childSide, p, q);
    }

    private static boolean covers(TreeNode root, TreeNode p) {
        if (root == null) return false;
        if (root == p) return true;
        return covers(root.left, p) || covers(root.right, p);
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Recorre los nodos del arbol para ubicar a $p$ y $q$. |
| Espacio Auxiliar | `O(H)` | Profundidad de la pila de recursion acotada por la altura $H$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Resolución de Jerarquías

1. **Burbujeo de Eventos en el DOM:** Los navegadores calculan el ancestro comun mas bajo para determinar la cadena de propagacion de eventos.
2. **Jerarquías de Control de Acceso (RBAC):** Encuentra el grupo superior mas cercano para herencia de politicas.

## Casos Límite y Robustez en Producción

1. **Nodos inexistentes en el árbol:** La comprobacion inicial `covers` previene resultados falsos y retorna `null`.
2. **$p$ es ancestro de $q$:** Retorna $p$ correctamente.
