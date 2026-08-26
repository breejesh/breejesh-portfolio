---
title: "Volume of Histogram: Trapping Rain Water in Java (CTCI 17.21)"
description: "CTCI problem 17.21 in Java: compute total water trapped between bars in a 2D histogram in O(N) time and O(1) space."
date: "2026-05-18"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-21-volume-of-histogram.webp
previewImage: /assets/images/ctci-17-21-volume-of-histogram.webp
---

> **TL;DR**
> * **The Problem:** Given an array of bar heights representing a 2D histogram, calculate how much water can be trapped after rain.
> * **The Insight:** The water above any bar is determined by $\min(	ext{maxLeft}, 	ext{maxRight}) - 	ext{height}[i]$. Using two converging pointers eliminates extra array storage.
> * **Complexity:** $O(N)$ Time and optimal $O(1)$ Space.

Imagine a city skyline during a monsoon. Water pools between tall buildings. At any single building, the depth of water trapped above the roof is strictly limited by the shorter of the two tallest buildings to its left and right.

---

## 1. Algorithmic Approaches

| Approach | Time | Space | Mechanics |
| --- | --- | --- | --- |
| **Brute Force** | $O(N^2)$ | $O(1)$ | Scan left and right for maximums at every index |
| **Precomputed Arrays** | $O(N)$ | $O(N)$ | Store `leftMax[]` and `rightMax[]` arrays |
| **Two Pointers (Optimal)** | **$O(N)$** | **$O(1)$** | Converge pointers from boundaries inward |

---

## 2. Complete Java Solution (Two Pointers)

```java
public class HistogramVolume {
    public static int computeVolume(int[] heights) {
        if (heights == null || heights.length < 3) {
            return 0;
        }

        int left = 0;
        int right = heights.length - 1;
        int maxLeft = 0;
        int maxRight = 0;
        int totalVolume = 0;

        while (left < right) {
            if (heights[left] <= heights[right]) {
                if (heights[left] >= maxLeft) {
                    maxLeft = heights[left];
                } else {
                    totalVolume += maxLeft - heights[left];
                }
                left++;
            } else {
                if (heights[right] >= maxRight) {
                    maxRight = heights[right];
                } else {
                    totalVolume += maxRight - heights[right];
                }
                right--;
            }
        }

        return totalVolume;
    }
}
```

---

## 3. Edge Cases & Verification

- **Monotonically increasing or decreasing heights**: Returns `0` (water spills off the sides).
- **Arrays with length $< 3$**: Returns `0` (no containment basin possible).
- **Plateaus with equal heights**: Correctly processed without double counting.
