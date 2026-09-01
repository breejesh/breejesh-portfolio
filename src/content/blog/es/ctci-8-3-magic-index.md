---
title: "Índice Mágico: Búsqueda Binaria de Punto Fijo en Arreglos Ordenados (CTCI 8.3)"
description: "Encuentra un indice magico donde A[i] = i en arreglos ordenados con enteros unicos y duplicados usando busqueda binaria modificada en O(log N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-3-magic-index.webp
previewImage: /assets/images/ctci-8-3-magic-index.webp
---

> **TL;DR**
> * **El Problema del Libro:** Un indice magico en un arreglo $A[0 \dots n - 1]$ se define como un indice tal que $A[i] = i$. Dado un arreglo ordenado de enteros distintos, escribe un metodo para encontrar un indice magico si existe. SEGUIMIENTO: ¿Y si los valores tienen duplicados?
> * **La Solución Óptima:** Busqueda Binaria de Punto Fijo: (1) **Elementos Únicos**: Si $A[\text{mid}] > \text{mid}$, el indice solo puede estar a la izquierda, logrando tiempo $O(\log N)$; (2) **Con Duplicados**: Poda recursiva buscando a la izquierda en $[start, \min(\text{mid}-1, A[\text{mid}])]$ y a la derecha en $[\max(\text{mid}+1, A[\text{mid}]), end]$ en tiempo promedio $O(\log N)$ y $O(N)$ en el peor caso.
> * **Realidad en Producción:** Puntos fijos en analisis de flujo de compiladores y busquedas en indices monotonicos de bases de datos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.3), se nos plantea:

*"Encuentra un indice magico tal que A[i] = i en un arreglo ordenado de enteros unicos y generaliza para arreglos con duplicados."*

## 2. Derivación del Algoritmo

1. **Elementos Distintos:** Dado que cada elemento es mayor que el anterior al menos en 1:
   * Si $A[\text{mid}] > \text{mid}$, a la derecha todos los elementos cumpliran $A[j] > j$, por lo que se descarta la mitad derecha.
   * Si $A[\text{mid}] < \text{mid}$, se descarta la mitad izquierda.
2. **Con Duplicados:** La presencia de duplicados rompe la monotonicidad estricta, pero permite acotar las busquedas a los rangos $\min(\text{mid}-1, A[\text{mid}])$ y $\max(\text{mid}+1, A[\text{mid}])$.

## Implementación de Producción

```java
public class MagicIndex {
    /**
     * Elementos DISTINTOS.
     * Complejidad Temporal: O(log N)
     * Complejidad Espacial: O(log N)
     */
    public static int magicDistinct(int[] array) {
        return magicDistinct(array, 0, array.length - 1);
    }

    private static int magicDistinct(int[] array, int start, int end) {
        if (end < start) return -1;

        int mid = start + (end - start) / 2;
        if (array[mid] == mid) {
            return mid;
        } else if (array[mid] > mid) {
            return magicDistinct(array, start, mid - 1);
        } else {
            return magicDistinct(array, mid + 1, end);
        }
    }

    /**
     * Elementos con DUPLICADOS.
     * Complejidad Temporal: O(log N) promedio, O(N) peor caso.
     * Complejidad Espacial: O(log N)
     */
    public static int magicNonDistinct(int[] array) {
        return magicNonDistinct(array, 0, array.length - 1);
    }

    private static int magicNonDistinct(int[] array, int start, int end) {
        if (end < start) return -1;

        int midIndex = start + (end - start) / 2;
        int midValue = array[midIndex];

        if (midValue == midIndex) {
            return midIndex;
        }

        int leftIndex = Math.min(midIndex - 1, midValue);
        int left = magicNonDistinct(array, start, leftIndex);
        if (left >= 0) return left;

        int rightIndex = Math.max(midIndex + 1, midValue);
        return magicNonDistinct(array, rightIndex, end);
    }
}
```

## Análisis de Complejidad y Memoria

| Modo | Complejidad Temporal | Espacio Auxiliar | Detalle Técnico |
|---|---|---|---|
| Enteros Únicos | `O(log N)` | `O(log N)` | Búsqueda binaria estricta. |
| Con Duplicados | `O(log N)` prom. / `O(N)` peor | `O(log N)` | Poda dual de sub-rangos no viables. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Puntos Fijos

1. **Optimizaciones en Compiladores:** Los analizadores de flujo de datos calculan puntos fijos ($f(x) = x$) para determinar variables vivas y expresiones redundantes.
2. **Tablas de Particionado Monotónico:** Localizacion eficiente de rangos sin escanear bloques completos.

## Casos Límite y Robustez en Producción

1. **Arreglo sin índice mágico:** Retorna `-1`.
2. **Arreglo vacío:** Termina de forma segura.
