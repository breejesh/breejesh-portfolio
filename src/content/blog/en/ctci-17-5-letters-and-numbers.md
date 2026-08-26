---
title: "Letters and Numbers: Find Longest Subarray with Equal Letters and Digits (CTCI 17.5)"
description: "CTCI problem 17.5: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time."
date: "2026-01-10"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-5-letters-and-numbers.webp
previewImage: /assets/images/ctci-17-5-letters-and-numbers.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.5 technical mechanics.
> * **The Approach:** CTCI problem 17.5: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.5**: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.5: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time.

## 2. Technical Code & Mechanics

```java
public static char[] findLongestSubarray(char[] array) {
    int[] deltas = computeDeltaArray(array);
    int[] match = findLongestMatch(deltas);
    return extractSubarray(array, match[0] + 1, match[1]);
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.