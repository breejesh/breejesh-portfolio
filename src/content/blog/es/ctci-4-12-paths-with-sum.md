---
title: "Caminos con Suma: Contar Caminos Descendentes con Suma Objetivo (CTCI 4.12)"
description: "Disena un algoritmo para contar la cantidad de caminos descendentes en un arbol binario que suman un valor objetivo usando sumas acumuladas en O(N) tiempo."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-12-paths-with-sum.webp
previewImage: /assets/images/ctci-4-12-paths-with-sum.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un arbol binario donde cada nodo contiene un entero (positivo o negativo), cuenta la cantidad de caminos que suman un valor dado sin necesidad de comenzar en la raiz o terminar en una hoja (pero viajando estrictamente hacia abajo).
> * **La Solución Óptima:** Utiliza **Sumas de Prefijo con Tabla Hash**: Manten la suma acumulada `runningSum` en el camino actual. La cantidad de subcaminos que terminan en el nodo actual sumando `targetSum` equivale al conteo de ancestros previos con prefijo `runningSum - targetSum`, almacenados en un `HashMap` con backtracking en tiempo $O(N)$ y espacio $O(H)$.
> * **Realidad en Producción:** Agregacion de ventanas de flujo de paquetes en redes y analisis de intervalos de ganancias en transacciones financieras.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 4.12), se nos plantea:

*"Se te da un arbol binario en el que cada nodo contiene un valor entero. Disena un algoritmo para contar la cantidad de caminos que suman un valor dado. El camino no necesita comenzar ni terminar en la raiz o una hoja, pero debe ir hacia abajo."*

## 2. Mecánica de Sumas de Prefijo con Backtracking

Un subcamino contiguo desde el ancestro $A$ hasta el nodo $B$ cumple:
$$\text{PathSum}(A \to B) = \text{RunningSum}(B) - \text{RunningSum}(\text{padre}(A))$$

Por lo tanto, buscamos en el historial de ancestros el valor:
$$\text{RunningSum}(\text{padre}(A)) = \text{RunningSum}(B) - \text{targetSum}$$

**Algoritmo:**
1. Recorrer el arbol actualizando `runningSum`.
2. Consultar `runningSum - targetSum` en `HashMap<Integer, Integer> pathCount`.
3. Sumar las ocurrencias encontradas al total de caminos.
4. Agregar el `runningSum` actual al mapa.
5. Recorrer hijos izquierdo y derecho.
6. **Backtracking:** Decrementar el conteo de `runningSum` en el mapa antes de retornar al padre.

## Implementación de Producción

```java
import java.util.HashMap;

public class PathsWithSum {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Cuenta caminos descendentes que suman targetSum.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(log N) en arboles balanceados, O(N) en el peor caso.
     */
    public static int countPathsWithSum(TreeNode root, int targetSum) {
        return countPathsWithSum(root, targetSum, 0, new HashMap<Integer, Integer>());
    }

    private static int countPathsWithSum(TreeNode node, int targetSum, int runningSum,
                                         HashMap<Integer, Integer> pathCount) {
        if (node == null) return 0;

        runningSum += node.val;
        int sum = runningSum - targetSum;
        int totalPaths = pathCount.getOrDefault(sum, 0);

        if (runningSum == targetSum) {
            totalPaths++;
        }

        incrementHashTable(pathCount, runningSum, 1);

        totalPaths += countPathsWithSum(node.left, targetSum, runningSum, pathCount);
        totalPaths += countPathsWithSum(node.right, targetSum, runningSum, pathCount);

        incrementHashTable(pathCount, runningSum, -1); // Backtracking

        return totalPaths;
    }

    private static void incrementHashTable(HashMap<Integer, Integer> hashTable, int key, int delta) {
        int newCount = hashTable.getOrDefault(key, 0) + delta;
        if (newCount == 0) {
            hashTable.remove(key);
        } else {
            hashTable.put(key, newCount);
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Cada nodo se visita una sola vez con operaciones $O(1)$ en la tabla hash. |
| Espacio Auxiliar | `O(log N) a O(N)` | La tabla hash almacena a lo sumo los $H$ ancestros del camino actual. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Evaluación de Sumas de Intervalo

1. **Flujos Financieros de Alta Frecuencia:** Rastreo de intervalos contiguos de transacciones que alcanzan umbrales de riesgo.
2. **Monitoreo de Redes:** Identificacion de secuencias de paquetes que saturan el ancho de banda del canal.

## Casos Límite y Robustez en Producción

1. **Valores negativos o ceros:** Manejados correctamente gracias al conteo de frecuencias de prefijos.
2. **Arbol vacío:** Retorna 0.
