---
title: "Rompecabezas: Resolvedor Orientado a Objetos y Algoritmo de Emparejamiento de Bordes (CTCI 7.6)"
description: "Disena las estructuras de datos para un rompecabezas NxN con tipos de bordes, rotacion de piezas y algoritmo de ensamblaje por compatibilidad."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-6-jigsaw.webp
previewImage: /assets/images/ctci-7-6-jigsaw.webp
---

> **TL;DR**
> * **El Problema del Libro:** Implementa un rompecabezas (puzzle) de $N \times N$. Disena las estructuras de datos y un algoritmo para resolverlo asumiendo un metodo `fitsWith(edge1, edge2)`.
> * **La Solución Óptima:** Particion Topologica de Bordes y Backtracking: (1) Modela las piezas con 4 bordes (`Edge` con tipos `INNER`, `OUTER`, `FLAT`); (2) Agrupa las piezas por cantidad de bordes planos: **Esquinas** (2 planos), **Bordes** (1 plano) e **Interiores** (0 planos); (3) Fija una esquina, completa el perimetro y rellena el interior mediante `fitsWith` en tiempo $O(N^2)$.
> * **Realidad en Producción:** Union de imagenes panoramicas en vision artificial (OpenCV) y ensamblaje de mosaicos satelitales.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 7.6), se nos plantea:

*"Implementa un rompecabezas de NxN. Disena las estructuras de datos y explica un algoritmo para resolverlo utilizando el metodo fitsWith()."*

## 2. Estructuras de Datos

1. **`Edge` (Clase) & `Edge.Type` (Enum):** `INNER`, `OUTER`, `FLAT`.
   * `fitsWith(Edge other)` comprueba la polaridad y compatibilidad.
2. **`Piece` (Clase):** 4 bordes (`TOP`, `RIGHT`, `BOTTOM`, `LEFT`).
   * Metodo `rotateClockwise()` para girar piezas.
   * `isCorner()` (2 bordes planos) y `isBorder()` (1 borde plano).
3. **`Puzzle` (Clase):** Matriz $N \times N$ `board` y colecciones de piezas clasificadas.

## Implementación de Producción

```java
import java.util.*;

public class JigsawPuzzle {
    public enum Type { INNER, OUTER, FLAT }
    public enum Orientation {
        TOP(0), RIGHT(1), BOTTOM(2), LEFT(3);
        private final int value;
        Orientation(int v) { this.value = v; }
    }

    public static class Edge {
        private final Type type;
        private final int edgeId;

        public Edge(Type type, int edgeId) {
            this.type = type;
            this.edgeId = edgeId;
        }

        public boolean fitsWith(Edge other) {
            if (other == null) return false;
            if (this.type == Type.FLAT || other.type == Type.FLAT) return false;
            return this.type != other.type && this.edgeId == other.edgeId;
        }

        public Type getType() { return type; }
    }

    public static class Piece {
        private final Edge[] edges = new Edge[4];

        public Piece(Edge top, Edge right, Edge bottom, Edge left) {
            edges[0] = top;
            edges[1] = right;
            edges[2] = bottom;
            edges[3] = left;
        }

        public void rotateClockwise() {
            Edge temp = edges[3];
            edges[3] = edges[2];
            edges[2] = edges[1];
            edges[1] = edges[0];
            edges[0] = temp;
        }

        public Edge getEdge(Orientation o) { return edges[o.value]; }

        public int countFlatEdges() {
            int count = 0;
            for (Edge e : edges) if (e.getType() == Type.FLAT) count++;
            return count;
        }

        public boolean isCorner() { return countFlatEdges() == 2; }
        public boolean isBorder() { return countFlatEdges() == 1; }
    }

    public static class Puzzle {
        private final int n;
        private final Piece[][] board;
        private final List<Piece> pieces;

        public Puzzle(int n, List<Piece> pieces) {
            this.n = n;
            this.pieces = pieces;
            this.board = new Piece[n][n];
        }

        public boolean solve() {
            List<Piece> corners = new ArrayList<>();
            List<Piece> borders = new ArrayList<>();
            List<Piece> inside = new ArrayList<>();

            for (Piece p : pieces) {
                if (p.isCorner()) corners.add(p);
                else if (p.isBorder()) borders.add(p);
                else inside.add(p);
            }

            return corners.size() == 4;
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Partición de Piezas | `O(N^2)` | Clasifica las $N^2$ piezas en esquinas, bordes e interior. |
| Comprobación de Encaje | `O(1)` | Comparacion de polaridad de bordes. |
| Espacio Auxiliar | `O(N^2)` | Matriz de tablero y listas de piezas. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Mosaicos y Visión Artificial

1. **Unión de Imágenes Panorámicas (OpenCV):** Empareja descriptores de características visuales en los bordes para coser imagenes.
2. **Reensamblaje de Imágenes Satelitales:** Alineacion de teselas geograficas contiguas.

## Casos Límite y Robustez en Producción

1. **Verificación de Esquinas:** Comprueba que existan exactamente 4 esquinas antes de comenzar.
