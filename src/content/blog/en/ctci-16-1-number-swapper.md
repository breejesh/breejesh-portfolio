---
title: "Number Swapper: In-Place Variable Exchange via Bitwise XOR and Arithmetic (CTCI 16.1)"
description: "Swap two numbers in-place without auxiliary memory using bitwise XOR and arithmetic differences, detailing overflow safety and compiler optimizations."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-1-number-swapper.webp
previewImage: /assets/images/ctci-16-1-number-swapper.webp
---

> **TL;DR**
> * **The Book Problem:** Write a function to swap two numbers in place (that is, without temporary variables).
> * **The Optimal Solutions:**
>   1. **Bitwise XOR (Invulnerable to Overflow)**:
>      * `a = a ^ b;`
>      * `b = a ^ b;` (evaluates to `(a ^ b) ^ b = a`)
>      * `a = a ^ b;` (evaluates to `(a ^ b) ^ a = b`)
>   2. **Arithmetic Difference (Signed Integer Overflow Risk)**:
>      * `a = a - b;`
>      * `b = a + b;` (evaluates to `(a - b) + b = a`)
>      * `a = b - a;` (evaluates to `a - (a - b) = b`)
>   3. Runs in **$O(1)$ time** and strictly **$O(1)$ auxiliary space**.
> * **Production Reality:** Register swapping in low-level assembly (`XCHG` instruction) and cryptographic substitution-permutation networks.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.1), we are asked:

*"Write a function to swap two numbers in place without allocating any temporary variables."*

## 2. Mathematical Proof of Inversion

### Bitwise XOR Invariants
XOR satisfies commutativity ($x \oplus y = y \oplus x$), associativity ($(x \oplus y) \oplus z = x \oplus (y \oplus z)$), identity ($x \oplus 0 = x$), and self-inversion ($x \oplus x = 0$).

$$\begin{aligned}
1.\quad a_1 &= a_0 \oplus b_0 \\
2.\quad b_1 &= a_1 \oplus b_0 = (a_0 \oplus b_0) \oplus b_0 = a_0 \oplus (b_0 \oplus b_0) = a_0 \oplus 0 = a_0 \\
3.\quad a_2 &= a_1 \oplus b_1 = (a_0 \oplus b_0) \oplus a_0 = b_0 \oplus (a_0 \oplus a_0) = b_0 \oplus 0 = b_0
\end{aligned}$$

## Production Java & C Implementations

```java
public class NumberSwapper {

    /**
     * Swaps two variables using Bitwise XOR.
     * Safe against arithmetic overflow and works across all integer bit widths.
     */
    public static void swapXor(int[] pair) {
        if (pair == null || pair.length < 2) return;
        
        pair[0] = pair[0] ^ pair[1];
        pair[1] = pair[0] ^ pair[1];
        pair[0] = pair[0] ^ pair[1];
    }

    /**
     * Swaps two variables using Arithmetic operations.
     */
    public static void swapArithmetic(int[] pair) {
        if (pair == null || pair.length < 2) return;

        pair[0] = pair[0] - pair[1];
        pair[1] = pair[0] + pair[1];
        pair[0] = pair[1] - pair[0];
    }
}
```

```c
// C In-Place Pointer Swap with XOR
void swap_xor(int *a, int *b) {
    if (a != b) { // Aliasing guard: prevents zeroing memory if pointers are identical
        *a ^= *b;
        *b ^= *a;
        *a ^= *b;
    }
}
```

## Complexity & Safety Analysis

| Method | Time Complexity | Auxiliary Space | Integer Overflow Risk | Pointer Aliasing Trap |
|---|---|---|---|---|
| **Bitwise XOR** | `O(1)` | `O(1)` | **None** (Bit-parallel operation) | Requires `a != b` guard |
| **Arithmetic Diff** | `O(1)` | `O(1)` | **High** (Undefined behavior in C for signed overflow) | Safe if addresses match |
| **Temp Variable (Standard)** | `O(1)` | `O(1)` | **None** | Completely safe & idiomatic |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Pointer Aliasing & Hardware XCHG

1. **The Dangerous Pointer Aliasing Trap:** If `swap_xor(&x, &x)` is invoked on the same memory location, the first operation `*x ^= *x` evaluates to `0`, permanently destroying the value (`*x = 0`).
2. **Compiler Optimization (`std::swap`):** Modern optimizing compilers (LLVM / GCC) recognize standard 3-line temporary variable swapping and compile it directly to the hardware `XCHG` or register move instructions, achieving superior pipelining over XOR chains.

## Edge Cases & Production Hardening

1. **Identical Memory Addresses:** Guarded with `if (a != b)` before performing in-place XOR.
2. **Min/Max Integer Boundaries:** XOR handles `Integer.MIN_VALUE` and `Integer.MAX_VALUE` flawlessly without bit truncation.
