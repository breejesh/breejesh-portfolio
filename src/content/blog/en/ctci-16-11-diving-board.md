---
title: "Diving Board: Closed-Form Combinatorial Length Generation (CTCI 16.11)"
description: "Generate all distinct diving board lengths constructed from K planks of shorter and longer types using closed-form linear iteration in O(K) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-11-diving-board.webp
previewImage: /assets/images/ctci-16-11-diving-board.webp
---

> **TL;DR**
> * **The Book Problem:** You are building a diving board by placing exactly $K$ planks of wood end-to-end. There are two types of planks: shorter ($s$) and longer ($l$). Write a method to generate all possible lengths for the diving board.
> * **The Mathematical Breakthrough:** **Closed-Form Linear Generation**:
>   1. Any valid board consists of $i$ shorter planks and $(K - i)$ longer planks ($0 \le i \le K$).
>   2. The total length formula is:
>      $$\text{Length}(i) = i \times s + (K - i) \times l$$
>   3. If $s == l$, exactly $1$ distinct length exists ($K \times s$).
>   4. If $s \ne l$, iterating $i$ from $0$ to $K$ produces exactly **$K + 1$ distinct lengths**.
>   5. Eliminates recursive branching ($O(2^K)$) and hash set deduplication in favor of a single linear loop.
>   6. Runs in **$O(K)$ time** and **$O(K)$ space**.
> * **Production Reality:** Knapsack subset configurations, manufacturing tolerance modeling, and memory page allocation block sizing.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.11), we are asked:

*"Generate all unique possible total lengths of a diving board built by placing exactly K planks of shorter and longer sizes end-to-end."*

## 2. Combinatorial Derivation: Why Exactly $K + 1$ Unique Values?

```
For K = 3 Planks (Shorter=s, Longer=l):
  i = 0 shorter, 3 longer  ──> 0*s + 3*l = 3l
  i = 1 shorter, 2 longer  ──> 1*s + 2*l
  i = 2 shorter, 1 longer  ──> 2*s + 1*l
  i = 3 shorter, 0 longer  ──> 3*s + 0*l = 3s

Total Distinct Values: K + 1 = 4 lengths.
```

Since addition is commutative ($s + l + l = l + s + l$), the order of planks is completely irrelevant; only the count $i$ of shorter planks determines the total length.

## Production Java Implementation

```java
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class DivingBoard {

    /**
     * Generates all possible unique diving board lengths in O(K) time.
     * Time Complexity: O(K)
     * Space Complexity: O(K)
     */
    public static int[] allLengths(int k, int shorter, int longer) {
        if (k <= 0) {
            return new int[0];
        }

        // Edge case: Both plank types have identical length
        if (shorter == longer) {
            return new int[] { k * shorter };
        }

        int[] lengths = new int[k + 1];

        // i represents the number of shorter planks used
        for (int i = 0; i <= k; i++) {
            int nShorter = i;
            int nLonger = k - i;
            lengths[i] = nShorter * shorter + nLonger * longer;
        }

        return lengths;
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Space Complexity | Memoization Overhead |
|---|---|---|---|
| **Closed-Form Iteration** | **$O(K)$** | **$O(K)$** | **None (Pure math)** |
| **Memoized DFS Recursion** | $O(K^2)$ | $O(K^2)$ | HashSet + Call stack |
| **Naive Tree Recursion** | $O(2^K)$ | $O(K)$ | Exponential explosion |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Coin Change & Knapsack Configurations

1. **Deterministic Linear Sizing:** In container memory allocators (jemalloc / TCMalloc), size classes are generated using geometric step arithmetic, ensuring deterministic memory binning without combinatorial runtime lookups.
2. **Manufacturing Tolerance Verification:** Validates cumulative mechanical tolerance variations across chained component assemblies.

## Edge Cases & Production Hardening

1. **$K = 0$:** Handled cleanly returning an empty array.
2. **Identical Plank Sizes ($s = l$):** Returns a 1-element array, preventing duplicate generation.
