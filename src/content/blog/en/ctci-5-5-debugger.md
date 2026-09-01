---
title: "Debugger: Understanding ((n & (n - 1)) == 0) and Power-of-Two Detection (CTCI 5.5)"
description: "Explain the algorithmic mechanics of the bitwise expression ((n & (n - 1)) == 0) and how it detects powers of two and zero in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-5-debugger.webp
previewImage: /assets/images/ctci-5-5-debugger.webp
---

> **TL;DR**
> * **The Book Problem:** Explain what the following code does: `((n & (n - 1)) == 0)`.
> * **The Optimal Explanation:** Subtracting 1 from $n$ flips the least significant 1-bit to `0` and flips all trailing zeros after it to `1`. If $n$ has exactly one 1-bit (i.e., $n$ is a power of two), $n$ and $n - 1$ have zero 1-bits in common, causing $n \ \& \ (n - 1)$ to equal `0`. Thus, `((n & (n - 1)) == 0)` checks whether $n$ is a **power of two** (or $n == 0$) in $O(1)$ time and $O(1)$ space.
> * **Production Reality:** Ring buffer circular wrapping bounds checks, memory alignment allocations, and hash table bucket capacity sizing.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 5.5), we are asked:

*"Explain what the following code does: `((n & (n - 1)) == 0)`"*

## 2. Bitwise Mathematical Breakdown

Consider what happens when you subtract 1 from an integer $n$:
1. **Case A: $n$ ends in a 1 (e.g. $n = \dots 1$):**
   * $n = \text{abc}1$
   * $n - 1 = \text{abc}0$
   * $n \ \& \ (n - 1) = \text{abc}0$ (only the least significant bit is cleared).
2. **Case B: $n$ ends in zeros (e.g. $n = \dots 1000$):**
   * $n = \text{abc}1000$
   * $n - 1 = \text{abc}0111$
   * $n \ \& \ (n - 1) = \text{abc}0000$.

Notice that $n \ \& \ (n - 1)$ **always clears the lowest set 1-bit** of $n$, leaving all higher bits ($\text{abc}$) untouched.

### When Does $n \ \& \ (n - 1) == 0$?
The expression yields `0` if and only if there are no higher bits ($\text{abc} = 0$). That is, $n$ possesses **at most one single 1-bit**:
* If $n = 0$: $0 \ \& \ -1 = 0 \implies \text{true}$.
* If $n = 2^k$ (power of two): single 1-bit at index $k$ is cleared $\implies \text{true}$.
* If $n$ has 2 or more 1-bits: $\text{false}$.

Therefore:
$$\text{isPowerOfTwo}(n) \iff n > 0 \text{ and } ((n \ \& \ (n - 1)) == 0)$$

## Production Implementation

```java
public class Debugger {
    /**
     * Checks if a positive integer is an exact power of two.
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     */
    public static boolean isPowerOfTwo(int n) {
        return n > 0 && ((n & (n - 1)) == 0);
    }

    /**
     * Clears the lowest set bit in an integer.
     * Foundational utility for Brian Kernighan's bit-counting algorithm.
     */
    public static int clearLowestSetBit(int n) {
        return n & (n - 1);
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(1)` | Single subtraction and bitwise AND operation (1 CPU cycle). |
| Auxiliary Space | `O(1)` | Zero memory allocations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Power-of-Two Fast Paths

1. **Circular Ring Buffers (Disruptor / Netty):** When buffer capacity $C = 2^k$, modulo index wrapping `index % C` is replaced by single-cycle bitmask `index & (C - 1)`.
2. **Hash Table Bucket Masking (Java `HashMap`):** Enforces table capacities to be powers of two so bucket indices are computed via `hash & (capacity - 1)`.
3. **Memory Allocators (jemalloc / tcmalloc):** Aligns memory chunk sizes to powers of two to minimize fragmentation.

## Edge Cases & Production Hardening

1. **$n = 0$:** `(0 & -1) == 0` evaluates to `true`. In production power-of-two checks, explicitly guard with `n > 0`.
2. **Negative numbers:** In two's complement, `Integer.MIN_VALUE` (`0x80000000`) has a single 1-bit; `n > 0` guard prevents false positives.
