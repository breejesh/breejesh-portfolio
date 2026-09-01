---
title: "Fusión Ordenada: Fusión In-Place de Arreglos con Dos Punteros Inversos (CTCI 10.1)"
description: "Fusiona el arreglo ordenado B dentro del arreglo ordenado A con buffer al final in-place usando punteros inversos en tiempo O(A + B) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-1-sorted-merge.webp
previewImage: /assets/images/ctci-10-1-sorted-merge.webp
---

> **TL;DR**
> * **El Problema del Libro:** Se te dan dos arreglos ordenados, $A$ y $B$, donde $A$ tiene un buffer al final lo suficientemente grande para contener a $B$. Escribe un metodo para fusionar $B$ dentro de $A$ en orden.
> * **La Solución Óptima:** Fusión Inversa In-Place con Tres Punteros: (1) `indexA = lastA - 1`, `indexB = lastB - 1` e `indexMerged = lastA + lastB - 1`; (2) Compara desde el final y copia el mayor en $A[\text{indexMerged}]$; (3) Si quedan elementos en $B$, se copian directamente; (4) Se ejecuta en **tiempo $O(A + B)$** y **espacio $O(1)$** sin desplazar elementos hacia la derecha ni usar arreglos adicionales.
> * **Realidad en Producción:** Compactacion de tablas SSTable en arboles LSM (RocksDB).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.1), se nos plantea:

*"Fusiona dos arreglos ordenados A y B dentro de A in-place, sabiendo que A cuenta con espacio suficiente al final."*

## 2. Lógica de Fusión Inversa

Fusionar desde el inicio requeriria desplazar los elementos de $A$ repetidamente ($O(N^2)$).

Al comenzar desde el extremo final del buffer vacio:
$$\text{indexMerged} = \text{lastA} + \text{lastB} - 1$$
Los elementos mayores se ubican en el espacio libre sin sobreescribir datos no leidos de $A$.

## Implementación de Producción

```java
public class SortedMerge {
    /**
     * Fusiona el arreglo B en el arreglo A in-place.
     * Complejidad Temporal: O(A + B)
     * Complejidad Espacial: O(1)
     */
    public static void merge(int[] a, int[] b, int lastA, int lastB) {
        int indexA = lastA - 1;
        int indexB = lastB - 1;
        int indexMerged = lastB + lastA - 1;

        while (indexB >= 0) {
            if (indexA >= 0 && a[indexA] > b[indexB]) {
                a[indexMerged] = a[indexA];
                indexA--;
            } else {
                a[indexMerged] = b[indexB];
                indexB--;
            }
            indexMerged--;
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(A + B)` | Exactamente $lastA + lastB$ comparaciones lineales. |
| Espacio Auxiliar | `O(1)` | Tres variables puntero de tipo entero. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Compactación en Árboles LSM

1. **Fusión de Cursors SSTable:** Motores como RocksDB y Cassandra fusionan bloques ordenados en streaming evitando asignaciones adicionales de memoria intermedia.
2. **Protección de Sobrescritura:** La indexacion inversa garantiza la integridad de los datos en estructuras de buffer contiguo.

## Casos Límite y Robustez en Producción

1. **Arreglo B Vacío ($lastB = 0$):** Bucle finaliza inmediatamente; $A$ queda inalterado.
2. **Arreglo A Vacío ($lastA = 0$):** Copia todos los elementos de $B$ en $A$.
