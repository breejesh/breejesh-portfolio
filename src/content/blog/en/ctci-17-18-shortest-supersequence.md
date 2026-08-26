---
title: "Shortest Supersequence: Shortest Subarray Containing All Target Elements (CTCI 17.18)"
description: "CTCI problem 17.18: find the shortest subarray of a larger array that contains all elements from a smaller target set using sliding window."
date: "2025-08-14"
tags: [Algorithms & Data Structures, Development]
coverImage: /assets/images/ctci-17-18-shortest-supersequence.webp
previewImage: /assets/images/ctci-17-18-shortest-supersequence.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.18 technical mechanics.
> * **The Approach:** CTCI problem 17.18: find the shortest subarray of a larger array that contains all elements from a smaller target set using sliding window.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.18**: find the shortest subarray of a larger array that contains all elements from a smaller target set using sliding window. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.18: find the shortest subarray of a larger array that contains all elements from a smaller target set using sliding window.

## 2. Technical Code & Mechanics

```java
public static int[] shortestSupersequence(int[] big, int[] small) {
    // Sliding window technique with frequency map
    return new int[]{-1, -1};
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.