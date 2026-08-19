---
title: "Basketball: One Shot vs Make 2 of 3 (Probability)"
description: "CTCI-style problem 6.2 for beginners: with make probability p, choose Game 1 (one make) or Game 2 (at least two makes in three shots). Algebra: p vs 3p^2(1-p)+p^3, and when each wins."
date: "2026-01-12"
tags: [Algorithms]
coverImage: /assets/images/ctci-6-2-basketball.webp
previewImage: /assets/images/ctci-6-2-basketball.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 6.2 for beginners: with make probability p, choose Game 1 (one make) or Game 2 (at least two makes in three shots). Algebra: p vs 3p^2(1-p)+p^3, and when each wins.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You stand under a hoop. Someone offers two carnival-style games. **Game 1:** take one shot; you win if it goes in. **Game 2:** take three shots; you win if at least two go in. Same shooter every time. Same make chance `p` on every attempt. Shots are independent. Which game do you pick?

Intuition is messy. If you are cold, one free look can feel safer than needing two hits. If you are hot, three tries with a two-make bar can feel safer than a single do-or-die. The interview wants the algebra that turns that gut feeling into a clean rule in terms of `p`.

This post is original teaching for beginners in **Java** (light code for comparing the curves). Same problem family as classic interview math and logic puzzles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 6, math and logic puzzles, problem 6.2.

---

## 1. Everyday analogy

Think of free throws at the park.

* **Game 1** is "money ball": one attempt. Make it, you take the prize. Probability of winning is just how often you usually make a free throw: `p`.
* **Game 2** is "best of a short series": three attempts, you need **two or more** makes. Miss the first two and the third cannot save you. Make the first two and you can even brick the third.

If you are a terrible shooter (`p` near 0), needing two makes is brutal. One lucky single shot is the better gamble. If you are a great shooter (`p` near 1), missing twice is rare, so Game 2 stacks the deck in your favor. Somewhere in the middle the two games are equal. That "somewhere" is what we solve for.

---

## 2. Plain problem statement

**Given:**

* You make each shot with probability `p`, independently, `0 <= p <= 1`.
* Game 1: win if you make **1** shot out of **1**.
* Game 2: win if you make **at least 2** shots out of **3**.

**Find:**

* Probability of winning each game as a function of `p`.
* For which values of `p` you prefer Game 1, prefer Game 2, or are indifferent.

**Assumptions to state out loud:**

* Shots are i.i.d. Bernoulli trials with success probability `p`.
* Order of makes and misses does not matter for Game 2; only the count of makes does.
* "Prefer" means higher probability of winning (not higher expected fun, not risk preference beyond P(win)).

**Signature shape if they want code:**

```java
// positive: prefer game1; negative: prefer game2; zero: equal
int compareGames(double p)

double probGame1(double p)
double probGame2(double p)
```

**Clarify before diving into algebra:**

* Is `p` known, or do we leave the answer as ranges of `p`? (Ranges of `p`.)
* Are shots independent? (Yes, classic statement.)
* Exactly two makes, or at least two? (**At least two**: MMF, MFM, FMM, and MMM.)
* What about `p = 0` and `p = 1`? (Both games pay the same: never win, or always win.)

---

## 3. Think first

### Win probability for Game 1

One shot. One success.

```
P(Game1) = p
```

Nothing to expand.

### Win probability for Game 2

Three independent shots. Win on exactly 2 makes or exactly 3 makes.

Binomial coefficients:

* Exactly 2 makes: `C(3, 2) = 3` sequences: MMF, MFM, FMM. Each has probability `p^2 (1-p)`.
* Exactly 3 makes: `C(3, 3) = 1` sequence: MMM. Probability `p^3`.

```
P(Game2) = 3 * p^2 * (1 - p) + p^3
         = 3p^2 - 3p^3 + p^3
         = 3p^2 - 2p^3
```

You can also write it as "1 minus P(0 makes) minus P(1 make)":

```
P(0) = (1-p)^3
P(1) = 3 p (1-p)^2
P(Game2) = 1 - (1-p)^3 - 3p(1-p)^2
```

Same polynomial after expand. The "exactly 2 plus exactly 3" form is shorter for comparing to `p`.

### Sanity checks before comparing

