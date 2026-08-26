---
title: "Sorted Search No Size: Search Listy Without Size Method (CTCI 10.4)"
description: "CTCI problem 10.4 in Java: find an element in a Listy data structure lacking a size method by exponentially bounding the search range."
date: "2025-11-01"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
previewImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.4 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.4 in Java: find an element in a Listy data structure lacking a size method by exponentially bounding the search range.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

You walk into an interview and get handed problem **10.4**: find an element in a Listy data structure lacking a size method by exponentially bounding the search range. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

---

## 1. Everyday analogy

Think of CTCI problem 10.4 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.4:** CTCI problem 10.4 in Java: find an element in a Listy data structure lacking a size method by exponentially bounding the search range.

---

## 3. Optimal approach and implementation

```java
public class SortedSearchNoSize {
    static class Listy {
        private final int[] array;
        public Listy(int[] arr) { this.array = arr; }
        public int elementAt(int i) {
            return (i >= 0 && i < array.length) ? array[i] : -1;
        }
    }

    public static int search(Listy list, int value) {
        int index = 1;
        while (list.elementAt(index) != -1 && list.elementAt(index) < value) {
            index *= 2;
        }
        return binarySearch(list, value, index / 2, index);
    }

    private static int binarySearch(Listy list, int value, int low, int high) {
        while (low <= high) {
            int mid = low + (high - low) / 2;
            int middle = list.elementAt(mid);
            if (middle > value || middle == -1) high = mid - 1;
            else if (middle < value) low = mid + 1;
            else return mid;
        }
        return -1;
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