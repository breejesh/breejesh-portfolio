---
title: "Max Submatrix: Kadane's Algorithm Extended to 2D for Maximum Sum Rectangle (CTCI 17.24)"
description: "Find the submatrix with the maximum sum in an MxN integer matrix by collapsing rows into 1D prefix sums and applying Kadane's algorithm across all row-pair combinations in O(N^2 * M) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-24-max-submatrix.webp
previewImage: /assets/images/ctci-17-24-max-submatrix.webp
---

> **TL;DR**
> * **The Book Problem:** Given an $M \times N$ matrix of integers (possibly negative), find the submatrix with the largest possible sum.
> * **The Optimal Solution:** **2D Kadane's Algorithm via Row-Pair Prefix Sum Collapse**:
>   1. Fix a top row `r1` and a bottom row `r2`. For each column `c`, compute the collapsed 1D sum `colSum[c] = sum(matrix[r1..r2][c])`.
>   2. Apply **Kadane's 1D Maximum Subarray** to `colSum[]` to find the best left/right column boundaries for this row pair.
>   3. Iterate over all $O(M^2)$ row pairs, applying Kadane's $O(N)$ per pair.
>   4. Time: **$O(M^2 \cdot N)$**. Space: **$O(N)$** for the collapsed column sums.
> * **Production Reality:** Financial P&L heatmap maximum gain rectangle extraction, image segmentation maximum brightness region, and GPU threadblock profit-maximizing tile selection.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.24), we are asked:

*"Write an algorithm to find the submatrix with the largest possible sum."*

## 2. 2D Kadane Mechanics

```
Matrix:
  [  2  1 -3 -4  3 ]
  [ -3  4  1  2 -1 ]
  [  1  2 -3  2  3 ]
  [ -2  5 -5  3  1 ]

Row pair (r1=1, r2=3):
  colSum = [-3+1-2, 4+2+5, 1-3-5, 2+2+3, -1+3+1]
         = [-4, 11, -7, 7, 3]

Kadane on [-4, 11, -7, 7, 3]:
  maxSum = 14 (c=1 to c=3: 11-7+7+3=14)

Best rectangle: rows 1-3, cols 1-3, sum=14
```

## Production Java Implementation

```java
public class MaxSubmatrix {

    public static int[] maxSubmatrix(int[][] matrix) {
        int rows = matrix.length, cols = matrix[0].length;
        int[] best = {Integer.MIN_VALUE, 0, 0, 0, 0}; // {sum, r1, c1, r2, c2}

        for (int r1 = 0; r1 < rows; r1++) {
            int[] colSum = new int[cols];
            for (int r2 = r1; r2 < rows; r2++) {
                for (int c = 0; c < cols; c++) {
                    colSum[c] += matrix[r2][c];
                }
                int[] kadane = kadane(colSum, cols);
                // kadane = {maxSum, startCol, endCol}
                if (kadane[0] > best[0]) {
                    best = new int[]{kadane[0], r1, kadane[1], r2, kadane[2]};
                }
            }
        }
        return best;
    }

    private static int[] kadane(int[] arr, int n) {
        int maxSum = Integer.MIN_VALUE, current = 0;
        int start = 0, end = 0, tempStart = 0;
        for (int i = 0; i < n; i++) {
            current += arr[i];
            if (current > maxSum) {
                maxSum = current;
                start = tempStart;
                end = i;
            }
            if (current < 0) {
                current = 0;
                tempStart = i + 1;
            }
        }
        return new int[]{maxSum, start, end};
    }
}
```

## Complexity Analysis

| Phase | Time Complexity | Space |
|---|---|---|
| Row Pair Iteration | $O(M^2)$ | — |
| Column Sum Update + Kadane | $O(N)$ per pair | $O(N)$ |
| **Total** | **$O(M^2 \cdot N)$** | **$O(N)$** |

## Real-World Systems Engineering Discussion

1. **Financial P&L Heatmaps:** Portfolio risk systems find maximum-gain rectangular subwindows in 2D time-vs-asset return matrices for trade book analysis.
2. **Medical Imaging Brightness Regions:** Finding maximum-sum intensity tile in CT/PET scan slice arrays for automated lesion density scoring.

## Edge Cases & Production Hardening

1. **All Negative:** Returns the single least-negative cell (Kadane handles this).
2. **Single Row / Column:** Degenerates cleanly to 1D Kadane.
