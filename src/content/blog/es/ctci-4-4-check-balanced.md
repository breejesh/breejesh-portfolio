---
title: "Comprobar Balanceo: Verificar si un Árbol Binario está Balanceado en Altura (CTCI 4.4)"
description: "Implementa un algoritmo para determinar si un arbol binario esta balanceado en tiempo O(N) y espacio O(H) mediante recorrido post-orden con cortocircuito."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-4-check-balanced.webp
previewImage: /assets/images/ctci-4-4-check-balanced.webp
---

> **TL;DR**
> * **El Problema del Libro:** Implementa una funcion para comprobar si un arbol binario esta balanceado (las alturas de los dos subarboles de cualquier nodo nunca difieren en mas de uno).
> * **La Solución Óptima:** Utiliza **Recorrido Post-Orden Ascendente**: Calcula las alturas desde las hojas. Si algun subarbol esta desbalanceado ($|h_{izq} - h_{der}| > 1$), retorna un codigo de error (`Integer.MIN_VALUE`) para abortar el recorrido, ejecutandose en tiempo $O(N)$ y espacio de pila $O(H)$.
> * **Realidad en Producción:** Validacion de estructuras auto-balanceables AVL/Rojinegras y jerarquias de volumen delimitador en motores fisicos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 4.4), se nos plantea:

*"Implementa una funcion para comprobar si un arbol binario esta balanceado. Para esta pregunta, un arbol balanceado se define como aquel cuyas alturas de subarboles izquierdo y derecho en cualquier nodo nunca difieren en mas de uno."*

## 2. Por Qué Falla el Enfoque Descendente

Calcular `getHeight` en cada nodo desde la raiz repite el recorrido de los mismos nodos multiples veces:
* Para arboles balanceados toma $O(N \log N)$ y para arboles lineales degenera a $O(N^2)$.

## 3. Enfoque Ascendente Óptimo con Cortocircuito

Calculamos la altura y el balance en una sola pasada:
1. `checkHeight(node)` retorna la altura real si el subarbol esta balanceado.
2. Si $|h_{izq} - h_{der}| > 1$, o si un hijo ya retorno error, propaga `Integer.MIN_VALUE`.
3. Si esta balanceado, retorna $\max(h_{izq}, h_{der}) + 1$.

## Implementación de Producción

```java
public class CheckBalanced {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Comprueba si un arbol binario esta balanceado en altura.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(H) donde H es la altura del arbol.
     */
    public static boolean isBalanced(TreeNode root) {
        return checkHeight(root) != Integer.MIN_VALUE;
    }

    private static int checkHeight(TreeNode root) {
        if (root == null) return -1;

        int leftHeight = checkHeight(root.left);
        if (leftHeight == Integer.MIN_VALUE) return Integer.MIN_VALUE;

        int rightHeight = checkHeight(root.right);
        if (rightHeight == Integer.MIN_VALUE) return Integer.MIN_VALUE;

        int heightDiff = Math.abs(leftHeight - rightHeight);
        if (heightDiff > 1) {
            return Integer.MIN_VALUE;
        } else {
            return Math.max(leftHeight, rightHeight) + 1;
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Cada nodo se visita a lo sumo una vez; termina al primer desbalance. |
| Espacio Auxiliar | `O(H)` | Espacio de pila acotado por la altura $H$ ($O(\log N)$ promedio). |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Auditoría de Invariantes

1. **Motores de Almacenamiento LSM (RocksDB):** Validan la altura de arboles de memoria para evitar latencias de busqueda excesivas.
2. **Jerarquías de Colisión en Motores de Juegos:** Aseguran que las jerarquias de volumenes envolventes (BVH) no degeneren en cadenas lineales.

## Casos Límite y Robustez en Producción

1. **Arbol vacío:** Retorna `true` (altura $-1$).
2. **Desbalance en subarbol profundo:** El codigo de error interrumpe inmediatamente el resto de las ramas.
