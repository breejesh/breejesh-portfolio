---
title: "Count of 2s: Digit-by-Digit Combinatorial Counting (CTCI 17.6)"
description: "Count the total occurrences of digit 2 in all integers from 0 to N using place-value boundary mathematics and combinatorial digit analysis in O(log10 N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-6-count-of-2s.webp
previewImage: /assets/images/ctci-17-6-count-of-2s.webp
---

> **TL;DR**
> * **The Book Problem:** Write a method to count the number of 2s that appear in all integers between $0$ and $n$ (inclusive).
> * **The Optimal Solution:** **Digit-by-Digit Place-Value Decomposition**:
>   1. For each power of 10 ($d = 1, 10, 100, \dots \le n$), isolate three components:
>      $$\text{higher} = \lfloor n / (10 \cdot d) \rfloor,\quad \text{digit} = \lfloor n / d \rfloor \pmod{10},\quad \text{lower} = n \pmod d$$
>   2. **Three Place-Value Cases**:
>      * $\text{digit} < 2 \implies \text{count} += \text{higher} \times d$
>      * $\text{digit} == 2 \implies \text{count} += (\text{higher} \times d) + \text{lower} + 1$
>      * $\text{digit} > 2 \implies \text{count} += (\text{higher} + 1) \times d$
>   3. Runs in **$O(\log_{10} n)$ time** (at most 10 iterations for 32-bit integers) and **$O(1)$ space**.
> * **Production Reality:** Database primary key fragmentation analysis, digital ledger range querying, and high-precision combinatorial mathematics.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.6), we are asked:

*"Count how many times the digit 2 appears across all numbers from 0 to n in sub-microsecond time without looping through all n numbers."*

## 2. Place-Value Combinatorial Cases

For $n = 513$ analyzing the tens place ($d = 10$, $\text{digit} = 1$):
* $\text{higher} = 5, \text{digit} = 1, \text{lower} = 3$.
* Because $\text{digit} < 2$, the tens place contributes $5 \times 10 = 50$ twos (from ranges `20..29`, `120..129`, `220..229`, `320..329`, `420..429`).

```
Full Formulation:
  Power = 10^k
  Higher = n / (Power * 10)
  Digit  = (n / Power) % 10
  Lower  = n % Power

  If (Digit < 2):   Twos += Higher * Power
  If (Digit == 2):  Twos += Higher * Power + Lower + 1
  If (Digit > 2):   Twos += (Higher + 1) * Power
```

## Production Java Implementation

```java
public class CountOf2s {

    /**
     * Computes total occurrences of digit 2 in [0..n] in O(log10 n) time.
     * Time Complexity: O(log10 n)
     * Space Complexity: O(1)
     */
    public static int count2sInRange(int n) {
        if (n < 2) {
            return 0;
        }

        int count = 0;
        int len = String.valueOf(n).length();

        for (int digit = 0; digit < len; digit++) {
            count += count2sAtDigit(n, digit);
        }

        return count;
    }

    private static int count2sAtDigit(int number, int d) {
        int powerOf10 = (int) Math.pow(10, d);
        int nextPowerOf10 = powerOf10 * 10;
        int right = number % powerOf10;

        int roundDown = number - (number % nextPowerOf10);
        int roundUp = roundDown + nextPowerOf10;

        int digit = (number / powerOf10) % 10;

        if (digit < 2) {
            return roundDown / 10;
        } else if (digit == 2) {
            return roundDown / 10 + right + 1;
        } else {
            return roundUp / 10;
        }
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Iterations for $N = 10^9$ | Space Complexity |
|---|---|---|---|
| **Place-Value Mathematics** | **$O(\log_{10} N)$** | **10 iterations** | **$O(1)$** |
| **Naive Brute-Force Counting** | $O(N \log_{10} N)$ | $9 \times 10^9$ operations | $O(1)$ |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Database Key Sparsity Analysis

1. **Auto-Increment ID Range Auditing:** When distributed databases (Spanner / CockroachDB) partition primary key ranges, combinatorial place-value analysis estimates digit density distribution across B-Tree shards without executing table full scans.
2. **Benford's Law Forensic Auditing:** Financial fraud detection engines compute expected vs. observed leading and interior digit frequencies using closed-form place-value formulas.

## Edge Cases & Production Hardening

1. **$N < 2$:** Returns $0$ immediately without entering loops.
2. **Exact Boundary Values ($N = 222$):** Correctly computes partial contributions from lower digit residues.
