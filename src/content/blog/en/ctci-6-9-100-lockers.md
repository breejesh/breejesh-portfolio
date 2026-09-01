---
title: "100 Lockers: Factor Pairs and Perfect Square Lockers (CTCI 6.9)"
description: "Mathematical proof and bit-toggle simulation showing why exactly 10 lockers (the perfect squares) remain open after 100 passes in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-9-100-lockers.webp
previewImage: /assets/images/ctci-6-9-100-lockers.webp
---

> **TL;DR**
> * **The Book Problem:** There are 100 closed lockers in a hallway. A man begins by opening all 100 lockers. Next, he closes every second locker. Then, on his third pass, he toggles every third locker... On the 100th pass, he toggles the 100th locker. After 100 passes, how many lockers are open?
> * **The Optimal Solution:** **Factor Parity / Perfect Squares**: A locker $k$ is toggled once for every divisor of $k$. Since divisors naturally come in complementary pairs $(a, b)$ where $a \times b = k$, total factor counts are **even** unless $a = b \implies k = a^2$ (a perfect square). Therefore, only **perfect squares** have an odd number of divisors and end up in the OPEN state. In the range $1 \dots 100$, there are $\lfloor \sqrt{100} \rfloor = \mathbf{10}$ perfect squares ($1, 4, 9, 16, 25, 36, 49, 64, 81, 100$).
> * **Production Reality:** Sieve of Eratosthenes memory optimizations, multi-pass bloom filter parity toggling, and cache line multi-way associative evictions.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 6.9), we are asked:

*"There are 100 closed lockers in a hallway. A man begins by opening all 100 lockers. Next, he closes every second locker. Then, on his third pass, he toggles every third locker... On the 100th pass, he toggles the 100th locker. After his 100th pass in the hallway, in which he toggles only locker number 100, how many lockers are open?"*

## 2. Mathematical Proof: Divisor Pairing

1. **State Inversion Rule:**
   * Every pass $i$ toggles locker $k$ if and only if $i$ divides $k$ ($k \pmod i == 0$).
   * A locker starts CLOSED (0 toggles).
   * After 100 passes, total toggles for locker $k = \text{number of divisors of } k$.
   * An **odd** number of toggles leaves the locker **OPEN**.
   * An **even** number of toggles leaves the locker **CLOSED**.
2. **Divisors Occur in Pairs:**
   * For any integer $k$, if $a$ divides $k$, then $b = k / a$ also divides $k$.
   * Example ($k = 12$): Factors are $(1, 12), (2, 6), (3, 4) \implies 6$ factors (even $\implies$ CLOSED).
3. **The Perfect Square Exception:**
   * A factor pair collapses into a single factor if and only if $a = b \implies a^2 = k$.
   * Example ($k = 16$): Factors are $(1, 16), (2, 8), (4, 4) \implies \{1, 2, 4, 8, 16\}$ has **5 factors** (odd $\implies$ OPEN).
4. **Counting Open Lockers $\le 100$:**
   $$\text{Open Lockers} = \{1^2, 2^2, 3^2, 4^2, 5^2, 6^2, 7^2, 8^2, 9^2, 10^2\} = \{1, 4, 9, 16, 25, 36, 49, 64, 81, 100\}$$
   Total open lockers $= \lfloor \sqrt{100} \rfloor = \mathbf{10}$.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class LockersProblem {
    /**
     * Computes the number of open lockers in O(1) time.
     */
    public static int countOpenLockers(int n) {
        if (n <= 0) return 0;
        return (int) Math.sqrt(n);
    }

    /**
     * Returns the exact list of open locker numbers.
     */
    public static List<Integer> getOpenLockers(int n) {
        List<Integer> openLockers = new ArrayList<>();
        for (int i = 1; i * i <= n; i++) {
            openLockers.add(i * i);
        }
        return openLockers;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Closed-Form Time | `O(1)` | Direct square root calculation `(int) Math.sqrt(n)`. |
| List Generation Time | `O(sqrt(N))` | Generates each perfect square in a single loop. |
| Auxiliary Space | `O(1)` | Zero memory allocations for count. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Factor Sieve Engines

1. **Sieve of Eratosthenes Prime Generators:** Leverages factor pair symmetry up to $\sqrt{N}$ to eliminate redundant trial divisions.
2. **CPU Cache Multi-Way Bank Conflicts:** Strided access patterns toggle address tag bits across set-associative cache lines.

## Edge Cases & Production Hardening

1. **$n = 1$:** Returns $1$ (locker 1 is open).
2. **$n = 0$ or negative:** Returns $0$.
