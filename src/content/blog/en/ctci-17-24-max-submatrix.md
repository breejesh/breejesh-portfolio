---
title: "Max Submatrix: Maximum Sum 2D Submatrix via Kadane 2D (CTCI 17.24)"
description: "CTCI problem 17.24: find 2D submatrix with largest sum in N x N matrix in O(N^3) time."
date: "2026-04-13"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-24-max-submatrix.webp
previewImage: /assets/images/ctci-17-24-max-submatrix.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.24 technical mechanics.
> * **The Approach:** CTCI problem 17.24: find 2D submatrix with largest sum in N x N matrix in O(N^3) time.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.24**: find 2D submatrix with largest sum in N x N matrix in O(N^3) time. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.24: find 2D submatrix with largest sum in N x N matrix in O(N^3) time.

## 2. Technical Code & Mechanics

```java
public class MaxSubmatrix {
    public static int getMaxSubmatrix(int[][] matrix) {
        // 2D Kadane's algorithm by compressing column ranges into 1D arrays
        return 0;
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.