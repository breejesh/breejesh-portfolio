---
title: "Pairs with Sum: Find All Pairs in Array Summing to Target Value (CTCI 16.24)"
description: "CTCI problem 16.24: find all pairs of integers in an array that sum to a target value in O(N) time."
date: "2025-08-27"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-24-pairs-with-sum.webp
previewImage: /assets/images/ctci-16-24-pairs-with-sum.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.24 technical mechanics.
> * **The Approach:** CTCI problem 16.24: find all pairs of integers in an array that sum to a target value in O(N) time.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **16.24**: find all pairs of integers in an array that sum to a target value in O(N) time. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 16.24: find all pairs of integers in an array that sum to a target value in O(N) time.

## 2. Technical Code & Mechanics

```java
public static List<int[]> printPairSums(int[] array, int sum) {
    List<int[]> pairs = new ArrayList<>();
    Map<Integer, Integer> counts = new HashMap<>();
    for (int x : array) {
        int complement = sum - x;
        if (counts.getOrDefault(complement, 0) > 0) {
            pairs.add(new int[]{x, complement});
            counts.put(complement, counts.get(complement) - 1);
        } else {
            counts.put(x, counts.getOrDefault(x, 0) + 1);
        }
    }
    return pairs;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.