---
title: "Ants on a Triangle: Probability They Never Collide (Java)"
description: "CTCI-style problem 6.4 for beginners: three ants on triangle vertices each pick a random direction. Count the 8 outcomes, find when they only chase, and get probability 1/4. Java enumeration included."
date: "2025-10-22"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
previewImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 6.4 for beginners: three ants on triangle vertices each pick a random direction. Count the 8 outcomes, find when they only chase, and get probability 1/4. Java enumeration included.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

Three ants sit on the three corners of a triangle. At the same moment each ant chooses left or right along an edge and starts walking at the same speed. Will they crash into each other? The interview question is not a simulation of physics. It is a tiny counting problem: how many direction combinations avoid a collision, out of every equally likely choice?

This post is original teaching for beginners in **Java**. Same problem family as classic interview math-and-logic puzzles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 6, math and logic, problem 6.4.

---

## 1. Everyday analogy

Picture three people standing at the three corners of a triangular park path. Each person flips a coin: walk the loop clockwise, or walk it counterclockwise. Same walking speed for everyone.

If all three flip the same way, they stay spaced. Each is always chasing the person ahead and is chased by the person behind. Nobody ever meets face to face on an edge. They just rotate forever.

If even one person goes the other way, two people are walking toward each other on some edge. They meet head-on. That is a collision for this puzzle.

So the puzzle is: coin flips for three people, each heads or tails. How often do all three match?

---

## 2. Plain problem statement

**Setup:**

* Equilateral triangle (shape does not really matter; three vertices, three edges).
* One ant on each vertex.
* Each ant independently chooses a direction: clockwise (CW) or counterclockwise (CCW), each with probability `1/2`.
* All ants walk at the same constant speed along the edges.

**Collision rule (state it out loud in the interview):**

* Two ants **collide** if they are moving toward each other on the same edge (head-on meeting).
* If all three choose the same direction, they never meet head-on. They stay equally spaced and circle forever.
* We ignore "passing at a vertex" as a separate case under the usual model: only the all-same-direction runs are collision-free.

**Question:** what is the probability that the ants never collide?

**Clarify before solving:**

* Are directions independent and fair? (Yes: each ant, each direction, probability `1/2`.)
* Does equal speed matter? (Yes for the head-on story. Different speeds can change meeting points, but the classic answer still hinges on direction agreement.)
* Is a collision only head-on, or any meeting including catching from behind? (Classic statement: head-on. With equal speed, same-direction ants never catch up.)
* Generalize to `n` ants on an n-gon? Nice follow-up. Same idea: only two global orientations work.

---

## 3. Think first

### Sample space

Each ant has 2 choices. Three ants:

```
total outcomes = 2^3 = 8
```

All eight are equally likely if coins are fair. List them as a triple `(A, B, C)` where `0` means CW and `1` means CCW (any labeling of the vertices is fine).

```
(0,0,0)  all CW
(0,0,1)
(0,1,0)
(0,1,1)
(1,0,0)
(1,0,1)
(1,1,0)
(1,1,1)  all CCW
```

### Which ones avoid collision?

Only the two uniform rows:

* All CW: `(0,0,0)`
* All CCW: `(1,1,1)`

In every mixed row, at least one pair of neighbors chose opposite directions, so they walk toward each other on the edge between them and collide.

So:

```
favorable = 2
probability = 2 / 8 = 1/4
```

### Another way to say it

Fix ant A (direction free, probability 1). Ant B must match A (`1/2`). Ant C must match A (`1/2`). Product:

```
P(no collision) = 1 * (1/2) * (1/2) = 1/4
```

Same answer without listing eight rows. Listing is better in an interview for a beginner story, because the interviewer can see you counted.

### Why mixed directions always collide (equal speed)

Label vertices `A`, `B`, `C` in CW order. Edge `AB` has ants only from A and B at the start.

* If A walks CW toward B and B walks CCW toward A: head-on on `AB`.
* If A walks CCW (toward C) and B walks CW (toward C from the other side of their next edges): somewhere else a head-on still appears, because not all three match.

You do not need to case-bash every mixed pattern in the interview if you state the clean theorem:

> Collision-free if and only if every ant chooses the same orientation.

Prove "if": same direction, equal speed, constant spacing, no head-on.
Prove "only if": if some ant differs, that ant and a neighbor form an opposing pair on a shared edge (or the cycle forces at least one opposing neighbor pair on a triangle).

On a triangle it is especially obvious: two directions means at least one edge has ants walking into each other.

### Follow-up: n ants on a regular n-gon

Same model: each picks CW or CCW with probability `1/2`, equal speed, collision = head-on on an edge.

Only two safe configurations: all CW, all CCW.

```
P = 2 / 2^n = 2^(1-n)
```

For `n = 3`: `2^(1-3) = 2^(-2) = 1/4`. Same answer.

For `n = 4`: `1/8`. For large `n` the probability collapses toward zero. Almost always someone disagrees.

---

## 4. Java solution

You do not need heavy code for the closed form. Still, enumerating outcomes is a clean way to show the count, and it generalizes to `n`.

### Closed form

```java
/** Probability all n ants agree on direction (fair coins, independent). */
static double noCollisionProbability(int n) {
    if (n < 1) {
        throw new IllegalArgumentException("n must be at least 1");
    }
    // 2 favorable out of 2^n
    return 2.0 / Math.pow(2, n);
}

// triangle
// noCollisionProbability(3) == 0.25
```

### Enumerate all 2^n masks

Treat bit `i` as the direction of ant `i` (`0` CW, `1` CCW). A mask is safe only if every bit is 0 or every bit is 1.