| `p` | Game1 | Game2 | Comment |
| --- | --- | --- | --- |
| 0 | 0 | 0 | both impossible |
| 0.5 | 0.5 | `3*(0.25)-2*(0.125)=0.5` | equal |
| 1 | 1 | 1 | both certain |
| 0.25 | 0.25 | `3*(0.0625)-2*(0.015625)=0.15625` | Game1 better |
| 0.75 | 0.75 | `3*(0.5625)-2*(0.421875)=0.84375` | Game2 better |

If your closed form fails these five points, fix the formula before solving inequalities.

---

## 4. Algebra: when is Game 1 better?

Prefer Game 1 when `P(Game1) > P(Game2)`:

```
p > 3p^2 - 2p^3
p - 3p^2 + 2p^3 > 0
p (1 - 3p + 2p^2) > 0
p (2p^2 - 3p + 1) > 0
```

Factor the quadratic:

```
2p^2 - 3p + 1 = (2p - 1)(p - 1)
```

Check: `(2p - 1)(p - 1) = 2p^2 - 2p - p + 1 = 2p^2 - 3p + 1`. Good.

So:

```
p (2p - 1)(p - 1) > 0
```

Sign chart for `f(p) = p(2p-1)(p-1)` on `(0, 1)`:

* Critical points: `p = 0`, `p = 1/2`, `p = 1`.
* On `(0, 1/2)`: `p > 0`, `(2p-1) < 0`, `(p-1) < 0` → positive × negative × negative = **positive** → Game1 better.
* On `(1/2, 1)`: `p > 0`, `(2p-1) > 0`, `(p-1) < 0` → positive × positive × negative = **negative** → Game2 better.
* At `p = 1/2`: `f = 0` → equal.
* At endpoints `0` and `1`: both games have equal win probability (both 0, or both 1).

### The answer (memorize this shape)

| Range of `p` | Prefer |
| --- | --- |
| `0 < p < 1/2` | **Game 1** (one shot) |
| `p = 0`, `p = 1/2`, or `p = 1` | **Indifferent** |
| `1/2 < p < 1` | **Game 2** (at least 2 of 3) |

In words: **if you make less than half your shots, take the single shot. If you make more than half, take the three-shot game. At exactly half (or the trivial ends), it does not matter.**

That matches the park intuition. Weak shooters hate needing two hits. Strong shooters turn three attempts into a safety net.

---

## 5. Java helpers (compute and compare)

You do not need code in a pure whiteboard math interview, but a tiny helper makes the curves checkable and shows you can implement the binomial idea.

```java
public final class BasketballGames {

    /** P(win Game 1) = p. */
    public static double probGame1(double p) {
        return p;
    }

    /**
     * P(win Game 2) = C(3,2) p^2 (1-p) + C(3,3) p^3
     *               = 3p^2(1-p) + p^3
     *               = 3p^2 - 2p^3
     */
    public static double probGame2(double p) {
        return 3 * p * p * (1 - p) + p * p * p;
    }

    /**
     * +1 prefer Game1, -1 prefer Game2, 0 equal (within epsilon).
     */
    public static int compareGames(double p) {
        if (p < 0.0 || p > 1.0) {
            throw new IllegalArgumentException("p must be in [0, 1], got " + p);
        }
        double d = probGame1(p) - probGame2(p);
        final double eps = 1e-12;
        if (Math.abs(d) <= eps) {
            return 0;
        }
        return d > 0 ? 1 : -1;
    }

    /** Closed-form preference without floating noise near known roots. */
    public static String preferClosedForm(double p) {
        if (p < 0.0 || p > 1.0) {
            throw new IllegalArgumentException("p must be in [0, 1]");
        }
        if (p == 0.0 || p == 0.5 || p == 1.0) {
            return "indifferent";
        }
        return p < 0.5 ? "game1" : "game2";
    }
}
```

### Optional: scan the interval and print the switch

```java
public static void main(String[] args) {
    for (int i = 0; i <= 20; i++) {
        double p = i / 20.0;
        double g1 = BasketballGames.probGame1(p);
        double g2 = BasketballGames.probGame2(p);
        String who = BasketballGames.preferClosedForm(p);
        System.out.printf("p=%.2f  g1=%.5f  g2=%.5f  -> %s%n", p, g1, g2, who);
    }
    // p=0.00 ... indifferent
    // p=0.25 ... game1
    // p=0.50 ... indifferent
    // p=0.75 ... game2
    // p=1.00 ... indifferent
}
```

