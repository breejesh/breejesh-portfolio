---
title: "Pairwise Swap: Swapping Odd and Even Bits with Minimal Instructions (CTCI 5.7)"
description: "Write a program to swap odd and even bits in a 32-bit integer with as few instructions as possible using bitmasks in O(1) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-7-pairwise-swap.webp
previewImage: /assets/images/ctci-5-7-pairwise-swap.webp
---

> **TL;DR**
> * **The Book Problem:** Write a program to swap odd and even bits in an integer with as few instructions as possible (e.g., bit 0 and bit 1 are swapped, bit 2 and bit 3 are swapped, and so on).
> * **The Optimal Solution:** Mask and Shift: (1) Extract even bits with mask `0xAAAAAAAA` ($10101010\dots_2$) and shift right by 1 using logical shift `>>> 1`; (2) Extract odd bits with mask `0x55555555` ($01010101\dots_2$) and shift left by 1 using `<< 1`; (3) Combine results with bitwise OR: `((x & 0xAAAAAAAA) >>> 1) | ((x & 0x55555555) << 1)` in $O(1)$ time and $O(1)$ space.
> * **Production Reality:** SIMD bit matrix transposition, endianness byte permutation routines, and GPU raster scan-line interleaving.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 5.7), we are asked:

*"Write a program to swap odd and even bits in an integer with as few instructions as possible (e.g., bit 0 and bit 1 are swapped, bit 2 and bit 3 are swapped, and so on)."*

## 2. Bitmask Mechanics

In a 32-bit integer:
* **Even-indexed bits** (bits $30, 28, \dots, 2, 0$): Masked by hexadecimal `0xAAAAAAAA` ($10101010101010101010101010101010_2$).
* **Odd-indexed bits** (bits $31, 29, \dots, 3, 1$): Masked by hexadecimal `0x55555555` ($01010101010101010101010101010101_2$).

To swap adjacent pairs:
1. Mask out all even bits and shift them right by 1: `(x & 0xaaaaaaaa) >>> 1`.
2. Mask out all odd bits and shift them left by 1: `(x & 0x55555555) << 1`.
3. Combine using bitwise OR (`|`).

## Production Implementation

```java
public class PairwiseSwap {
    /**
     * Swaps odd and even bits in a 32-bit integer.
     * Time Complexity: O(1) [3 bitwise operations]
     * Space Complexity: O(1)
     */
    public static int swapOddEvenBits(int x) {
        // 0xaaaaaaaa extracts bits 31, 29, 27, ..., 1
        // Logical right shift moves them to 30, 28, 26, ..., 0
        int evenShifted = (x & 0xaaaaaaaa) >>> 1;

        // 0x55555555 extracts bits 30, 28, 26, ..., 0
        // Left shift moves them to 31, 29, 27, ..., 1
        int oddShifted = (x & 0x55555555) << 1;

        return evenShifted | oddShifted;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(1)` | Exactly 3 bitwise machine instructions (AND, Shift, OR). |
| Auxiliary Space | `O(1)` | Direct CPU register operation. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: SIMD Permutations

1. **AVX / NEON Vector Bit Permutations:** High-performance cryptography (AES S-box permutations) and audio DSP filters parallelize bit transposition across 256-bit SIMD registers using pairwise bitmask shifts.
2. **GPU Texture Swizzling (Morton Code / Z-Order Curve):** Interleaves $X$ and $Y$ spatial coordinate bits using bitwise masking masks (`0x55555555`, `0x33333333`, `0x0F0F0F0F`) to optimize texture cache locality.

## Edge Cases & Production Hardening

1. **Logical vs Arithmetic Right Shift:** Using `>>>` (logical right shift) instead of `>>` (arithmetic right shift) ensures sign-extension does not introduce extraneous 1-bits into the most significant bit position.
2. **Zero input ($0$):** Returns $0$.
3. **All ones ($-1$ / `0xFFFFFFFF`):** Returns $-1$.
