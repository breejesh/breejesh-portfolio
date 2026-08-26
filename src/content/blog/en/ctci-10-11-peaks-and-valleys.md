---
title: "Peaks and Valleys: Sort Array into Alternating Sequence (CTCI 10.11)"
description: "CTCI problem 10.11 in Java: rearrange an array of integers into an alternating sequence of peaks and valleys in O(N) single-pass time."
date: "2026-06-06"
tags: [Algorithms & Data Structures, Developer Tools & Policy]
coverImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
previewImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.11 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.11 in Java: rearrange an array of integers into an alternating sequence of peaks and valleys in O(N) single-pass time.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

You walk into an interview and get handed problem **10.11**: rearrange an array of integers into an alternating sequence of peaks and valleys in O(N) single-pass time. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

---

## 1. Everyday analogy

Think of CTCI problem 10.11 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.11:** CTCI problem 10.11 in Java: rearrange an array of integers into an alternating sequence of peaks and valleys in O(N) single-pass time.

---

## 3. Optimal approach and implementation

```java
public class PeaksAndValleys {
    public static void sortValleyPeak(int[] array) {
        for (int i = 1; i < array.length; i += 2) {
            int maxIndex = maxIndex(array, i - 1, i, i + 1);
            if (i != maxIndex) {
                swap(array, i, maxIndex);
            }
        }
    }

    private static int maxIndex(int[] array, int a, int b, int c) {
        int len = array.length;
        int aValue = (a >= 0 && a < len) ? array[a] : Integer.MIN_VALUE;
        int bValue = (b >= 0 && b < len) ? array[b] : Integer.MIN_VALUE;
        int cValue = (c >= 0 && c < len) ? array[c] : Integer.MIN_VALUE;
        int max = Math.max(aValue, Math.max(bValue, cValue));

        if (aValue == max) return a;
        else if (bValue == max) return b;
        else return c;
    }

    private static void swap(int[] array, int i, int j) {
        int temp = array[i];
        array[i] = array[j];
        array[j] = temp;
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