Floating compare near `0.5` can jitter; for interview talk, use the closed form `p ? 1/2`. Use the numeric helpers to **verify**, not to **discover** the threshold by scanning alone.

---

## 6. Walk through numbers and a common wrong turn

### Case A: cold shooter, `p = 0.2`

```
P1 = 0.2
P2 = 3*(0.04)*(0.8) + 0.008 = 0.096 + 0.008 = 0.104
```

Game 1 wins (`0.2 > 0.104`). Needing two makes when you only hit 20% is painful.

### Case B: fair coin shooter, `p = 0.5`

```
P1 = 0.5
P2 = 3*(0.25)*(0.5) + 0.125 = 0.375 + 0.125 = 0.5
```

Equal. Nice checkpoint in the algebra.

### Case C: hot shooter, `p = 0.8`

```
P1 = 0.8
P2 = 3*(0.64)*(0.2) + 0.512 = 0.384 + 0.512 = 0.896
```

Game 2 wins. Missing twice out of three is unlikely.

### Wrong turn people take

1. **Only count exactly two makes** and forget three makes: understates Game 2 by `p^3`.
2. **Treat Game 2 as "make two in a row"** instead of any two of three: wrong event.
3. **Compare expected number of makes** instead of P(win): Game 1 has expected makes `p`, Game 2 has expected makes `3p`. That answers a different question. You care about the **win rule**, not total makes.
4. **Assume dependent shots** (fatigue, pressure) without being asked. State independence unless the interviewer adds it.
5. **Solve `p = 3p^2 - 2p^3` and stop** without a sign chart. Roots alone do not tell which side prefers which game.

---

## 7. Complexity, edges, interview tips

| Topic | Answer |
| --- | --- |
| Model | Independent Bernoulli shots with success `p` |
| P(Game1) | `p` |
| P(Game2) | `3p^2(1-p) + p^3 = 3p^2 - 2p^3` |
| Prefer Game1 | `0 < p < 1/2` |
| Prefer Game2 | `1/2 < p < 1` |
| Indifferent | `p ∈ {0, 1/2, 1}` |
| Time (closed form) | O(1) arithmetic |
| Extra space | O(1) |

**How to talk it (45-second version):**

1. Game 1 is just `p`.
2. Game 2 is binomial: three ways to get exactly two makes, one way to get three: `3p^2(1-p)+p^3`.
3. Set `p > 3p^2-2p^3`, factor `p(2p-1)(p-1) > 0`.
4. On `(0,1)`, that holds for `p < 1/2`.
5. Check endpoints and `p = 1/2` as ties.

**Follow-ups an interviewer might throw:**

* Generalize to "make `k` of `n`" vs one shot: same compare idea, messier polynomials.
* What if make probability changes after a miss? Then independence dies; you need a tree of cases.
* Risk: if the prize is huge and you are risk-seeking, utility might not equal P(win). Classic CTCI answer stays on P(win).

**Related series neighbors:**

* Warmup puzzle before this: [The Heavy Pill](/blog/en/ctci-6-1-the-heavy-pill).
* Next tiling / coloring style puzzle: [Dominos](/blog/en/ctci-6-3-dominos).

---

## 8. Explain to a friend recap

Basketball (problem 6.2) is a **probability comparison**, not a coding grind.

1. Game 1 win chance is `p`.
2. Game 2 win chance is make at least two of three independent shots: `3p^2(1-p) + p^3`.
3. Simplify to `3p^2 - 2p^3`.
4. Prefer Game 1 when `p > 3p^2 - 2p^3`, which factors to `p(2p-1)(p-1) > 0`.
5. For real free-throw percentages between 0 and 1 exclusive of the roots: **pick one shot if `p < 1/2`, pick two-of-three if `p > 1/2`.** At `0`, `1/2`, and `1` the games are equal.

If you can write both probabilities, factor the inequality, and name the switch at one half without looking it up, you own problem 6.2.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [The Heavy Pill](/blog/en/ctci-6-1-the-heavy-pill)
* Next: [Dominos](/blog/en/ctci-6-3-dominos)