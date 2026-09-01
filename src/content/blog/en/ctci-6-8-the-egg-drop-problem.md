---
title: "The Egg Drop Problem: Minimizing Worst-Case Drop Tests with 2 Eggs (CTCI 6.8)"
description: "How to find the highest floor from which an egg can be dropped without breaking in a 100-floor building with 2 eggs, minimizing the worst-case number of drops."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
previewImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
---

> **TL;DR**
> * **The Book Problem:** You have a 100-floor building and 2 eggs. Find the highest floor from which an egg can be dropped without breaking, minimizing the worst-case number of drops.
> * **The Breakthrough:** Load-Balancing Strategy: Drop egg 1 from floor $x$, then $x + (x-1)$, then $x + (x-1) + (x-2)...$ so that the total drops (Egg 1 drops + Egg 2 linear scan) is constant ($x$). Solving $\frac{x(x+1)}{2} \ge 100 \implies x = 14$.
> * **Production Reality:** Worst-case bounded search algorithms and binary search fallback strategies.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 6.8), we are given a building with 100 floors and 2 identical eggs. If an egg drops from floor $F$ or higher, it breaks. If it drops from below floor $F$, it remains intact and can be reused. We must find floor $F$ while **minimizing the worst-case number of drops**.

## 2. The Equalized Worst-Case Strategy

If we step in equal increments of 10 floors (10, 20, 30... 100), the worst case occurs if Egg 1 breaks on floor 100: Egg 1 took 10 drops, and Egg 2 must linearly check floors 91-99 (9 drops), totaling $10 + 9 = 19$ drops.

To make the worst-case constant across all floors, whenever Egg 1 takes 1 additional drop, the remaining interval for Egg 2 must shrink by 1 floor:
$$x + (x-1) + (x-2) + \dots + 1 = \frac{x(x+1)}{2} \ge 100$$
$$x^2 + x - 200 \ge 0 \implies x = 14$$

Egg 1 drop sequence: **14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99, 100**. Worst case is strictly **14 drops**.

## Production Implementation

```java
public class EggDropSolver {
    /**
     * Calculates the optimal first drop floor x such that x(x+1)/2 >= totalFloors.
     * Time: O(1)
     * Space: O(1)
     */
    public static int findOptimalDrops(int totalFloors) {
        // Solving quadratic equation: x^2 + x - 2*totalFloors = 0
        // x = (-1 + sqrt(1 + 8*totalFloors)) / 2
        double root = (-1.0 + Math.sqrt(1.0 + 8.0 * totalFloors)) / 2.0;
        return (int) Math.ceil(root);
    }

    public static List<Integer> getDropSequence(int totalFloors) {
        int interval = findOptimalDrops(totalFloors);
        List<Integer> sequence = new ArrayList<>();
        int currentFloor = interval;

        while (currentFloor <= totalFloors && interval > 0) {
            sequence.add(currentFloor);
            interval--;
            currentFloor += interval;
        }
        if (sequence.get(sequence.size() - 1) < totalFloors) {
            sequence.add(totalFloors);
        }
        return sequence;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Worst-Case Drops | `14 Drops` | For a 100-floor building with 2 eggs. |
| Time Complexity | `O(sqrt(N))` | Number of drops grows as O(sqrt(N)) for N floors. |
| Space Complexity | `O(1)` | Direct mathematical formula. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Adaptive Exponential Search & Rate Limiting

1. **Adaptive Rate-Limit Probing:** When discovering the maximum throughput of an unmetered network endpoint before dropped packets occur, network probes expand intervals non-linearly to equalize worst-case discovery latency.
2. **Dynamic Range Sharding:** Storage engines partition SSTable boundary splits using non-linear stepped offsets to equalize worst-case range scan times.

## Edge Cases & Production Hardening

1. Building with 1 floor: 1 drop.
2. Egg breaks on floor 1: 1 drop.
3. Egg does not break even from floor 100: Exactly 12 drops (following sequence).
