---
title: "La Hormiga de Langton: Autómatas Celulares en Planos Infinitos (CTCI 16.22)"
description: "Simula el automata celular de la hormiga de Langton en una cuadricula infinita mediante conjuntos hash de coordenadas y cajas delimitadoras en O(K)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-22-langtons-ant.webp
previewImage: /assets/images/ctci-16-22-langtons-ant.webp
---

> **TL;DR**
> * **El Problema del Libro:** Una hormiga se encuentra en una cuadricula infinita de celdas blancas. En cada paso:
>   * En celda blanca: cambia el color a negro, gira $90^\circ$ a la derecha y avanza una unidad.
>   * En celda negra: cambia el color a blanco, gira $90^\circ$ a la izquierda y avanza una unidad.
>   * Simula los primeros $K$ movimientos e imprime la cuadricula delimitada resultante.
> * **La Solución Óptima:** **HashSet de Coordenadas Dispersas y Caja Delimitadora Dinámica**:
>   1. **Plano Infinito**: En lugar de un array fijo, almacenar unicamente las celdas negras activas en un `HashSet<Position>`.
>   2. **Caja Delimitadora**: Rastrear `minRow`, `maxRow`, `minCol` y `maxCol` para renderizar el rectangulo minimo.
>   3. **Transiciones**: Alternar estados en tiempo constante $O(1)$.
>   4. Se ejecuta en **tiempo $O(K)$** y **espacio $O(K)$**.
> * **Realidad en Producción:** Hashing espacial en motores de fisica y teoria del caos emergente.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.22), se nos plantea:

*"Simula la trayectoria de la hormiga de Langton en una superficie infinita durante K pasos y representa el tablero final."*

## 2. Dinámica del Autómata Celular

Tras una fase inicial caotica, el automata entra espontaneamente en un patron ciclico de 104 pasos ("autopista").

## Implementación de Producción

```java
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class LangtonsAnt {

    public enum Orientation {
        RIGHT(0, 1), DOWN(1, 0), LEFT(0, -1), UP(-1, 0);

        public final int dRow, dCol;
        Orientation(int dRow, int dCol) {
            this.dRow = dRow; this.dCol = dCol;
        }

        public Orientation turnRight() { return values()[(ordinal() + 1) % 4]; }
        public Orientation turnLeft() { return values()[(ordinal() + 3) % 4]; }
    }

    public static class Position {
        public final int row, col;
        public Position(int row, int col) {
            this.row = row; this.col = col;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Position)) return false;
            Position pos = (Position) o;
            return row == pos.row && col == pos.col;
        }

        @Override
        public int hashCode() {
            return Objects.hash(row, col);
        }
    }

    public static class AntSimulation {
        private int row = 0, col = 0;
        private Orientation orientation = Orientation.RIGHT;
        private final Set<Position> blackCells = new HashSet<>();
        private int minRow = 0, maxRow = 0, minCol = 0, maxCol = 0;

        public void step() {
            Position currentPos = new Position(row, col);
            if (blackCells.contains(currentPos)) {
                blackCells.remove(currentPos);
                orientation = orientation.turnLeft();
            } else {
                blackCells.add(currentPos);
                orientation = orientation.turnRight();
            }

            row += orientation.dRow;
            col += orientation.dCol;

            minRow = Math.min(minRow, row);
            maxRow = Math.max(maxRow, row);
            minCol = Math.min(minCol, col);
            maxCol = Math.max(maxCol, col);
        }

        public void simulate(int k) {
            for (int i = 0; i < k; i++) step();
        }

        public String printBoard() {
            StringBuilder sb = new StringBuilder();
            for (int r = minRow; r <= maxRow; r++) {
                for (int c = minCol; c <= maxCol; c++) {
                    if (r == row && c == col) {
                        sb.append(orientation.name().charAt(0));
                    } else if (blackCells.contains(new Position(r, c))) {
                        sb.append('X');
                    } else {
                        sb.append('_');
                    }
                }
                sb.append('\n');
            }
            return sb.toString();
        }
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(K)` | $K$ pasos con operaciones hash amortizadas $O(1)$. |
| Espacio Auxiliar | `O(K)` | Maximo $K$ coordenadas activas en el conjunto hash. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Hashing Espacial

1. **Motores de Videojuegos:** Box2D y Havok utilizan tablas hash de coordenadas para rastrear colisiones en mundos abiertos infinitos sin matrices gigantescas.

## Casos Límite y Robustez en Producción

1. **Coordenadas Negativas:** Soportadas sin restricciones por la clase inmutable `Position`.
