---
title: "CTCI 1.8 Zero Matrix: Clear Rows and Columns in Place (Java)"
description: "If a cell is 0, set its whole row and column to 0. Brute force first, then O(1) extra space with first-row and first-column flags in Java."
date: "2025-10-06"
tags: [Algorithms]
coverImage: /assets/images/ctci-1-8-zero-matrix.webp
previewImage: /assets/images/ctci-1-8-zero-matrix.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** If a cell is 0, set its whole row and column to 0. Brute force first, then O(1) extra space with first-row and first-column flags in Java.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

Picture a seating chart for a theater. If one seat is broken, you close the whole row and the whole column so nobody sits in that cross. The chart is a matrix of integers. A zero means "broken." Your job is to apply every broken seat rule **in place**, without building a second full chart if you can avoid it.

This is **Cracking the Coding Interview** style problem **1.8 Zero Matrix**, from Chapter 1 (Arrays and Strings). Part of the [CTCI Java series](/blog/en/ctci-series-guide). Original explanation and code, not a book paste.

---

## The problem in plain words

**Input:** an `M x N` matrix of integers (usually `int[][]` in Java).

**Output:** modify the matrix so that if `matrix[i][j] == 0`, then every entry in row `i` and every entry in column `j` becomes `0`.

**Rules that matter:**

* Do it **in place** if asked (very common follow-up).
* Multiple zeros can share a row or column. Zeroing twice is fine; the result should look as if all rules fired.
* Zeros you write while zeroing must not create **new** "original zero" rules. That is the classic trap.

Example:

```
Before:                 After:
1  2  3  0              0  0  0  0
5  6  7  8       →      5  6  7  0
9  0 11 12              0  0  0  0
```

Row 0 has a zero at column 3. Row 2 has a zero at column 1. So rows 0 and 2 die, and columns 1 and 3 die.

---

## How to think before coding

### Brute force (and why it fails)

Scan for zeros, and when you find one, immediately set its row and column to zero.

**Bug:** you turn non-zeros into zeros mid-scan. Later you treat those new zeros as original zeros and wipe half the matrix by accident.

### Better: two passes with extra arrays

1. First pass: record which rows and which columns must be zeroed. Use `boolean[] zeroRow` of length `M` and `boolean[] zeroCol` of length `N`.
2. Second pass: for each cell `(r, c)`, if `zeroRow[r]` or `zeroCol[c]`, write `0`.

Time `O(MN)`. Extra space `O(M + N)`. This is the clean interview answer if they do not demand constant space.

### Preferred: O(1) extra space using the first row and first column

The matrix itself can store the flags.

* Use **row 0** as the column flags: if column `c` must be zeroed, set `matrix[0][c] = 0`.
* Use **column 0** as the row flags: if row `r` must be zeroed, set `matrix[r][0] = 0`.
* The cell `matrix[0][0]` sits in both. Keep two booleans, `firstRowHasZero` and `firstColHasZero`, for whether row 0 and column 0 themselves need zeroing.

Order matters:

1. Scan first row and first column only to set the two booleans.
2. Scan the rest of the matrix (`r >= 1`, `c >= 1`). On a zero, mark `matrix[r][0] = 0` and `matrix[0][c] = 0`.
3. Second pass over the interior: if `matrix[r][0] == 0` or `matrix[0][c] == 0`, set `matrix[r][c] = 0`.
4. **Last**, zero the first row if needed, then the first column if needed. Do those last so you do not erase the flags early.

That is the whole trick: store bookkeeping in the border, apply interior first, fix the border last.

---

## Java solution (O(1) extra space)

