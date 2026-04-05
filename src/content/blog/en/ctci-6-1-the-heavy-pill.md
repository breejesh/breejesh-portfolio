---
title: "The Heavy Pill: Find the Heavy Bottle with One Weighing (Java)"
description: "CTCI-style problem 6.1 for beginners: 20 pill bottles, one bottle has 1.1g pills instead of 1.0g. Identify it with a single scale weighing by taking 1, 2, ..., 20 pills and reading the weight excess."
date: "2026-04-05"
tags: [Algorithms]
coverImage: /assets/images/ctci-6-1-the-heavy-pill.webp
previewImage: /assets/images/ctci-6-1-the-heavy-pill.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 6.1 for beginners: 20 pill bottles, one bottle has 1.1g pills instead of 1.0g. Identify it with a single scale weighing by taking 1, 2, ..., 20 pills and reading the weight excess.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You have **20 bottles** of pills. Nineteen bottles hold normal pills of **1.0 gram** each. One bottle holds heavy pills of **1.1 grams** each. The bottles look identical. You have a scale that reports exact weight, and you may use it **only once**. Which bottle is heavy?

This is a reasoning puzzle first, code second. The classic trick is to put a different number of pills from each bottle on the scale so the extra mass encodes the bottle index. This post is original teaching for beginners, with optional **Java** to simulate the weighing. Same family as classic interview math puzzles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 6, math and logic, starts here.

---

## 1. Everyday analogy

Imagine twenty sealed coffee jars. Nineteen are full of ordinary beans. One is packed with slightly denser beans. You get one trip to a kitchen scale.

If you weigh one bean from jar 1, one from jar 2, and so on, a heavier reading only tells you "something is wrong." It does not say which jar.

Give each jar a **unique fingerprint** in the pile. Put **1** bean from jar 1, **2** from jar 2, ..., **20** from jar 20. If every bean were normal, the total would be fixed. Any extra weight comes only from the dense jar, and the size of that excess is proportional to how many beans you took from it. The excess itself is the jar number.

---

## 2. Plain problem statement

**Setup:**

* 20 bottles, labeled 1 through 20 (or 0 through 19; pick one and stick to it).
* 19 bottles: every pill weighs **1.0 g**.
* 1 bottle: every pill weighs **1.1 g**.
* You do not know which bottle is the heavy one.
* You have a scale that returns a numeric weight (not a balance that only says left/right/equal).
* **One weighing only.**

**Goal:** name the heavy bottle after that single measurement.

**Assumptions to state in an interview:**

* Enough pills in each bottle (at least 20 in bottle 20).
* Pills within a bottle are uniform.
* Exactly one heavy bottle (not zero, not two).
* Scale precision is fine enough to see 0.1 g steps (or better).

**Signature shape if you code a simulator:**

```java
// bottles[i] is true if bottle i (1-based in comments, 0-based in arrays) is heavy
// returns the 1-based bottle index inferred from one weighing
int findHeavyBottle(boolean[] isHeavy);
```

Or, more honestly for the puzzle:

```java
// given the true heavy bottle (1..20), simulate the weighing strategy and recover it
int identifyHeavy(int trueHeavyBottle);
```

**Tiny numeric preview:**

Take `1 + 2 + ... + 20 = 210` pills total. If all were 1.0 g, the scale reads **210.0 g**.

If bottle `k` is heavy, those `k` pills each contribute an extra **0.1 g**, so:

```
measured = 210.0 + 0.1 * k
k = (measured - 210.0) / 0.1
```

Example: measure **210.7 g** → excess **0.7 g** → bottle **7**.

---

## 3. Think first

### Why one pill from each bottle fails

One pill from every bottle: 20 pills. Expected 20.0 g if all normal. If the heavy bottle is among them, you get 20.1 g. You learn that a heavy bottle exists, but every heavy bottle would add the same +0.1 g. Zero information about *which* one.

Binary search style ideas (half the bottles, then half again) need **multiple** weighings. The problem freezes you at one.

### Encode the bottle index in the excess

You need each bottle to leave a **distinct signature** on the total weight. Different counts do that:

| Bottle | Pills taken | Extra if heavy |
| --- | --- | --- |
| 1 | 1 | 0.1 g |
| 2 | 2 | 0.2 g |
| 3 | 3 | 0.3 g |
| ... | ... | ... |
| 20 | 20 | 2.0 g |

All-normal baseline:

```
sum = 1 + 2 + ... + 20 = n(n+1)/2 = 20*21/2 = 210
baseline weight = 210.0 g
```

Only the heavy bottle's pills are 0.1 g over. If bottle `k` is heavy:

```
weight = (210 - k) * 1.0 + k * 1.1
       = 210 + 0.1 * k
```

So:

```
k = round((weight - 210.0) / 0.1)
```

Use rounding in code because floating point is messy. In pure math on paper, exact arithmetic is fine.

### Why this is "math and logic," not sorting

There is no array to sort. The insight is **information theory on a continuous measurement**: one real number has enough resolution to carry an integer ID if you design the sample carefully. Interviewers care that you invent the encoding, not that you memorize "210."

### Variants people bring up

* **Some bottles light, some heavy, or unknown direction:** different classic puzzles (often with a balance and more weighings). Do not mix them in unless asked.
* **Bottles numbered 0..19:** take 0 from bottle 0? Useless. Renumber 1..20, or take `i+1` pills from bottle `i`.
* **Only a balance (left vs right):** this problem's scale is usually digital/numeric. Clarify. With only left/right you need a different strategy and often more uses.

---

## 4. Java solution (simulation)

The puzzle is solved with reasoning. Code is a clean way to show you can implement the plan without floating-point landmines.

### Core math helper

