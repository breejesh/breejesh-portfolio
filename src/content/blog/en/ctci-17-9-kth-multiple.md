---
title: "Kth Multiple: Generating 3, 5, 7 Prime Factor Numbers in O(K) Time (CTCI 17.9)"
description: "Compute the Kth number whose only prime factors are 3, 5, and 7 using 3-pointer monotonic sequence generation with duplicate deduplication in O(K) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-9-kth-multiple.webp
previewImage: /assets/images/ctci-17-9-kth-multiple.webp
---

> **TL;DR**
> * **The Book Problem:** Design an algorithm to find the $k$-th number whose only prime factors are 3, 5, and 7 ($1, 3, 5, 7, 9, 15, 21, 25, 27, 35, \dots$).
> * **The Optimal Solution:** **3-Pointer Monotonic Dynamic Programming**:
>   1. Maintain an array `dp` of size $k$ with `dp[0] = 1`.
>   2. Maintain three pointers: $p_3 = 0, p_5 = 0, p_7 = 0$.
>   3. For each step $i \in [1, k-1]$:
>      * Evaluate candidate multiples: $v_3 = 3 \cdot dp[p_3], v_5 = 5 \cdot dp[p_5], v_7 = 7 \cdot dp[p_7]$.
>      * Pick minimum: $dp[i] = \min(v_3, v_5, v_7)$.
>      * Advance all pointers generating that minimum (e.g. if $dp[i] == v_3$, increment $p_3++$; if $dp[i] == v_5$, increment $p_5++$). Non-exclusive incrementing guarantees duplicate elimination ($15 = 3 \times 5 = 5 \times 3$).
>   4. Runs in **$O(K)$ time** and **$O(K)$ space** (outperforming $O(K \log K)$ min-heap approaches).
> * **Production Reality:** Hamming numbers in FFT signal processing, smooth integer factorization in cryptography, and streaming multi-queue merges.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.9), we are asked:

*"Generate the kth positive integer whose prime factorization contains only 3, 5, and 7 without factoring every integer or inserting duplicates."*

## 2. 3-Pointer Multi-Stream Generation

```
State at i = 0: dp = [1], p3 = 0, p5 = 0, p7 = 0

Step 1: candidates: (3*1=3, 5*1=5, 7*1=7)  ──> min = 3 ──> dp[1] = 3, p3 = 1
Step 2: candidates: (3*3=9, 5*1=5, 7*1=7)  ──> min = 5 ──> dp[2] = 5, p5 = 1
Step 3: candidates: (3*3=9, 5*3=15, 7*1=7) ──> min = 7 ──> dp[3] = 7, p7 = 1
Step 4: candidates: (3*3=9, 5*3=15, 7*3=21)──> min = 9 ──> dp[4] = 9, p3 = 2
...
Step on 15: candidates: (3*5=15, 5*3=15, 7*3=21) ──> min = 15 ──> p3++ AND p5++ (Deduplicated!)
```

## Production Java Implementation

```java
import java.util.LinkedList;
import java.util.Queue;

public class KthMultiple {

    /**
     * 3-Pointer Dynamic Programming (Optimal O(K) time and space).
     */
    public static long getKthMultiple(int k) {
        if (k <= 0) return 0;

        long[] dp = new long[k];
        dp[0] = 1;

        int p3 = 0;
        int p5 = 0;
        int p7 = 0;

        for (int i = 1; i < k; i++) {
            long next3 = dp[p3] * 3;
            long next5 = dp[p5] * 5;
            long next7 = dp[p7] * 7;

            long minVal = Math.min(next3, Math.min(next5, next7));
            dp[i] = minVal;

            // Non-exclusive if checks advance both pointers on shared values (e.g. 15)
            if (minVal == next3) p3++;
            if (minVal == next5) p5++;
            if (minVal == next7) p7++;
        }

        return dp[k - 1];
    }

    /**
     * 3-Queue Formulation (CTCI Classic Variant).
     */
    public static long getKthMultipleQueues(int k) {
        if (k <= 0) return 0;

        long val = 1;
        Queue<Long> q3 = new LinkedList<>();
        Queue<Long> q5 = new LinkedList<>();
        Queue<Long> q7 = new LinkedList<>();

        q3.add(3L);
        q5.add(5L);
        q7.add(7L);

        for (int i = 1; i < k; i++) {
            long v3 = q3.peek();
            long v5 = q5.peek();
            long v7 = q7.peek();

            val = Math.min(v3, Math.min(v5, v7));

            if (val == v3) {
                q3.poll();
                q3.add(3 * val);
                q5.add(5 * val);
                q7.add(7 * val);
            } else if (val == v5) {
                q5.poll();
                q5.add(5 * val);
                q7.add(7 * val);
            } else {
                q7.poll();
                q7.add(7 * val);
            }
        }

        return val;
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Auxiliary Space | Duplicate Handling |
|---|---|---|---|
| **3-Pointer DP** | **$O(K)$** | **$O(K)$** | **Inherent (Shared Pointer Advancement)** |
| **3 Queues (CTCI)** | $O(K)$ | $O(K)$ | Inherent (Layered Enqueuing) |
| **Min-Heap (PriorityQueue)** | $O(K \log K)$ | $O(K)$ | Requires HashSet Deduplication |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Smooth Numbers & FFT Signal Processing

1. **5-Smooth Numbers in Fast Fourier Transform (FFT):** Cooley-Tukey FFT algorithms (FFTW library) achieve optimal hardware cache performance when input array lengths are $5$-smooth numbers ($2^a \cdot 3^b \cdot 5^c$). FFT planners pre-compute smooth buffer sizes using 3-pointer generator arrays.
2. **Cryptographic Sieve Methods (Quadratic Sieve):** Factoring large RSA moduli relies on generating smooth number sequences across small prime factor bases.

## Edge Cases & Production Hardening

1. **64-bit Long Overflow:** Values for $k > 1,000$ grow exponentially; return types must use 64-bit `long` to avoid integer wrapping.
2. **$k = 1$:** Correctly returns $1$ (the $3^0 \cdot 5^0 \cdot 7^0$ identity).
