---
title: "The Apocalypse: Gender Ratio Under One-Girl Stopping Rule (CTCI 6.7)"
description: "Mathematical proof and Monte Carlo simulation showing why a post-apocalyptic one-girl policy maintains an exact 50:50 gender ratio in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-7-the-apocalypse.webp
previewImage: /assets/images/ctci-6-7-the-apocalypse.webp
---

> **TL;DR**
> * **The Book Problem:** In the new post-apocalyptic world, the queen decrees that all families must continue having children until they have one girl, at which point they must immediately stop. What is the gender ratio of the new generation? (Assume that the odds of having a boy or girl are equal).
> * **The Optimal Solution:** The gender ratio remains strictly **50:50 (1:1)**. Every single birth is an independent Bernoulli trial with $P(\text{boy}) = 0.5$ and $P(\text{girl}) = 0.5$. By the Optional Stopping Theorem (and infinite geometric series summation), the expected number of boys per family is $E[\text{boys}] = \sum_{i=1}^{\infty} (i - 1)(1/2)^i = 1.0$. Because each family has exactly 1 girl and an expected 1 boy, the population ratio is $1:1$.
> * **Production Reality:** Martingale stopping theorems in financial option pricing, randomized load balancer polling bounds, and Bernoulli bandit algorithms in A/B routing.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 6.7), we are asked:

*"In the new post-apocalyptic world, the world queen is desperately concerned about the birth rate. Therefore, she decrees that all families must continue having children until they have one girl, at which point they must immediately stop. What is the gender ratio of the new generation? (Assume that the odds of having a boy or girl are equal)."*

## 2. Mathematical Proof

### Proof 1: Independent Bernoulli Trials (Intuitive Proof)
Imagine all babies born across the entire world placed in a single chronological hospital queue.
* For every baby born, the probability of being a girl is independently $0.5$.
* Deciding when a family *stops* having more children merely partitions the global birth sequence into subsets. It cannot alter the underlying 50% probability of any individual coin flip.

### Proof 2: Expected Value Summation (Formal Proof)
Let $G$ be the number of girls per family ($G = 1$).
Let $B$ be the number of boys in a family:
* $P(B = 0) = P(G) = \frac{1}{2}$
* $P(B = 1) = P(BG) = \frac{1}{4}$
* $P(B = 2) = P(BBG) = \frac{1}{8}$
* In general: $P(B = k) = \left(\frac{1}{2}\right)^{k+1}$

Calculating the expected number of boys:
$$E[B] = \sum_{k=0}^{\infty} k \cdot P(B = k) = \sum_{k=0}^{\infty} k \left(\frac{1}{2}\right)^{k+1} = 0 \cdot \frac{1}{2} + 1 \cdot \frac{1}{4} + 2 \cdot \frac{1}{8} + 3 \cdot \frac{1}{16} + \dots$$

Let $S = \sum_{k=0}^{\infty} k (1/2)^{k+1}$:
$$S = \frac{1}{4} + \frac{2}{8} + \frac{3}{16} + \frac{4}{32} + \dots$$
$$\frac{1}{2} S = \frac{1}{8} + \frac{2}{16} + \frac{3}{32} + \dots$$
Subtracting the two equations:
$$\frac{1}{2} S = \frac{1}{4} + \frac{1}{8} + \frac{1}{16} + \dots = \frac{1/4}{1 - 1/2} = \frac{1}{2} \implies S = 1$$

Thus:
$$E[\text{boys}] = 1, \quad E[\text{girls}] = 1 \implies \text{Gender Ratio} = \frac{1}{1} = \mathbf{50\% \text{ Girls}, 50\% \text{ Boys}}$$

## Production Implementation & Monte Carlo Simulator

```java
import java.util.Random;

public class ApocalypseRatio {
    /**
     * Simulates n families to empirically demonstrate 50:50 gender ratio convergence.
     * Time Complexity: O(N)
     * Space Complexity: O(1)
     */
    public static double runSimulation(int numFamilies) {
        int boys = 0;
        int girls = 0;
        Random random = new Random();

        for (int i = 0; i < numFamilies; i++) {
            // A family continues having babies until they get a girl
            while (true) {
                if (random.nextBoolean()) {
                    girls++;
                    break;
                } else {
                    boys++;
                }
            }
        }

        return (double) girls / (girls + boys);
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Theoretical Proof Time | `O(1)` | Constant 50:50 ratio by Martingale stopping theorem. |
| Monte Carlo Simulation | `O(N)` | Linear in the number of simulated families. |
| Auxiliary Space | `O(1)` | Two primitive accumulator registers. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Optional Stopping Invariants

1. **Financial Quantitative Modeling (Martingale Optional Stopping):** Traders cannot alter the expected value of an asset price process by choosing arbitrary time-based stopping rules.
2. **Multi-Armed Bandit Optimizers (A/B Testing):** Demonstrates why early stopping rules in naive A/B tests inflate false discovery rates without Bayesian corrections.

## Edge Cases & Production Hardening

1. **Finite Population Variance:** Small sample sizes show binomial variance; large $N$ ($N \ge 100,000$) converges within machine precision to $0.5000$.
