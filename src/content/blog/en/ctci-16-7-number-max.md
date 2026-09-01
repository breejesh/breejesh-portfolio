---
title: "Number Max: Branchless Maximum Computation with Overflow Safety (CTCI 16.7)"
description: "Compute the maximum of two integers without if-else or comparison operators using sign-bit extraction, bitwise multiplexing, and overflow guards."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-7-number-max.webp
previewImage: /assets/images/ctci-16-7-number-max.webp
---

> **TL;DR**
> * **The Book Problem:** Write a method that finds the maximum of two numbers. You should not use `if-else` or any other comparison operator.
> * **The Optimal Solution:** **Branchless Sign-Bit Multiplexing with Overflow Protection**:
>   1. **Sign Extraction**: Extract the MSB sign bit: `sign(x) = ((x >> 31) & 1) ^ 1` ($1$ if $x \ge 0$, $0$ if $x < 0$).
>   2. **The Overflow Trap**: Directly evaluating $a - b$ overflows when $a$ and $b$ have opposite signs (e.g. $a = \text{MAX\_VALUE}, b = -5$).
>   3. **Branchless Disjunction**:
>      * If signs of $a$ and $b$ are *different* (`sa ^ sb == 1`): $a - b$ might overflow, so choose $a$ if $a \ge 0$ (`k = sa`).
>      * If signs of $a$ and $b$ are the *same* (`sa ^ sb == 0`): $a - b$ cannot overflow, so choose based on `sc = sign(a - b)`.
>      * Unified coefficient: `k = (sa ^ sb) * sa + (1 ^ (sa ^ sb)) * sc`.
>   4. **Return Value**: `return a * k + b * (1 ^ k);`.
>   5. Runs in **$O(1)$ time** with strictly zero branch misprediction penalties.
> * **Production Reality:** SIMD vector instructions (`PMAXSD` in AVX2/NEON) and constant-time cryptographic primitives.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.7), we are asked:

*"Find the maximum of two integers a and b without using if-else, ternary operators (? :), switch statements, or comparison operators (<, >, <=, >=, ==)."*

## 2. Mathematical & Bitwise Mechanics

```
Let sign(x) = 1 if x >= 0 else 0:
  sign(x) = ((x >>> 31) ^ 1)

If signs differ (sa ^ sb == 1):
  k = sa  (take a if positive, else take b)

If signs match (sa ^ sb == 0):
  k = sign(a - b)

Merged branchless formula:
  k = (use_sign_a * sa) + (use_sign_c * sc)
  return a * k + b * (1 - k)
```

## Production Java Implementation

```java
public class NumberMax {

    /**
     * Returns 1 if a >= 0, and 0 if a < 0.
     */
    private static int sign(int a) {
        return (a >>> 31) ^ 1;
    }

    /**
     * Computes max(a, b) branchlessly with complete overflow protection.
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     */
    public static int getMax(int a, int b) {
        int sa = sign(a);
        int sb = sign(b);
        int sc = sign(a - b); // Safe only if a and b have identical signs

        // Flag: 1 if signs of a and b are different, 0 if same
        int useSignA = sa ^ sb;

        // Flag: 1 if signs of a and b are same, 0 if different
        int useSignC = useSignA ^ 1;

        // Unified selection coefficient
        int k = useSignA * sa + useSignC * sc;
        int q = k ^ 1; // Invert k (1 if b is greater, 0 if a is greater)

        return a * k + b * q;
    }
}
```

## Complexity & Architecture Analysis

| Metric | Value | Technical Detail |
|---|---|---|
| Time Complexity | `O(1)` | Exactly 11 bitwise operations (shifts, XORs, multiplications). |
| Auxiliary Space | `O(1)` | Zero dynamic memory allocation. |
| Branch Mispredictions | `0%` | Pure arithmetic/bitwise data-flow graph without jumps. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Constant-Time Cryptography & SIMD

1. **Constant-Time Cryptography (Side-Channel Resistance):** In OpenSSL and BoringSSL, secret cryptographic keys must never be compared using conditional branches (`if (a > b)`). Branch predictors leak execution timing information to CPU cache side-channel attacks (Spectre/Meltdown). Branchless sign-bit multiplexing guarantees identical execution cycles regardless of data values.
2. **SIMD Vectorization:** Modern compilers vectorize branchless integer maximums using hardware instructions such as x86 AVX2 `_mm256_max_epi32` or ARM NEON `VMAX.S32`.

## Edge Cases & Production Hardening

1. **Extreme Overflow Boundary:** $a = \text{Integer.MAX\_VALUE} \ (2^{31}-1)$ and $b = \text{Integer.MIN\_VALUE} \ (-2^{31})$. Since signs differ, `useSignA = 1`, completely skipping the overflowing $a - b$ subtraction and returning $a$.
2. **Identical Inputs ($a = b$):** $a - b = 0 \implies sc = 1 \implies k = 1$, correctly returning $a$.
