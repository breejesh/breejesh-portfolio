---
title: "Eight Queens: N-Queens Backtracking and Diagonal Collision Invariants (CTCI 8.12)"
description: "Place eight queens on an 8x8 chessboard such that none share a row, column, or diagonal using 1D column representation backtracking in O(8!) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-12-eight-queens.webp
previewImage: /assets/images/ctci-8-12-eight-queens.webp
---

> **TL;DR**
> * **The Book Problem:** Write an algorithm to print all ways of arranging eight queens on an $8 \times 8$ chess board so that none of them share the same row, column, or diagonal. In this case, "diagonal" means all diagonals, not just the two that bisect the board.
> * **The Optimal Solution:** 1D Column-Array Backtracking: (1) Since each row contains exactly one queen, represent board state using `Integer[] columns` of size 8, where `columns[row] = col`; (2) Iterate row by row $0 \dots 7$; (3) To place a queen at `(row, col)`, check conflict with previous rows $r < row$: column check `columns[r] == col` and diagonal slope check `Math.abs(columns[r] - col) == (row - r)`; (4) Backtrack if conflict occurs; finds all **92 distinct valid solutions** in $O(8!)$ time and $O(1)$ auxiliary space.
> * **Production Reality:** Constraint Satisfaction Problems (CSP) in SAT solvers, resource scheduling matrices, and optical interconnect crossbar routing.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.12), we are asked:

*"Write an algorithm to print all ways of arranging eight queens on an 8x8 chess board so that none of them share the same row, column, or diagonal."*

## 2. Diagonal Collision Invariant & 1D Array Optimization

### 1D Board Representation
Since no two queens can share the same row, row conflicts are eliminated by construction: row $r$ always holds queen $r$. We represent queen placements with a single 1D array:
$$\text{columns}[r] = c$$

### Collision Invariants for Candidate $(row_2, col_2)$ vs $(row_1, col_1)$:
1. **Same Column:** $col_1 == col_2$.
2. **Diagonal Conflict:** The slope between coordinates equals $\pm 1$:
   $$\frac{|row_2 - row_1|}{|col_2 - col_1|} = 1 \iff |col_2 - col_1| == |row_2 - row_1|$$

## Production Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class EightQueens {
    private static final int GRID_SIZE = 8;

    /**
     * Finds all 92 valid arrangements of 8 queens on an 8x8 board.
     * Time Complexity: O(GRID_SIZE!)
     * Space Complexity: O(GRID_SIZE)
     */
    public static List<Integer[]> placeQueens() {
        List<Integer[]> results = new ArrayList<>();
        Integer[] columns = new Integer[GRID_SIZE];
        placeQueensHelper(0, columns, results);
        return results;
    }

    private static void placeQueensHelper(int row, Integer[] columns, List<Integer[]> results) {
        if (row == GRID_SIZE) {
            results.add(columns.clone());
            return;
        }

        for (int col = 0; col < GRID_SIZE; col++) {
            if (checkValid(columns, row, col)) {
                columns[row] = col; // Place queen
                placeQueensHelper(row + 1, columns, results);
            }
        }
    }

    /**
     * Checks if (row1, col1) conflicts with any previously placed queen in rows 0..row1-1.
     */
    private static boolean checkValid(Integer[] columns, int row1, int col1) {
        for (int row2 = 0; row2 < row1; row2++) {
            int col2 = columns[row2];

            // Check if (row2, col2) shares the same column
            if (col1 == col2) {
                return false;
            }

            // Check diagonals: if distance between columns == distance between rows
            int columnDistance = Math.abs(col2 - col1);
            int rowDistance = row1 - row2; // row1 > row2 always
            if (columnDistance == rowDistance) {
                return false;
            }
        }
        return true;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N!)` | For $N = 8$, visits a fraction of the search tree thanks to immediate pruning, finding all 92 solutions. |
| Auxiliary Space | `O(N)` | 1D array of 8 integers and 8 levels of call stack depth. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Constraint Satisfaction Problems (CSP)

1. **Z3 Theorem Prover / SMT Solvers:** Industrial solvers reduce logic puzzles and hardware circuit equivalence checks to boolean satisfiability clauses with backtracking pruning.
2. **Kubernetes Pod Scheduling Matrix:** Multi-dimensional constraint solvers allocate microservice pods across nodes ensuring anti-affinity and resource non-interference.

## Edge Cases & Production Hardening

1. **Grid size generalization:** Supports arbitrary board size $N$ ($N$-Queens).
2. **Solution verification:** Exactly 92 unique valid configurations generated for $N = 8$.
