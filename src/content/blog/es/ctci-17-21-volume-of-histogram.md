---
title: "Volume of Histogram: Trapping Rain Water DP / Two-Pointer Solution (CTCI 17.21)"
description: "CTCI problem 17.21: compute total volume of water trapped between bars in a 2D histogram in O(N) time."
date: "2026-03-01"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-21-volume-of-histogram.webp
previewImage: /assets/images/ctci-17-21-volume-of-histogram.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.21 technical mechanics.
> * **The Approach:** CTCI problem 17.21: compute total volume of water trapped between bars in a 2D histogram in O(N) time.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **17.21**.

## 1. Context and Problem Statement
CTCI problem 17.21: compute total volume of water trapped between bars in a 2D histogram in O(N) time.

## 2. Technical Code & Mechanics

```java
public static int computeVolume(int[] histo) {
    int left = 0, right = histo.length - 1;
    int leftMax = 0, rightMax = 0, volume = 0;
    while (left < right) {
        if (histo[left] < histo[right]) {
            if (histo[left] >= leftMax) leftMax = histo[left];
            else volume += leftMax - histo[left];
            left++;
        } else {
            if (histo[right] >= rightMax) rightMax = histo[right];
            else volume += rightMax - histo[right];
            right--;
        }
    }
    return volume;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.