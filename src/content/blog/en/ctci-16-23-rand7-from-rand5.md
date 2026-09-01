---
title: "Rand7 from Rand5: Rejection Sampling & Uniform Distribution (CTCI 16.23)"
description: "Generate a perfectly uniform random integer in [0, 6] given a uniform generator in [0, 4] using 2D base-5 space generation and rejection sampling in O(1) expected time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-23-rand7-from-rand5.webp
previewImage: /assets/images/ctci-16-23-rand7-from-rand5.webp
---

> **TL;DR**
> * **The Book Problem:** Given a random generator `rand5()` that produces an integer from $0$ to $4$ with uniform probability, implement `rand7()` which produces an integer from $0$ to $6$ with uniform probability.
> * **The Optimal Solution:** **2D Base-5 Grid & Rejection Sampling**:
>   1. **Outcome Space Expansion**: Calling `rand5()` twice generates $5 \times 5 = 25$ equally probable outcomes:
>      $$\text{val} = 5 \times \text{rand5}() + \text{rand5}() \in [0, 24]$$
>   2. **Symmetric Truncation**: The largest multiple of 7 less than 25 is $21 = 3 \times 7$.
>   3. **Rejection Condition**: If $\text{val} < 21$, return $\text{val} \pmod 7$. Each outcome $0..6$ is mapped to exactly 3 unique values ($\Pr = 3/21 = 1/7$).
>   4. If $\text{val} \in \{21, 22, 23, 24\}$, discard and retry.
>   5. Runs in **$O(1)$ expected time** ($\approx 1.19$ expected iterations) and **$O(1)$ space**.
> * **Production Reality:** Cryptographic nonces in TLS handshakes, Monte Carlo simulation resampling, and unbiased hardware entropy whitening.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.23), we are asked:

*"Implement a method rand7() using only invocations of rand5(), ensuring an exact, unbiased uniform distribution across {0, 1, 2, 3, 4, 5, 6}."*

## 2. 2D Base-5 Outcome Matrix ($5 \times 5 = 25$)

```
          rand5() #2:  0    1    2    3    4
rand5() #1:  0     [  0,   1,   2,   3,   4 ]  ──> val % 7: [0, 1, 2, 3, 4]
             1     [  5,   6,   7,   8,   9 ]  ──> val % 7: [5, 6, 0, 1, 2]
             2     [ 10,  11,  12,  13,  14 ]  ──> val % 7: [3, 4, 5, 6, 0]
             3     [ 15,  16,  17,  18,  19 ]  ──> val % 7: [1, 2, 3, 4, 5]
             4     [ 20,  21*, 22*, 23*, 24*]  ──> val=20 (6), val >= 21: REJECTED!

Valid Range [0, 20]: Exactly 3 occurrences for each output {0..6}.
```

## Production Java Implementation

```java
import java.util.Random;

public class Rand7FromRand5 {

    private static final Random RNG = new Random();

    /**
     * Provided base generator: Uniform integer in [0, 4].
     */
    public static int rand5() {
        return RNG.nextInt(5);
    }

    /**
     * Uniform generator: Unbiased integer in [0, 6].
     * Expected Time Complexity: O(1)
     * Auxiliary Space: O(1)
     */
    public static int rand7() {
        while (true) {
            // Generates uniform integer in [0, 24]
            int num = 5 * rand5() + rand5();

            // Accept values in [0, 20] (21 values = 3 * 7)
            if (num < 21) {
                return num % 7;
            }
            // Discard remaining 4 values [21..24] to avoid distribution skew
        }
    }
}
```

## Complexity & Statistical Analysis

| Metric | Value | Technical Detail |
|---|---|---|
| Acceptance Probability | $p = 21 / 25 = 84.0\%$ | High acceptance rate per trial. |
| Rejection Probability | $q = 4 / 25 = 16.0\%$ | Low redraw overhead. |
| Expected Iterations | $E = 1 / p = 25 / 21 \approx 1.19$ | Near-instantaneous termination. |
| Time Complexity | `O(1) Expected` | Geometrically distributed iteration count. |
| Statistical Bias | `0.00%` | Exact uniform probability $1/7$ per bucket. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Cryptographic Entropy Whitening

1. **Hardware RNG Conditioning (von Neumann / Peres Algorithms):** Physical noise sources (thermal shot noise, quantum tunneling) output biased bit streams ($P(1) \ne P(0)$). Rejection sampling pairs (`01` $\to 0$, `10` $\to 1$, `00`/`11` $\to$ reject) normalize hardware entropy into cryptographically secure random bits.
2. **Monte Carlo Sampling:** Transforming standard uniform random floats $U(0, 1)$ into custom probability density functions (PDFs) via inverse transform and rejection sampling.

## Edge Cases & Production Hardening

1. **Trap of `(rand5() + rand5()) % 7`:** Summing two independent uniform variables produces a triangular non-uniform distribution ($P(4) > P(0)$). Multiplying $5 \times \text{rand5}()$ guarantees an exact 2D Cartesian grid with identical $1/25$ probabilities for every cell.
