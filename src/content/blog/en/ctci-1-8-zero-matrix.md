---
title: "Zero Matrix: Zeroing Rows and Columns with O(1) Space (CTCI 1.8)"
description: "Write an algorithm such that if an element in an M x N matrix is 0, its entire row and column are set to 0, using the first row and column as storage flags to achieve O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-8-zero-matrix.webp
previewImage: /assets/images/ctci-1-8-zero-matrix.webp
---

> **TL;DR**
> * **The Book Problem:** Write an algorithm such that if an element in an M x N matrix is 0, its entire row and column are set to 0.
> * **The Core Breakthrough:** Use the first row and first column of the matrix itself as flag arrays (`matrix[0][j] = 0` and `matrix[i][0] = 0`), eliminating external memory allocations to achieve $O(1)$ space and $O(M \times N)$ time.
> * **Production Reality:** Sparse matrix compression, graphical spreadsheet bulk operations, and relational tabular masking.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 1.8), we are asked:

*"Write an algorithm such that if an element in an M x N matrix is 0, its entire row and column are set to 0."*

## 2. The In-Place Storage Flag Algorithm

If we zero rows immediately upon finding a 0, we will zero out the whole matrix as subsequent searches find the newly created zeros.

*Optimal O(1) Space Strategy:*
1. Check if the first row and first column originally contain zeros (store in two booleans: `rowHasZero`, `colHasZero`).
2. Iterate through the rest of the matrix ($i=1..M-1, j=1..N-1$). If `matrix[i][j] == 0`, set `matrix[i][0] = 0` and `matrix[0][j] = 0`.
3. Use the marks in the first row and column to zero out inner cells.
4. Zero out the first row and first column if `rowHasZero` or `colHasZero` were true.

## Production Implementation

```java
public class ZeroMatrix {
    public static void setZeros(int[][] matrix) {
        boolean rowHasZero = false;
        boolean colHasZero = false;

        // Check if first column has a zero
        for (int i = 0; i < matrix.length; i++) {
            if (matrix[i][0] == 0) { colHasZero = true; break; }
        }

        // Check if first row has a zero
        for (int j = 0; j < matrix[0].length; j++) {
            if (matrix[0][j] == 0) { rowHasZero = true; break; }
        }

        // Use first row and column as flag storage
        for (int i = 1; i < matrix.length; i++) {
            for (int j = 1; j < matrix[0].length; j++) {
                if (matrix[i][j] == 0) {
                    matrix[i][0] = 0;
                    matrix[0][j] = 0;
                }
            }
        }

        // Nullify rows based on first column
        for (int i = 1; i < matrix.length; i++) {
            if (matrix[i][0] == 0) nullifyRow(matrix, i);
        }

        // Nullify columns based on first row
        for (int j = 1; j < matrix[0].length; j++) {
            if (matrix[0][j] == 0) nullifyColumn(matrix, j);
        }

        // Nullify first row and column if needed
        if (rowHasZero) nullifyRow(matrix, 0);
        if (colHasZero) nullifyColumn(matrix, 0);
    }

    private static void nullifyRow(int[][] matrix, int row) {
        for (int j = 0; j < matrix[0].length; j++) matrix[row][j] = 0;
    }

    private static void nullifyColumn(int[][] matrix, int col) {
        for (int i = 0; i < matrix.length; i++) matrix[i][col] = 0;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(M * N)` | Two full passes over M x N matrix. |
| Auxiliary Space | `O(1)` | Reuses first row/column cells as in-place storage flags. |

## Real-World Systems Engineering Discussion

Compressed Sparse Row (CSR) linear algebra libraries and spreadsheet tabular recalculation engines use in-place marker scanning to zero out inactive tensor dimensions.

## Edge Cases & Production Hardening

1. Matrix with all zeros: Zeroed cleanly.
2. Matrix with zero in (0,0): Handled by first row/col flags.
