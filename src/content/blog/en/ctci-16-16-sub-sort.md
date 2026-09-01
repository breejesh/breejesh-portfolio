---
title: "Sub Sort: Minimum Unsorted Subarray Window in Linear Time (CTCI 16.16)"
description: "Find the shortest subarray indices [m, n] that, when sorted, sort the entire array using dual prefix-max and suffix-min boundary scans in O(N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-16-sub-sort.webp
previewImage: /assets/images/ctci-16-16-sub-sort.webp
---

> **TL;DR**
> * **The Book Problem:** Given an array of integers, find indices $m$ and $n$ such that sorting elements $m$ through $n$ results in the entire array being sorted. Minimize $n - m$ (find the smallest such sequence).
> * **The Optimal Solution:** **Dual Extremum Boundary Scans**:
>   1. **Find Right Boundary ($n$)**: Scan from left to right ($0 \to N-1$) tracking `maxSeenSoFar`. The rightmost element where $A[i] < \text{maxSeenSoFar}$ defines the right index $n$.
>   2. **Find Left Boundary ($m$)**: Scan from right to left ($N-1 \to 0$) tracking `minSeenSoFar`. The leftmost element where $A[j] > \text{minSeenSoFar}$ defines the left index $m$.
>   3. If no inversions exist ($m = -1$), the array is already sorted.
>   4. Runs in **$O(N)$ time** (two linear passes) and strictly **$O(1)$ space**.
> * **Production Reality:** Partial data frame realignment in Apache Arrow / Pandas, near-sorted database stream ingestion (LSM compaction), and network out-of-order packet reassembly.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.16), we are asked:

*"Given an unsorted array of integers, find the minimal contiguous subarray window [m, n] whose sorting will render the full array strictly sorted."*

## 2. Invariant Partition Architecture

An array is partitioned into three logical segments:

```
[ Left Sorted Segment ] ── [ Middle Unsorted Window [m, n] ] ── [ Right Sorted Segment ]
       0 .. m-1                            m .. n                            n+1 .. N-1

Invariants:
  1. max(Left) <= min(Middle + Right)
  2. min(Right) >= max(Left + Middle)
```

## Production Java Implementation

```java
public class SubSort {

    public static class Range {
        public final int start;
        public final int end;

        public Range(int start, int end) {
            this.start = start;
            this.end = end;
        }

        @Override
        public String toString() {
            return "[" + start + ", " + end + "]";
        }
    }

    /**
     * Finds the minimal subarray [m, n] in O(N) time and O(1) space.
     */
    public static Range findUnsortedSequence(int[] array) {
        if (array == null || array.length <= 1) {
            return new Range(-1, -1); // Already sorted
        }

        int n = array.length;
        int rightIndex = -1;
        int maxSeen = array[0];

        // 1. Left-to-Right Scan: Find rightmost element smaller than a preceding max
        for (int i = 1; i < n; i++) {
            if (array[i] < maxSeen) {
                rightIndex = i;
            } else {
                maxSeen = array[i];
            }
        }

        // If no element is out of order, the entire array is already sorted
        if (rightIndex == -1) {
            return new Range(-1, -1);
        }

        int leftIndex = -1;
        int minSeen = array[n - 1];

        // 2. Right-to-Left Scan: Find leftmost element greater than a subsequent min
        for (int j = n - 2; j >= 0; j--) {
            if (array[j] > minSeen) {
                leftIndex = j;
            } else {
                minSeen = array[j];
            }
        }

        return new Range(leftIndex, rightIndex);
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Exactly two sequential linear array scans. |
| Auxiliary Space | `O(1)` | Constant memory tracking running extrema (`maxSeen`, `minSeen`). |
| Comparison Count | $2N - 2$ | Minimal possible comparisons without array cloning. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: LSM Tree Compactions & Packet Buffers

1. **LSM-Tree SSTable Compaction:** When Log-Structured Merge (LSM) engines (RocksDB / Cassandra) merge memtables with on-disk SSTables, identifying non-overlapping sorted key runs avoids full-table merging, compacting only the minimal unsorted key range $[m, n]$.
2. **TCP Out-of-Order SACK Reassembly:** Network stacks detect out-of-order sequence windows to request selective retransmissions.

## Edge Cases & Production Hardening

1. **Already Sorted Arrays (`[1, 2, 3, 4]`):** Returns `[-1, -1]` without performing unnecessary boundary rewrites.
2. **Strictly Reverse-Sorted Arrays (`[5, 4, 3, 2, 1]`):** Correctly returns full array range `[0, N-1]`.
3. **Duplicate Extremes (`[1, 2, 4, 7, 10, 11, 7, 12, 6, 7, 16, 18, 19]`):** Correctly expands window to encompass all duplicate boundary values.
