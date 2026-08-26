---
title: "Majority Element: Boyer-Moore Majority Vote Algorithm (CTCI 17.10)"
description: "CTCI problem 17.10: find the element that appears more than N/2 times in an array in O(N) time and O(1) space."
date: "2025-12-08"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-10-majority-element.webp
previewImage: /assets/images/ctci-17-10-majority-element.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.10 technical mechanics.
> * **The Approach:** CTCI problem 17.10: find the element that appears more than N/2 times in an array in O(N) time and O(1) space.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.10**: find the element that appears more than N/2 times in an array in O(N) time and O(1) space. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.10: find the element that appears more than N/2 times in an array in O(N) time and O(1) space.

## 2. Technical Code & Mechanics

```java
public static int findMajorityElement(int[] array) {
    int candidate = getCandidate(array);
    return validate(array, candidate) ? candidate : -1;
}
private static int getCandidate(int[] array) {
    int majority = 0, count = 0;
    for (int n : array) {
        if (count == 0) majority = n;
        if (n == majority) count++;
        else count--;
    }
    return majority;
}
private static boolean validate(int[] array, int candidate) {
    int count = 0;
    for (int n : array) if (n == candidate) count++;
    return count > array.length / 2;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.