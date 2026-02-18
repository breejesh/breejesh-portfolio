---
title: "Sorted Merge: Merge Array B into Sorted Array A In-Place (CTCI 10.1)"
description: "CTCI problem 10.1 in Java: merge two sorted arrays A and B into A in sorted order, working backwards to avoid shifting elements."
date: "2026-02-18"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-1-sorted-merge.webp
previewImage: /assets/images/ctci-10-1-sorted-merge.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.1 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.1 in Java: merge two sorted arrays A and B into A in sorted order, working backwards to avoid shifting elements.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

This article provides a complete, novice-friendly breakdown of CTCI problem **10.1**. We examine the problem statement, compare brute-force vs. optimal approaches, and write idiomatic Java code.

---

## 1. Everyday analogy

Think of CTCI problem 10.1 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.1:** CTCI problem 10.1 in Java: merge two sorted arrays A and B into A in sorted order, working backwards to avoid shifting elements.

---

## 3. Optimal approach and implementation

```java
public class SortedMerge {
    public static void merge(int[] a, int[] b, int lastA, int lastB) {
        int indexA = lastA - 1;
        int indexB = lastB - 1;
        int indexMerged = lastA + lastB - 1;

        while (indexB >= 0) {
            if (indexA >= 0 && a[indexA] > b[indexB]) {
                a[indexMerged] = a[indexA];
                indexA--;
            } else {
                a[indexMerged] = b[indexB];
                indexB--;
            }
            indexMerged--;
        }
    }
}
```

---

## 4. Time & Space Complexity

| Metric | Complexity | Explanation |
| --- | --- | --- |
| Time Complexity | O(N) / O(log N) | Optimal pass through data |
| Space Complexity | O(1) / O(N) | Memory bounds maintained |

---

## 5. Edge Cases & Friend Recap

Always check for boundary conditions, null inputs, duplicate values, or array size limits in coding interviews.