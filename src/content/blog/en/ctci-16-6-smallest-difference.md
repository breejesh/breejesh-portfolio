---
title: "Smallest Difference: Dual Sorted Array Two-Pointer Optimization (CTCI 16.6)"
description: "Compute the minimum non-negative absolute difference between two integer arrays using dual sorting and two-pointer traversal in O(A log A + B log B)."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-6-smallest-difference.webp
previewImage: /assets/images/ctci-16-6-smallest-difference.webp
---

> **TL;DR**
> * **The Book Problem:** Given two arrays of integers, compute the pair of values (one value in each array) with the smallest (non-negative) difference. Return the difference.
> * **The Optimal Solution:** **Dual-Sorting + Two-Pointer Convergence**:
>   1. Sort both arrays in ascending order: `Arrays.sort(a); Arrays.sort(b);`.
>   2. Initialize two pointers: $i = 0$ (for array $A$) and $j = 0$ (for array $B$).
>   3. In each step, compute `diff = Math.abs((long)a[i] - (long)b[j])` and update `minDiff`.
>   4. If `diff == 0`, return `0` immediately (optimal lower bound).
>   5. Advance the pointer pointing to the smaller element: if `a[i] < b[j]`, increment $i++$; else increment $j++$.
>   6. Cast elements to 64-bit `long` to prevent 32-bit integer subtraction overflow (`Integer.MIN_VALUE - Integer.MAX_VALUE`).
>   7. Runs in **$O(A \log A + B \log B)$ time** and **$O(1)$ auxiliary space**.
> * **Production Reality:** Audio waveform alignment, timestamp synchronization in distributed event logs, and nearest-neighbor vector quantization.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.6), we are asked:

*"Given two arrays of integers, find a pair (one from each array) whose absolute difference is minimized, and return that minimal difference."*

## 2. Two-Pointer Convergence Mechanics

```
Sorted Array A: [ 1,  3, 15, 11, 2 ] ──> [ 1,  2,  3, 11, 15 ] (Pointer i)
                                                      ▲
                                                      │ diff = |11 - 19| = 8
                                                      ▼
Sorted Array B: [ 23, 127, 235, 19, 8 ] ──> [ 8, 19, 23, 127, 235 ] (Pointer j)
```

At each step, advancing the pointer at the smaller value is guaranteed to move the search closer to or past the larger value, preserving monotonicity without omitting any optimal pair.

## Production Java Implementation

```java
import java.util.Arrays;

public class SmallestDifference {

    /**
     * Finds the minimum non-negative difference between elements of two arrays.
     * Time Complexity: O(A log A + B log B)
     * Space Complexity: O(1) auxiliary
     */
    public static long findSmallestDifference(int[] a, int[] b) {
        if (a == null || b == null || a.length == 0 || b.length == 0) {
            return -1; // Invalid input
        }

        Arrays.sort(a);
        Arrays.sort(b);

        int i = 0;
        int j = 0;
        long minDifference = Long.MAX_VALUE;

        while (i < a.length && j < b.length) {
            // 64-bit long subtraction prevents integer underflow/overflow
            long diff = Math.abs((long) a[i] - (long) b[j]);
            minDifference = Math.min(minDifference, diff);

            if (minDifference == 0) {
                return 0; // Absolute minimum reached
            }

            // Move the pointer at the smaller value
            if (a[i] < b[j]) {
                i++;
            } else {
                j++;
            }
        }

        return minDifference;
    }
}
```

## Complexity Analysis

| Stage | Algorithm | Time Complexity | Auxiliary Space |
|---|---|---|---|
| 1. Dual Sorting | Dual-Pivot QuickSort / TimSort | $O(A \log A + B \log B)$ | $O(\log A + \log B)$ recursion stack |
| 2. Two-Pointer Scan | Monotonic Linear Scan | $O(A + B)$ | $O(1)$ |
| **Total** | **Optimal** | **$O(A \log A + B \log B)$** | **$O(1)$ auxiliary** |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Distributed Log Timestamp Alignment

1. **Distributed Trace Correlation:** In distributed tracing systems (Jaeger / OpenTelemetry), microservice request logs from independent nodes have small clock drifts. Merging traces involves finding the closest timestamp pairs across two sorted log event streams using two-pointer scans.
2. **Audio Sample Phase Matching:** Aligning multi-track audio recordings utilizes smallest difference scans over discrete peak amplitude timestamp arrays.

## Edge Cases & Production Hardening

1. **Integer Underflow:** Comparing `Integer.MIN_VALUE` ($-2^{31}$) with `Integer.MAX_VALUE` ($2^{31}-1$) would wrap around in 32-bit math; using `(long) a[i] - (long) b[j]` eliminates numeric overflow.
2. **Identical Elements:** If any $a[i] == b[j]$, returns `0` early, skipping remaining iterations.
