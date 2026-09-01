---
title: "The Heavy Pill: Weighing Puzzles & Discrete Mathematical Identification (CTCI 6.1)"
description: "How to identify which of 20 pill bottles contains 1.1g heavy pills instead of 1.0g pills in exactly one single weighing on a digital scale using arithmetic progression weighting."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-1-the-heavy-pill.webp
previewImage: /assets/images/ctci-6-1-the-heavy-pill.webp
---

> **TL;DR**
> * **The Book Problem:** You have 20 bottles of pills. 19 bottles have 1.0g pills, but 1 bottle has pills weighing 1.1g. Given a scale that gives an exact measurement, how do you find the heavy bottle with only ONE weighing?
> * **The Core Breakthrough:** Take $i$ pills from bottle $i$ (1 pill from bottle 1, 2 from bottle 2, ..., 20 from bottle 20). Total pills = $\frac{20 \times 21}{2} = 210$. The heavy bottle number is exactly $\frac{\text{Weight} - 210}{0.1}$.
> * **Production Reality:** Error syndrome decoding in Hamming error-correcting codes and multi-tenant billing attribution.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 6.1), we are given 20 bottles of pills. 19 bottles contain 1.0 gram pills, while exactly 1 bottle contains 1.1 gram pills. We are provided with a digital scale that provides an exact numeric measurement (in grams). We must identify the defective bottle in **exactly one weighing**.

## 2. The Arithmetic Progression Weighting Method

If we take 1 pill from each bottle, the total weight is always $20.1\text{g}$, revealing that a heavy pill exists but giving zero information about *which* bottle it came from.

To encode the bottle identifier into the measured weight:
1. Take $1$ pill from Bottle 1.
2. Take $2$ pills from Bottle 2.
3. Take $k$ pills from Bottle $k$ ($1 \le k \le 20$).

Total pills on the scale:
$$N = \sum_{i=1}^{20} i = \frac{20 \times 21}{2} = 210\text{ pills}$$

If all bottles were normal (1.0g), the scale would read exactly $210.0\text{g}$.
If Bottle $k$ is the heavy bottle (1.1g), its $k$ pills each contribute an extra $0.1\text{g}$, so the scale reads:
$$\text{Weight} = 210.0 + (k \times 0.1)$$
$$\text{Bottle Number } k = \frac{\text{Measured Weight} - 210.0}{0.1} = (\text{Weight} - 210.0) \times 10$$

## Production Implementation

```java
public class HeavyPillSolver {
    /**
     * Identifies the heavy bottle number (1-indexed) in O(1) from a single scale reading.
     * @param totalBottles Total number of bottles (e.g. 20)
     * @param scaleWeight Measured weight of the combined sample
     * @return 1-indexed heavy bottle number
     */
    public static int findHeavyBottle(int totalBottles, double scaleWeight) {
        int expectedPills = (totalBottles * (totalBottles + 1)) / 2;
        double expectedWeight = expectedPills * 1.0;
        double excessWeight = scaleWeight - expectedWeight;

        // Round to nearest integer to eliminate floating-point representation drift
        return (int) Math.round(excessWeight / 0.1);
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Scale Operations | `1 Weighing` | Strictly single measurement. |
| Time Complexity | `O(1)` | Single closed-form algebraic formula. |
| Space Complexity | `O(1)` | Zero heap allocation. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Syndrome Decoding in Error-Correcting Codes

1. **Hamming Code Error Localization:** In ECC memory, parity check bits are assigned to overlapping subsets of data bits based on powers of 2. When a single-bit memory corruption occurs, the matrix product (syndrome) directly outputs the binary index of the flipped bit in $O(1)$.
2. **Distributed Usage Attribution:** Multi-tenant telemetry pipelines tag batched network packets with distinct prime factors or linear weights to determine which tenant exhausted network bandwidth during traffic spikes without per-packet database logs.

## Edge Cases & Production Hardening

1. Floating point rounding errors ($0.1$ has no exact binary representation): Use `Math.round()` or integer microgram calculations ($1000\mu\text{g}$ vs $1100\mu\text{g}$).
2. Bottle index out of range: Verify calculated index is strictly within $[1, \text{totalBottles}]$.
