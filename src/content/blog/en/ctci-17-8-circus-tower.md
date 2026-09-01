---
title: "Circus Tower: 2D Longest Increasing Subsequence via Patience Sorting (CTCI 17.8)"
description: "Compute the maximum height human circus tower where each person is strictly shorter and lighter using dual-key sorting and patience LIS in O(N log N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-8-circus-tower.webp
previewImage: /assets/images/ctci-17-8-circus-tower.webp
---

> **TL;DR**
> * **The Book Problem:** A circus tower routine requires each person to be strictly shorter and lighter than the person below them ($H_i < H_{i+1}$ and $W_i < W_{i+1}$). Given height and weight pairs, find the maximum number of people that can be stacked.
> * **The Optimal Solution:** **Dual-Key Sorting + Patience Sorting (LIS)**:
>   1. **Dual-Key Sort**: Sort people by **Height ascending** ($H \uparrow$). For ties in height, sort by **Weight descending** ($W \downarrow$).
>   2. **The Tie-Breaking Trick**: Sorting equal-height people by descending weight prevents more than one person of the exact same height from being erroneously included in the weight subsequence.
>   3. **1D LIS via Binary Search**: Find the Longest Increasing Subsequence (LIS) on the resulting weight array using Patience Sorting and binary search (`Arrays.binarySearch`).
>   4. Runs in **$O(N \log N)$ time** and **$O(N)$ space** (vastly superior to $O(N^2)$ dynamic programming).
> * **Production Reality:** Russian Doll envelope nesting (LeetCode 354), DAG scheduling with multi-dimensional resource constraints, and geometric box packing.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.8), we are asked:

*"Given a collection of Person(height, weight) pairs, determine the maximum chain of people where each person is strictly smaller in both dimensions than the person supporting them."*

## 2. 2D-to-1D Reduction via Dual Sorting

```
Input: (65, 100), (70, 150), (56, 90), (75, 190), (60, 95), (68, 110)

1. Dual-Sort (Height ASC, Weight DESC):
   (56, 90), (60, 95), (65, 100), (68, 110), (70, 150), (75, 190)

2. Extract Weight Array:
   [ 90,  95, 100, 110, 150, 190 ]

3. Compute LIS on Weights via Binary Search:
   Patience Piles: [90] ──> [90, 95] ──> [90, 95, 100, 110, 150, 190]
   Length = 6 people!
```

## Production Java Implementation

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class CircusTower {

    public static class Person implements Comparable<Person> {
        public final int height;
        public final int weight;

        public Person(int height, int weight) {
            this.height = height;
            this.weight = weight;
        }

        @Override
        public int compareTo(Person other) {
            if (this.height != other.height) {
                return Integer.compare(this.height, other.height); // Height Ascending
            }
            // Tie-break: Weight Descending to prevent same-height chaining
            return Integer.compare(other.weight, this.weight);
        }
    }

    /**
     * Solves 2D Circus Tower in O(N log N) time using Patience Sorting.
     * Time Complexity: O(N log N)
     * Space Complexity: O(N)
     */
    public static int maxTowerHeight(List<Person> people) {
        if (people == null || people.isEmpty()) {
            return 0;
        }

        // 1. Sort people dual-key
        Collections.sort(people);

        // 2. Patience Sorting on weights (O(N log N))
        int[] tails = new int[people.size()];
        int size = 0;

        for (Person p : people) {
            int w = p.weight;
            int idx = Arrays.binarySearch(tails, 0, size, w);

            // Binary search returns (-(insertion point) - 1) if not found
            if (idx < 0) {
                idx = -(idx + 1);
            }

            tails[idx] = w;
            if (idx == size) {
                size++;
            }
        }

        return size;
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Auxiliary Space | Handles Ties Correctly |
|---|---|---|---|
| **Dual Sort + Patience LIS** | **$O(N \log N)$** | **$O(N)$** | **Yes (Weight Descending)** |
| **2D Dynamic Programming** | $O(N^2)$ | $O(N)$ | Yes |
| **Recursive Tree Search** | $O(2^N)$ | $O(N)$ | Exponential explosion |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Multi-Dimensional Resource Scheduling

1. **Kubernetes Multi-Resource Bin Packing:** When scheduling containers with simultaneous CPU and Memory minimum constraints, scheduling engines compute Pareto-optimal frontier chains to maximize density.
2. **CAD Box Nesting:** 2D polygon nesting algorithms in sheet metal manufacturing maximize cutting yield by chaining strict dimension inclusions.

## Edge Cases & Production Hardening

1. **Identical Heights with Different Weights (`(70, 150), (70, 160)`):** Sorted as `(70, 160)` then `(70, 150)`, ensuring `150` overwrites `160` in the patience array rather than extending the chain length.
2. **Duplicate Identical People:** Handled seamlessly by strict binary search replacement.
