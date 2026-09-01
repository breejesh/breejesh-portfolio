---
title: "Shortest Supersequence: Sliding Window Minimum Cover Subsequence (CTCI 17.18)"
description: "Find the smallest contiguous subarray of a large array containing all elements of a small array using a sliding window and ordered element tracking in O(N log S) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-18-shortest-supersequence.webp
previewImage: /assets/images/ctci-17-18-shortest-supersequence.webp
---

> **TL;DR**
> * **The Book Problem:** Given two arrays — `big` and `small` — find the shortest subarray of `big` containing all elements of `small`.
> * **The Optimal Solution:** **Sliding Window with Next-Occurrence Index Tracking**:
>   1. **Precompute Query Map**: For each element in `small`, build a sorted list of indices in `big` where it appears.
>   2. **Priority Queue Pointer**: Use a Min-Heap tracking the current sweep pointer for each element of `small`.
>   3. **Advance by Min**: Dequeue the smallest-index element, compute `max_ptr - min_ptr` as the window size, update global minimum, then advance that element's pointer to its next occurrence in `big`.
>   4. Terminate when any element in `small` runs out of future occurrences.
>   5. Runs in **$O(N \log S)$ time** and **$O(N)$ space**.
> * **Production Reality:** Minimum cover substring problems in search relevance, Elasticsearch phrase proximity, and data stream multi-sensor fusion windows.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.18), we are asked:

*"Find the shortest subarray of 'big' that contains all elements of 'small'. Return the indices of the starting and ending positions of that subarray."*

## 2. Sliding Window Mechanics

```
big   = [7, 5, 9, 0, 2, 1, 3, 5, 7, 9, 1, 1, 5, 8, 8, 9, 7]
small = [1, 5, 9]

Sorted occurrence lists:
  1: [5, 10, 11]
  5: [1, 7, 12]
  9: [2, 9, 15]

Min-Heap Sweep (current_idx for each element):
  Iteration 1: ptrs = [5, 1, 2]. Range [1, 5], size 5.
  Iteration 2: advance 5 to 7.  ptrs = [5, 7, 2]. Range [2, 7], size 6.
  Iteration 3: advance 9 to 9.  ptrs = [5, 7, 9]. Range [5, 9], size 5.
  ...
  Minimum window found: [5, 9] of size 5.
```

## Production Java Implementation

```java
import java.util.*;

public class ShortestSupersequence {

    public static int[] shortestSupersequence(int[] big, int[] small) {
        List<List<Integer>> lists = new ArrayList<>();
        Map<Integer, Integer> map = new HashMap<>();

        for (int s : small) {
            if (!map.containsKey(s)) {
                map.put(s, lists.size());
                lists.add(new ArrayList<>());
            }
        }

        for (int i = 0; i < big.length; i++) {
            Integer idx = map.get(big[i]);
            if (idx != null) {
                lists.get(idx).add(i);
            }
        }

        // Min-Heap: [current_index_in_big, list_index, position_in_list]
        PriorityQueue<int[]> minHeap = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        int maxIndex = Integer.MIN_VALUE;

        for (int i = 0; i < lists.size(); i++) {
            if (lists.get(i).isEmpty()) return new int[]{-1, -1};
            int firstOcc = lists.get(i).get(0);
            minHeap.add(new int[]{firstOcc, i, 0});
            maxIndex = Math.max(maxIndex, firstOcc);
        }

        int[] best = {-1, -1};
        while (!minHeap.isEmpty()) {
            int[] curr = minHeap.poll();
            int minIndex = curr[0];
            int listIdx = curr[1];
            int posIdx = curr[2];

            if (best[0] == -1 || maxIndex - minIndex < best[1] - best[0]) {
                best[0] = minIndex;
                best[1] = maxIndex;
            }

            // Advance to next occurrence
            if (posIdx + 1 >= lists.get(listIdx).size()) break;
            int nextOcc = lists.get(listIdx).get(posIdx + 1);
            minHeap.add(new int[]{nextOcc, listIdx, posIdx + 1});
            maxIndex = Math.max(maxIndex, nextOcc);
        }

        return best;
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N log S)` | $N$ elements scanned, $S$-element heap operations. |
| Auxiliary Space | `O(N)` | Occurrence lists store all $N$ positions. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Search Relevance and Proximity Scoring

1. **BM25 Minimum Span Scoring:** Web search engines boost phrase proximity scores by computing the minimum span subwindow across document positions of query terms.
2. **Multi-Sensor Fusion Windows:** IoT data pipelines define minimum-width time windows containing at least one reading from every sensor channel.

## Edge Cases & Production Hardening

1. **Element in `small` Absent from `big`:** Returns `{-1, -1}` cleanly.
2. **`small` Is a Subset of a Single Position:** Window of size 1 detected immediately.