```java
public final class ZeroMatrix {

    private ZeroMatrix() {}

    /**
     * If any cell is 0, set its entire row and column to 0.
     * Mutates matrix in place. O(1) extra space via first row/col flags.
     */
    public static void setZeros(int[][] matrix) {
        if (matrix == null || matrix.length == 0 || matrix[0].length == 0) {
            return;
        }

        int rows = matrix.length;
        int cols = matrix[0].length;

        boolean firstRowHasZero = false;
        boolean firstColHasZero = false;

        // Does row 0 already contain a zero?
        for (int c = 0; c < cols; c++) {
            if (matrix[0][c] == 0) {
                firstRowHasZero = true;
                break;
            }
        }

        // Does column 0 already contain a zero?
        for (int r = 0; r < rows; r++) {
            if (matrix[r][0] == 0) {
                firstColHasZero = true;
                break;
            }
        }

        // Use first row / first col as flags for the rest of the matrix.
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (matrix[r][c] == 0) {
                    matrix[r][0] = 0;
                    matrix[0][c] = 0;
                }
            }
        }

        // Zero interior cells based on flags.
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (matrix[r][0] == 0 || matrix[0][c] == 0) {
                    matrix[r][c] = 0;
                }
            }
        }

        // Zero first row last (it held column flags).
        if (firstRowHasZero) {
            for (int c = 0; c < cols; c++) {
                matrix[0][c] = 0;
            }
        }

        // Zero first column last (it held row flags).
        if (firstColHasZero) {
            for (int r = 0; r < rows; r++) {
                matrix[r][0] = 0;
            }
        }
    }
}
```

Optional clearer variant with `O(M + N)` space (same idea, separate flag arrays):

```java
public static void setZerosWithFlagArrays(int[][] matrix) {
    if (matrix == null || matrix.length == 0 || matrix[0].length == 0) {
        return;
    }
    int rows = matrix.length;
    int cols = matrix[0].length;
    boolean[] zeroRow = new boolean[rows];
    boolean[] zeroCol = new boolean[cols];

    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (matrix[r][c] == 0) {
                zeroRow[r] = true;
                zeroCol[c] = true;
            }
        }
    }

    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (zeroRow[r] || zeroCol[c]) {
                matrix[r][c] = 0;
            }
        }
    }
}
```

In an interview, start with flag arrays so the idea is obvious, then compress flags into the first row and first column when they ask for constant space.

---

## Complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Immediate zero while scanning | `O(MN)` worst case, but wrong | `O(1)` |
| Flag arrays | `O(MN)` | `O(M + N)` |
| First row / first col flags | `O(MN)` | `O(1)` |

You must look at every cell at least once, so `O(MN)` time is expected. The fight is about space and about not poisoning the scan with zeros you just wrote.

---

## Edge cases interviewers poke

* **Null or empty matrix.** Return without crashing.
* **1 x 1.** `[0]` stays `[0]`. `[5]` stays `[5]`.
* **Single row or single column.** First-row / first-col flags still work; interior loops simply do nothing.
* **Zero only at `matrix[0][0]`.** Both `firstRowHasZero` and `firstColHasZero` become true. Entire first row and first column clear. Interior may stay if no other zeros.
* **Every cell already zero.** Result is all zeros. Fine.
* **No zeros.** Matrix unchanged. Scan still costs `O(MN)`.
* **Rectangular, not square.** Code uses `rows` and `cols` separately. Never assume `N == N`.
* **Negative numbers and positives.** Only `0` triggers. Do not treat "falsy" ideas from other languages.

---

## Common mistakes

1. **Zeroing during the discovery pass.** Creates fake original zeros.
2. **Clearing the first row or first column before using them as flags.** You lose the map.
3. **Forgetting the two booleans** and overloading `matrix[0][0]` for both "row 0 dies" and "col 0 dies" without care.
4. **Assuming a square matrix** and using one length for both dimensions.
5. **Returning a new matrix** when the prompt said in place (wastes space and can fail tests that check identity).

---

## Explain to a friend

You have a grid. Any zero means "kill this whole row and this whole column." If you kill while you still search, you invent new zeros and over-kill. So first **remember** which rows and columns must die. You can remember that in two boolean arrays, or you can scribble those reminders into the first row and first column of the grid itself, with two tiny booleans for the first row and first column. Then fill the middle from those reminders. Only at the end wipe the first row and first column if they were marked.

Time is proportional to the number of cells. Extra memory can be constant if you reuse the border of the matrix as your notebook.

---

## Series

* Series guide: [Cracking the Coding Interview in Java](/blog/en/ctci-series-guide)
* Previous: [1.7 Rotate Matrix](/blog/en/ctci-1-7-rotate-matrix)
* Next: [1.9 String Rotation](/blog/en/ctci-1-9-string-rotation)

Practice the flag-array version until you can code it cold, then practice the border-flag version once without looking. That second version is the one that shows you can manage state carefully under pressure.