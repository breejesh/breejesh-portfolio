---
title: "Pairs with Sum: Two-Sum Complement Hash Maps & Two-Pointer Scans (CTCI 16.24)"
description: "Find all pairs of integers in an array that sum to a target value using single-pass complement frequency hash maps and dual-pointer scans in O(N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-24-pairs-with-sum.webp
previewImage: /assets/images/ctci-16-24-pairs-with-sum.webp
---

> **TL;DR**
> * **The Book Problem:** Design an algorithm to find all pairs of integers within an array which sum to a specified target value.
> * **The Optimal Solutions:**
>   1. **Single-Pass Frequency Complement Hash Map (Optimal for Time)**:
>      * For each element $x$, compute the required complement $\text{target} = \text{sum} - x$.
>      * If $\text{target}$ is in `unpairedCountMap` with count $> 0$, pair $(x, \text{target})$ and decrement its count.
>      * Otherwise, record $x$ in `unpairedCountMap`.
>      * Runs in **$O(N)$ time** and **$O(N)$ space**.
>   2. **Two-Pointer on Sorted Array (Optimal for In-Place Space)**:
>      * Sort the array in $O(N \log N)$ time.
>      * Converge two pointers $L = 0$ and $R = N - 1$ inward in **$O(1)$ space**.
> * **Production Reality:** Order matching engines in financial exchanges (bids and asks pairing), network subnet packet pairing, and chemical stoichiometry balancing.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.24), we are asked:

*"Find all integer pairs (a, b) in an array such that a + b = target, accounting correctly for duplicates and element reuse rules."*

## 2. Complement Tracking Pipeline

```
Target Sum = 8
Array: [ -1,  4,  9,  4,  5,  3,  4 ]

Pass:
  x = -1 ──> Target 9  (Map: {-1: 1})
  x =  4 ──> Target 4  (Map: {-1: 1, 4: 1})
  x =  9 ──> Target -1 (Found -1! Pair: {-1, 9}, Map: {4: 1})
  x =  4 ──> Target 4  (Found 4!  Pair: {4, 4},   Map: {})
  x =  5 ──> Target 3  (Map: {5: 1})
  x =  3 ──> Target 5  (Found 5!  Pair: {5, 3},   Map: {})
```

## Production Java Implementation

```java
import java.util.*;

public class PairsWithSum {

    public static class Pair {
        public final int first;
        public final int second;

        public Pair(int first, int second) {
            this.first = first;
            this.second = second;
        }

        @Override
        public String toString() {
            return "(" + first + ", " + second + ")";
        }
    }

    /**
     * Optimal O(N) time single-pass frequency hash map.
     */
    public static List<Pair> findPairsHash(int[] array, int targetSum) {
        if (array == null || array.length < 2) {
            return Collections.emptyList();
        }

        List<Pair> result = new ArrayList<>();
        Map<Integer, Integer> unpairedCounts = new HashMap<>();

        for (int x : array) {
            int complement = targetSum - x;
            int count = unpairedCounts.getOrDefault(complement, 0);

            if (count > 0) {
                result.add(new Pair(x, complement));
                if (count == 1) {
                    unpairedCounts.remove(complement);
                } else {
                    unpairedCounts.put(complement, count - 1);
                }
            } else {
                unpairedCounts.put(x, unpairedCounts.getOrDefault(x, 0) + 1);
            }
        }

        return result;
    }

    /**
     * In-place O(1) space two-pointer approach after sorting.
     */
    public static List<Pair> findPairsSorted(int[] array, int targetSum) {
        if (array == null || array.length < 2) {
            return Collections.emptyList();
        }

        Arrays.sort(array);
        List<Pair> result = new ArrayList<>();
        int left = 0;
        int right = array.length - 1;

        while (left < right) {
            int sum = array[left] + array[right];
            if (sum == targetSum) {
                result.add(new Pair(array[left], array[right]));
                left++;
                right--;
            } else if (sum < targetSum) {
                left++;
            } else {
                right--;
            }
        }

        return result;
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Auxiliary Space | Preserves Original Array |
|---|---|---|---|
| **Complement HashMap** | **$O(N)$** | **$O(N)$** | Yes |
| **Two-Pointer Sorted** | $O(N \log N)$ | $O(1)$ | No (In-place sort) |
| **Brute Force Pairs** | $O(N^2)$ | $O(1)$ | Yes |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: High-Throughput Exchange Order Matching

1. **Exchange Order Book Crossed Pairs:** Matching engines (Nasdaq / LMAX) pair bid orders and ask orders whose limit prices cross or sum to structured collar thresholds using fast hash lookup tables.
2. **Database Hash Joins (Equi-Joins):** Relational engines execute `JOIN ON A.val + B.val = Constant` using in-memory hash complement tables.

## Edge Cases & Production Hardening

1. **Duplicate Elements ($x = \text{complement}$):** Handled cleanly via frequency decrementing so an element `4` only pairs with another distinct instance of `4`.
2. **Integer Underflow/Overflow:** If inputs approach `Integer.MAX_VALUE`, use 64-bit `long` arithmetic.
