---
title: "Comprobar Subárbol: Determinar si un Árbol Binario es Subárbol de Otro (CTCI 4.10)"
description: "Disena un algoritmo para determinar si un arbol binario T2 es subarbol de T1 mediante coincidencia recursiva en tiempo O(N + kM) y espacio O(log N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-10-check-subtree.webp
previewImage: /assets/images/ctci-4-10-check-subtree.webp
---

> **TL;DR**
> * **El Problema del Libro:** $T_1$ y $T_2$ son dos arboles binarios muy grandes, con $T_1$ mucho mayor que $T_2$. Crea un algoritmo para determinar si $T_2$ es un subarbol de $T_1$.
> * **La Solución Óptima:** Utiliza **Coincidencia de Árboles (Tree Search Matching)**: Recorre $T_1$ buscando nodos cuya clave coincida con la raiz de $T_2$. Para cada candidato, invoca `matchTree(r1, r2)` que compara estructura y valores en paralelo, ejecutandose en tiempo $O(N + kM)$ y espacio $O(\log N + \log M)$ sin serializaciones masivas de cadenas.
> * **Realidad en Producción:** Analizadores estaticos de codigo basados en AST (Semgrep/ESLint) y plegado de subexpresiones comunes en compiladores (LLVM).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 4.10), se nos plantea:

*"T1 y T2 son dos arboles binarios muy grandes, con T1 mucho mayor que T2. Crea un algoritmo para determinar si T2 es un subarbol de T1."*

## 2. Comparación de Estrategias

1. **Serialización a Cadenas:** Convertir ambos arboles a texto (incluyendo marcadores `X` para `null`) y aplicar KMP. Consume $O(N + M)$ memoria adicional, lo que puede causar desbordamiento de memoria en arboles con millones de nodos.
2. **Coincidencia Estructural Recursiva (Solución del Libro):** Buscar coincidencias de raiz en $T_1$ y validar con `matchTree`. Requiere solo $O(\log N + \log M)$ espacio de pila.

## Implementación de Producción

```java
public class CheckSubtree {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Comprueba si t2 es subarbol de t1.
     * Complejidad Temporal: O(N + kM)
     * Complejidad Espacial: O(log N + log M)
     */
    public static boolean containsTree(TreeNode t1, TreeNode t2) {
        if (t2 == null) return true; // Un arbol vacio siempre es subarbol
        return subTree(t1, t2);
    }

    private static boolean subTree(TreeNode r1, TreeNode r2) {
        if (r1 == null) {
            return false;
        } else if (r1.val == r2.val && matchTree(r1, r2)) {
            return true;
        }
        return subTree(r1.left, r2) || subTree(r1.right, r2);
    }

    private static boolean matchTree(TreeNode r1, TreeNode r2) {
        if (r1 == null && r2 == null) {
            return true;
        } else if (r1 == null || r2 == null) {
            return false;
        } else if (r1.val != r2.val) {
            return false;
        } else {
            return matchTree(r1.left, r2.left) && matchTree(r1.right, r2.right);
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N + kM)` | $N$ nodos en $T_1$, $M$ nodos en $T_2$ y $k$ nodos candidatos coincidentes. |
| Espacio Auxiliar | `O(log N + log M)` | Memoria en la pila de recursion para arboles balanceados. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Coincidencia de Patrones AST

1. **Analizadores de Código Estático (Semgrep / ESLint):** Comparan fragmentos de arbol sintactico para detectar vulnerabilidades.
2. **Optimizadores de Compiladores (LLVM):** Identifican expresiones identicas en el grafo de computacion para optimizacion de codigo.

## Casos Límite y Robustez en Producción

1. **$T_2$ es null:** Retorna `true` inmediatamente.
2. **$T_1$ es null y $T_2$ no es null:** Retorna `false`.
