---
title: "Max Black Square: Precomputed DP Right and Down Counts for Largest All-Black Square (CTCI 17.23)"
description: "Find the largest square sub-matrix composed entirely of black pixels using O(N^2) precomputed right and down count arrays with O(N^3) worst-case scanning in O(1) per cell check."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-23-max-black-square.webp
previewImage: /assets/images/ctci-17-23-max-black-square.webp
---

> **TL;DR**
> * **The Book Problem:** Given an $N \times N$ matrix of black and white cells, find the largest square sub-matrix consisting entirely of black pixels.
> * **The Optimal Solution:** **Precomputed Right+Down DP with Decreasing Square Scan**:
>   1. **Precompute**: For each cell `(r, c)`, compute `right[r][c]` = consecutive black cells to the right, `down[r][c]` = consecutive black cells downward.
>   2. **Scan**: For each cell `(r, c)` starting from the largest possible square size down to 1, check if all four corners of a candidate square are valid using the precomputed arrays.
>   3. **Corner Checks**: Top-left `(r,c)` needs `right >= sz` and `down >= sz`. Top-right `(r, c+sz-1)` needs `down >= sz`. Bottom-left `(r+sz-1, c)` needs `right >= sz`.
>   4. Time: **$O(N^3)$** worst case. Space: **$O(N^2)$** for the DP tables.
> * **Production Reality:** Medical image ROI detection, satellite imagery dark-region extraction, and GPU kernel tile validation masks.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.23), we are asked:

*"Imagine you have a square matrix where each cell is filled with either black or white. Design an algorithm to find the maximum subsquare such that all four borders are filled with black pixels."*

## 2. DP Precomputation and Corner Validation

```
Matrix (B=black, W=white):
  B B B B
  B W B B
  B B B B
  B B B B

right[0][0]=4, down[0][0]=4
right[1][0]=1, down[1][0]=3 (hits W at col 1)
...

Largest all-black-border square of size 3:
  Top-left=(0,0): right[0][0]=4>=3, down[0][0]=4>=3
  Top-right=(0,2): down[0][2]=4>=3
  Bottom-left=(2,0): right[2][0]=4>=3
  => Valid! Size-3 square found.
```

## Production Java Implementation

```java
public class MaxBlackSquare {

    static final int BLACK = 1, WHITE = 0;

    public static int[] findSquare(int[][] matrix) {
        int n = matrix.length;
        int[][] right = new int[n][n];
        int[][] down  = new int[n][n];

        // Precompute right and down counts
        for (int r = n - 1; r >= 0; r--) {
            for (int c = n - 1; c >= 0; c--) {
                if (matrix[r][c] == BLACK) {
                    right[r][c] = (c + 1 < n) ? right[r][c + 1] + 1 : 1;
                    down[r][c]  = (r + 1 < n) ? down[r + 1][c]  + 1 : 1;
                }
            }
        }

        // Scan for largest valid square
        for (int sz = n; sz >= 1; sz--) {
            for (int r = 0; r <= n - sz; r++) {
                for (int c = 0; c <= n - sz; c++) {
                    if (right[r][c] >= sz && down[r][c] >= sz
                            && down[r][c + sz - 1] >= sz
                            && right[r + sz - 1][c] >= sz) {
                        return new int[]{r, c, sz};
                    }
                }
            }
        }
        return null;
    }
}
```

## Complexity Analysis

| Phase | Time Complexity | Space |
|---|---|---|
| DP Precompute (right + down) | $O(N^2)$ | $O(N^2)$ |
| Square Scan | $O(N^3)$ worst | $O(1)$ per check |
| **Total** | **$O(N^3)$** | **$O(N^2)$** |

## Real-World Systems Engineering Discussion

1. **Medical Imaging ROI Detection:** Finding maximally homogeneous dark-region tiles in MRI scans for automated lesion segmentation pipelines.
2. **GPU Kernel Tile Validation:** Verifying that compute tile boundaries fall entirely within valid buffer memory regions before dispatching CUDA/Metal compute grids.

## Edge Cases & Production Hardening

1. **All White:** Returns `null`.
2. **Single Black Cell:** Returns `{r, c, 1}`.
