---
title: "Search in Rotated Array: Find Element in Rotated Sorted Array (CTCI 10.3)"
description: "CTCI problem 10.3 in Java: modified binary search to locate an element in a sorted array that has been rotated by an unknown offset."
date: "2026-03-11"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
previewImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.3 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.3 in Java: modified binary search to locate an element in a sorted array that has been rotated by an unknown offset.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

You walk into an interview and get handed problem **10.3**: modified binary search to locate an element in a sorted array that has been rotated by an unknown offset. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

---

## 1. Everyday analogy

Think of CTCI problem 10.3 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.3:** CTCI problem 10.3 in Java: modified binary search to locate an element in a sorted array that has been rotated by an unknown offset.

---

## 3. Optimal approach and implementation

```java
public class SearchRotatedArray {
    public static int search(int[] a, int left, int right, int x) {
        if (left > right) return -1;
        int mid = left + (right - left) / 2;
        if (a[mid] == x) return mid;

        if (a[left] < a[mid]) { // Left half is normally sorted
            if (x >= a[left] && x < a[mid]) return search(a, left, mid - 1, x);
            else return search(a, mid + 1, right, x);
        } else if (a[mid] < a[left]) { // Right half is normally sorted
            if (x > a[mid] && x <= a[right]) return search(a, mid + 1, right, x);
            else return search(a, left, mid - 1, x);
        } else { // Duplicates handling
            int location = -1;
            if (a[mid] != a[right]) location = search(a, mid + 1, right, x);
            if (location == -1) location = search(a, left, mid - 1, x);
            return location;
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