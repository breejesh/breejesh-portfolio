---
title: "Recursive Multiply: Bit Doubling Multiplication without Operators (CTCI 8.5)"
description: "Multiply two positive integers without using the * or / operators using divide-and-conquer bit doubling recursion in O(log S) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-5-recursive-multiply.webp
previewImage: /assets/images/ctci-8-5-recursive-multiply.webp
---

> **TL;DR**
> * **The Book Problem:** Write a recursive function to multiply two positive integers without using the `*` operator (or `/` operator). You can use addition, subtraction, and bit shifting, but you should minimize the number of operations.
> * **The Optimal Solution:** Divide-and-Conquer Bit Doubling: (1) Identify smaller integer $S$ and bigger integer $B$; (2) Halve $S$ using bit shift `half = multiply(S >> 1, B)`; (3) If $S$ is even, return `half + half` (`half << 1`); if $S$ is odd, return `half + half + B`. By caching the single half computation, the recursion executes in optimal **$O(\log S)$ time** and **$O(\log S)$ call stack space**.
> * **Production Reality:** Ancient Egyptian / Russian Peasant multiplication hardware multiplier ALUs and Karatsuba / Montgomery multiplication in large-number cryptography (RSA).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.5), we are asked:

*"Write a recursive function to multiply two positive integers without using the * operator (or / operator). You can use addition, subtraction, and bit shifting, but you should minimize the number of operations."*

## 2. Mathematical Foundation: Russian Peasant / Bit Halving

To compute $S \times B$ where $S \le B$:
1. If $S == 0$, return $0$.
2. If $S == 1$, return $B$.
3. Compute $H = \lfloor S / 2 \rfloor \times B$ (recursively compute once with $S \gg 1$).
4. If $S$ is even: $S \times B = 2 \times H = H + H$.
5. If $S$ is odd: $S \times B = 2 \times H + B = H + H + B$.

This cuts $S$ in half at each step, taking exactly $\lfloor \log_2 S \rfloor$ recursive steps.

## Production Implementation

```java
public class RecursiveMultiply {
    /**
     * Multiplies two positive integers without * or / operators.
     * Time Complexity: O(log(min(a, b)))
     * Space Complexity: O(log(min(a, b)))
     */
    public static int minProduct(int a, int b) {
        int bigger = a < b ? b : a;
        int smaller = a < b ? a : b;
        return minProductHelper(smaller, bigger);
    }

    private static int minProductHelper(int smaller, int bigger) {
        if (smaller == 0) return 0;
        if (smaller == 1) return bigger;

        // Divide smaller by 2 using logical bit shift
        int s = smaller >> 1;
        int halfProd = minProductHelper(s, bigger);

        if (smaller % 2 == 0) {
            return halfProd + halfProd;
        } else {
            return halfProd + halfProd + bigger;
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(log S)` | Where $S = \min(a, b)$. Halves $S$ on each recursion level. |
| Auxiliary Space | `O(log S)` | Call stack depth bounded by the number of bits in $S$ ($\le 31$). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Arithmetic Logic Units (ALUs)

1. **Hardware Multiplier Circuits (Booth's Multiplication):** Silicon ALUs perform multiplication in $O(\log N)$ clock cycles by shifting and adding binary partial products.
2. **Cryptographic Big-Integer Multiplication (RSA / Elliptic Curve):** Modular multiplication algorithms (Karatsuba / Montgomery reduction) decompose large integers into halved limbs to reduce multiplication complexity.

## Edge Cases & Production Hardening

1. **Multiplying by 0:** Base case returns 0 immediately.
2. **Multiplying by 1:** Base case returns `bigger` immediately.
3. **Equal inputs ($A == B$):** Halving works seamlessly.
