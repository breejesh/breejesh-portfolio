---
title: "Triple Step: Counting Staircase Paths with Dynamic Programming (CTCI 8.1)"
description: "Count the number of ways a child can run up n staircase steps taking 1, 2, or 3 hops at a time using bottom-up dynamic programming in O(N) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-1-triple-step.webp
previewImage: /assets/images/ctci-8-1-triple-step.webp
---

> **TL;DR**
> * **The Book Problem:** A child is running up a staircase with $n$ steps and can hop either 1 step, 2 steps, or 3 steps at a time. Implement a method to count how many possible ways the child can run up the stairs.
> * **The Optimal Solution:** Tribonacci Recurrence DP: The total ways to reach step $n$ is $W(n) = W(n - 1) + W(n - 2) + W(n - 3)$ with base cases $W(0) = 1, W(1) = 1, W(2) = 2$. Using 3 rolling variables avoids array allocation, achieving $O(N)$ time and $O(1)$ space. (Use 64-bit integer / `BigInteger` or modulo arithmetic to prevent integer overflow when $n \ge 37$).
> * **Production Reality:** Discrete pathway combinatorics in probabilistic finite state machines, packet routing sequence counting, and Markov decision process state reachability.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.1), we are asked:

*"A child is running up a staircase with n steps and can hop either 1 step, 2 steps, or 3 steps at a time. Implement a method to count how many possible ways the child can run up the stairs."*

## 2. Recurrence Relation & Rolling Variables

To reach step $n$, the child must have jumped from:
* Step $n - 1$ (by taking a 1-step hop)
* Step $n - 2$ (by taking a 2-step hop)
* Step $n - 3$ (by taking a 3-step hop)

Because these choices are mutually exclusive, the total count is their sum:
$$W(n) = W(n - 1) + W(n - 2) + W(n - 3)$$

**Base Cases:**
* $W(0) = 1$ (1 way to stand at ground level)
* $W(1) = 1$ ($[1]$)
* $W(2) = 2$ ($[1,1], [2]$)
* $W(3) = 4$ ($[1,1,1], [1,2], [2,1], [3]$)

## Production Implementation

```java
import java.util.Arrays;

public class TripleStep {
    /**
     * Counts ways to climb n stairs with 1, 2, or 3 hops using O(1) memory.
     * Time Complexity: O(N)
     * Space Complexity: O(1)
     */
    public static int countWays(int n) {
        if (n < 0) return 0;
        if (n == 0) return 1;
        if (n == 1) return 1;
        if (n == 2) return 2;

        int a = 1; // W(0)
        int b = 1; // W(1)
        int c = 2; // W(2)

        for (int i = 3; i <= n; i++) {
            int d = a + b + c;
            a = b;
            b = c;
            c = d;
        }

        return c;
    }

    /**
     * Memoized top-down implementation demonstrating standard DP caching.
     * Time Complexity: O(N)
     * Space Complexity: O(N)
     */
    public static int countWaysMemo(int n) {
        int[] memo = new int[n + 1];
        Arrays.fill(memo, -1);
        return countWaysMemoHelper(n, memo);
    }

    private static int countWaysMemoHelper(int n, int[] memo) {
        if (n < 0) return 0;
        if (n == 0) return 1;
        if (memo[n] > -1) return memo[n];

        memo[n] = countWaysMemoHelper(n - 1, memo) +
                  countWaysMemoHelper(n - 2, memo) +
                  countWaysMemoHelper(n - 3, memo);
        return memo[n];
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Exactly $N - 2$ constant-time integer additions. |
| Auxiliary Space | `O(1)` | Three primitive integer registers for rolling state. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Integer Overflow & Matrix Exponentiation

1. **Integer Overflow Guard:** Because $W(n)$ grows asymptotically as $O(1.839^n)$, a 32-bit signed integer overflows at $n = 37$. For large $n$, production systems use 64-bit `long` or modular arithmetic ($10^9 + 7$).
2. **Matrix Exponentiation:** The recurrence $\begin{bmatrix} W(n) \\ W(n-1) \\ W(n-2) \end{bmatrix} = \begin{bmatrix} 1 & 1 & 1 \\ 1 & 0 & 0 \\ 0 & 1 & 0 \end{bmatrix}^{n-2} \begin{bmatrix} 2 \\ 1 \\ 1 \end{bmatrix}$ enables $O(\log N)$ evaluation for massive $N$.

## Edge Cases & Production Hardening

1. **$n = 0$:** Returns $1$.
2. **$n < 0$:** Returns $0$.
3. **$n = 1, 2, 3$:** Returns $1, 2, 4$ respectively.
