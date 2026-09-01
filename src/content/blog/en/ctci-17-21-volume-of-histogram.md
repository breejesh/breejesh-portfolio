---
title: "Volume of Histogram: Two-Pointer Water Trapping in O(N) Time (CTCI 17.21)"
description: "Compute the total water trapped between histogram bars using precomputed left/right max arrays or an in-place two-pointer sweep in O(N) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-21-volume-of-histogram.webp
previewImage: /assets/images/ctci-17-21-volume-of-histogram.webp
---

> **TL;DR**
> * **The Book Problem:** Given a histogram represented by an array of bar heights, compute the total volume of water it can hold if it rains.
> * **The Optimal Solution:** **Two-Pointer In-Place Water Trapping**:
>   1. Initialize `left = 0`, `right = n-1`, `leftMax = 0`, `rightMax = 0`, `water = 0`.
>   2. While `left < right`: if `height[left] <= height[right]`, the water trapped at `left` is `leftMax - height[left]`, advance `left`. Otherwise, the water trapped at `right` is `rightMax - height[right]`, advance `right`.
>   3. Runs in **$O(N)$ time** and **$O(1)$ space**.
> * **Production Reality:** Digital terrain model flood simulation, stormwater infrastructure routing, and GPU rasterization coverage mask computation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.21), we are asked:

*"Imagine a histogram (bar chart). Design an algorithm to compute the volume of water it could hold if someone poured water across the top."*

## 2. Why Two Pointers Work

```
Heights: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]

Left Pointer sweeps right while height[left] <= height[right].
Water at each bar = max(0, min(leftMax, rightMax) - height[i]).
Total water trapped = 6 units.
```

The key insight: water held at any bar is `min(max_left, max_right) - bar_height`. Two pointers allow computing this without storing max arrays.

## Production Java Implementation

```java
public class VolumeOfHistogram {

    /**
     * Computes total trapped water in O(N) time, O(1) space.
     */
    public static int computeHistogramVolume(int[] heights) {
        if (heights == null || heights.length < 3) return 0;

        int left = 0, right = heights.length - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;

        while (left < right) {
            if (heights[left] <= heights[right]) {
                leftMax = Math.max(leftMax, heights[left]);
                water += leftMax - heights[left];
                left++;
            } else {
                rightMax = Math.max(rightMax, heights[right]);
                water += rightMax - heights[right];
                right--;
            }
        }

        return water;
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Space | Notes |
|---|---|---|---|
| **Two-Pointer** | **$O(N)$** | **$O(1)$** | **Optimal; single pass.** |
| Left/Right Max Arrays | $O(N)$ | $O(N)$ | Cleaner logic, requires two auxiliary arrays. |
| Brute Force | $O(N^2)$ | $O(1)$ | For each bar, scan left/right for maxima. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Terrain Flood Simulation

1. **Digital Elevation Models (DEM):** GIS hydrological flood simulations compute water volume retention in basins by applying the same min-max boundary argument across terrain elevation profiles.
2. **GPU Rasterization:** Pixel coverage mask computation uses analogous boundary sweep algorithms for conservative depth buffer anti-aliasing.

## Edge Cases & Production Hardening

1. **Monotone Array:** Produces `0` correctly (water drains off one side).
2. **All Zeros:** Returns `0`.
3. **Single Bar:** Returns `0`.
