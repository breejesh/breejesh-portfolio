---
title: "Buscaminas: Motor de Cuadrícula Orientado a Objetos y Relleno por Inundación (CTCI 7.10)"
description: "Disena e implementa el juego de Buscaminas con generacion aleatoria de bombas, conteo de minas adyacentes y recursion flood-fill en tiempo O(R * C)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-10-minesweeper.webp
previewImage: /assets/images/ctci-7-10-minesweeper.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena e implementa el juego del Buscaminas (Minesweeper). En una cuadricula de $N \times N$ con $B$ bombas, hacer clic en una bomba pierde la partida, y hacer clic en una celda vacia revela las bombas vecinas. Si ese numero es 0, las celdas circundantes se revelan recursivamente.
> * **La Solución Óptima:** Motor BFS / DFS de Flood-Fill: (1) Modelo `Cell` con estado de bomba, revelado y conteo de minas vecinas; (2) `Board` que distribuye $B$ bombas aleatoriamente y precalcula los valores contiguos; (3) `clickCell()` que ejecuta un flood-fill cuando la celda es `0`, revelando regiones conectadas en tiempo $O(R \times C)$ y espacio $O(R \times C)$.
> * **Realidad en Producción:** Algoritmos de bote de pintura en editores graficos (Photoshop) y analisis de cuencas hidrograficas en SIG.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 7.10), se nos plantea:

*"Disena e implementa un juego de Buscaminas en consola que gestione celdas vacias, conteo de bombas vecinas y expansion recursiva."*

## 2. Arquitectura de Clases

1. **`Cell`:** Encapsula coordenadas, si contiene una mina, si esta descubierta y numero de minas adyacentes.
2. **`Board`:** Gestiona la matriz $R \times C$, la colocacion aleatoria de bombas y la expansion BFS de celdas en blanco.
3. **`Game`:** Administra los estados de juego (`RUNNING`, `WON`, `LOST`).

## Implementación de Producción

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.Random;

public class MinesweeperGame {
    public enum GameState { RUNNING, WON, LOST }

    public static class Cell {
        private final int row;
        private final int col;
        private boolean isBomb = false;
        private boolean isExposed = false;
        private int adjacentMines = 0;

        public Cell(int r, int c) { this.row = r; this.col = c; }
        public boolean isBomb() { return isBomb; }
        public void setBomb(boolean bomb) { this.isBomb = bomb; }
        public boolean isExposed() { return isExposed; }
        public void expose() { this.isExposed = true; }
        public boolean isBlank() { return adjacentMines == 0; }
        public int getAdjacentMines() { return adjacentMines; }
        public void setAdjacentMines(int count) { this.adjacentMines = count; }
    }

    public static class Board {
        private final int rows;
        private final int cols;
        private final int totalBombs;
        private final Cell[][] cells;
        private int unexposedRemaining;

        public Board(int rows, int cols, int bombs) {
            this.rows = rows;
            this.cols = cols;
            this.totalBombs = bombs;
            this.unexposedRemaining = (rows * cols) - bombs;
            this.cells = new Cell[rows][cols];

            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    cells[r][c] = new Cell(r, c);
                }
            }
            placeBombs();
            calculateNeighborCounts();
        }

        private void placeBombs() {
            Random rand = new Random();
            int placed = 0;
            while (placed < totalBombs) {
                int r = rand.nextInt(rows);
                int c = rand.nextInt(cols);
                if (!cells[r][c].isBomb()) {
                    cells[r][c].setBomb(true);
                    placed++;
                }
            }
        }

        private void calculateNeighborCounts() {
            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    if (!cells[r][c].isBomb()) {
                        int count = 0;
                        for (int dr = -1; dr <= 1; dr++) {
                            for (int dc = -1; dc <= 1; dc++) {
                                int nr = r + dr, nc = c + dc;
                                if (inBounds(nr, nc) && cells[nr][nc].isBomb()) {
                                    count++;
                                }
                            }
                        }
                        cells[r][c].setAdjacentMines(count);
                    }
                }
            }
        }

        private boolean inBounds(int r, int c) {
            return r >= 0 && r < rows && c >= 0 && c < cols;
        }

        public GameState clickCell(int r, int c) {
            if (!inBounds(r, c) || cells[r][c].isExposed()) return GameState.RUNNING;

            Cell cell = cells[r][c];
            if (cell.isBomb()) {
                cell.expose();
                return GameState.LOST;
            }

            Queue<Cell> queue = new LinkedList<>();
            cell.expose();
            unexposedRemaining--;
            queue.add(cell);

            while (!queue.isEmpty()) {
                Cell curr = queue.poll();
                if (curr.isBlank()) {
                    for (int dr = -1; dr <= 1; dr++) {
                        for (int dc = -1; dc <= 1; dc++) {
                            int nr = curr.row + dr, nc = curr.col + dc;
                            if (inBounds(nr, nc) && !cells[nr][nc].isExposed() && !cells[nr][nc].isBomb()) {
                                cells[nr][nc].expose();
                                unexposedRemaining--;
                                queue.add(cells[nr][nc]);
                            }
                        }
                    }
                }
            }

            return unexposedRemaining == 0 ? GameState.WON : GameState.RUNNING;
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Clic en Celda | `O(R * C)` | En el peor caso el BFS expande toda la cuadrícula libre de minas. |
| Espacio Auxiliar | `O(R * C)` | Memoria para matriz de celdas y cola BFS. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Algoritmos Flood-Fill

1. **Herramienta Cubo de Pintura (Photoshop):** Algoritmo de inundacion para rellenar areas contiguas de pixeles de color uniforme.
2. **Sistemas de Informacion Geografica (SIG):** Modelado de drenaje y acumulacion de agua sobre modelos digitales de terreno.

## Casos Límite y Robustez en Producción

1. **Clic en Celda Revelada o Fuera de Rango:** Se descarta de forma segura sin excepciones.
