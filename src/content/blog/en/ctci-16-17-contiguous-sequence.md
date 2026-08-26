---
title: "Contiguous Sequence: Maximum Sum Subarray via Kadane's Algorithm (CTCI 16.17)"
description: "CTCI problem 16.17: find contiguous sequence of integers with maximum sum using Kadane's dynamic programming algorithm."
date: "2026-03-02"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-17-contiguous-sequence.webp
previewImage: /assets/images/ctci-16-17-contiguous-sequence.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.17 technical mechanics.
> * **The Approach:** CTCI problem 16.17: find contiguous sequence of integers with maximum sum using Kadane's dynamic programming algorithm.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **16.17**: find contiguous sequence of integers with maximum sum using Kadane's dynamic programming algorithm. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 16.17: find contiguous sequence of integers with maximum sum using Kadane's dynamic programming algorithm.

## 2. Technical Code & Mechanics

```java
public static int getMaxSum(int[] a) {
    int maxSum = 0;
    int currentSum = 0;
    for (int i = 0; i < a.length; i++) {
        currentSum += a[i];
        if (maxSum < currentSum) maxSum = currentSum;
        else if (currentSum < 0) currentSum = 0;
    }
    return maxSum;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.