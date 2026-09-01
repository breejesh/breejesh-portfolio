---
title: "Contiguous Sequence: Maximum Subarray Sum via Kadane's Algorithm (CTCI 16.17)"
description: "Compute the maximum contiguous subarray sum in an integer array using dynamic programming Kadane's Algorithm with prefix resets in O(N) linear time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-17-contiguous-sequence.webp
previewImage: /assets/images/ctci-16-17-contiguous-sequence.webp
---

> **TL;DR**
> * **The Book Problem:** Given an array of integers (both positive and negative), find the contiguous sequence with the largest sum and return that sum (e.g. `[2, -8, 3, -2, 4, -10]` $\to$ `5` from `[3, -2, 4]`).
> * **The Optimal Solution:** **Kadane's Algorithm (Dynamic Programming)**:
>   1. Maintain two variables: `maxSum = 0` (or `array[0]`) and `runningSum = 0`.
>   2. For each element $x$:
>      * Accumulate: `runningSum += x;`
>      * Update peak: `maxSum = Math.max(maxSum, runningSum);`
>      * Prefix Reset: If `runningSum < 0`, reset `runningSum = 0` (a negative prefix strictly degrades any future subarray sum).
>   3. Runs in **$O(N)$ time** (single linear pass) and strictly **$O(1)$ auxiliary space**.
> * **Production Reality:** High-frequency trading maximum drawdown / gain analysis, genomic maximum-scoring segment identification, and audio amplitude burst detection.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.17), we are asked:

*"Given an array of integers containing both positive and negative values, compute the maximum sum across all possible contiguous subarrays."*

## 2. Dynamic Programming State Transitions (Kadane's Paradigm)

Let $DP[i]$ be the maximum subarray sum ending at index $i$:
$$DP[i] = \max(A[i], DP[i-1] + A[i])$$

$$\text{GlobalMax} = \max_{0 \le i < N} DP[i]$$

```
Array:        2   -8    3   -2    4  -10
runningSum:   2    0    3    1    5    0
maxSum:       2    2    3    3    5    5
                   ▲                   ▲
            (Reset to 0)          (Max Subarray = 5)
```

## Production Java Implementation

```java
public class ContiguousSequence {

    /**
     * Standard CTCI Formulation: Returns maximum contiguous sum (allows empty subarray = 0).
     * Time Complexity: O(N)
     * Space Complexity: O(1)
     */
    public static int getMaxSum(int[] array) {
        if (array == null || array.length == 0) {
            return 0;
        }

        int maxSum = 0;
        int runningSum = 0;

        for (int x : array) {
            runningSum += x;
            if (runningSum > maxSum) {
                maxSum = runningSum;
            } else if (runningSum < 0) {
                runningSum = 0; // Discard negative prefix
            }
        }

        return maxSum;
    }

    /**
     * Non-Empty Subarray Variant (handles all-negative arrays gracefully)
     */
    public static int getMaxSumNonEmpty(int[] array) {
        if (array == null || array.length == 0) {
            throw new IllegalArgumentException("Array must not be empty");
        }

        int maxSoFar = array[0];
        int currentMax = array[0];

        for (int i = 1; i < array.length; i++) {
            currentMax = Math.max(array[i], currentMax + array[i]);
            maxSoFar = Math.max(maxSoFar, currentMax);
        }

        return maxSoFar;
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Single linear pass through array with $N$ additions. |
| Auxiliary Space | `O(1)` | Constant two integer scalar registers. |
| Cache Locality | `Optimal` | Sequential contiguous memory access pattern. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Algorithmic Trading Maximum Gain

1. **Financial Volatility Monitoring:** In automated market-making engines, Kadane's algorithm runs over tick price delta streams ($\Delta P_t$) to compute the maximum instantaneous profitable trading window in $O(1)$ stateful increments per market tick.
2. **Genomic Sequence Islands:** Identifies high-density GC-rich gene clusters within DNA nucleotide strings.

## Edge Cases & Production Hardening

1. **All-Negative Arrays (`[-5, -2, -8]`):**
   * Standard CTCI variant returns `0` (choosing the empty subarray).
   * Non-empty variant returns `-2` (the least negative individual element).
2. **Integer Overflow on Sums:** If numbers can be large, use 64-bit `long` accumulators.
