---
title: "Sum Swap: Find Element Pair to Swap for Equal Array Sums (CTCI 16.21)"
description: "CTCI problem 16.21: find pair of values (one from each array) to swap so both arrays have equal sum in O(A + B) time."
date: "2026-01-01"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-21-sum-swap.webp
previewImage: /assets/images/ctci-16-21-sum-swap.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.21 technical mechanics.
> * **The Approach:** CTCI problem 16.21: find pair of values (one from each array) to swap so both arrays have equal sum in O(A + B) time.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **16.21**: find pair of values (one from each array) to swap so both arrays have equal sum in O(A + B) time. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 16.21: find pair of values (one from each array) to swap so both arrays have equal sum in O(A + B) time.

## 2. Technical Code & Mechanics

```java
public static int[] findSwapValues(int[] array1, int[] array2) {
    int sum1 = Arrays.stream(array1).sum();
    int sum2 = Arrays.stream(array2).sum();
    int target = (sum1 - sum2);
    if (target % 2 != 0) return null;
    int targetDiff = target / 2;
    Set<Integer> set2 = Arrays.stream(array2).boxed().collect(Collectors.toSet());
    for (int one : array1) {
        if (set2.contains(one - targetDiff)) return new int[]{one, one - targetDiff};
    }
    return null;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.