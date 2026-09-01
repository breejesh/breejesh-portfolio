---
title: "Robot en una Cuadrícula: Búsqueda de Caminos en Laberintos con Memoización (CTCI 8.2)"
description: "Encuentra un camino para un robot que se desplaza hacia la derecha y hacia abajo en una cuadricula con obstaculos usando backtracking con memoizacion en O(R * C)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
previewImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
---

> **TL;DR**
> * **El Problema del Libro:** Imagina un robot en la esquina superior izquierda de una cuadricula de $r$ filas y $c$ columnas. El robot solo puede moverse a la derecha y hacia abajo, pero ciertas celdas son obstaculos prohibidos. Disena un algoritmo para encontrar un camino desde el inicio hasta la esquina inferior derecha.
> * **La Solución Óptima:** Backtracking Recursivo Inverso con Memoización: (1) Busca en reversa desde el destino $(r-1, c-1)$ hacia el origen $(0, 0)$; (2) Si existe un camino desde la celda superior o izquierda, agrega la posicion actual al camino; (3) Mantiene un `HashSet<Point> failedPoints` para descartar puntos sin salida, reduciendo la complejidad de $O(2^{R+C})$ a **$O(R \times C)$ en tiempo** y **$O(R + C)$ en espacio**.
> * **Realidad en Producción:** Planificacion de rutas de robots en almacenes automatizados (Amazon Kiva) y enrutamiento Manhattan en diseno de microchips (VLSI).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.2), se nos plantea:

*"Encuentra una ruta valida para un robot en una cuadricula de r filas y c columnas con celdas bloqueadas, moviendose solo hacia abajo y hacia la derecha."*

## 2. Poda de Estados con `failedPoints`

Sin memoizacion, los subproblemas repetidos provocan una explosion exponencial de llamadas ($O(2^{R+C})$).

Al registrar cada celda desde la cual no es posible alcanzar el origen en un conjunto `failedPoints`, cualquier visita futura a dicha celda se interrumpe de inmediato en tiempo $O(1)$.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Objects;

public class RobotInGrid {
    public static class Point {
        public final int row;
        public final int col;

        public Point(int r, int c) { this.row = r; this.col = c; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Point)) return false;
            Point p = (Point) o;
            return row == p.row && col == p.col;
        }

        @Override
        public int hashCode() { return Objects.hash(row, col); }
    }

    public static ArrayList<Point> getPath(boolean[][] maze) {
        if (maze == null || maze.length == 0) return null;
        ArrayList<Point> path = new ArrayList<>();
        HashSet<Point> failedPoints = new HashSet<>();

        if (getPathHelper(maze, maze.length - 1, maze[0].length - 1, path, failedPoints)) {
            return path;
        }
        return null;
    }

    private static boolean getPathHelper(boolean[][] maze, int row, int col,
                                         ArrayList<Point> path, HashSet<Point> failedPoints) {
        if (row < 0 || col < 0 || !maze[row][col]) return false;

        Point p = new Point(row, col);
        if (failedPoints.contains(p)) return false;

        boolean isAtOrigin = (row == 0) && (col == 0);

        if (isAtOrigin || getPathHelper(maze, row - 1, col, path, failedPoints)
                       || getPathHelper(maze, row, col - 1, path, failedPoints)) {
            path.add(p);
            return true;
        }

        failedPoints.add(p);
        return false;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(R * C)` | Cada celda de la matriz se procesa a lo sumo una vez. |
| Espacio Auxiliar | `O(R * C)` | Conjunto hash de puntos fallidos y pila de recursion $O(R + C)$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Enrutamiento en Grillas

1. **Robótica de Almacén (Amazon Kiva):** Planificadores de trayectoria que coordinan vehiculos autonomos sobre matrices de reserva espaciotemporal.
2. **Trazado de Pistas VLSI:** Algoritmos de expansion de ondas tipo Lee para conectar componentes de silicio evitando interferencias.

## Casos Límite y Robustez en Producción

1. **Origen o Destino Bloqueado:** Retorna `null` inmediatamente.
2. **Sin camino viable:** Recorre celdas accesibles y devuelve `null`.
