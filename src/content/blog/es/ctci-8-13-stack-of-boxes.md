---
title: "Pila de Cajas: Apilamiento 3D de Cajas mediante Programación Dinámica LIS (CTCI 8.13)"
description: "Calcula la altura maxima de una pila de cajas 3D donde cada caja debe ser estrictamente menor en ancho, alto y profundidad en tiempo O(N^2) y espacio O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-13-stack-of-boxes.webp
previewImage: /assets/images/ctci-8-13-stack-of-boxes.webp
---

> **TL;DR**
> * **El Problema del Libro:** Tienes $n$ cajas con ancho $w_i$, alto $h_i$ y profundidad $d_i$. Las cajas no pueden rotarse y solo pueden apilarse si cada caja es estrictamente menor que la caja inferior en las 3 dimensiones. Calcula la altura maxima de la torre.
> * **La Solución Óptima:** Programación Dinámica LIS 3D Ordenada: (1) Ordena las cajas de mayor a menor por altura; (2) Usa una tabla `stackMap[i]` que guarda la altura maxima teniendo la caja `i` como base; (3) Itera sobre cajas $j > i$ con dimensiones estrictamente menores $(w_j < w_i, h_j < h_i, d_j < d_i)$; (4) Se ejecuta en **tiempo $O(N^2)$** y **espacio $O(N)$**.
> * **Realidad en Producción:** Empaquetado 3D en logistica (3D Bin Packing) y ordenamiento topologico en grafos aciclicos dirigidos (DAG).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.13), se nos plantea:

*"Calcula la altura maxima posible de una torre de cajas tridimensionales donde cada caja debe ser estrictamente menor en ancho, alto y profundidad que la caja que tiene debajo."*

## 2. Modelado Matemático: DAG y Ordenamiento

Al ordenar las cajas de forma descendente por altura ($h_0 \ge h_1 \dots$), la caja $j$ solo puede colocarse sobre $i$ si $j > i$. Esto reduce el problema a la Subsecuencia Creciente Mas Larga (LIS) sobre un DAG.

$$\text{maxHeight}(i) = h_i + \max_{j > i, \text{canBeAbove}(i, j)} \text{maxHeight}(j)$$

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class StackOfBoxes {
    public static class Box {
        public final int width;
        public final int height;
        public final int depth;

        public Box(int w, int h, int d) {
            this.width = w;
            this.height = h;
            this.depth = d;
        }

        public boolean canBeAbove(Box other) {
            if (other == null) return true;
            return this.width < other.width &&
                   this.height < other.height &&
                   this.depth < other.depth;
        }
    }

    /**
     * Calcula la altura maxima de apilamiento.
     * Complejidad Temporal: O(N^2)
     * Complejidad Espacial: O(N)
     */
    public static int createStack(List<Box> boxes) {
        if (boxes == null || boxes.isEmpty()) return 0;

        Collections.sort(boxes, new Comparator<Box>() {
            @Override
            public int compare(Box b1, Box b2) {
                return Integer.compare(b2.height, b1.height);
            }
        });

        int[] stackMap = new int[boxes.size()];
        int maxHeight = 0;

        for (int i = 0; i < boxes.size(); i++) {
            int height = createStackHelper(boxes, i, stackMap);
            maxHeight = Math.max(maxHeight, height);
        }

        return maxHeight;
    }

    private static int createStackHelper(List<Box> boxes, int bottomIndex, int[] stackMap) {
        if (bottomIndex < boxes.size() && stackMap[bottomIndex] > 0) {
            return stackMap[bottomIndex];
        }

        Box bottom = boxes.get(bottomIndex);
        int maxSubHeight = 0;

        for (int i = bottomIndex + 1; i < boxes.size(); i++) {
            if (boxes.get(i).canBeAbove(bottom)) {
                int height = createStackHelper(boxes, i, stackMap);
                maxSubHeight = Math.max(maxSubHeight, height);
            }
        }

        int totalHeight = maxSubHeight + bottom.height;
        stackMap[bottomIndex] = totalHeight;
        return totalHeight;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N^2)` | Ordenamiento $O(N \log N)$ mas evaluacion memoizada de pares $(i, j)$ en $O(N^2)$. |
| Espacio Auxiliar | `O(N)` | Arreglo de memoizacion y profundidad de llamadas $O(N)$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Empaquetado Logístico 3D

1. **Optimización de Carga en Almacenes (Amazon):** Algoritmos de empaquetado de contenedores que maximizan densidad de carga bajo restricciones de estabilidad fisica.
2. **Planificación en Compiladores:** Recorrido de grafos de dependencias de instrucciones para minimizar latencias de ejecucion en CPU.

## Casos Límite y Robustez en Producción

1. **Sin cajas apilables (dimensiones identicas):** Retorna la altura de la mayor caja individual.
2. **Lista vacía:** Retorna 0.
