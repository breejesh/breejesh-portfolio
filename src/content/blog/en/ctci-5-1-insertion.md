---
title: "Insertion: Bit Manipulation & Bitmask Clearing in O(1) Time (CTCI 5.1)"
description: "You are given two 32-bit numbers, N and M, and two bit positions, i and j. Write a method to insert M into N such that M starts at bit j and ends at bit i using bitmask clearing."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-1-insertion.webp
previewImage: /assets/images/ctci-5-1-insertion.webp
---

> **TL;DR**
> * **The Book Problem:** You are given two 32-bit numbers, N and M, and bit positions i and j. Insert M into N such that M starts at bit j and ends at bit i.
> * **The Core Breakthrough:** Bitmask Clearing: (1) Create mask `~0 << (j + 1)` and `(1 << i) - 1`, OR them together to create a mask with 0s between $i$ and $j$; (2) Clear bits $i..j$ in $N$ with `n & mask`; (3) Shift $M$ with `m << i`; (4) Combine with `(n & mask) | (m << i)` in $O(1)$ time.
> * **Production Reality:** Network packet header encapsulation, hardware control register updates, and GPU pixel bit packing.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 5.1), we are given $N = 10000000000_2$, $M = 10011_2$, $i = 2, j = 6$. Output should be $N = 10001001100_2$.

## 2. The Bitmask Clearing & Merging Strategy

1. **Clear bits $i$ through $j$ in $N$:** Create a mask with 1s everywhere except 0s between $i$ and $j$:
   * Left side: `left = (~0) << (j + 1)`
   * Right side: `right = (1 << i) - 1`
   * Combined mask: `mask = left | right`
2. **Clear bits in $N$:** `n_cleared = N & mask`
3. **Shift and merge $M$:** `(m << i) | n_cleared`

## Production Implementation

```java
public class BitInsertion {
    public static int updateBits(int n, int m, int i, int j) {
        // Create mask to clear bits i through j in n
        // Example: i = 2, j = 4 -> mask = 11100011
        int allOnes = ~0; // 11111111...

        // 1s before position j, then 0s. left = 11100000
        int left = (j >= 31) ? 0 : (allOnes << (j + 1));

        // 1s after position i. right = 00000011
        int right = ((1 << i) - 1);

        // All 1s, except for 0s between i and j. mask = 11100011
        int mask = left | right;

        // Clear bits j through i, then put m in there
        int n_cleared = n & mask;
        int m_shifted = m << i;

        return n_cleared | m_shifted;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(1)` | Bitwise shift and masking instructions execute in single CPU cycle. |
| Auxiliary Space | `O(1)` | Single register calculation. |

## Real-World Systems Engineering Discussion

Operating system device drivers update hardware control registers (e.g. Ethernet MAC address filters or PCIe configuration spaces) by masking target bitfields without overwriting adjacent flags.

## Edge Cases & Production Hardening

1. j = 31 (MSB edge): Managed with conditional boundary check `j >= 31 ? 0 : ...` to prevent 32-bit shift overflow.
2. i = 0 (LSB edge): Right mask equals 0.
