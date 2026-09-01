---
title: "Basketball: Probability and Expected Value Analysis for Shooting Games (CTCI 6.2)"
description: "Analyze the probability equations for a 1-shot vs 3-shot basketball game to determine optimal game selection based on shot probability p in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-2-basketball.webp
previewImage: /assets/images/ctci-6-2-basketball.webp
---

> **TL;DR**
> * **The Book Problem:** You have a basketball hoop and someone says you can play one of two games. Game 1: You get one shot to make the hoop. Game 2: You get three shots and you have to make two of three shots. If $p$ is the probability of making a particular shot, for which values of $p$ should you pick one game or the other?
> * **The Optimal Solution:** Binomial Probability Inequality: $P(\text{Game 1}) = p$. $P(\text{Game 2}) = \binom{3}{2} p^2 (1 - p) + \binom{3}{3} p^3 = 3p^2 - 2p^3$. Solving $P(\text{Game 2}) > P(\text{Game 1}) \implies 3p^2 - 2p^3 > p \implies 2p^2 - 3p + 1 < 0 \implies (2p - 1)(p - 1) < 0 \implies p > 0.5$. Choose **Game 1 if $p < 0.5$**, **Game 2 if $p > 0.5$**, and either game if $p \in \{0, 0.5, 1\}$.
> * **Production Reality:** Quorum replica voting thresholds (Raft/Paxos), multi-stage health check failover policies, and A/B test statistical power calculations.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 6.2), we are asked:

*"You have a basketball hoop and someone says you can play one of two games. Game 1: You get one shot to make the hoop. Game 2: You get three shots and you have to make two of three shots. If p is the probability of making a particular shot, for which values of p should you pick one game or the other?"*

## 2. Mathematical Derivation

### Probability of Winning Game 1
$$P(\text{Game 1}) = p$$

### Probability of Winning Game 2
Winning Game 2 requires making either exactly 2 shots or all 3 shots:
1. Making exactly 2 shots (3 combinations: $S_1S_2M_3, S_1M_2S_3, M_1S_2S_3$):
   $$P(\text{make 2}) = 3 \times p^2(1 - p) = 3p^2 - 3p^3$$
2. Making all 3 shots ($S_1S_2S_3$):
   $$P(\text{make 3}) = p^3$$
3. Total winning probability for Game 2:
   $$P(\text{Game 2}) = (3p^2 - 3p^3) + p^3 = 3p^2 - 2p^3$$

### Comparing Game 1 and Game 2
We should play Game 2 when $P(\text{Game 2}) > P(\text{Game 1})$:
$$3p^2 - 2p^3 > p$$
Assuming $0 < p < 1$, divide by $p$:
$$3p - 2p^2 > 1 \implies 2p^2 - 3p + 1 < 0$$
Factoring the quadratic polynomial:
$$(2p - 1)(p - 1) < 0$$
Because $p < 1$, the term $(p - 1)$ is always negative. For the entire product to be negative, $(2p - 1)$ must be positive:
$$2p - 1 > 0 \implies p > 0.5$$

## Production Implementation

```java
public class BasketballGame {
    /**
     * Determines whether to pick Game 1 or Game 2 given shot probability p.
     * Returns 1 for Game 1, 2 for Game 2, 0 for indifference.
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     */
    public static int pickGame(double p) {
        if (p < 0.0 || p > 1.0) {
            throw new IllegalArgumentException("Probability must be between 0 and 1");
        }

        if (p > 0.5 && p < 1.0) {
            return 2; // Game 2 has higher win probability
        } else if (p < 0.5 && p > 0.0) {
            return 1; // Game 1 has higher win probability
        } else {
            return 0; // Both games have identical win probability (p = 0, 0.5, or 1.0)
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Evaluation Time | `O(1)` | Direct floating-point threshold comparison. |
| Auxiliary Space | `O(1)` | Zero memory allocations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Majority Quorum & Redundancy

1. **Distributed Consensus Quorums (Raft / Paxos):** When individual node availability is $p > 0.5$, a majority cluster quorum ($2f + 1$) strictly amplifies overall cluster reliability. When node availability drops below 0.5, adding more nodes reduces system reliability.
2. **Circuit Breakers (Netflix Hystrix / Resilience4j):** Threshold evaluations determine whether multi-sample probe queries increase or decrease false-positive failover rates.

## Edge Cases & Production Hardening

1. **$p = 0.5$:** Both games have identical winning probability $0.5$ ($3(0.5)^2 - 2(0.5)^3 = 0.75 - 0.25 = 0.5$).
2. **Boundary values ($p = 0$ or $p = 1$):** Both games yield 0% or 100% win probability respectively.
