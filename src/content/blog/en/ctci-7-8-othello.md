---
title: "Othello: Object-Oriented Game Architecture and Directional Flip Logic (CTCI 7.8)"
description: "Design the classes and game engine logic for Othello (Reversi) supporting 8-directional raycasting flips and turn-based scoring in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-7-8-othello.webp
previewImage: /assets/images/ctci-7-8-othello.webp
---

> **TL;DR**
> * **The Book Problem:** Othello is played as follows: Each piece is white on one side and black on the other. When a piece is surrounded by pieces of the opposite color in a horizontal, vertical, or diagonal line, it is flipped to the opposite color. The game ends when neither side can move. Design the game.
> * **The Optimal Solution:** Directional Raycasting Board Architecture: (1) `Color` enum (`Black`, `White`) with `getOpposite()`; (2) `Piece` model with `flip()`; (3) $8 \times 8$ grid in `Board` implementing `placeColor(row, col, color)` that projects ray vectors across all 8 directions $[(-1,-1) \dots (1,1)]$, validating flanking sequences and flipping captured opponent pieces; (4) `Game` singleton tracking black/white score accumulators and alternate player turns in $O(1)$ board operations.
> * **Production Reality:** Turn-based board game engines (Chess / Go / Reversi AI backends) and Minimax / Alpha-Beta pruning game-tree search evaluators.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.8), we are asked:

*"Othello is played as follows: Each Othello piece is white on one side and black on the other. When a piece is surrounded by pieces of the opposite color in a horizontal, vertical, or diagonal line, it is flipped to the opposite color. The game ends when neither side can move. The player with the most pieces wins. Design the game."*

## 2. Object-Oriented Architecture

1. **`Color` (Enum):** `White`, `Black`. Includes `getOpposite()`.
2. **`Direction` (Enum):** `UP`, `DOWN`, `LEFT`, `RIGHT`, `UP_LEFT`, `UP_RIGHT`, `DOWN_LEFT`, `DOWN_RIGHT` (with `dRow`, `dCol` deltas).
3. **`Piece`:** Encapsulates current `Color` and `flip()` method.
4. **`Board`:** $8 \times 8$ grid of `Piece` objects. Tracks score counters `blackCount` and `whiteCount`. Implements directional raycasting:
   * `flipSection(int row, int col, Color color, Direction d)`
5. **`Player`:** Manages player color and move inputs.
6. **`Game` (Singleton):** Manages turns, validates moves, and detects game-over states.

## Production Implementation

```java
public class OthelloGame {
    public enum Color {
        White, Black;
        public Color getOpposite() {
            return this == White ? Black : White;
        }
    }

    public enum Direction {
        UP(-1, 0), DOWN(1, 0), LEFT(0, -1), RIGHT(0, 1),
        UP_LEFT(-1, -1), UP_RIGHT(-1, 1), DOWN_LEFT(1, -1), DOWN_RIGHT(1, 1);

        public final int dRow;
        public final int dCol;
        Direction(int dr, int dc) { this.dRow = dr; this.dCol = dc; }
    }

    public static class Piece {
        private Color color;
        public Piece(Color c) { this.color = c; }
        public void flip() { color = color.getOpposite(); }
        public Color getColor() { return color; }
    }

    public static class Board {
        public static final int ROWS = 8;
        public static final int COLS = 8;
        private final Piece[][] board = new Piece[ROWS][COLS];
        private int blackCount = 0;
        private int whiteCount = 0;

        public Board() {
            // Initial 4 center pieces in Othello
            board[3][3] = new Piece(Color.White);
            board[3][4] = new Piece(Color.Black);
            board[4][3] = new Piece(Color.Black);
            board[4][4] = new Piece(Color.White);
            blackCount = 2;
            whiteCount = 2;
        }

        public boolean placeColor(int row, int col, Color color) {
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS || board[row][col] != null) {
                return false;
            }

            int flipped = 0;
            for (Direction dir : Direction.values()) {
                flipped += flipSection(row, col, color, dir);
            }

            if (flipped <= 0) return false;

            board[row][col] = new Piece(color);
            if (color == Color.Black) {
                blackCount += flipped + 1;
                whiteCount -= flipped;
            } else {
                whiteCount += flipped + 1;
                blackCount -= flipped;
            }
            return true;
        }

        private int flipSection(int row, int col, Color color, Direction dir) {
            int r = row + dir.dRow;
            int c = col + dir.dCol;
            int count = 0;

            // March until empty or matching color
            while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] != null) {
                if (board[r][c].getColor() == color) {
                    if (count == 0) return 0;
                    // Flip bounded opponent pieces
                    int currR = row + dir.dRow;
                    int currC = col + dir.dCol;
                    while (currR != r || currC != c) {
                        board[currR][currC].flip();
                        currR += dir.dRow;
                        currC += dir.dCol;
                    }
                    return count;
                }
                count++;
                r += dir.dRow;
                c += dir.dCol;
            }
            return 0;
        }

        public int getBlackCount() { return blackCount; }
        public int getWhiteCount() { return whiteCount; }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| placeColor() Time | `O(1)` | Inspects at most $8 \times 8 = 64$ fixed grid cells across 8 directions. |
| Auxiliary Space | `O(1)` | Fixed $8 \times 8$ board allocation. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Minimax Game-Tree Search

1. **Board Evaluation Heuristics:** Othello AI bots (Logistello) project raycasting flips to evaluate frontier disc mobility and stable corner ownership.
2. **Bitboard Representations:** Production game engines represent the $8 \times 8$ board as two 64-bit integers (`long blackDiscs`, `long whiteDiscs`), computing directional flips in parallel using SIMD bit shifts.

## Edge Cases & Production Hardening

1. **No valid flips:** Move is rejected without altering board state.
2. **Out of bounds moves:** Guarded by boundary checks.
