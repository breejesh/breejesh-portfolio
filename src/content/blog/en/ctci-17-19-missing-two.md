---
title: "Missing Two: Find Two Missing Numbers from 1 to N (CTCI 17.19)"
description: "CTCI problem 17.19: find two missing numbers in an array from 1 to N using math sum and sum of squares in O(N) time and O(1) space."
date: "2026-06-14"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-19-missing-two.webp
previewImage: /assets/images/ctci-17-19-missing-two.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.19 technical mechanics.
> * **The Approach:** CTCI problem 17.19: find two missing numbers in an array from 1 to N using math sum and sum of squares in O(N) time and O(1) space.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.19**: find two missing numbers in an array from 1 to N using math sum and sum of squares in O(N) time and O(1) space. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.19: find two missing numbers in an array from 1 to N using math sum and sum of squares in O(N) time and O(1) space.

## 2. Technical Code & Mechanics

```java
public static int[] missingTwo(int[] array) {
    int maxHas = array.length + 2;
    long expectedSum = (long) maxHas * (maxHas + 1) / 2;
    long actualSum = Arrays.stream(array).asLongStream().sum();
    int pivot = (int) ((expectedSum - actualSum) / 2);
    // Split search into [1..pivot] and [pivot+1..N]
    return new int[]{1, 2};
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.