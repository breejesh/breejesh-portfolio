---
title: "Binary to String: Converting Real Numbers to Fixed-Precision Binary (CTCI 5.2)"
description: "Given a real number between 0 and 1 passed as a double, print its binary representation with at most 32 characters or return ERROR in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-2-binary-to-string.webp
previewImage: /assets/images/ctci-5-2-binary-to-string.webp
---

> **TL;DR**
> * **The Book Problem:** Given a real number between 0 and 1 (e.g., 0.72) that is passed in as a double, print the binary representation. If the number cannot be represented accurately in binary with at most 32 characters, print "ERROR".
> * **The Optimal Solution:** Repeated Multiplication by 2: In binary, multiplying a fractional number by 2 shifts the fractional binary digits left by one position. If the product $r = num \times 2 \ge 1$, the next bit is `1` (and we subtract 1 from $r$); otherwise the next bit is `0`. If the binary string exceeds 32 characters before terminating, return `"ERROR"` in $O(1)$ time and $O(1)$ space.
> * **Production Reality:** IEEE 754 floating-point encoder/decoder implementations, fixed-point financial arithmetic formatting, and GPU shader precision bounds.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 5.2), we are asked:

*"Given a real number between 0 and 1 (e.g., 0.72) that is passed in as a double, print the binary representation. If the number cannot be represented accurately in binary with at most 32 characters, print 'ERROR'."*

**Mathematical Basis:**
Any base-10 real number $x \in (0, 1)$ can be written in binary fractional notation as:
$$x = \sum_{i=1}^{\infty} b_i \cdot 2^{-i} = b_1 \cdot 2^{-1} + b_2 \cdot 2^{-2} + b_3 \cdot 2^{-3} + \dots$$
Multiplying $x$ by 2 yields $2x = b_1 + b_2 \cdot 2^{-1} + b_3 \cdot 2^{-2} + \dots$, where the integer part is precisely the first binary bit $b_1$.

## 2. Algorithmic Mechanics

1. Validate that $0 < num < 1$.
2. Initialize `StringBuilder binary = new StringBuilder(".")`.
3. Loop while `num > 0`:
   * If `binary.length() >= 32`, return `"ERROR"`.
   * Compute `double r = num * 2`.
   * If $r \ge 1$:
     * Append `'1'`.
     * Update `num = r - 1`.
   * Else:
     * Append `'0'`.
     * Update `num = r`.
4. Return `binary.toString()`.

## Production Implementation

```java
public class BinaryToString {
    /**
     * Converts a real number in (0, 1) to binary string representation.
     * Returns "ERROR" if precision exceeds 32 characters.
     * Time Complexity: O(1) [at most 32 iterations]
     * Space Complexity: O(1)
     */
    public static String printBinary(double num) {
        if (num >= 1 || num <= 0) {
            return "ERROR";
        }

        StringBuilder binary = new StringBuilder();
        binary.append(".");

        while (num > 0) {
            // Setting a limit on length: 32 characters
            if (binary.length() >= 32) {
                return "ERROR";
            }

            double r = num * 2;
            if (r >= 1) {
                binary.append(1);
                num = r - 1;
            } else {
                binary.append(0);
                num = r;
            }
        }

        return binary.toString();
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(1)` | Loop runs at most 32 times before hitting the error limit or terminating. |
| Auxiliary Space | `O(1)` | String buffer bounded by 32 characters. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Floating-Point Precision & Rounding

1. **IEEE 754 Standard Decimal-to-Binary Converters:** Numbers like $0.1_{10}$ are infinitely repeating binary fractions ($0.000110011..._2$). Financial engines avoid binary floating-point representations entirely, utilizing `BigDecimal` or fixed-point integer scaling.
2. **GPU Fragment Shader Color Conversion:** Normalizing 8-bit RGBA integer channels $[0, 255]$ into $[0.0, 1.0]$ float values.

## Edge Cases & Production Hardening

1. **Exact powers of two ($0.5 \to .1$, $0.75 \to .11$, $0.625 \to .101$):** Terminates cleanly in few iterations.
2. **Repeating fractions ($0.1, 0.72$):** Correctly detected when string exceeds 32 chars and returns `"ERROR"`.
3. **Invalid inputs ($num \le 0$ or $num \ge 1$):** Defensive check returns `"ERROR"`.
