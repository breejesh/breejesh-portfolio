---
title: "Sub Sort: Find Minimum Subarray Index Range to Sort Entire Array (CTCI 16.16)"
description: "CTCI problem 16.16: find smallest index range (m, n) such that sorting subarray array[m..n] sorts the entire array."
date: "2026-01-02"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-16-sub-sort.webp
previewImage: /assets/images/ctci-16-16-sub-sort.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.16 technical mechanics.
> * **The Approach:** CTCI problem 16.16: find smallest index range (m, n) such that sorting subarray array[m..n] sorts the entire array.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **16.16**: find smallest index range (m, n) such that sorting subarray array[m..n] sorts the entire array. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 16.16: find smallest index range (m, n) such that sorting subarray array[m..n] sorts the entire array.

## 2. Technical Code & Mechanics

```java
public static void findUnsortedSequence(int[] array) {
    int end_left = findLeftSequenceEnd(array);
    int start_right = findRightSequenceStart(array);
    // Expand bounds to cover max and min of unsorted section
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.