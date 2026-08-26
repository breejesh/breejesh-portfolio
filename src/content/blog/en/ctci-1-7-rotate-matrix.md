---
title: "CTCI 1.7 Rotate Matrix: Turn an NxN Grid 90 Degrees In Place (Java)"
description: "Rotate an NxN matrix 90 degrees clockwise without a second matrix. Layer-by-layer 4-way swap in Java, with text diagrams and edge cases for interviews."
date: "2025-11-12"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-7-rotate-matrix.webp
previewImage: /assets/images/ctci-1-7-rotate-matrix.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** Rotate an NxN matrix 90 degrees clockwise without a second matrix. Layer-by-layer 4-way swap in Java, with text diagrams and edge cases for interviews.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

Imagine a square photo on a table. You want it turned to horizontal orientation, so you spin the whole print **90 degrees clockwise**. Every corner moves to a new corner. The center stays the center. You do not buy a second photo and copy pixels onto it. You flip the same sheet.

That is this problem: rotate an **N by N** matrix by 90 degrees **in place**. No second full matrix.

This is Chapter 1, Problem 1.7 in the CTCI-style series. Read the series map in [Cracking the Coding Interview in Java](/blog/en/ctci-series-guide). Tag: **Algorithms**.

---

## The problem in plain words

**Input:** a square matrix `matrix` of size `N x N`. Each cell holds some value (think of each cell as one pixel).

**Output:** the same matrix object, values rearranged so the image is rotated **90 degrees clockwise**.

**Constraint that matters:** do it **in place**. Extra O(1) memory is the goal (a few temps), not an N x N copy.

Clockwise means:

- The top row becomes the right column.
- The right column becomes the bottom row (reversed in reading order of the old top).
- And so on around the square.

Counterclockwise is the same idea with the cycle reversed. Interviews almost always mean clockwise unless they say otherwise. Ask once if unsure.

---

## Tiny example you can draw by hand

Start with N = 4. Letters make the move easy to see:

```
Before:                 After 90 deg clockwise:
A  B  C  D              M  I  E  A
E  F  G  H              N  J  F  B
I  J  K  L              O  K  G  C
M  N  O  P              P  L  H  D
```

Check one corner: `A` was at top-left. After rotate, `A` is at top-right. `D` went to bottom-right. `P` went to bottom-left. `M` went to top-left.

Check one inner cell: `F` was at (1,1). After rotate it sits at (1,2) where `G` used to be. The 2x2 center also turns as its own square.

---

## How to think before coding

### Brute force (easy, but not in place)

Create a new matrix `out` of size N x N.

For every cell `(r, c)`:

```
out[c][N - 1 - r] = matrix[r][c]
```

Why? Row becomes column. The old row index decides how far from the **right** edge you land.

```
(r, c)  -->  (c, N - 1 - r)
```

Examples on the 4x4 above:

| From | To | Letter |
| --- | --- | --- |
| (0,0) | (0,3) | A |
| (0,3) | (3,3) | D |
| (3,0) | (0,0) | M |
| (1,2) | (2,2) | G |

This is correct and O(N²) time. Space is O(N²). Interviews will ask: can you avoid the second matrix?

### Better idea: rotate four cells at a time

You cannot move one cell into its new home without overwriting someone. So save one cell in a temp, then walk a **cycle of four**:

```
top  -->  right  -->  bottom  -->  left  -->  top
```

Do that for every position on the edge of a layer, then move inward.

### Layers (onion rings)

An N x N matrix is nested rings:

```
Layer 0: outer ring (rows/cols 0 and N-1)
Layer 1: next ring in (rows/cols 1 and N-2)
...
```

How many layers? `N / 2` (integer divide). For N = 4 you get 2 layers. For N = 5 you get 2 full rings and one center cell that never moves.

```
N = 5, layers = 2

* * * * *     outer layer
* + + + *     inner layer
* + o + *     o is center, stays
* + + + *
* * * * *
```

---

## One layer, step by step

Focus on layer `layer` of an N x N matrix.

```
first = layer
last  = N - 1 - layer
```

On that ring you walk offsets `i` from `0` to `last - first - 1` (you stop before the corner that the next offset already covers; each 4-cycle handles one "slot" on the side).

For each offset `i`:

```
// positions in the cycle (clockwise destination map)
top    = matrix[first][first + i]
right  = matrix[first + i][last]
bottom = matrix[last][last - i]
left   = matrix[last - i][first]
```

Clockwise rotation means each value moves to where the **previous** side's value used to go:

```
temp   = top
top    <- left      // left side moves up to top
left   <- bottom    // bottom moves to left
bottom <- right     // right moves to bottom
right  <- temp      // old top moves to right
```

In index form (write this on the board):

```
temp = matrix[first][first + i]

matrix[first][first + i]       = matrix[last - i][first]       // top    <- left
matrix[last - i][first]        = matrix[last][last - i]        // left   <- bottom
matrix[last][last - i]         = matrix[first + i][last]       // bottom <- right
matrix[first + i][last]        = temp                          // right  <- old top
```

### Walk one offset on the outer ring (N = 4, layer 0, i = 0)

