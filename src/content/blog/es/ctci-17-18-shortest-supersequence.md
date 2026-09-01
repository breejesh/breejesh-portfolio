---
title: "Supersecuencia Más Corta: Ventana Deslizante de Cobertura Mínima (CTCI 17.18)"
description: "Halla el subarray contiguo mas corto de un array grande que contenga todos los elementos de un array pequeño mediante ventana deslizante en tiempo O(N log S)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-18-shortest-supersequence.webp
previewImage: /assets/images/ctci-17-18-shortest-supersequence.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dados dos arrays `big` y `small`, encuentra el subarray contiguo mas corto de `big` que contenga todos los elementos de `small`.
> * **La Solución Óptima:** **Ventana Deslizante con Seguimiento de Próxima Ocurrencia**:
>   1. Precalcular listas ordenadas de posiciones en `big` para cada elemento de `small`.
>   2. Usar un montículo mínimo para mantener el puntero de avance actual de cada elemento.
>   3. Extraer el elemento con la posicion minima, calcular el tamano de ventana y avanzar al siguiente.
>   4. Terminar cuando cualquier elemento de `small` agota sus ocurrencias.
>   5. Se ejecuta en **tiempo $O(N \log S)$** y **espacio $O(N)$**.
> * **Realidad en Producción:** Puntuacion de proximidad BM25 en motores de busqueda y fusion de flujos de sensores IoT.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.18), se nos plantea:

*"Devuelve los indices de inicio y fin del subarray mas corto de 'big' que cubra todos los elementos de 'small'."*

## 2. Mecánica del Barrido por Montículo Mínimo

Al mantener un puntero activo por cada elemento del conjunto `small`, la ventana se encoge sin necesidad de reiniciar el escaneo desde el principio.

## Implementación de Producción

```java
import java.util.*;

public class ShortestSupersequence {

    public static int[] shortestSupersequence(int[] big, int[] small) {
        List<List<Integer>> lists = new ArrayList<>();
        Map<Integer, Integer> map = new HashMap<>();

        for (int s : small) {
            if (!map.containsKey(s)) {
                map.put(s, lists.size());
                lists.add(new ArrayList<>());
            }
        }

        for (int i = 0; i < big.length; i++) {
            Integer idx = map.get(big[i]);
            if (idx != null) lists.get(idx).add(i);
        }

        PriorityQueue<int[]> minHeap = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        int maxIndex = Integer.MIN_VALUE;

        for (int i = 0; i < lists.size(); i++) {
            if (lists.get(i).isEmpty()) return new int[]{-1, -1};
            int firstOcc = lists.get(i).get(0);
            minHeap.add(new int[]{firstOcc, i, 0});
            maxIndex = Math.max(maxIndex, firstOcc);
        }

        int[] best = {-1, -1};
        while (!minHeap.isEmpty()) {
            int[] curr = minHeap.poll();
            int minIndex = curr[0];
            int listIdx = curr[1];
            int posIdx = curr[2];

            if (best[0] == -1 || maxIndex - minIndex < best[1] - best[0]) {
                best[0] = minIndex;
                best[1] = maxIndex;
            }

            if (posIdx + 1 >= lists.get(listIdx).size()) break;
            int nextOcc = lists.get(listIdx).get(posIdx + 1);
            minHeap.add(new int[]{nextOcc, listIdx, posIdx + 1});
            maxIndex = Math.max(maxIndex, nextOcc);
        }

        return best;
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N log S)` | N posiciones escaneadas con operaciones de heap de S elementos. |
| Espacio Auxiliar | `O(N)` | Listas de ocurrencias con todas las posiciones. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Relevancia y Proximidad en Búsqueda

1. **BM25 Minimum Span:** Los motores de busqueda calculan la ventana de menor tamano que contiene todos los terminos de la consulta para puntuar la proximidad.
2. **Fusion de Sensores IoT:** Definicion de ventanas temporales minimas con al menos una lectura por canal de sensor.

## Casos Límite y Robustez en Producción

1. **Elemento de `small` Ausente en `big`:** Retorna `{-1, -1}`.