```java
/** Sum 1+2+...+n. For n=20 this is 210. */
static int triangular(int n) {
    return n * (n + 1) / 2;
}

/**
 * Infer heavy bottle (1..n) from measured total grams.
 * baseline is triangular(n) assuming 1.0 g pills.
 */
static int bottleFromWeight(double measuredGrams, int n) {
    double baseline = triangular(n); // 210.0 for n=20
    double excess = measuredGrams - baseline;
    // each heavy pill adds 0.1 g; k pills add 0.1*k
    int k = (int) Math.round(excess / 0.1);
    if (k < 1 || k > n) {
        throw new IllegalArgumentException(
            "weight does not match any bottle: " + measuredGrams);
    }
    return k;
}
```

### Simulate one true heavy bottle

```java
/**
 * Simulate the classic strategy for bottles 1..n.
 * trueHeavy is 1-based. Returns the bottle index recovered from one weighing.
 */
static int identifyHeavy(int trueHeavy, int n) {
    if (trueHeavy < 1 || trueHeavy > n) {
        throw new IllegalArgumentException("trueHeavy out of range");
    }

    // one weighing: take i pills from bottle i
    double weight = 0.0;
    for (int bottle = 1; bottle <= n; bottle++) {
        int count = bottle;
        double pillMass = (bottle == trueHeavy) ? 1.1 : 1.0;
        weight += count * pillMass;
    }

    return bottleFromWeight(weight, n);
}
```

### Self-check all 20 cases

```java
static void verifyAll() {
    int n = 20;
    for (int heavy = 1; heavy <= n; heavy++) {
        int found = identifyHeavy(heavy, n);
        if (found != heavy) {
            throw new AssertionError("failed for bottle " + heavy);
        }
    }
    System.out.println("ok: all " + n + " bottles identified");
}
```

### Avoid float in the model (optional, cleaner)

Treat masses in **tenths of a gram**: normal pill = 10 units, heavy = 11 units. Then everything is integers.

```java
static int identifyHeavyInt(int trueHeavy, int n) {
    // units of 0.1 g: normal=10, heavy=11
    int weightUnits = 0;
    for (int bottle = 1; bottle <= n; bottle++) {
        int count = bottle;
        int pill = (bottle == trueHeavy) ? 11 : 10;
        weightUnits += count * pill;
    }
    int baselineUnits = triangular(n) * 10; // 2100
    int extraUnits = weightUnits - baselineUnits; // equals trueHeavy
    return extraUnits; // 1..n
}
```

Interview-friendly line: "I would reason in tenths of a gram so I never divide floats on the whiteboard."

### Worked numbers

Bottle 12 is heavy, `n = 20`:

```
baseline = 210.0 g
extra    = 12 * 0.1 = 1.2 g
measured = 211.2 g
k        = 1.2 / 0.1 = 12
```

Integer units:

```
baseline = 2100
measured = 2100 + 12 = 2112
extra    = 12
```

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Take i pills from bottle i, one weighing | O(n) prep to pick pills | O(1) | n bottles; human does this by hand |
| Weigh one pill per bottle (useless alone) | O(n) | O(1) | only detects "there is a heavy bottle" |
| Binary search with multi weighings | O(log n) weighings | O(1) | violates the one-weighing rule |
| Weigh bottles whole against each other | varies | O(1) | needs a balance strategy; different puzzle |

The interesting cost is **number of weighings: 1**, not asymptotic runtime. In code, building the sample is O(n) arithmetic.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Bottle 1 is heavy:** excess 0.1 g. Easy to miss if someone only thinks about "large" differences.
* **Bottle 20 is heavy:** excess 2.0 g. Measured 212.0 g. Still unique.
* **Off-by-one labeling:** bottles 0..19 vs 1..20. State labels clearly. Map `extra/0.1` to your index scheme.
* **Floating point:** `211.2 - 210.0` might be `1.199999...`. Prefer `Math.round` or integer tenths.
* **Not enough pills in a bottle:** strategy needs 20 pills from bottle 20. Confirm the problem allows it (it does in the classic statement).
* **Scale that only compares two pans:** different problem. Ask.
* **Possibility of all normal or multiple heavies:** classic 6.1 assumes exactly one heavy bottle.
* **Taking the same count from every bottle:** collapses all signatures to one excess value.

Common mistakes:

1. **Weighing whole bottles once** without a plan that isolates an index.
2. **Using binary groups** as if you had log₂(20) weighings.
3. **Forgetting the baseline** and trying to interpret absolute weight without subtracting 210.
4. **Dividing excess by 1.1 or by 0.01** (wrong unit). Excess per heavy pill is **0.1 g**.
5. **Saying complexity is O(1) weighings** and then writing an algorithm that loops weighings in code without noticing the contradiction.

Minimal smoke idea:

```java
verifyAll();
System.out.println(identifyHeavy(7, 20));  // 7
System.out.println(identifyHeavy(20, 20)); // 20
System.out.println(identifyHeavyInt(12, 20)); // 12
```

---

## 7. Explain to a friend recap

Twenty bottles. One has heavier pills. One weighing on a numeric scale.

1. Do not take the same number of pills from each bottle. That only says "someone is heavy."
2. Take **1** from bottle 1, **2** from bottle 2, ..., **20** from bottle 20.
3. If everything were normal, total mass is **210 g**.
4. The heavy bottle `k` adds **0.1 × k** grams.
5. Compute `k = (measured - 210) / 0.1`. That is the answer.
6. In code, prefer integer tenths of a gram so floats do not embarrass you.

If you can explain why the excess *is* the bottle number without writing a loop, you own problem 6.1. Chapter 6 is full of this style: invent a measurement or invariant, then the code is short.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Draw Line](/blog/en/ctci-5-8-draw-line)
* Next: [Basketball](/blog/en/ctci-6-2-basketball)