---
title: "Next Number: Finding Next Smallest & Largest Numbers with Same Hamming Weight (CTCI 5.4)"
description: "Given a positive integer, compute the next largest and next smallest numbers with the exact same number of set 1-bits using bit manipulation in O(b) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-4-next-number.webp
previewImage: /assets/images/ctci-5-4-next-number.webp
---

> **TL;DR**
> * **The Book Problem:** Given a positive integer, print the next smallest and next largest number that have the same number of 1s in their binary representation.
> * **The Optimal Solution:** (1) **Get Next:** Find the first non-trailing zero at position $p$. Flip bit $p$ from `0` to `1`, clear all bits to the right ($0 \dots p-1$), and insert $c_1 - 1$ ones at the lowest positions ($0 \dots c_1-2$); (2) **Get Prev:** Find the first non-trailing one at position $p$. Flip bit $p$ from `1` to `0`, clear all bits to the right, and insert $c_1 + 1$ ones immediately to the right of $p$ in $O(b)$ time and $O(1)$ space.
> * **Production Reality:** Gosper's Hack for subset generation, chess bitboard move generation, and cryptographic Hamming weight permutations.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 5.4), we are asked:

*"Given a positive integer, print the next smallest and the next largest number that have the same number of 1s in their binary representation."*

## 2. Algorithmic Mechanics

### Algorithm for Next Largest (`getNext`)
1. Scan $n$ from right to left to count trailing zeros ($c_0$) and consecutive ones ($c_1$).
2. The index of the first non-trailing zero is $p = c_0 + c_1$.
3. If $p == 31$ or $p == 0$, no larger number with the same number of bits can fit in 32-bit positive integer range (error).
4. Flip bit $p$ to 1: `n |= (1 << p)`.
5. Clear all bits after $p$: `n &= ~((1 << p) - 1)`.
6. Insert $c_1 - 1$ ones on the right: `n |= (1 << (c_1 - 1)) - 1`.

### Algorithm for Next Smallest (`getPrev`)
1. Scan $n$ from right to left to count trailing ones ($c_1$) and consecutive zeros ($c_0$).
2. The index of the first non-trailing one is $p = c_0 + c_1$.
3. Flip bit $p$ to 0: `n &= ~((1 << (p + 1)) - 1)`.
4. Insert $c_1 + 1$ ones immediately to the right of $p$: `int mask = (1 << (c_1 + 1)) - 1; n |= mask << (c_0 - 1)`.

## Production Implementation

```java
public class NextNumber {
    /**
     * Computes the next largest number with identical bit count.
     * Time Complexity: O(b) where b <= 32
     * Space Complexity: O(1)
     */
    public static int getNext(int n) {
        int c = n;
        int c0 = 0;
        int c1 = 0;

        while (((c & 1) == 0) && (c != 0)) {
            c0++;
            c >>= 1;
        }

        while ((c & 1) == 1) {
            c1++;
            c >>= 1;
        }

        // Error if n is like 11110000...00 (cannot fit in 32-bit positive int)
        if (c0 + c1 == 31 || c0 + c1 == 0) {
            return -1;
        }

        int p = c0 + c1; // position of rightmost non-trailing zero

        n |= (1 << p); // Flip rightmost non-trailing zero
        n &= ~((1 << p) - 1); // Clear all bits to the right of p
        n |= (1 << (c1 - 1)) - 1; // Insert (c1 - 1) ones on the right

        return n;
    }

    /**
     * Computes the next smallest number with identical bit count.
     * Time Complexity: O(b) where b <= 32
     * Space Complexity: O(1)
     */
    public static int getPrev(int n) {
        int temp = n;
        int c0 = 0;
        int c1 = 0;

        while ((temp & 1) == 1) {
            c1++;
            temp >>= 1;
        }

        if (temp == 0) return -1; // If n is like 000...001111, no smaller exists

        while (((temp & 1) == 0) && (temp != 0)) {
            c0++;
            temp >>= 1;
        }

        int p = c0 + c1; // position of rightmost non-trailing one
        n &= ((~0) << (p + 1)); // clears from bit p onwards

        int mask = (1 << (c1 + 1)) - 1; // (c1 + 1) ones
        n |= mask << (c0 - 1);

        return n;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(b)` | Inspects at most 32 bits using bitwise shifts. |
| Auxiliary Space | `O(1)` | Local primitive registers. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Gosper's Hack and Bitboards

1. **Chess Engine Move Generators (Bitboards):** Enumerate piece configurations with identical Hamming weights to generate legal tactical moves.
2. **Gosper's Hack (`next_permutation` on Bitsets):** Iterates over all $\binom{N}{K}$ subsets of size $K$ in constant time per step using `c = (n & -n); r = n + c; n = (((r ^ n) >> 2) / c) | r;`.

## Edge Cases & Production Hardening

1. **Numbers with no valid larger/smaller equivalent in 32-bit range:** Returns `-1`.
2. **Power of two ($n = 4 \to 0100$):** `getNext` returns $8$ ($1000$), `getPrev` returns $2$ ($0010$).
