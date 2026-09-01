---
title: "Secuencias de BST: Generar Todas las Secuencias de Arreglos que Crean un BST Dado (CTCI 4.9)"
description: "Reconstruye todas las posibles secuencias de insercion de arreglos que producen un arbol binario de busqueda mediante entrelazado recursivo."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-9-bst-sequences.webp
previewImage: /assets/images/ctci-4-9-bst-sequences.webp
---

> **TL;DR**
> * **El Problema del Libro:** Un arbol binario de busqueda se creo insertando los elementos de un arreglo de izquierda a derecha. Dado un BST con elementos distintos, imprime todos los posibles arreglos que pudieron haber generado este arbol.
> * **La Solución Óptima:** La raiz siempre debe insertarse antes que sus hijos. Obten recursivamente todas las secuencias del subarbol izquierdo y del derecho, y **entrelaza** (weave) cada secuencia izquierda con cada derecha preservando su orden relativo interno.
> * **Realidad en Producción:** Fuzzing de transacciones concurrentes en bases de datos y pruebas de sistemas de consenso (Raft/Paxos).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 4.9), se nos plantea:

*"Un arbol binario de busqueda se creo recorriendo un arreglo de izquierda a derecha e insertando cada elemento. Dado un arbol binario de busqueda con elementos distintos, imprime todos los arreglos posibles que pudieron haber generado este arbol."*

**Ejemplo:**
* Arbol: Raiz `2`, Hijo izquierdo `1`, Hijo derecho `3`
* Salida: `[2, 1, 3]`, `[2, 3, 1]`

## 2. Mecánica de Entrelazado (Weaving)

1. Para cada subarbol, la raiz debe preceder a todos sus descendientes.
2. Las secuencias del subarbol izquierdo y derecho pueden intercalarse en cualquier combinacion, siempre que se conserve el orden relativo interno de cada subarbol.
3. La funcion `weaveLists` intercala recursivamente con backtracking:
   * Extrae la cabeza de la primera lista, la anade al prefijo y desciende recursivamente.
   * Restaura el estado (backtracking).
   * Extrae la cabeza de la segunda lista, la anade al prefijo y desciende.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class BSTSequences {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Genera todas las secuencias de insercion posibles.
     */
    public static List<LinkedList<Integer>> allSequences(TreeNode node) {
        List<LinkedList<Integer>> result = new ArrayList<>();

        if (node == null) {
            result.add(new LinkedList<>());
            return result;
        }

        LinkedList<Integer> prefix = new LinkedList<>();
        prefix.add(node.val);

        List<LinkedList<Integer>> leftSeq = allSequences(node.left);
        List<LinkedList<Integer>> rightSeq = allSequences(node.right);

        for (LinkedList<Integer> left : leftSeq) {
            for (LinkedList<Integer> right : rightSeq) {
                List<LinkedList<Integer>> weaved = new ArrayList<>();
                weaveLists(left, right, weaved, prefix);
                result.addAll(weaved);
            }
        }

        return result;
    }

    private static void weaveLists(LinkedList<Integer> first, LinkedList<Integer> second,
                                   List<LinkedList<Integer>> results, LinkedList<Integer> prefix) {
        if (first.isEmpty() || second.isEmpty()) {
            LinkedList<Integer> result = (LinkedList<Integer>) prefix.clone();
            result.addAll(first);
            result.addAll(second);
            results.add(result);
            return;
        }

        int headFirst = first.removeFirst();
        prefix.addLast(headFirst);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        first.addFirst(headFirst);

        int headSecond = second.removeFirst();
        prefix.addLast(headSecond);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        second.addFirst(headSecond);
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | Exponencial ($O(2^N \text{ a } N!)$) | Depende de la cantidad combinatoria de entrelazados posibles. |
| Espacio Auxiliar | $O(N \times K)$ | Almacenamiento de las $K$ secuencias resultantes de longitud $N$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Fuzzing de Concurrencia

1. **Pruebas de Caos en Sistemas Distribuidos (Jepsen):** Simula todas las secuencias topologicamente validas de eventos para detectar condiciones de carrera.
2. **Serialización de Transacciones:** Audita permutaciones de lectura y escritura en bases de datos ACID.

## Casos Límite y Robustez en Producción

1. **Arbol nulo:** Retorna una lista con una lista vacia `[[]]`.
2. **Arbol lineal:** Genera exactamente 1 secuencia de insercion.
