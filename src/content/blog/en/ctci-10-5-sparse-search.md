---
title: "Sparse Search: Search String Array Interspersed with Empty Strings (CTCI 10.5)"
description: "CTCI problem 10.5 in Java: locate a target string in a sorted array of strings interspersed with empty strings using modified binary search."
date: "2026-01-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-5-sparse-search.webp
previewImage: /assets/images/ctci-10-5-sparse-search.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.5 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.5 in Java: locate a target string in a sorted array of strings interspersed with empty strings using modified binary search.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

You walk into an interview and get handed problem **10.5**: locate a target string in a sorted array of strings interspersed with empty strings using modified binary search. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

---

## 1. Everyday analogy

Think of CTCI problem 10.5 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.5:** CTCI problem 10.5 in Java: locate a target string in a sorted array of strings interspersed with empty strings using modified binary search.

---

## 3. Optimal approach and implementation

```java
public class SparseSearch {
    public static int search(String[] strings, String str) {
        if (strings == null || str == null || str.isEmpty()) return -1;
        return search(strings, str, 0, strings.length - 1);
    }

    private static int search(String[] strings, String str, int first, int last) {
        if (first > last) return -1;
        int mid = (first + last) / 2;

        if (strings[mid].isEmpty()) {
            int left = mid - 1, right = mid + 1;
            while (true) {
                if (left < first && right > last) return -1;
                if (right <= last && !strings[right].isEmpty()) { mid = right; break; }
                if (left >= first && !strings[left].isEmpty()) { mid = left; break; }
                right++; left--;
            }
        }

        if (strings[mid].equals(str)) return mid;
        else if (strings[mid].compareTo(str) < 0) return search(strings, str, mid + 1, last);
        else return search(strings, str, first, mid - 1);
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