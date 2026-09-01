---
title: "Ants on a Triangle: Collision Probability on Polygon Vertices (CTCI 6.4)"
description: "Calculate the collision probability of n ants walking randomly on an n-vertex regular polygon using complementary probability in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
previewImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
---

> **TL;DR**
> * **The Book Problem:** There are three ants on different vertices of a triangle. What is the probability of collision (between any two or all of them) if they start walking on the sides of the triangle? Assume that each ant randomly picks a direction (clockwise or counter-clockwise) with equal probability. Similarly, find the probability for $n$ ants on an $n$-vertex polygon.
> * **The Optimal Solution:** Complementary Probability: Collision occurs in all cases except when all ants choose the exact same direction (all clockwise or all counter-clockwise). Total directional permutations $= 2^n$. Non-colliding permutations $= 2$. $P(\text{no collision}) = \frac{2}{2^n} = \left(\frac{1}{2}\right)^{n-1}$. Therefore, **$P(\text{collision}) = 1 - \left(\frac{1}{2}\right)^{n-1}$**. For a triangle ($n = 3$), $P(\text{collision}) = 1 - (1/2)^2 = 1 - 1/4 = 3/4 = \mathbf{75\%}$.
> * **Production Reality:** CSMA/CD Ethernet collision probability models, distributed token ring message passing, and network routing loop prevention.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 6.4), we are asked:

*"There are three ants on different vertices of a triangle. What is the probability of collision (between any two or all of them) if they start walking on the sides of the triangle? Assume that each ant randomly picks a direction, with either direction being equally likely to be chosen, and that they walk at the same speed. Similarly, find the probability of collision with n ants on an n-vertex polygon."*

## 2. Mathematical Derivation via Complementary Events

1. **Individual Ant Choices:**
   * Each ant has 2 choices: Clockwise ($C$) or Counter-Clockwise ($CC$).
   * For $n$ ants, there are $2^n$ equally likely combinations.
2. **Non-Colliding Configurations:**
   * Ants will never collide if and only if **all ants walk in the same direction**:
     * Combination 1: All Clockwise $(C, C, \dots, C) \implies \text{Probability } (1/2)^n$.
     * Combination 2: All Counter-Clockwise $(CC, CC, \dots, CC) \implies \text{Probability } (1/2)^n$.
   * $P(\text{no collision}) = (1/2)^n + (1/2)^n = 2 \cdot (1/2)^n = (1/2)^{n-1}$.
3. **Collision Probability:**
   $$P(\text{collision}) = 1 - P(\text{no collision}) = 1 - \left(\frac{1}{2}\right)^{n-1}$$
4. **Evaluations:**
   * For $n = 3$ (Triangle): $1 - (1/2)^2 = 1 - 0.25 = \mathbf{0.75 \text{ (75\%)}}$.
   * For $n = 4$ (Square): $1 - (1/2)^3 = 1 - 0.125 = \mathbf{0.875 \text{ (87.5\%)}}$.
   * As $n \to \infty$, $P(\text{collision}) \to 1.0$.

## Production Implementation

```java
public class AntsOnPolygon {
    /**
     * Calculates the probability of collision for n ants on an n-vertex regular polygon.
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     */
    public static double collisionProbability(int n) {
        if (n < 3) {
            throw new IllegalArgumentException("A polygon must have at least 3 vertices.");
        }
        // Formula: 1.0 - (1.0 / 2^(n - 1))
        return 1.0 - Math.pow(0.5, n - 1);
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Evaluation Time | `O(1)` | Direct closed-form exponential calculation. |
| Auxiliary Space | `O(1)` | Zero memory allocations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Channel Contention Models

1. **CSMA/CD (Carrier Sense Multiple Access with Collision Detection):** Network adapters compute exponential backoff intervals derived from collision probabilities in shared Ethernet media.
2. **Token Ring & Distributed Mutex Routing:** Ensures unidirectional message flow along logical rings to guarantee zero-collision message passing.

## Edge Cases & Production Hardening

1. **$n = 3$ (Triangle):** Returns $0.75$.
2. **$n < 3$:** Guard clause rejects degenerate polygons ($n \le 2$).
3. **Large $n$ ($n \ge 60$):** `Math.pow(0.5, 60)` approaches machine epsilon, returning $1.0$ cleanly.
