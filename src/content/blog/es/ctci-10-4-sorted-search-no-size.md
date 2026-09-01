---
title: "Búsqueda en Arreglo sin Tamaño: Búsqueda Exponencial en Estructuras Infinitas (CTCI 10.4)"
description: "Busca un valor en una estructura ordenada de longitud desconocida Listy mediante sondeo exponencial y busqueda binaria acotada en tiempo O(log p)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
previewImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
---

> **TL;DR**
> * **El Problema del Libro:** Se te da una estructura de datos tipo arreglo `Listy` que no posee metodo de tamano (`size()`), pero tiene `elementAt(i)` en $O(1)$ que retorna `-1` si $i$ esta fuera de limites. Dado un `Listy` con enteros positivos ordenados, encuentra el indice de un elemento $x$.
> * **La Solución Óptima:** **Búsqueda Exponencial + Búsqueda Binaria Acotada**: (1) **Sondeo Exponencial**: Inicia en `index = 1` y duplica `index *= 2` hasta que `elementAt(index) == -1` o `elementAt(index) >= value`; (2) **Búsqueda Binaria**: Busca dentro del rango acotado $[index / 2, index]$; (3) Trata `-1` como un valor infinito a la derecha y retrocede hacia la izquierda; (4) Se ejecuta en **tiempo $O(\log p)$** (donde $p$ es la posicion del objetivo) y **espacio $O(1)$**.
> * **Realidad en Producción:** Busqueda de marcas de tiempo en flujos continuos de datos (streams) y archivos mapeados en memoria (`mmap`).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.4), se nos plantea:

*"Encuentra el indice de un elemento x en una estructura ordenada Listy de longitud desconocida que retorna -1 al consultar indices fuera de rango."*

## 2. Mecánica de la Búsqueda Exponencial ($O(\log p)$)

1. **Fase de Duplicación:** Consultar indices $1, 2, 4, 8, \dots, 2^k$ hasta superar el valor objetivo o salir del arreglo. Esto toma $\lceil \log_2 p \rceil$ pasos.
2. **Fase de Búsqueda Binaria:** Ejecutar busqueda binaria en el intervalo $[2^{k-1}, 2^k]$ en tiempo $O(\log p)$.

## Implementación de Producción

```java
public class SortedSearchNoSize {
    public static class Listy {
        private final int[] array;

        public Listy(int[] arr) { this.array = arr; }

        public int elementAt(int i) {
            if (i < 0 || i >= array.length) return -1;
            return array[i];
        }
    }

    /**
     * Busca el valor en Listy.
     * Complejidad Temporal: O(log p)
     * Complejidad Espacial: O(1)
     */
    public static int search(Listy list, int value) {
        int index = 1;
        while (list.elementAt(index) != -1 && list.elementAt(index) < value) {
            index *= 2;
        }
        return binarySearch(list, value, index / 2, index);
    }

    private static int binarySearch(Listy list, int value, int low, int high) {
        int mid;

        while (low <= high) {
            mid = low + (high - low) / 2;
            int middle = list.elementAt(mid);

            if (middle > value || middle == -1) {
                high = mid - 1;
            } else if (middle < value) {
                low = mid + 1;
            } else {
                return mid;
            }
        }
        return -1;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(log p)` | $\log_2 p$ pasos de duplicación + $\log_2 p$ pasos de búsqueda binaria. |
| Espacio Auxiliar | `O(1)` | Algoritmo iterativo sin memoria adicional. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Búsqueda en Flujos No Acotados

1. **Particiones de Flujo (Kafka Streams):** Los consumidores acotan marcas de tiempo en particiones continuas duplicando ventanas de busqueda.
2. **Memoria Virtual y Archivos Dispersos:** Resolucion de accesos no comprometidos en RAM mediante valores centinela.

## Casos Límite y Robustez en Producción

1. **Elemento en Índice 0:** La condicion `elementAt(1) >= value` acota el rango $[0, 1]$ correctamente.
2. **Elemento Ausente:** Retorna `-1` de forma segura.
