---
title: "Factorial Zeros: Counting Trailing Zeros via Legendre's Formula (CTCI 16.5)"
description: "Compute the exact number of trailing zeros in n factorial without large number computation using Legendre's Formula and base-5 factorization in O(log5 n)."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-5-factorial-zeros.webp
previewImage: /assets/images/ctci-16-5-factorial-zeros.webp
---

> **TL;DR**
> * **The Book Problem:** Write an algorithm which computes the number of trailing zeros in $n$ factorial ($n!$).
> * **The Mathematical Breakthrough:** **Prime Factorization (Legendre's Formula)**:
>   1. Trailing decimal zeros are produced exclusively by pairs of prime factors $2 \times 5 = 10$.
>   2. In any factorial $n!$, factors of 2 occur far more frequently than factors of 5.
>   3. The number of trailing zeros is strictly determined by counting the multiplicity of the prime factor 5 in $n!$:
>      $$Z(n) = \sum_{k=1}^{\infty} \left\lfloor \frac{n}{5^k} \right\rfloor = \left\lfloor \frac{n}{5} \right\rfloor + \left\lfloor \frac{n}{25} \right\rfloor + \left\lfloor \frac{n}{125} \right\rfloor + \cdots$$
>   4. Avoid integer overflow when incrementing the divisor by repeatedly dividing $n$ by 5: `while (n > 0) { count += n / 5; n /= 5; }`.
>   5. Runs in **$O(\log_5 n)$ time** and strictly **$O(1)$ space**.
> * **Production Reality:** High-precision combinatorics, BigInt libraries, and RSA cryptographic key validation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.5), we are asked:

*"Write an algorithm which computes the number of trailing zeros in n factorial without computing the actual astronomical factorial value."*

## 2. Mathematical Derivation via Legendre's Formula

For $n = 26$:
* Multiples of $5$: $\{5, 10, 15, 20, 25\} \implies \lfloor 26 / 5 \rfloor = 5$
* Multiples of $25$: $\{25\} \implies \lfloor 26 / 25 \rfloor = 1$
* Total zeros: $5 + 1 = 6$.

```
Factorial Factors:
  1 .. 4, [5*1], 6 .. 9, [5*2], 11 .. 14, [5*3], 16 .. 19, [5*4], 21 .. 24, [5*5*1], 26
            │              │                │                │                │
            └──────────────┴────────────────┴────────────────┴────────────────┴─> 5 factors of 5
                                                                              └──> +1 extra factor (25 = 5^2)
Total 5s = 6 zeros.
```

## Production Java Implementation

```java
public class FactorialZeros {

    /**
     * Computes trailing zeros in n! in O(log5 n) time.
     * Prevents integer overflow by reducing n instead of multiplying the divisor.
     */
    public static int countTrailingZeros(int n) {
        if (n < 0) {
            return -1; // Invalid negative factorial
        }

        int count = 0;
        while (n >= 5) {
            count += n / 5;
            n /= 5;
        }
        return count;
    }

    /**
     * Alternative representation using power divisor loop
     */
    public static int countTrailingZerosDivisor(int n) {
        if (n < 0) return -1;
        int count = 0;
        for (long divisor = 5; n / divisor > 0; divisor *= 5) {
            count += (int)(n / divisor);
        }
        return count;
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(log5 n)` | Loop divides $n$ by 5 on every iteration ($\approx 13$ iterations for `Integer.MAX_VALUE`). |
| Auxiliary Space | `O(1)` | Constant memory footprint. |
| Overflow Safety | Guaranteed | Uses iterative division or 64-bit `long` divisor. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Arbitrary-Precision Arithmetic

1. **Astronomical Growth of $n!$:** $100!$ has 158 decimal digits, and $1000!$ has 2,568 digits. Attempting to compute $n!$ using `BigInteger` requires $O(n \log n \cdot M(n))$ multiplications and leads to massive memory bloat, whereas Legendre's Formula computes the zeros in under 1 nanosecond.
2. **Trailing Zero Removal (p-adic Valuation):** In cryptographic mathematics, extracting the $p$-adic valuation $\nu_p(n!)$ optimizes modular exponentiations and discrete logarithm attacks.

## Edge Cases & Production Hardening

1. **Negative Inputs:** Factorial is undefined for negative integers; returns `-1`.
2. **Zero and One:** $0! = 1$ and $1! = 1$, correctly returning $0$ trailing zeros.
3. **`Integer.MAX_VALUE` ($2,147,483,647$):** Resolves in 13 iterations with zero integer overflow.
