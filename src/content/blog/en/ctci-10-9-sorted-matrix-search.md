---
title: "Sorted Matrix Search: Saddleback Search on 2D Sorted Grids (CTCI 10.9)"
description: "Search for an element in an M x N matrix where every row and column is sorted in ascending order using Saddleback step-wise pruning in O(M + N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
previewImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
---

> **TL;DR**
> * **The Book Problem:** Given an $M \times N$ matrix in which each row and each column is sorted in ascending order, write a method to find an element.
> * **The Optimal Solution:** **Saddleback Step-Wise Pruning from Top-Right Corner**: (1) Start at coordinate `(row = 0, col = N - 1)` (top-right corner); (2) If `matrix[row][col] == target`, target found; (3) If `matrix[row][col] > target`, the entire current column has values larger than target, so decrement `col--`; (4) If `matrix[row][col] < target`, the entire current row has values smaller than target, so increment `row++`; (5) Runs in optimal **$O(M + N)$ time** and **$O(1)$ auxiliary space**, discarding an entire row or column at each step.
> * **Production Reality:** Spatial bounding box queries in GIS databases (PostGIS), 2D range filters in financial order books, and matrix image filters.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.9), we are asked:

*"Given an M x N matrix in which each row and each column is sorted in ascending order, write a method to find an element."*

**Example Matrix:**
```
 15  20  40  85
 20  35  80  95
 30  55  95 105
 40  80 100 120
```

## 2. Saddleback Pruning Derivation

Starting at $(0, 0)$ gives no decision boundary because moving right or down both increase the value.

By starting at the **top-right corner $(0, \text{cols} - 1)$** (or bottom-left):
* Moving **left** decreases the value.
* Moving **down** increases the value.

At every step, exactly one row or column is permanently eliminated from the search space:
$$\text{Max Steps} = M + N$$

## Production Implementation

```java
public class SortedMatrixSearch {
    public static class Coordinate {
        public int row;
        public int column;

        public Coordinate(int r, int c) {
            this.row = r;
            this.column = c;
        }
    }

    /**
     * Finds element in sorted 2D matrix using Saddleback search.
     * Time Complexity: O(M + N)
     * Space Complexity: O(1)
     */
    public static boolean findElement(int[][] matrix, int elem) {
        if (matrix == null || matrix.length == 0 || matrix[0].length == 0) {
            return false;
        }

        int row = 0;
        int col = matrix[0].length - 1;

        while (row < matrix.length && col >= 0) {
            if (matrix[row][col] == elem) {
                return true;
            } else if (matrix[row][col] > elem) {
                col--; // Eliminate entire column
            } else {
                row++; // Eliminate entire row
            }
        }
        return false;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(M + N)` | In each iteration, either `row` increments or `col` decrements ($M + N$ total steps). |
| Auxiliary Space | `O(1)` | Two primitive index pointers. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Spatial & Financial Indices

1. **Spatial R-Tree Bounding Box Intersection (PostGIS):** 2D monotonic grid boundaries filter out latitude/longitude coordinate rectangles without scanning interior cells.
2. **Limit Order Book Multi-Price Matching:** Financial matching engines query bid/ask price-time matrices to match trades with sub-microsecond latency.

## Edge Cases & Production Hardening

1. **Target Smaller than Minimum `matrix[0][0]`:** Step-wise search moves left until `col < 0` and terminates immediately.
2. **Target Larger than Maximum `matrix[M-1][N-1]`:** Moves down until `row >= M` and terminates immediately.
