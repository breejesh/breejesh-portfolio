---
title: "Contiguous Sequence: Maximum Sum Subarray via Kadane's Algorithm (CTCI 16.17)"
description: "CTCI problem 16.17: find contiguous sequence of integers with maximum sum using Kadane's dynamic programming algorithm."
date: "2026-03-02"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-17-contiguous-sequence.webp
previewImage: /assets/images/ctci-16-17-contiguous-sequence.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.17 technical mechanics.
> * **The Approach:** CTCI problem 16.17: find contiguous sequence of integers with maximum sum using Kadane's dynamic programming algorithm.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.17**.

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