```
Before (outer corners only called out):

A  B  C  D
E  .  .  H
I  .  .  L
M  N  O  P

Cycle: A (top) , D (right) , P (bottom) , M (left)

After this one cycle:

M  B  C  A
E  .  .  H
I  .  .  L
P  N  O  D
```

Then `i = 1` rotates the next four on the sides (`B`, `H`, `O`, `I`), and so on until the outer ring is done. Then `layer = 1` spins the inner 2x2.

### Optional second mental model: transpose then reverse rows

Another correct approach:

1. **Transpose:** swap `matrix[r][c]` with `matrix[c][r]` for `c > r`.
2. **Reverse each row.**

```
A B C D     transpose      A E I M     reverse rows      M I E A
E F G H     -------->      B F J N     ------------>     N J F B
I J K L                    C G K O                       O K G C
M N O P                    D H L P                       P L H D
```

Same result. Layer-by-layer is the classic "in place ring" story; transpose + reverse is often easier to type under stress. Know both. Code one cleanly.

---

## Java solution (layer by layer)

```java
/**
 * Rotates an N x N matrix 90 degrees clockwise in place.
 * Returns false if the matrix is null or not square; true on success.
 */
public final class RotateMatrix {

    private RotateMatrix() {}

    public static boolean rotate(int[][] matrix) {
        if (matrix == null || matrix.length == 0) {
            return false;
        }
        int n = matrix.length;
        for (int[] row : matrix) {
            if (row == null || row.length != n) {
                return false; // not square
            }
        }

        // Process each layer from outside in
        for (int layer = 0; layer < n / 2; layer++) {
            int first = layer;
            int last = n - 1 - layer;

            for (int i = first; i < last; i++) {
                int offset = i - first;

                // save top
                int top = matrix[first][first + offset];

                // left -> top
                matrix[first][first + offset] = matrix[last - offset][first];

                // bottom -> left
                matrix[last - offset][first] = matrix[last][last - offset];

                // right -> bottom
                matrix[last][last - offset] = matrix[first + offset][last];

                // top -> right
                matrix[first + offset][last] = top;
            }
        }
        return true;
    }
}
```

### Same logic with the transpose + reverse style

```java
public static void rotateViaTranspose(int[][] matrix) {
    int n = matrix.length;

    // Transpose
    for (int r = 0; r < n; r++) {
        for (int c = r + 1; c < n; c++) {
            int tmp = matrix[r][c];
            matrix[r][c] = matrix[c][r];
            matrix[c][r] = tmp;
        }
    }

    // Reverse each row
    for (int r = 0; r < n; r++) {
        for (int c = 0; c < n / 2; c++) {
            int tmp = matrix[r][c];
            matrix[r][c] = matrix[r][n - 1 - c];
            matrix[r][n - 1 - c] = tmp;
        }
    }
}
```

Both are in place. Pick one and be ready to explain the other in one sentence.

---

## Complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Copy to new matrix | O(N²) | O(N²) |
| Layer-by-layer 4-cycles | O(N²) | O(1) |
| Transpose + reverse rows | O(N²) | O(1) |

You must touch every cell once (or a constant number of times), so O(N²) time is optimal for dense matrices.

---

## Edge cases interviewers poke

| Case | What should happen |
| --- | --- |
| `N = 0` or null | No-op or reject; do not crash |
| `N = 1` | Single cell; already "rotated" |
| `N = 2` | One layer, one offset per side (the four corners) |
| Odd `N` | Center cell never moves; still only `N/2` layers |
| Not square | Define behavior; real images can be MxN, but this problem is NxN |
| Values are objects / large structs | Same index math; only the temp type changes |

Also clarify **direction**: clockwise vs counterclockwise. For counterclockwise, reverse the assignment order of the 4-cycle (or transpose then reverse **columns**).

---

## Quick self-check (N = 3)

```
1 2 3      rotate CW      7 4 1
4 5 6      -------->      8 5 2
7 8 9                     9 6 3
```

Layer 0 only (`N/2 = 1`). Offsets for `i` on the outer ring:

1. Cycle `1, 3, 9, 7` → places `7` top-left, `1` top-right, `3` bottom-right, `9` bottom-left.
2. Cycle `2, 6, 8, 4` → finishes the sides.
3. Center `5` stays.

If your code prints that, the indices are right.

---

## Explain to a friend

You have a square grid of pixels. You want to spin it 90 degrees clockwise without allocating a second full grid.

Treat the grid like an onion. For each ring, walk along one side. For each position, four cells trade places: top, right, bottom, left. Save one in a temp so you do not lose it, then write the other three, then put the temp in the last hole. Finish the ring, step inward, repeat until the middle.

Time is proportional to the number of cells. Extra memory is basically one temporary cell. That is the whole trick.

---

## Practice next

* Code both versions from memory (layer cycle, then transpose + reverse).
* Change the problem to **counterclockwise** and adjust only the cycle.
* Stretch: rotate an **M x N** image (needs a new buffer or a different representation; pure in-place for non-square is a different puzzle).

Series home: [CTCI in Java guide](/blog/en/ctci-series-guide). Next array problem in the plan: [Zero Matrix](/blog/en/ctci-1-8-zero-matrix).