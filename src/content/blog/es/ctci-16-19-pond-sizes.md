---
title: "Tamaños de Estanques: Componentes Conexos en 8 Direcciones y Flood-Fill (CTCI 16.19)"
description: "Calcula los tamanos de todas las masas de agua conectadas en una matriz de elevacion topografica mediante busqueda en profundidad (DFS) en tiempo O(R * C)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-19-pond-sizes.webp
previewImage: /assets/images/ctci-16-19-pond-sizes.webp
---

> **TL;DR**
> * **El Problema del Libro:** Tienes una matriz de enteros que representa un terreno, donde $0$ indica agua y valores mayores que $0$ indican altura sobre el nivel del mar. Un estanque es una region de agua conectada en 8 direcciones (vertical, horizontal y diagonal). Calcula el tamano de todos los estanques.
> * **La Solución Óptima:** **Búsqueda en Profundidad (DFS) en 8 Direcciones**:
>   1. **Recorrido Matricial**: Recorrer todas las celdas $(r, c)$ de la matriz $R \times C$.
>   2. **Exploración DFS**: Al encontrar agua ($0$):
>      * Marcar la celda como visitada (asignando `matriz[r][c] = -1`).
>      * Explorar recursivamente las 8 celdas adyacentes.
>      * Sumar las celdas contiguas ($1 + \sum \text{DFS}(\text{vecino})$).
>   3. Se ejecuta en **tiempo $O(R \cdot C)$** y **espacio $O(R \cdot C)$**.
> * **Realidad en Producción:** Mapeo satelital de inundaciones y segmentacion de componentes conexos en OpenCV.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.19), se nos plantea:

*"Calcula el area de cada estanque de agua conectado en 8 direcciones dentro de un mapa topografico matricial."*

## 2. Máscara de Desplazamiento en 8 Direcciones

Se evaluan todos los desplazamientos relativos $(\Delta r, \Delta c) \in \{-1, 0, 1\}^2 \setminus \{(0, 0)\}$.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class PondSizes {

    public static List<Integer> computePondSizes(int[][] land) {
        if (land == null || land.length == 0 || land[0].length == 0) {
            return Collections.emptyList();
        }

        List<Integer> pondSizes = new ArrayList<>();
        int rows = land.length;
        int cols = land[0].length;

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (land[r][c] == 0) {
                    int size = computePondSize(land, r, c);
                    pondSizes.add(size);
                }
            }
        }

        return pondSizes;
    }

    private static int computePondSize(int[][] land, int r, int c) {
        if (r < 0 || r >= land.length || c < 0 || c >= land[0].length || land[r][c] != 0) {
            return 0;
        }

        land[r][c] = -1;
        int size = 1;

        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                if (dr == 0 && dc == 0) continue;
                size += computePondSize(land, r + dr, c + dc);
            }
        }

        return size;
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(R * C)` | Cada celda es evaluada un numero constante de veces. |
| Espacio Auxiliar | `O(R * C)` | Pila de recursion en caso de terreno completamente sumergido. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Teledetección y Radares SAR

1. **Imágenes Satelitales Sentinel-1:** Los algoritmos de etiquetado de componentes conexos identifican reservorios de agua y zonas inundadas sobre imagenes rasterizadas.
2. **Estructura Union-Find:** Alternativa escalable para procesamiento distribuido en clusters de computacion (Apache Spark).

## Casos Límite y Robustez en Producción

1. **Límites de Matriz:** Validacion estricta de bordes en cada llamada recursiva.
