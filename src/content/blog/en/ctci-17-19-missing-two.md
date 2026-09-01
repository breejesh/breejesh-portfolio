---
title: "Missing Two: Gaussian Sum and XOR Variance Equations for Two Missing Numbers (CTCI 17.19)"
description: "Find two missing numbers from an array of 1 to N using algebraic sum and sum-of-squares equations solvable in O(N) time and O(1) space without hash sets."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-19-missing-two.webp
previewImage: /assets/images/ctci-17-19-missing-two.webp
---

> **TL;DR**
> * **The Book Problem:** An array originally containing integers 1 through N is missing two numbers. Find both in $O(N)$ time and $O(1)$ space.
> * **The Optimal Solution:** **Sum and Sum-of-Squares System of Equations**:
>   1. **Compute Deficits**: Let $x$ and $y$ be the missing numbers.
>      $$S_1 = \frac{N(N+1)}{2} - \sum\text{arr} = x + y$$
>      $$S_2 = \frac{N(N+1)(2N+1)}{6} - \sum\text{arr}_i^2 = x^2 + y^2$$
>   2. **Solve**: From $(x+y)^2 - (x^2+y^2) = 2xy$, derive $x \cdot y$ and solve the quadratic $t^2 - (x+y)t + xy = 0$.
>   3. Runs in **$O(N)$ time** and **$O(1)$ space**.
> * **Production Reality:** Data integrity auditing in distributed ledger reconciliation and stream deduplication quality checks.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.19), we are asked:

*"You are given an array with numbers from 1 to N, where N is at most 32000. The array may have duplicate entries and may be missing some numbers. Find the missing two numbers."*

## 2. Algebraic Derivation

```
N = 5, arr = [3, 1, 2]    (missing 4 and 5)

Expected Sum:  1+2+3+4+5 = 15
Actual Sum:    1+2+3      = 6
x + y = S1 = 9

Expected SumSq:  1+4+9+16+25 = 55
Actual SumSq:    1+4+9        = 14
x^2 + y^2 = S2 = 41

xy = ((S1^2) - S2) / 2 = (81 - 41) / 2 = 20

Quadratic: t^2 - 9t + 20 = 0
(t - 4)(t - 5) = 0  =>  {4, 5}
```

## Production Java Implementation

```java
public class MissingTwo {

    public static int[] missingTwo(int[] array) {
        int n = array.length + 2; // original length before removals

        long sumN = (long) n * (n + 1) / 2;
        long sumSqN = (long) n * (n + 1) * (2 * n + 1) / 6;

        long actualSum = 0;
        long actualSumSq = 0;
        for (int v : array) {
            actualSum += v;
            actualSumSq += (long) v * v;
        }

        long s1 = sumN - actualSum;       // x + y
        long s2 = sumSqN - actualSumSq;   // x^2 + y^2

        // xy = ((x+y)^2 - (x^2+y^2)) / 2
        long xy = (s1 * s1 - s2) / 2;

        // Solve: t^2 - s1*t + xy = 0
        // discriminant = s1^2 - 4*xy
        long discriminant = s1 * s1 - 4 * xy;
        long sqrtD = (long) Math.round(Math.sqrt(discriminant));

        int x = (int) ((s1 + sqrtD) / 2);
        int y = (int) ((s1 - sqrtD) / 2);

        return new int[]{x, y};
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Space | Overflow Risk |
|---|---|---|---|
| **Sum + Sum-of-Squares** | **$O(N)$** | **$O(1)$** | Use `long` for N up to 32000 |
| BitSet Marking | $O(N)$ | $O(N/8)$ | None |
| Sorting | $O(N \log N)$ | $O(1)$ | None |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Distributed Ledger Reconciliation

1. **Bank Transaction Reconciliation:** Nightly batch jobs verify that no transaction sequence numbers are duplicated or missing across distributed shards using algebraic checksum equations.
2. **Sensor Reading Quality Assurance:** Industrial IoT pipelines verify no sample IDs were dropped from a continuous reading stream.

## Edge Cases & Production Hardening

1. **Integer Overflow:** Use `long` arithmetic for sums; $N \leq 32000$ gives $\sum N^2 \approx 10^{10}$, safely within `long` range.
2. **Floating-Point Sqrt:** Round carefully to nearest integer to avoid off-by-one from floating-point imprecision.
