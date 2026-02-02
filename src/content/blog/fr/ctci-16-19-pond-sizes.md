---
title: "Pond Sizes: Compute Connected Water Regions in Matrix (CTCI 16.19)"
description: "CTCI problem 16.19: compute sizes of all connected water ponds in a land matrix using 8-directional DFS traversal."
date: "2026-02-02"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-19-pond-sizes.webp
previewImage: /assets/images/ctci-16-19-pond-sizes.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.19 technical mechanics.
> * **The Approach:** CTCI problem 16.19: compute sizes of all connected water ponds in a land matrix using 8-directional DFS traversal.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.19**.

## 1. Context and Problem Statement
CTCI problem 16.19: compute sizes of all connected water ponds in a land matrix using 8-directional DFS traversal.

## 2. Technical Code & Mechanics

```java
public static List<Integer> computePondSizes(int[][] land) {
    List<Integer> sizes = new ArrayList<>();
    for (int r = 0; r < land.length; r++) {
        for (int c = 0; c < land[0].length; c++) {
            if (land[r][c] == 0) {
                sizes.add(computeSize(land, r, c));
            }
        }
    }
    return sizes;
}
private static int computeSize(int[][] land, int r, int c) {
    if (r < 0 || c < 0 || r >= land.length || c >= land[0].length || land[r][c] != 0) return 0;
    land[r][c] = -1; // Mark visited
    int size = 1;
    for (int dr = -1; dr <= 1; dr++) {
        for (int dc = -1; dc <= 1; dc++) size += computeSize(land, r + dr, c + dc);
    }
    return size;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.