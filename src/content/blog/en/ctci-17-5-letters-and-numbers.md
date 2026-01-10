---
title: "Letters and Numbers: Find Longest Subarray with Equal Letters and Digits (CTCI 17.5)"
description: "CTCI problem 17.5: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time."
date: "2026-01-10"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-5-letters-and-numbers.webp
previewImage: /assets/images/ctci-17-5-letters-and-numbers.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.5 technical mechanics.
> * **The Approach:** CTCI problem 17.5: find the longest contiguous subarray containing an equal number of letters and numbers in O(N) time.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **17.5**.

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