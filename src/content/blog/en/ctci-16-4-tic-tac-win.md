---
title: "Tic Tac Win: Board State Precomputation & Incremental Move Validation (CTCI 16.4)"
description: "Design robust algorithms to detect winning Tic-Tac-Toe states for 3x3 boards, base-3 precomputed lookups, and O(1) incremental N-by-N validation."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-4-tic-tac-win.webp
previewImage: /assets/images/ctci-16-4-tic-tac-win.webp
---

> **TL;DR**
> * **The Book Problem:** Design an algorithm to figure out if someone has won a game of tic-tac-toe.
> * **The Optimal Solutions:**
>   1. **Repeated Queries ($3 \times 3$)**: Precompute all $3^9 = 19,683$ possible board configurations into an in-memory winner lookup array indexed by a base-3 hash: `ID = sum(cell[i] * 3^i)`. Resolves in **$O(1)$ instant memory lookup**.
>   2. **Arbitrary $N \times N$ Board**: Scan $N$ rows, $N$ columns, and 2 diagonals in **$O(N)$ time** and **$O(1)$ space**.
>   3. **Incremental Move-by-Move Tracking ($N \times N$)**: Maintain running row/column/diagonal sum arrays. Each move updates counters in **$O(1)$ time** and checks if any sum reaches $\pm N$.
> * **Production Reality:** Turn-based board game servers and Alpha-Beta minimax game tree evaluators.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.4), we are asked:

*"Design an algorithm to determine if a player has won a game of Tic-Tac-Toe, exploring fixed 3x3 boards, precomputed lookups, and generic NxN boards."*

## 2. Solution Taxonomy: From $3 \times 3$ to $N \times N$

```
[Approach 1: Base-3 Hash Precomputation (3x3)]
Board Matrix ──> Convert to Base-3 Integer (0..19682) ──> O(1) Array Lookup

[Approach 2: Incremental Move Counters (NxN)]
Move(r, c, Player=X) ──> row[r]++, col[c]++, diag++, antiDiag++ ──> O(1) Check == N
```

## Production Java Implementations

```java
public class TicTacToe {
    public enum Piece { Empty, X, O }

    /**
     * Approach 1: Incremental O(1) Move Tracker for N x N Board
     */
    public static class TicTacToeGame {
        private final int n;
        private final int[] rows;
        private final int[] cols;
        private int diagonal = 0;
        private int antiDiagonal = 0;

        public TicTacToeGame(int n) {
            this.n = n;
            this.rows = new int[n];
            this.cols = new int[n];
        }

        /**
         * Records a move and returns winning player if this move causes a win.
         * Time Complexity: O(1)
         */
        public Piece move(int r, int c, Piece player) {
            if (player == Piece.Empty) return Piece.Empty;
            int val = (player == Piece.X) ? 1 : -1;

            rows[r] += val;
            cols[c] += val;
            if (r == c) diagonal += val;
            if (r + c == n - 1) antiDiagonal += val;

            int target = (player == Piece.X) ? n : -n;
            if (rows[r] == target || cols[c] == target || diagonal == target || antiDiagonal == target) {
                return player;
            }
            return Piece.Empty;
        }
    }

    /**
     * Approach 2: Full N x N Board Scan in O(N) Time
     */
    public static Piece hasWon(Piece[][] board) {
        if (board == null || board.length == 0 || board.length != board[0].length) {
            return Piece.Empty;
        }
        int n = board.length;

        // Check Rows and Columns
        for (int i = 0; i < n; i++) {
            if (hasLine(board, i, 0, 0, 1)) return board[i][0];
            if (hasLine(board, 0, i, 1, 0)) return board[0][i];
        }

        // Check Diagonals
        if (hasLine(board, 0, 0, 1, 1)) return board[0][0];
        if (hasLine(board, 0, n - 1, 1, -1)) return board[0][n - 1];

        return Piece.Empty;
    }

    private static boolean hasLine(Piece[][] board, int r, int c, int dr, int dc) {
        Piece first = board[r][c];
        if (first == Piece.Empty) return false;

        int n = board.length;
        for (int step = 1; step < n; step++) {
            r += dr;
            c += dc;
            if (board[r][c] != first) return false;
        }
        return true;
    }
}
```

## Complexity Analysis

| Approach | Preprocessing Time | Query / Move Time | Auxiliary Space | Best Used For |
|---|---|---|---|---|
| **Incremental Counters** | $O(N)$ initialization | **$O(1)$ per move** | $O(N)$ counters | Active live gameplay on $N \times N$ board |
| **Full Board Scan** | $0$ (None) | $O(N)$ time | $O(1)$ space | Standalone validation of arbitrary board |
| **Base-3 Precomputation** | $O(3^9 \cdot 1) \approx 20\text{k}$ ops | **$O(1)$ lookup** | $19.7\text{ KB}$ array | Repeated evaluations on static $3 \times 3$ board |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Minimax Alpha-Beta Pruning

1. **Transposition Tables & Zobrist Hashing:** In chess and Gomoku engines, board states are mapped to 64-bit integers using XOR Zobrist hashing to cache win-loss evaluations and avoid re-evaluating identical search tree nodes.
2. **Bitboard Representations:** In $8 \times 8$ or $3 \times 3$ games, board configurations are stored inside 64-bit integers (`long`), resolving line checks via bitwise shift masks in a single CPU cycle.

## Edge Cases & Production Hardening

1. **Board Full (Draw):** If `hasWon()` returns `Piece.Empty` and all cells are non-empty, the game is declared a draw.
2. **Invalid Double-Win Boards:** Precomputation lookups can flag invalid states where both X and O simultaneously satisfy winning lines.
