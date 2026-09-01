---
title: "Paint Fill: Flood Fill Algorithm on 2D Screen Matrix (CTCI 8.10)"
description: "Implement the classic paint fill / bucket fill tool on a 2D screen color matrix using recursive DFS flood fill in O(R * C) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-10-paint-fill.webp
previewImage: /assets/images/ctci-8-10-paint-fill.webp
---

> **TL;DR**
> * **The Book Problem:** Implement the "paint fill" function that one might see on many image editing programs. That is, given a screen (represented by a two-dimensional array of colors), a point $(r, c)$, and a new color `ncolor`, fill in the surrounding area until the color changes from the original color.
> * **The Optimal Solution:** Depth-First / Breadth-First Flood Fill: (1) Save original color $O = screen[r][c]$; (2) If $O == ncolor$, return immediately (prevents infinite recursion); (3) Mutate $screen[r][c] = ncolor$; (4) Recurse into all 4 cardinal directions (up, down, left, right) if the adjacent pixel matches $O$, executing in **$O(R \times C)$ time** and $O(R \times C)$ worst-case recursion stack space.
> * **Production Reality:** Photoshop / GIMP paint bucket raster fill, connected-component labeling in computer vision (OpenCV), and polygon contour rasterization in game engines.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.10), we are asked:

*"Implement the 'paint fill' function that one might see on many image editing programs. That is, given a screen (represented by a two-dimensional array of colors), a point, and a new color, fill in the surrounding area until the color changes from the original color."*

## 2. Recursive DFS Flood Fill Algorithm

1. **Guard Condition:** If the starting pixel already matches `ncolor`, abort immediately.
2. **Boundary Check:** If $(r, c)$ is outside the screen matrix boundaries, return.
3. **Color Matching:** If $screen[r][c] == \text{origColor}$, update $screen[r][c] = \text{ncolor}$.
4. **Neighbor Expansion:** Recurse across $(r - 1, c)$, $(r + 1, c)$, $(r, c - 1)$, and $(r, c + 1)$.

## Production Implementation

```java
public class PaintFill {
    public enum Color { Black, White, Red, Yellow, Blue, Green }

    /**
     * Fills the contiguous region of origColor with ncolor.
     * Time Complexity: O(R * C)
     * Space Complexity: O(R * C)
     */
    public static boolean paintFill(Color[][] screen, int r, int c, Color ncolor) {
        if (screen == null || r < 0 || r >= screen.length || c < 0 || c >= screen[0].length) {
            return false;
        }
        if (screen[r][c] == ncolor) {
            return false; // Already painted with new color
        }
        return paintFillHelper(screen, r, c, screen[r][c], ncolor);
    }

    private static boolean paintFillHelper(Color[][] screen, int r, int c,
                                          Color ocolor, Color ncolor) {
        if (r < 0 || r >= screen.length || c < 0 || c >= screen[0].length) {
            return false;
        }

        if (screen[r][c] == ocolor) {
            screen[r][c] = ncolor;
            paintFillHelper(screen, r - 1, c, ocolor, ncolor); // Up
            paintFillHelper(screen, r + 1, c, ocolor, ncolor); // Down
            paintFillHelper(screen, r, c - 1, ocolor, ncolor); // Left
            paintFillHelper(screen, r, c + 1, ocolor, ncolor); // Right
        }

        return true;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(R * C)` | In the worst case (uniform screen color), every pixel is visited and updated once. |
| Auxiliary Space | `O(R * C)` | Recursion call stack depth in the worst-case serpentine path. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Scanline Flood Fill

1. **Scanline Fill Optimization (GIMP / Photoshop):** Rather than recursing per-pixel, production graphics engines fill horizontal spans and push boundary segments to a queue, reducing stack depth from $O(R \times C)$ down to $O(R)$.
2. **Computer Vision Connected Components (OpenCV):** Segments binary thresholded images into distinct physical objects using 8-way flood-fill graph components.

## Edge Cases & Production Hardening

1. **Target Color Equals Source Color:** `screen[r][c] == ncolor` check prevents infinite recursive loops.
2. **Out of bounds seed coordinate:** Handled safely with matrix boundary guards.
