---
title: "Pares con Suma: Mapas Hash de Complementos y Dos Punteros (CTCI 16.24)"
description: "Encuentra todos los pares de enteros en un array que sumen un valor objetivo utilizando mapas de frecuencias complementarias y dos punteros en tiempo O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-24-pairs-with-sum.webp
previewImage: /assets/images/ctci-16-24-pairs-with-sum.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena un algoritmo para encontrar todos los pares de enteros dentro de un array que sumen un valor especificado.
> * **Las Soluciones Óptimas:**
>   1. **Mapa Hash de Frecuencias Complementarias (Óptimo en Tiempo)**:
>      * Para cada elemento $x$, calcular su complemento $\text{complemento} = \text{objetivo} - x$.
>      * Si el complemento existe en el mapa con frecuencia $> 0$, emparejar $(x, \text{complemento})$ y decrementar su contador.
>      * De lo contrario, almacenar $x$ en el mapa.
>      * Se ejecuta en **tiempo $O(N)$** y **espacio $O(N)$**.
>   2. **Dos Punteros sobre Array Ordenado (Óptimo en Espacio)**:
>      * Ordenar el array y converger dos punteros $L$ y $R$ en **tiempo $O(N \log N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Motores de emparejamiento de ordenes bursatiles (Matching Engines).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.24), se nos plantea:

*"Halla todos los pares de valores numericos en un array cuya suma total coincida exactamente con un numero objetivo dado."*

## 2. Invariante de Complementos

Para cada numero $x$, solo existe un unico complemento $y = \text{objetivo} - x$ que satisface la igualdad.

## Implementación de Producción

```java
import java.util.*;

public class PairsWithSum {

    public static class Pair {
        public final int first, second;
        public Pair(int first, int second) {
            this.first = first;
            this.second = second;
        }
    }

    public static List<Pair> findPairsHash(int[] array, int targetSum) {
        if (array == null || array.length < 2) return Collections.emptyList();

        List<Pair> result = new ArrayList<>();
        Map<Integer, Integer> unpaired = new HashMap<>();

        for (int x : array) {
            int comp = targetSum - x;
            int count = unpaired.getOrDefault(comp, 0);

            if (count > 0) {
                result.add(new Pair(x, comp));
                if (count == 1) {
                    unpaired.remove(comp);
                } else {
                    unpaired.put(comp, count - 1);
                }
            } else {
                unpaired.put(x, unpaired.getOrDefault(x, 0) + 1);
            }
        }

        return result;
    }

    public static List<Pair> findPairsSorted(int[] array, int targetSum) {
        if (array == null || array.length < 2) return Collections.emptyList();

        Arrays.sort(array);
        List<Pair> result = new ArrayList<>();
        int left = 0, right = array.length - 1;

        while (left < right) {
            int sum = array[left] + array[right];
            if (sum == targetSum) {
                result.add(new Pair(array[left], array[right]));
                left++;
                right--;
            } else if (sum < targetSum) {
                left++;
            } else {
                right--;
            }
        }

        return result;
    }
}
```

## Análisis de Complejidad

| Estrategia | Complejidad Temporal | Espacio Auxiliar |
|---|---|---|
| **Mapa Hash Complementario** | **$O(N)$** | **$O(N)$** |
| **Dos Punteros (Ordenado)** | $O(N \log N)$ | $O(1)$ |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores de Calce de Órdenes

1. **Emparejamiento de Órdenes Bursátiles:** Plataformas como Nasdaq emparejan posturas de compra (*bids*) y venta (*asks*) mediante tablas hash de precios complementarios en sub-microsegundos.

## Casos Límite y Robustez en Producción

1. **Elementos Duplicados:** Gestionados correctamente mediante contadores de frecuencia evitando auto-emparejamientos invalidos.
