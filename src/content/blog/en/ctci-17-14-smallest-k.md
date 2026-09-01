---
title: "Smallest K: Linear-Time Quickselect vs Bounded Max-Heap (CTCI 17.14)"
description: "Find the smallest K elements in an array using Hoare's Quickselect algorithm in expected O(N) linear time and bounded Max-Heaps in O(N log K) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-14-smallest-k.webp
previewImage: /assets/images/ctci-17-14-smallest-k.webp
---

> **TL;DR**
> * **The Book Problem:** Design an algorithm to find the smallest $k$ numbers in an unsorted array of size $n$.
> * **The Optimal Solutions:**
>   1. **Quickselect (Hoare's Selection Algorithm)**:
>      * Partition array around a pivot using Lomuto/Hoare partitioning.
>      * If `pivotIndex == k`, return `array[0..k-1]`.
>      * If `k < pivotIndex`, recurse exclusively on the left partition.
>      * If `k > pivotIndex`, recurse exclusively on the right partition.
>      * Runs in **expected $O(N)$ linear time** and **$O(1)$ auxiliary space**.
>   2. **Bounded Max-Heap (Streaming Top-K)**:
>      * Maintain a Max-Heap bounded to size $k$. For each element, if smaller than heap root, evict root and insert.
>      * Runs in **$O(N \log K)$ time** and **$O(K)$ space** (ideal for read-only streams).
> * **Production Reality:** Database `SELECT ... ORDER BY col LIMIT K` query optimization (Top-N Sort in Postgres & Spark), search engine BM25 score ranking, and latency percentile approximation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.14), we are asked:

*"Extract the k smallest values from an array of size n in linear average time without sorting the entire array."*

## 2. Quickselect Partitioning Halving

```
Array: [ 8, 3, 2, 9, 7, 1, 5, 4 ], k = 3
Partition around pivot 4:
  [ 3, 2, 1 ] | 4 | [ 8, 9, 7, 5 ]
  Pivot 4 lands at index 3 == k!
  Smallest 3 elements: [ 3, 2, 1 ] (Done in O(N)!)
```

## Production Java Implementation

```java
import java.util.*;

public class SmallestK {

    /**
     * Quickselect Algorithm (Expected O(N) time, O(1) auxiliary space).
     */
    public static int[] smallestKQuickselect(int[] array, int k) {
        if (array == null || k <= 0 || k > array.length) {
            return new int[0];
        }

        quickselect(array, 0, array.length - 1, k);

        int[] result = new int[k];
        System.arraycopy(array, 0, result, 0, k);
        return result;
    }

    private static void quickselect(int[] arr, int left, int right, int k) {
        if (left >= right) return;

        int pivotIndex = partition(arr, left, right);

        if (pivotIndex == k) {
            return; // Exactly k elements reside in arr[0..k-1]
        } else if (k < pivotIndex) {
            quickselect(arr, left, pivotIndex - 1, k);
        } else {
            quickselect(arr, pivotIndex + 1, right, k);
        }
    }

    private static int partition(int[] arr, int left, int right) {
        int pivot = arr[right];
        int i = left;

        for (int j = left; j < right; j++) {
            if (arr[j] <= pivot) {
                swap(arr, i, j);
                i++;
            }
        }
        swap(arr, i, right);
        return i;
    }

    private static void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    /**
     * Max-Heap Streaming Solution (O(N log K) time, O(K) space).
     */
    public static int[] smallestKHeap(int[] array, int k) {
        if (array == null || k <= 0 || k > array.length) return new int[0];

        // Max-Heap of size K
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(k, Collections.reverseOrder());

        for (int x : array) {
            if (maxHeap.size() < k) {
                maxHeap.add(x);
            } else if (x < maxHeap.peek()) {
                maxHeap.poll();
                maxHeap.add(x);
            }
        }

        int[] result = new int[k];
        for (int i = 0; i < k; i++) {
            result[i] = maxHeap.poll();
        }
        return result;
    }
}
```

## Complexity Analysis

| Strategy | Time Complexity | Auxiliary Space | In-Place Mutation | Stream Friendly |
|---|---|---|---|---|
| **Quickselect (Hoare)** | **Expected $O(N)$** | **$O(1)$** | **Yes** | No |
| **Bounded Max-Heap** | **$O(N \log K)$** | **$O(K)$** | **No** | **Yes** |
| **Full Array Sort** | $O(N \log N)$ | $O(1)$ or $O(N)$ | Yes | No |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Top-N Query Optimization

1. **PostgreSQL Top-N Heap Sort:** When executing `ORDER BY rating ASC LIMIT 10`, query planners bypass full table merges by maintaining a 10-element bounded tuple max-heap directly in work_mem.
2. **Search Engine Rankers (Elasticsearch TopDocs):** Search nodes collect Top-10 relevant hits from millions of matched postings using thread-local priority queues before shard aggregation.

## Edge Cases & Production Hardening

1. **$k \ge n$:** Returns a copy of the original array in $O(N)$.
2. **$k = 0$ or Negative:** Returns an empty array safely.
