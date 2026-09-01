---
title: "Sum Swap: Balanced Array Partitioning & HashSet Complements (CTCI 16.21)"
description: "Find an integer pair from two arrays whose swap equates both array sums using algebraic difference equations and HashSet complements in O(A + B) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-21-sum-swap.webp
previewImage: /assets/images/ctci-16-21-sum-swap.webp
---

> **TL;DR**
> * **The Book Problem:** Given two arrays of integers, find a pair of values (one from each array) that you can swap to make the sums of both arrays equal.
> * **The Mathematical Derivation:**
>   1. Let $S_A = \sum A$ and $S_B = \sum B$.
>   2. Swapping $a \in A$ and $b \in B$ yields the balance equation:
>      $$S_A - a + b = S_B - b + a \implies 2(a - b) = S_A - S_B \implies a - b = \frac{S_A - S_B}{2}$$
>   3. **Parity Check**: If $(S_A - S_B)$ is odd, no integer swap is possible; return `null` immediately.
>   4. **Target Formulation**: Target difference is $\Delta = (S_A - S_B) / 2$. We search for $b = a - \Delta$.
> * **The Optimal Solutions:**
>   * **HashSet Complement Search**: Store $B$ in a `HashSet`. For each $a \in A$, check if $b = a - \Delta$ exists in **$O(A + B)$ time** and **$O(B)$ space**.
>   * **Two-Pointer on Sorted Arrays**: Sort both arrays and converge pointers in **$O(A \log A + B \log B)$ time** and **$O(1)$ space**.
> * **Production Reality:** Server cluster load balancing, double-entry financial ledger reconciliation, and battery pack cell voltage balancing.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.21), we are asked:

*"Given two arrays of integers, determine if there exists a pair of elements (one from array A and one from array B) whose exchange yields identical array sums."*

## 2. Algebraic Difference Invariant

```
Array A: [4, 1, 2, 1, 1, 2] ──> Sum(A) = 11
Array B: [3, 6, 3, 3]       ──> Sum(B) = 15

Difference: Sum(A) - Sum(B) = 11 - 15 = -4
Target Delta: (Sum(A) - Sum(B)) / 2 = -2

Formula: b = a - (-2) = a + 2
For a = 1 in A: b = 1 + 2 = 3 in B (Valid pair: {1, 3})
After Swap:
  New Sum(A) = 11 - 1 + 3 = 13
  New Sum(B) = 15 - 3 + 1 = 13 (EQUAL!)
```

## Production Java Implementation

```java
import java.util.HashSet;
import java.util.Set;

public class SumSwap {

    /**
     * Finds swap pair in O(A + B) time using HashSet lookup.
     */
    public static int[] findSwapValuesHash(int[] a, int[] b) {
        if (a == null || b == null || a.length == 0 || b.length == 0) {
            return null;
        }

        long sumA = 0;
        for (int v : a) sumA += v;

        long sumB = 0;
        Set<Integer> setB = new HashSet<>();
        for (int v : b) {
            sumB += v;
            setB.add(v);
        }

        long diff = sumA - sumB;
        // If difference is odd, cannot be split evenly into integers
        if (diff % 2 != 0) {
            return null;
        }

        long targetDelta = diff / 2;

        for (int valA : a) {
            long targetB = valA - targetDelta;
            if (targetB >= Integer.MIN_VALUE && targetB <= Integer.MAX_VALUE) {
                if (setB.contains((int) targetB)) {
                    return new int[] { valA, (int) targetB };
                }
            }
        }

        return null;
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Auxiliary Space | Key Advantage |
|---|---|---|---|
| **HashSet Complement** | **$O(A + B)$** | **$O(B)$** | Linear execution speed. |
| **Two-Pointer Sorted** | $O(A \log A + B \log B)$ | $O(1)$ | Zero heap memory allocations. |
| **Brute Force Pairs** | $O(A \cdot B)$ | $O(1)$ | Quadratic slowdown. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Cluster Load Rebalancing & Ledger Sync

1. **Kubernetes Pod Rebalancing:** When two node groups drift in CPU allocation, schedulers exchange workload assignments using swap difference equations to equilibrate utilization without triggering cold-start migrations.
2. **Double-Entry Accounting Reconciliation:** Auditing unbalanced debit and credit ledgers to identify offsetting transaction discrepancies.

## Edge Cases & Production Hardening

1. **Odd Total Sum Difference ($S_A - S_B$ is odd):** Checked via `diff % 2 != 0` returning `null` immediately.
2. **Integer Overflow on Sums:** Accumulated using 64-bit `long` sum variables.
