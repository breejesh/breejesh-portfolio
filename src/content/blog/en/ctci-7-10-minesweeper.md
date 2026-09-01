---
title: "Minesweeper: Object-Oriented Grid Engine and Recursive Flood Fill (CTCI 7.10)"
description: "Design and implement a text-based Minesweeper game supporting random bomb placement, neighbor mine counting, and recursive blank-cell flood fill in O(R * C) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-7-10-minesweeper.webp
previewImage: /assets/images/ctci-7-10-minesweeper.webp
---

> **TL;DR**
> * **The Book Problem:** Design and implement a text-based Minesweeper game. An $N \times N$ grid has $B$ hidden bombs. Clicking a bomb loses the game. Clicking an empty cell reveals the adjacent bomb count. If that count is 0, surrounding cells are revealed recursively (flood fill). The player wins when all non-bomb cells are revealed.
> * **The Optimal Solution:** Recursive DFS / BFS Flood-Fill Grid Engine: (1) `Cell` model tracking `row`, `column`, `isBomb`, `isExposed`, `isFlagged`, and `adjacentMines`; (2) `Board` model maintaining an $R \times C$ matrix of cells, shuffling $B$ bomb locations, and precomputing adjacent bomb tallies; (3) `flipCell(row, col)` triggers recursive blank-cell flood fill across 8 neighbors when `adjacentMines == 0`; (4) `Game` coordinator managing `GameState` (`RUNNING`, `WON`, `LOST`) in $O(R \times C)$ worst-case flood fill time and $O(R \times C)$ space.
> * **Production Reality:** Flood-fill algorithms in paint raster editors (Photoshop magic wand), GIS watershed drainage basin modeling, and graph connected-component analysis.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.10), we are asked:

*"Design and implement a text-based Minesweeper game. Minesweeper is the classic single-player computer game where an NxN grid has B hidden bombs (or mines). If you click on a bomb, you lose. If you click on an empty cell, the number of exposed neighboring bombs is revealed. If that number is 0, the surrounding cells are revealed recursively. The player wins when all non-bomb cells are revealed."*

## 2. Object-Oriented Architecture

1. **`Cell`:** Encapsulates board position $(r, c)$, bomb state, exposed state, flagged state, and adjacent mine counter.
2. **`Board`:** $R \times C$ grid managing:
   * Random bomb placement.
   * Number precomputation for each cell.
   * `clickCell(int r, int c)` and recursive `expandBlank(Cell cell)` flood fill.
3. **`Game`:** Manages user input loop, win/loss evaluation, and text-based board rendering.

## Production Implementation

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
        private boolean isFlagged = false;
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

            // BFS Flood Fill on Blank Cells
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

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| clickCell() Time | `O(R * C)` | Worst-case BFS visits every connected non-bomb cell once. |
| Board Initialization | `O(R * C + B)` | Places bombs and precomputes neighbor counts across the matrix. |
| Auxiliary Space | `O(R * C)` | Memory for the grid cells and BFS queue. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Flood Fill Engines

1. **Raster Graphics Fill Bucket (Photoshop / GIMP):** Uses scanline flood fill to color contiguous pixel regions with identical color tolerance.
2. **GIS Flood Inundation Modeling:** Simulates digital elevation map water flow across connected terrain cells.

## Edge Cases & Production Hardening

1. **First-click bomb prevention:** Modern implementations defer bomb placement until after the user's first click to ensure the starting cell is always blank.
2. **Boundary safety:** `inBounds(r, c)` guards prevent matrix index exceptions.
