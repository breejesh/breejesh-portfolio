---
title: "Blue-Eyed Island: Common Knowledge and Inductive Reasoning (CTCI 6.6)"
description: "Solve the classic Blue-Eyed Island logic puzzle through mathematical induction, epistemic logic, and common knowledge proofs in O(c) days."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-6-blue-eyed-island.webp
previewImage: /assets/images/ctci-6-6-blue-eyed-island.webp
---

> **TL;DR**
> * **The Book Problem:** A group of people live on an island. A visitor announces: "At least one person has blue eyes. Anyone who knows their own eye color must leave the island on the 8:00 PM flight." Everyone can see everyone else's eyes but cannot see or discuss their own. All islanders are perfectly logical. If there are $c$ blue-eyed people, how many days will it take for them to leave?
> * **The Optimal Solution:** **Proof by Mathematical Induction**: (1) If $c = 1$, the blue-eyed person sees zero blue eyes, deduces they are the one, and leaves on Day 1; (2) If $c = 2$, each blue-eyed person sees 1 other and expects them to leave on Day 1. When neither leaves on Day 1, both deduce $c = 2$ and leave on Day 2; (3) By induction, all $c$ blue-eyed people leave together on **Day $c$**.
> * **Production Reality:** Distributed consensus round-trip knowledge synchronization (Byzantine Agreement), mutual information disclosure in multi-party cryptography, and cache invalidation propagation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 6.6), we are asked:

*"A bunch of people are living on an island, when a visitor comes with a strange order: all blue-eyed people must leave the island on the first flight possible. There will be a flight out at 8:00pm every evening. Each person can see everyone else's eye color, but they do not know their own eye color. No one can tell them their eye color. Also, everyone on the island is completely logical and will follow the rules. How many days will it take for all the blue-eyed people to leave if there are c blue-eyed people?"*

## 2. Epistemic Logic: Mutual Knowledge vs. Common Knowledge

Why did the visitor's announcement trigger action if everyone already saw multiple blue-eyed people?
* **Mutual Knowledge:** "Everyone knows at least one person has blue eyes."
* **Common Knowledge:** "Everyone knows that everyone knows that everyone knows... that someone has blue eyes."
The visitor provides the base case of common knowledge from which the inductive chain can unravel.

## 3. Mathematical Induction Proof

### Base Case 1: $c = 1$
* The single blue-eyed person sees zero blue-eyed people on the island.
* Because the visitor declared at least one person has blue eyes, the person instantly realizes: "I must be the blue-eyed person."
* They board the 8:00 PM flight on **Day 1**.

### Base Case 2: $c = 2$
* Call the blue-eyed people $A$ and $B$.
* $A$ sees $B$ with blue eyes and thinks: "If I don't have blue eyes, $B$ sees 0 blue eyes and will leave on Day 1."
* $B$ thinks the exact same thing about $A$.
* On Day 1 at 8:00 PM, nobody leaves.
* On Day 2 morning, $A$ realizes: "$B$ did not leave on Day 1, which means $B$ saw another blue-eyed person (me!)."
* Both $A$ and $B$ leave on the flight on **Day 2**.

### Inductive Step: General $c$
* Assume true for $c - 1$ blue-eyed people (they leave on Day $c - 1$).
* For $c$ blue-eyed people, each blue-eyed person sees $c - 1$ blue-eyed peers.
* Each assumes that if they are not blue-eyed, the $c - 1$ peers will leave on Day $c - 1$.
* When nobody leaves on Day $c - 1$, every blue-eyed person deduces that there are $c$ blue-eyed people (including themselves).
* All $c$ blue-eyed people leave together on **Day $c$**.

## Production Implementation

```java
public class BlueEyedIsland {
    /**
     * Computes the number of days required for all c blue-eyed islanders to leave.
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     */
    public static int daysUntilDeparture(int blueEyedCount) {
        if (blueEyedCount <= 0) {
            throw new IllegalArgumentException("Number of blue-eyed people must be positive.");
        }
        // Direct induction result: c people take c days
        return blueEyedCount;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Simulation Time | `O(c)` | Takes exactly $c$ discrete synchronous calendar rounds. |
| Auxiliary Space | `O(1)` | Zero memory allocations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Epistemic Consensus

1. **Byzantine Fault Tolerance (BFT Consensus):** Replicas wait for $f + 1$ rounds of mutual message acknowledgments to convert private knowledge into common knowledge.
2. **Distributed Cache Invalidation:** Epoch counter synchronization ensures all cluster nodes purge stale entries simultaneously across tick boundaries.

## Edge Cases & Production Hardening

1. **$c = 0$:** No one leaves; guarded with positive validation check.
2. **Non-blue eyed people:** After all $c$ blue-eyed people leave on Day $c$, the remaining islanders deduce their own non-blue status.