```java
/**
 * Count direction assignments with no head-on collision.
 * Bit i of the mask is ant i's direction.
 */
static int countSafeConfigs(int n) {
    if (n < 1 || n > 30) {
        throw new IllegalArgumentException("n out of supported range");
    }
    int total = 1 << n; // 2^n
    int safe = 0;
    int allOnes = total - 1; // n bits set
    for (int mask = 0; mask < total; mask++) {
        if (mask == 0 || mask == allOnes) {
            safe++;
        }
    }
    return safe; // always 2 for n >= 1
}

static double probabilityByEnumeration(int n) {
    int total = 1 << n;
    return (double) countSafeConfigs(n) / total;
}
```

### Explicit triangle table (good for the whiteboard)

```java
static void printTriangleCases() {
    // ants A, B, C; 0 = CW, 1 = CCW
    String[] labels = {"CW", "CCW"};
    int safe = 0;
    for (int a = 0; a <= 1; a++) {
        for (int b = 0; b <= 1; b++) {
            for (int c = 0; c <= 1; c++) {
                boolean ok = (a == b) && (b == c);
                if (ok) {
                    safe++;
                }
                System.out.printf(
                    "(%s, %s, %s) -> %s%n",
                    labels[a], labels[b], labels[c],
                    ok ? "safe (all same)" : "collide");
            }
        }
    }
    System.out.println("safe / total = " + safe + " / 8 = " + (safe / 8.0));
}
```

Rough output:

```
(CW, CW, CW) -> safe (all same)
(CW, CW, CCW) -> collide
(CW, CCW, CW) -> collide
(CW, CCW, CCW) -> collide
(CCW, CW, CW) -> collide
(CCW, CW, CCW) -> collide
(CCW, CCW, CW) -> collide
(CCW, CCW, CCW) -> safe (all same)
safe / total = 2 / 8 = 0.25
```

### Unit-style checks

```java
assert Math.abs(noCollisionProbability(3) - 0.25) < 1e-9;
assert Math.abs(probabilityByEnumeration(3) - 0.25) < 1e-9;
assert countSafeConfigs(3) == 2;
assert countSafeConfigs(4) == 2;
assert Math.abs(noCollisionProbability(4) - 0.125) < 1e-9;
assert Math.abs(noCollisionProbability(1) - 1.0) < 1e-9; // one ant: never collides
```

---

## 5. Walk through the classic cases

### All clockwise

Ants at A, B, C all walk CW. After a short time each has moved the same arc length. Distances between ants stay equal to one side length (along the perimeter). Nobody is walking into a neighbor. **Safe.**

### All counterclockwise

Same story, opposite orientation. **Safe.**

### Two CW, one CCW

Say A and B are CW, C is CCW. Then A walks toward B on edge AB while B walks toward C... and C walks toward B or A depending on orientation labeling. On a triangle, the minority direction creates at least one edge with opposing traffic. **Collide.**

Concrete: A at top, B bottom-right, C bottom-left. CW means A→B, B→C, C→A. CCW means A→C, C→B, B→A.

If A and B choose CW and C chooses CCW:

* A walks toward B (CW).
* B walks toward C (CW).
* C walks toward B (CCW: C→B).

So B and C walk toward each other on edge BC. Head-on. Done.

Any other mixed triple is the same shape after renaming vertices.

### Probability arithmetic

```
P(all CW)  = (1/2)^3 = 1/8
P(all CCW) = 1/8
P(safe)    = 1/8 + 1/8 = 1/4
```

Or: `2` favorable masks out of `8`.

---

## 6. Complexity, edges, interview tips

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Closed form `2 / 2^n` | O(1) | O(1) | Best answer once the model is clear |
| Enumerate `2^n` masks | O(2^n) | O(1) | Fine for n ≤ 20 in code demos; overkill for n = 3 |
| Nested loops for n = 3 | O(1) | O(1) | Best whiteboard for beginners |

**Edges and traps:**

1. **Forgetting equal likelihood.** If you only say "two good cases" without dividing by 8, you have not finished.
2. **Calling any meeting a collision, including same-direction.** With equal speed they do not catch up. Stick to head-on unless the interviewer changes the model.
3. **Thinking order of movement matters.** Simultaneous equal-speed choice makes it pure combinatorics.
4. **Floating point pride.** Prefer exact fractions: `2/8 = 1/4`. Use doubles only when coding.
5. **n = 2 "digon" nonsense.** Stick to n ≥ 3 for polygons, or note n = 1 is trivially 1.
6. **Assuming ants bounce or reverse.** Classic problem: they choose once and keep going until a meet would have happened.

**How to talk it (30-second version):**

1. Each ant has 2 directions, so 8 equally likely outcomes.
2. They avoid collision only if all walk CW or all walk CCW.
3. That is 2 out of 8, so probability `1/4`.
4. General n-gon: `2 / 2^n`.

**Where this shows up outside the riddle:**

* Sample spaces and independence in probability interviews.
* "Agreement" events: all bits equal, all votes match, all clocks same phase.
* Symmetry arguments: reduce continuous motion to a discrete choice count.

---

## 7. Explain to a friend recap

Ants on a Triangle is a counting problem dressed as wildlife.

1. Three ants, each picks CW or CCW with probability `1/2`. Eight outcomes, all equal.
2. Head-on on an edge counts as a collision. Equal speed, same direction: they only chase, never meet head-on.
3. Exactly two outcomes are safe: all CW, all CCW.
4. Probability: `2/8 = 1/4`.
5. For n ants on an n-gon: `2 / 2^n`.

If you can list the eight triples, mark the two uniform ones, and say why a mixed choice forces a head-on, you own problem 6.4. No calculus required. Just careful counting.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Dominos](/blog/en/ctci-6-3-dominos)
* Next: [Jugs of Water](/blog/en/ctci-6-5-jugs-of-water)