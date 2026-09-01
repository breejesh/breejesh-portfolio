---
title: "Sorted Search, No Size: Exponential Search on Infinite Data Structures (CTCI 10.4)"
description: "Search for a value in a sorted, unbounded Listy data structure without a size method using exponential doubling search and binary search in O(log p) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
previewImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
---

> **TL;DR**
> * **The Book Problem:** You are given an array-like data structure `Listy` which lacks a size method. It does, however, have an `elementAt(i)` method that returns the element at index $i$ in $O(1)$ time. If $i$ is beyond the bounds, it returns `-1`. Given a `Listy` containing sorted, positive integers, find the index of element $x$.
> * **The Optimal Solution:** **Exponential Doubling Search + Bounded Binary Search**: (1) **Exponential Probing**: Start at `index = 1` and repeatedly double `index *= 2` until `list.elementAt(index) == -1` or `list.elementAt(index) >= value`; (2) **Bounded Binary Search**: Perform binary search within the bounded window $[index / 2, index]$; (3) If `elementAt(mid) == -1` or `> value`, treat it as too large and search left; (4) Runs in optimal **$O(\log p)$ time** (where $p$ is the target's index) and **$O(1)$ auxiliary space**.
> * **Production Reality:** Infinite event stream seek operations, unbounded memory-mapped virtual files, and growing distributed commit log offsets.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.4), we are asked:

*"You are given an array-like data structure Listy which lacks a size method. It does, however, have an elementAt(i) method that returns the element at index i in O(1) time. If i is beyond the bounds of the data structure, it returns -1. Given a Listy containing sorted, positive integers, find the index at which an element x occurs."*

## 2. Exponential Search Mechanics ($O(\log p)$)

Since the length $N$ is unknown, we cannot initialize `right = N - 1`.

### Phase 1: Exponential Doubling
We probe indices $1, 2, 4, 8, 16, \dots, 2^k$ until:
$$\text{list.elementAt}(2^k) \ge x \quad \text{or} \quad \text{list.elementAt}(2^k) == -1$$
If the element exists at index $p$, we find an upper bound $2^k \le 2p$ in exactly $\lceil \log_2 p \rceil$ steps.

### Phase 2: Bounded Binary Search
We perform binary search in the interval $[2^{k-1}, 2^k]$. Since the range size is at most $p$, the binary search completes in $O(\log p)$ time.

## Production Implementation

```java
public class SortedSearchNoSize {
    public static class Listy {
        private final int[] array;

        public Listy(int[] arr) { this.array = arr; }

        public int elementAt(int i) {
            if (i < 0 || i >= array.length) return -1;
            return array[i];
        }
    }

    /**
     * Searches for value in a size-less Listy data structure.
     * Time Complexity: O(log p) where p is target element's index.
     * Space Complexity: O(1)
     */
    public static int search(Listy list, int value) {
        int index = 1;
        // Exponentially double index to find search boundary
        while (list.elementAt(index) != -1 && list.elementAt(index) < value) {
            index *= 2;
        }
        return binarySearch(list, value, index / 2, index);
    }

    private static int binarySearch(Listy list, int value, int low, int high) {
        int mid;

        while (low <= high) {
            mid = low + (high - low) / 2;
            int middle = list.elementAt(mid);

            if (middle > value || middle == -1) {
                high = mid - 1; // Out of bounds or too high: search left
            } else if (middle < value) {
                low = mid + 1; // Too low: search right
            } else {
                return mid; // Found element
            }
        }
        return -1;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(log p)` | $\log_2 p$ steps to double the boundary + $\log_2 p$ steps for binary search. |
| Auxiliary Space | `O(1)` | Iterative binary search with constant scalar registers. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Unbounded Stream Offsets

1. **Kafka Stream Offset Seeking:** Consumer groups seeking target timestamp offsets in continuous unbounded stream partitions use exponential probing to frame the target time window.
2. **Virtual Memory Mappings (mmap):** Sparse files with unallocated blocks return page faults (`SIGSEGV` or sentinel `-1`), resolved via exponential search bounds.

## Edge Cases & Production Hardening

1. **Target at Index 0:** Initial doubling loop detects `list.elementAt(1) >= value`, searching $[0, 1]$ correctly.
2. **Element Not Found:** Bounded binary search terminates safely returning `-1`.
