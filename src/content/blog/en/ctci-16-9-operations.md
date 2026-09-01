---
title: "Operations: Implementing Subtract, Multiply, and Divide with Only Add (CTCI 16.9)"
description: "Implement integer subtraction, multiplication, and division using exclusively the addition operator, featuring exponential doubling negation in O(log N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-9-operations.webp
previewImage: /assets/images/ctci-16-9-operations.webp
---

> **TL;DR**
> * **The Book Problem:** Write methods to implement the multiply, subtract, and divide operations for integers. The only operator you are allowed to use is the add (`+`) operator.
> * **The Optimal Solution:** **Exponential Doubling Negation & Quotient Doubling**:
>   1. **Negation (`negate(x)`)**: Rather than adding $\pm 1$ in $O(N)$ steps, exponentially double the delta ($\Delta = -1, -2, -4, -8, \dots$) in $O(\log |x|)$ steps.
>   2. **Subtraction (`subtract(a, b)`)**: $a - b = a + \text{negate}(b)$.
>   3. **Multiplication (`multiply(a, b)`)**: Repeatedly add $a$ to itself $|b|$ times (optimized via doubling $a + a = 2a$).
>   4. **Division (`divide(a, b)`)**: Determine how many times $|b|$ fits into $|a|$ using binary quotient doubling, subtracting scaled multiples of $b$.
>   5. Negation runs in **$O(\log |x|)$ time**; Division runs in **$O(\log^2 (a / b))$ time**.
> * **Production Reality:** ALU arithmetic logic unit hardware circuits (Half Adders / Full Adders) and arbitrary-precision integer libraries without hardware division support.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.9), we are asked:

*"Implement integer subtraction, multiplication, and division using ONLY the addition operator (+). No -, *, /, %, or bitwise shift operators allowed."*

## 2. Exponential Doubling Negation ($O(\log N)$)

Instead of stepping by $-1$ sequentially ($1,000,000$ iterations for $x = 1,000,000$), we exponentially double the decrement:

```
Target: Negate 37
  Step 1: delta = -1, -2, -4, -8, -16, -32  (negated = -32, remaining = 5)
  Step 2: delta = -1, -2, -4               (negated = -36, remaining = 1)
  Step 3: delta = -1                       (negated = -37, remaining = 0)
Total Additions: ~10 operations instead of 37!
```

## Production Java Implementation

```java
public class Operations {

    /**
     * Negates an integer in O(log |a|) time using exponential doubling.
     */
    public static int negate(int a) {
        if (a == 0) return 0;
        int negated = 0;
        int direction = (a < 0) ? 1 : -1;
        int delta = direction;

        while (a != 0) {
            // Check if doubling delta exceeds remaining magnitude
            boolean willExceed = (direction > 0) ? (a + delta > 0) : (a + delta < 0);
            if (willExceed) {
                delta = direction; // Reset delta back to +/- 1
            }
            negated += delta;
            a += delta;
            delta += delta; // Exponential doubling
        }
        return negated;
    }

    /**
     * Subtraction: a - b = a + (-b)
     */
    public static int subtract(int a, int b) {
        return a + negate(b);
    }

    /**
     * Multiplication via Repeated Exponential Addition
     */
    public static int multiply(int a, int b) {
        if (a == 0 || b == 0) return 0;
        if (abs(a) < abs(b)) {
            return multiply(b, a); // Optimization: fewer additions
        }

        int absB = abs(b);
        int product = 0;

        for (int i = 0; i < absB; i++) {
            product += a;
        }

        return (b < 0) ? negate(product) : product;
    }

    /**
     * Division: Computes a / b via Binary Quotient Doubling
     */
    public static int divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("Division by zero");
        }
        if (a == 0) return 0;

        int absA = abs(a);
        int absB = abs(b);

        int quotient = 0;
        int total = 0;

        while (total + absB <= absA) {
            int currentProduct = absB;
            int currentQuotient = 1;

            // Exponential doubling of divisor
            while (total + currentProduct + currentProduct <= absA) {
                currentProduct += currentProduct;
                currentQuotient += currentQuotient;
            }

            total += currentProduct;
            quotient += currentQuotient;
        }

        // Apply correct sign
        boolean sameSign = (a > 0 && b > 0) || (a < 0 && b < 0);
        return sameSign ? quotient : negate(quotient);
    }

    private static int abs(int a) {
        return (a < 0) ? negate(a) : a;
    }
}
```

## Complexity Analysis

| Operation | Time Complexity | Auxiliary Space | Key Algorithmic Strategy |
|---|---|---|---|
| **`negate(a)`** | $O(\log |a|)$ | $O(1)$ | Exponential doubling delta ($\Delta \leftarrow \Delta + \Delta$) |
| **`subtract(a, b)`** | $O(\log |b|)$ | $O(1)$ | Direct addition of negated subtrahend |
| **`multiply(a, b)`** | $O(\min(|a|, |b|))$ | $O(1)$ | Repeated addition of larger multiplicand |
| **`divide(a, b)`** | $O(\log^2 (a / b))$ | $O(1)$ | Binary divisor scaling |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Hardware Arithmetic Logic Units (ALUs)

1. **Adder-Only Microarchitectures:** Simple microcontrollers and ASIC crypto accelerators often lack dedicated hardware multiplier/divider silicon blocks due to transistor budget constraints. Multiplications and divisions are synthesized at the microcode level entirely using adders and register shifters.
2. **Two's Complement Inversion:** In modern CPUs, `negate(x)` is executed in a single cycle via bitwise NOT plus one (`~x + 1`).

## Edge Cases & Production Hardening

1. **Division by Zero:** Explicitly throws `ArithmeticException` before entering quotient loops.
2. **Zero Factors:** $a \times 0 = 0$ and $0 / b = 0$ return immediately without entering loops.
