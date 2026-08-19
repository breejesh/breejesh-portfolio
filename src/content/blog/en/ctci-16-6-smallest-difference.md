---
title: "Smallest Difference: Minimum Pairwise Difference Between Two Arrays (CTCI 16.6)"
description: "CTCI problem 16.6: find pair of values (one from each array) with smallest non-negative difference using sorting and two pointers."
date: "2026-01-27"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-6-smallest-difference.webp
previewImage: /assets/images/ctci-16-6-smallest-difference.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.6 technical mechanics.
> * **The Approach:** CTCI problem 16.6: find pair of values (one from each array) with smallest non-negative difference using sorting and two pointers.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **16.6**: find pair of values (one from each array) with smallest non-negative difference using sorting and two pointers. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 16.6: find pair of values (one from each array) with smallest non-negative difference using sorting and two pointers.

## 2. Technical Code & Mechanics

```java
public static int findSmallestDifference(int[] a, int[] b) {
    Arrays.sort(a);
    Arrays.sort(b);
    int aIdx = 0, bIdx = 0;
    int minDiff = Integer.MAX_VALUE;
    while (aIdx < a.length && bIdx < b.length) {
        int diff = Math.abs(a[aIdx] - b[bIdx]);
        if (diff < minDiff) minDiff = diff;
        if (a[aIdx] < b[bIdx]) aIdx++;
        else bIdx++;
    }
    return minDiff;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.