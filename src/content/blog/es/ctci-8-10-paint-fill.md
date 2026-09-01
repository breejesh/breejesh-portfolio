---
title: "Relleno de Pintura: Algoritmo Flood Fill en Matriz 2D de Pantalla (CTCI 8.10)"
description: "Implementa la herramienta de bote de pintura / flood fill en una matriz de colores mediante recursion DFS en tiempo O(R * C) y espacio O(R * C)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-10-paint-fill.webp
previewImage: /assets/images/ctci-8-10-paint-fill.webp
---

> **TL;DR**
> * **El Problema del Libro:** Implementa la funcion de relleno de pintura (paint fill) comun en programas de edicion. Dada una pantalla 2D de colores, un punto $(r, c)$ y un nuevo color `ncolor`, rellena el area contigua del color original.
> * **La Solución Óptima:** Flood Fill Recursivo (DFS): (1) Guarda el color original $O = screen[r][c]$; (2) Si $O == ncolor$, termina de inmediato para evitar ciclos infinitos; (3) Asigna $screen[r][c] = ncolor$; (4) Se expande recursivamente a los 4 vecinos cardinales (arriba, abajo, izquierda, derecha) en **tiempo $O(R \times C)$** y espacio $O(R \times C)$.
> * **Realidad en Producción:** Bote de pintura en Photoshop y etiquetado de componentes conectados en OpenCV.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.10), se nos plantea:

*"Implementa la herramienta de relleno de pintura que expande un nuevo color en un area contigua de color uniforme en una pantalla 2D."*

## 2. Algoritmo de Flood Fill Recursivo

1. **Condición de Parada:** Si el color de origen ya es igual al nuevo color, abortar de inmediato.
2. **Validación de Límites:** Si $(r, c)$ esta fuera de la pantalla, retornar.
3. **Pintado y Recursión:** Modificar el pixel y llamar recursivamente a los 4 vecinos ortogonales.

## Implementación de Producción

```java
public class PaintFill {
    public enum Color { Black, White, Red, Yellow, Blue, Green }

    /**
     * Rellena la region contigua de color uniforme.
     * Complejidad Temporal: O(R * C)
     * Complejidad Espacial: O(R * C)
     */
    public static boolean paintFill(Color[][] screen, int r, int c, Color ncolor) {
        if (screen == null || r < 0 || r >= screen.length || c < 0 || c >= screen[0].length) {
            return false;
        }
        if (screen[r][c] == ncolor) {
            return false;
        }
        return paintFillHelper(screen, r, c, screen[r][c], ncolor);
    }

    private static boolean paintFillHelper(Color[][] screen, int r, int c,
                                          Color ocolor, Color ncolor) {
        if (r < 0 || r >= screen.length || c < 0 || c >= screen[0].length) {
            return false;
        }

        if (screen[r][c] == ocolor) {
            screen[r][c] = ncolor;
            paintFillHelper(screen, r - 1, c, ocolor, ncolor);
            paintFillHelper(screen, r + 1, c, ocolor, ncolor);
            paintFillHelper(screen, r, c - 1, ocolor, ncolor);
            paintFillHelper(screen, r, c + 1, ocolor, ncolor);
        }

        return true;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(R * C)` | Cada celda conectada se visita y modifica exactamente una vez. |
| Espacio Auxiliar | `O(R * C)` | Profundidad de la pila de recursion en el peor caso. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Scanline Flood Fill

1. **Relleno por Líneas de Escaneo (Scanline en Photoshop):** En lugar de evaluar pixel por pixel, los motores de dibujo rellenan tramos horizontales enteros para reducir la profundidad de la pila de $O(R \times C)$ a $O(R)$.
2. **Visión Artificial (OpenCV):** Segmentacion de imagenes binarias mediante grafos de componentes conexos.

## Casos Límite y Robustez en Producción

1. **Color Objetivo Idéntico al Original:** La comprobacion inicial previene bucles infinitos.
2. **Coordenada fuera de límites:** Manejo seguro sin excepciones de matriz.
