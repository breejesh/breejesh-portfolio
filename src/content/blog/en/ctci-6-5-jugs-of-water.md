---
title: "Jugs of Water: Measuring 4 Quarts with 5-Quart and 3-Quart Jugs (CTCI 6.5)"
description: "Solve the classic water pouring riddle to measure exactly 4 quarts using 5-quart and 3-quart uncalibrated jugs via extended Euclidean state transitions."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-5-jugs-of-water.webp
previewImage: /assets/images/ctci-6-5-jugs-of-water.webp
---

> **TL;DR**
> * **The Book Problem:** You have a five-quart jug, a three-quart jug, and an unlimited supply of water (but no measuring markings). How would you come up with exactly four quarts of water? Note that the jugs are oddly shaped, such that filling up exactly "half" of the jug would be impossible.
> * **The Optimal Solution:** Extended Euclidean Pouring Sequence: (1) Fill the 5-quart jug full (5 qt); (2) Pour from 5-quart into 3-quart jug until full (leaving 2 qt in 5-quart); (3) Empty the 3-quart jug; (4) Pour the 2 qt from 5-quart into 3-quart jug; (5) Fill the 5-quart jug full (5 qt); (6) Pour from 5-quart into 3-quart jug until full (transfers exactly 1 qt), leaving exactly **4 quarts** in the 5-quart jug.
> * **Production Reality:** Bézout's identity linear Diophantine solvers, discrete resource reservation schedulers, and network token-bucket rate limiters.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 6.5), we are asked:

*"You have a five-quart jug, a three-quart jug, and an unlimited supply of water (but no measuring markings). How would you come up with exactly four quarts of water? Note that the jugs are oddly shaped, such that filling up exactly 'half' of the jug would be impossible."*

## 2. Mathematical Foundation: Bézout's Identity

By Bézout's identity for linear Diophantine equations:
$$a \cdot x + b \cdot y = d$$
A target volume $d$ can be measured using jugs of capacity $a$ and $b$ if and only if $d$ is a multiple of $\gcd(a, b)$ and $d \le \max(a, b)$.
* Here, $\gcd(5, 3) = 1$. Since $4$ is a multiple of $1$, measuring 4 quarts is guaranteed to be achievable:
$$5 \cdot (2) + 3 \cdot (-2) = 10 - 6 = 4$$

## 3. Step-by-Step State Transitions

| Step | Action | 5-Quart Jug | 3-Quart Jug | Explanation |
|---|---|---|---|---|
| 0 | Initial State | 0 qt | 0 qt | Both jugs empty |
| 1 | Fill 5-quart jug | 5 qt | 0 qt | 5-quart is full |
| 2 | Pour 5-qt $\to$ 3-qt | 2 qt | 3 qt | Pours 3 qt, 2 qt remains in 5-qt |
| 3 | Empty 3-quart jug | 2 qt | 0 qt | Discard water from 3-qt |
| 4 | Pour 5-qt $\to$ 3-qt | 0 qt | 2 qt | Transfers 2 qt into 3-qt |
| 5 | Fill 5-quart jug | 5 qt | 2 qt | 5-quart is full again |
| 6 | Pour 5-qt $\to$ 3-qt | **4 qt** | 3 qt | 3-qt takes 1 qt to fill, leaving **4 qt** |

## Production Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class JugsOfWater {
    public static class State {
        public final int jug5;
        public final int jug3;
        public final String action;

        public State(int j5, int j3, String action) {
            this.jug5 = j5;
            this.jug3 = j3;
            this.action = action;
        }
    }

    /**
     * Simulates the exact state machine sequence to produce 4 quarts.
     */
    public static List<State> measureFourQuarts() {
        List<State> steps = new ArrayList<>();

        int j5 = 0, j3 = 0;
        steps.add(new State(j5, j3, "Initial empty state"));

        j5 = 5;
        steps.add(new State(j5, j3, "Fill 5-quart jug"));

        j5 = 2; j3 = 3;
        steps.add(new State(j5, j3, "Pour 5-quart into 3-quart jug"));

        j3 = 0;
        steps.add(new State(j5, j3, "Dump 3-quart jug"));

        j3 = 2; j5 = 0;
        steps.add(new State(j5, j3, "Pour 2 quarts from 5-quart into 3-quart jug"));

        j5 = 5;
        steps.add(new State(j5, j3, "Fill 5-quart jug full"));

        j5 = 4; j3 = 3;
        steps.add(new State(j5, j3, "Pour from 5-quart into 3-quart jug until full (leaves 4 quarts)"));

        return steps;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Step Complexity | `O(1)` | Exactly 6 discrete operations. |
| Auxiliary Space | `O(1)` | Fixed state transition record. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Discrete Token Buckets

1. **Rate Limiting Token Buckets (Guava / Envoy):** Burst capacity accumulation models refill discrete burst quotas using Diophantine token transfers.
2. **Memory Allocator Slab Pools:** Bounded chunk splitting and re-merging in memory managers.

## Edge Cases & Production Hardening

1. **General Case Solvability:** For any capacities $(A, B)$ and target $C$, a BFS state graph search finds the minimal pouring sequence if $C \pmod{\gcd(A, B)} == 0$.
