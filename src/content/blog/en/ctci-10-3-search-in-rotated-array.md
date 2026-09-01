---
title: "Search in Rotated Array: Modified Binary Search with Invariant Branching (CTCI 10.3)"
description: "Find an element in a sorted array rotated at an unknown pivot using modified binary search handling distinct and duplicate elements in O(log N) average time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
previewImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
---

> **TL;DR**
> * **The Book Problem:** Given a sorted array of $n$ integers that has been rotated an unknown number of times, write code to find an element in the array. You may assume that the array was originally sorted in increasing order.
> * **The Optimal Solution:** Modified Binary Search with Sorted Half Invariants: (1) At least one half ($[left, mid]$ or $[mid, right]$) is guaranteed to be normally sorted; (2) If $A[left] < A[mid]$, the left half is normally sorted: if target $x \in [A[left], A[mid]]$, search left, else search right; (3) If $A[mid] < A[left]$, the right half is normally sorted: if target $x \in [A[mid], A[right]]$, search right, else search left; (4) If $A[left] == A[mid]$ (duplicate collision), resolve by searching non-duplicate sides or exploring both halves; (5) Runs in **$O(\log N)$ average time** and $O(N)$ worst-case time under all-identical duplicate inputs.
> * **Production Reality:** Circular buffer indexing in high-performance networking drivers, rotated timeseries partition lookups, and log segment binary searches in Apache Kafka.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.3), we are asked:

*"Given a sorted array of n integers that has been rotated an unknown number of times, write code to find an element in the array. You may assume that the array was originally sorted in increasing order."*

## 2. Deriving the Rotated Binary Search Invariant

At any point in the search space, the rotation pivot can only be in one half:
* If $A[left] < A[mid]$, the **left half is strictly sorted**.
* If $A[mid] < A[left]$, the **right half is strictly sorted** (the pivot lies in the left half).
* If $A[left] == A[mid]$, duplicates prevent immediate determination; we check $A[right]$ or branch both ways.

## Production Implementation

```java
public class SearchInRotatedArray {
    /**
     * Finds target x in a rotated sorted array.
     * Time Complexity: O(log N) average, O(N) worst case (duplicates).
     * Space Complexity: O(log N)
     */
    public static int search(int[] a, int left, int right, int x) {
        if (right < left) return -1;

        int mid = left + (right - left) / 2;
        if (a[mid] == x) {
            return mid;
        }

        // Case 1: Left half is normally sorted
        if (a[left] < a[mid]) {
            if (x >= a[left] && x < a[mid]) {
                return search(a, left, mid - 1, x); // Search left
            } else {
                return search(a, mid + 1, right, x); // Search right
            }
        }
        // Case 2: Right half is normally sorted
        else if (a[mid] < a[left]) {
            if (x > a[mid] && x <= a[right]) {
                return search(a, mid + 1, right, x); // Search right
            } else {
                return search(a, left, mid - 1, x); // Search left
            }
        }
        // Case 3: Left half and mid are duplicates
        else {
            if (a[mid] != a[right]) { // If right is different, search right
                return search(a, mid + 1, right, x);
            } else { // Must search both halves
                int result = search(a, left, mid - 1, x); // Search left
                if (result == -1) {
                    return search(a, mid + 1, right, x); // Search right
                }
                return result;
            }
        }
    }
}
```

## Complexity & Memory Analysis

| Case | Time Complexity | Auxiliary Space | Technical Detail |
|---|---|---|---|
| Distinct Integers | `O(log N)` | `O(log N)` | Standard binary search dividing search space in half. |
| Duplicate Integers (Worst Case) | `O(N)` | `O(log N)` | Occurs when all elements are identical ($[2, 2, 2, 2, 2]$). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Ring Buffer Seek Operations

1. **Circular Log Buffers (Kafka / DPDK):** Packet and message offset pointers wrap around ring buffers upon reaching capacity, utilizing rotated binary search to locate target timestamps without copying.
2. **Database Monotonic Partition Lookups:** Locates partition shards in clustered key ranges when partition splits cause circular ID boundaries.

## Edge Cases & Production Hardening

1. **Element Not Present:** Gracefully terminates and returns `-1`.
2. **Pivot at Extremes (Unrotated Array):** Standard binary search branches execute flawlessly.
