---
title: "Sorted Matrix Search: Search M x N Matrix Sorted by Rows and Columns (CTCI 10.9)"
description: "CTCI problem 10.9 in Java: search for an element in an M x N matrix where every row and column is sorted in O(M + N) time."
date: "2026-04-29"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
previewImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.9 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.9 in Java: search for an element in an M x N matrix where every row and column is sorted in O(M + N) time.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

This article provides a complete, novice-friendly breakdown of CTCI problem **10.9**. We examine the problem statement, compare brute-force vs. optimal approaches, and write idiomatic Java code.

---

## 1. Everyday analogy

Think of CTCI problem 10.9 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.9:** CTCI problem 10.9 in Java: search for an element in an M x N matrix where every row and column is sorted in O(M + N) time.

---

## 3. Optimal approach and implementation

```java
public class SortedMatrixSearch {
    public static boolean findElement(int[][] matrix, int elem) {
        int row = 0;
        int col = matrix[0].length - 1;
        while (row < matrix.length && col >= 0) {
            if (matrix[row][col] == elem) {
                return true;
            } else if (matrix[row][col] > elem) {
                col--;
            } else {
                row++;
            }
        }
        return false;
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