---
title: "Pond Sizes: 8-Directional Connected Components Flood-Fill (CTCI 16.19)"
description: "Compute the contiguous sizes of all water bodies in a 2D topographical elevation matrix using 8-directional connected components DFS in O(R * C) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-19-pond-sizes.webp
previewImage: /assets/images/ctci-16-19-pond-sizes.webp
---

> **TL;DR**
> * **The Book Problem:** You are given an integer matrix representing a plot of land, where $0$ indicates water and positive integers indicate land height above sea level. A pond is a region of water connected vertically, horizontally, or diagonally (8-way connected). Compute the sizes of all ponds in the matrix.
> * **The Optimal Solution:** **8-Directional Depth-First Search (Flood-Fill)**:
>   1. **Matrix Scan**: Iterate through all coordinates $(r, c)$ in the $R \times C$ matrix.
>   2. **DFS Exploration**: Whenever a water cell ($0$) is discovered:
>      * Mark the cell as visited (e.g. mutate `matrix[r][c] = -1`).
>      * Recursively explore all 8 adjacent neighbor offsets: $(\Delta r, \Delta c) \in \{-1, 0, 1\}^2 \setminus \{(0, 0)\}$.
>      * Sum up all contiguous water cells ($1 + \sum \text{DFS}(\text{neighbor})$).
>   3. Runs in **$O(R \cdot C)$ time** and **$O(R \cdot C)$ auxiliary space** (recursion stack).
> * **Production Reality:** Satellite SAR flood mapping, image segmentation in computer vision (connected component labeling), and procedural terrain generation in game engines.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.19), we are asked:

*"Given an R x C integer topographical map, compute the exact size of every 8-way connected water pond and return their sizes."*

## 2. 8-Directional Neighbor Traversal Stencil

```
Adjacent Neighbor Offsets (8 Directions):
  (-1, -1)   (-1,  0)   (-1, +1)
  ( 0, -1)   [ (r, c) ] ( 0, +1)
  (+1, -1)   (+1,  0)   (+1, +1)
```

Each water cell is visited exactly once and marked in-place, eliminating redundant traversal overhead.

## Production Java Implementation

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class PondSizes {

    /**
     * Computes all pond sizes in the land matrix.
     * Time Complexity: O(R * C)
     * Space Complexity: O(R * C)
     */
    public static List<Integer> computePondSizes(int[][] land) {
        if (land == null || land.length == 0 || land[0].length == 0) {
            return Collections.emptyList();
        }

        List<Integer> pondSizes = new ArrayList<>();
        int rows = land.length;
        int cols = land[0].length;

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (land[r][c] == 0) {
                    int size = computePondSize(land, r, c);
                    pondSizes.add(size);
                }
            }
        }

        return pondSizes;
    }

    private static int computePondSize(int[][] land, int r, int c) {
        // Boundary and water check
        if (r < 0 || r >= land.length || c < 0 || c >= land[0].length || land[r][c] != 0) {
            return 0;
        }

        // Mark cell as visited
        land[r][c] = -1;
        int size = 1;

        // Explore all 8 adjacent directions
        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                if (dr == 0 && dc == 0) continue;
                size += computePondSize(land, r + dr, c + dc);
            }
        }

        return size;
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(R * C)` | Each cell is visited at most 9 times (1 initiation + 8 neighbor probes). |
| Auxiliary Space | `O(R * C)` | Maximum DFS recursion stack for an entirely flooded grid. |
| Memory Footprint | `In-Place` | Mutates water cells to `-1` to avoid external `boolean[][]` visited matrix. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Remote Sensing & GIS Flood Mapping

1. **Satellite Radar Flood Inundation:** In NASA Earthdata and Copernicus Sentinel-1 SAR imagery analysis, 8-way connected component labeling groups thresholded dark backscatter pixels into contiguous flooded water reservoirs.
2. **Disjoint Set Union (DSU) Alternative:** In distributed map-reduce architectures (Apache Spark GraphX), large planetary raster grids are partitioned across workers and merged along tile boundaries using Union-Find.

## Edge Cases & Production Hardening

1. **Matrix Boundaries:** Guarded via explicit bounds checks (`0 <= r < rows` and `0 <= c < cols`).
2. **All-Land or All-Water Grids:** Completely dry plots return an empty list; completely flooded plots return a single element of size $R \times C$.
