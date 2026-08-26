---
title: "The Apocalypse: Boys, Girls, and a Policy That Still Hits 50/50 (Java)"
description: "CTCI-style problem 6.7 for beginners: families keep having kids until a boy, then stop. Ratio of boys to girls is still about 1:1. Infinite series proof and a short Java simulation."
date: "2026-04-18"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-7-the-apocalypse.webp
previewImage: /assets/images/ctci-6-7-the-apocalypse.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 6.7 for beginners: families keep having kids until a boy, then stop. Ratio of boys to girls is still about 1:1. Infinite series proof and a short Java simulation.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A dystopian government issues one rule: every family must keep having children until they get a boy, then they stop. No more kids after the first boy. Intuition screams that the world will fill with girls, long strings of GGG...B, more daughters than sons.

It does not. Under fair 50/50 births, the global ratio of boys to girls still converges to **1:1**.

This post is original teaching for beginners in **Java**. Same problem family as classic interview math puzzles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 6, math and logic, problem 6.7.

---

## 1. Everyday analogy

Think of a fair coin. Heads = boy, tails = girl. Each family flips until the first heads, then puts the coin away.

* Some families flip once: **H**. One boy. Zero girls.
* Some flip **TH**. One girl, then one boy.
* Some flip **TTH**. Two girls, then one boy.
* Rare families flip a long tail streak before the first heads.

Every family ends with **exactly one boy**. The number of girls is random: 0, 1, 2, 3, ... with smaller and smaller chance.

Now sum over a whole town. Lots of one-boy families. Fewer families with many girls. The rare huge girl-heavy families are exactly rare enough that, in the limit, total girls match total boys. The coin never "knows" the policy. Each flip is still half and half.

---

## 2. Plain problem statement

**Setup (classic form):**

* Every birth is independently boy or girl with probability `1/2` each.
* Every family continues having children until they have a boy, then stops.
* Families are independent. No twins, no sex selection, no mortality tricks. Just the stop rule.

**Question:** what is the ratio of boys to girls in the population (many families, limit sense)?

**What people often guess:** more girls than boys, because some families produce several girls before the boy.

**What we will show:** expected boys per family equals expected girls per family, both equal to 1. Ratio **1:1**. A simulation with enough families lands near 50% boys.

**Clarify before coding or writing a proof:**

* Are we counting children only, not parents? (Yes. Boys and girls among children.)
* Is order of birth fixed by the policy? (Yes: zero or more girls, then one boy. Never a girl after a boy in that family.)
* Fair coin? (Yes. If `P(boy) = p` is not 1/2, the ratio changes. Interview default is fair.)
* Population ratio or ratio of family types? (Population counts of kids.)

---

## 3. Think first

### Trap intuition

"Many families look like GGGGB. That pile of G's must dominate."

Wrong unit. Those families are **rare**. Probability of k girls then a boy is `(1/2)^{k+1}`. Four girls then a boy is only `1/32` of families. You are weighting rare long strings too heavily when you stare at one extreme family.

### Cleaner unit: one family, expected counts

Every family produces **exactly one boy** (the last child). So:

```
E[boys per family] = 1
```

Girls: with probability `1/2` the first child is a boy, so 0 girls. With probability `1/4`, pattern GB, so 1 girl. With probability `1/8`, GGB, so 2 girls. And so on.

```
E[girls] = 0*(1/2) + 1*(1/4) + 2*(1/8) + 3*(1/16) + ...
         = sum_{k=0}^{inf} k * (1/2)^{k+1}
```

There is a standard series: `sum_{k=1}^{inf} k x^k = x / (1-x)^2` for `|x| < 1`.

Here girls count uses `x = 1/2`:

```
sum_{k=1}^{inf} k (1/2)^k = (1/2) / (1/2)^2 = (1/2)/(1/4) = 2
```

But our sum is `sum k * (1/2)^{k+1} = (1/2) * sum k (1/2)^k = (1/2)*2 = 1`.

So:

```
E[girls per family] = 1
E[boys per family]  = 1
ratio boys : girls  = 1 : 1
```

### Another view: infinite series of all births

Count expected boys and girls across family shapes (fraction of families of each shape):

| Pattern | Prob | Boys | Girls | Contrib boys | Contrib girls |
| --- | --- | --- | --- | --- | --- |
| B | 1/2 | 1 | 0 | 1/2 | 0 |
| GB | 1/4 | 1 | 1 | 1/4 | 1/4 |
| GGB | 1/8 | 1 | 2 | 1/8 | 2/8 |
| GGGB | 1/16 | 1 | 3 | 1/16 | 3/16 |
| ... | ... | 1 | k | ... | ... |

Sum of boy contributions: `1/2 + 1/4 + 1/8 + ... = 1`.

Sum of girl contributions: `0 + 1/4 + 2/8 + 3/16 + ... = 1` (same series as above).

### Birth-level argument (shortest interview line)

Every child born is still boy or girl with probability 1/2, independent of past births. The policy only decides **whether a family has another child**, not the sex of the next one. Summing independent fair births cannot invent a global bias toward girls. The stop rule correlates family size with early boys, but not the sex of any single birth.

---

## 4. Infinite series, written cleanly

Let `G` be number of girls in one family. `G` is geometric: number of failures before first success, success probability `1/2`.

```
P(G = k) = (1/2)^{k+1}   for k = 0, 1, 2, ...
E[G]     = (1 - p) / p   for geometric failures-before-success with success p
         = (1/2) / (1/2) = 1
```

Boys `B = 1` always, so `E[B] = 1`.

For n families, total boys `n`, total girls about `n` in expectation. Ratio of expectations is 1. By the law of large numbers the sample ratio goes to 1 as n grows.

If the interviewer wants the closed form for girls again:

```
E[G] = sum_{k=0}^{inf} k (1/2)^{k+1}
     = (1/2) sum_{k=1}^{inf} k (1/2)^k
     = (1/2) * ( (1/2) / (1 - 1/2)^2 )
     = (1/2) * ( (1/2) / (1/4) )
     = (1/2) * 2
     = 1
```

---

## 5. Java simulation

Math is the proof. Simulation is the gut check for an interview whiteboard or a unit test style demo.

```java
import java.util.Random;

public final class ApocalypseRatio {
    private ApocalypseRatio() {}

    /** One family: keep having kids until a boy. Returns {boys, girls}. */
    static int[] oneFamily(Random rng) {
        int boys = 0;
        int girls = 0;
        while (true) {
            // true = boy
            if (rng.nextBoolean()) {
                boys++;
                break;
            } else {
                girls++;
            }
        }
        return new int[] {boys, girls};
    }

    /**
     * Simulate n families. Returns {totalBoys, totalGirls}.
     */
    static long[] simulate(int families, long seed) {
        Random rng = new Random(seed);
        long boys = 0;
        long girls = 0;
        for (int i = 0; i < families; i++) {
            int[] bg = oneFamily(rng);
            boys += bg[0];
            girls += bg[1];
        }
        return new long[] {boys, girls};
    }

    public static void main(String[] args) {
        int n = 1_000_000;
        long[] totals = simulate(n, 42L);
        long b = totals[0];
        long g = totals[1];
        double ratioBoys = b / (double) (b + g);
        System.out.printf("families=%d boys=%d girls=%d boyFraction=%.4f%n",
                n, b, g, ratioBoys);
        // expect boys == n, girls ~ n, boyFraction ~ 0.50
    }
}
```

Notes:

* Every family contributes exactly one boy, so `boys` should equal `families` always. That is a free assert.
* `girls` is random around `families`. With a million families, the fraction sits near 0.5 (typical error on the order of a few thousandths).
* `Random.nextBoolean()` is a fair coin for this purpose.

Optional assert helpers for a test apply:

```java
static void assertInvariants(int families, long seed) {
    long[] t = simulate(families, seed);
    if (t[0] != families) {
        throw new AssertionError("every family has exactly one boy");
    }
    double frac = t[0] / (double) (t[0] + t[1]);
    if (Math.abs(frac - 0.5) > 0.01 && families >= 100_000) {
        throw new AssertionError("ratio drifted too far: " + frac);
    }
}
```

---

## 6. Edge cases and interview follow-ups

Interviewers poke these:

* **Unfair coin:** if `P(boy) = p`, then `E[boys] = 1` still (stop on first boy), and `E[girls] = (1-p)/p`. Ratio boys:girls = `1 : (1-p)/p` = `p : (1-p)`. Only at `p = 1/2` do you get 1:1.
* **Stop after two boys, or other policies:** change the stopping rule and the expectation math changes. The "each birth is fair" slogan still holds per birth, but family composition weights change. Work the series again.
* **Counting parents:** if someone adds mothers and fathers into "population," you muddied the question. Stick to children unless asked.
* **Small n:** for 10 families the ratio is noisy. Explain limit vs single run.
* **Gender of the last child is always boy:** true, and people use that to claim bias. Remind them the **number** of preceding girls balances it in expectation.
* **Correlation vs bias:** family size is correlated with how many girls appeared first. That is not the same as a biased birth probability.

Common mistakes:

1. **Averaging ratios per family** (each family boys/girls, then average). Families with zero girls have undefined or infinite boy ratio. Use total counts, or expectations of counts.
2. **Only listing a few patterns** and not summing the tail. The infinite tail of rare families matters for the closed form.
3. **Confusing "most families have more girls"** with "most children are girls." Most families actually have zero or one girl (patterns B and GB cover 3/4 of families). The long-tail families pull girls up to match boys.
4. **Assuming the policy changes each birth's odds.** It only gates whether another birth happens.

Minimal mental check without code:

```
1 family expected: 1 boy, 1 girl
1000 families expected: 1000 boys, 1000 girls
```

---

## 7. Explain to a friend recap

The Apocalypse policy: keep having kids until a boy, then stop.

1. Every family ends with exactly one boy. Expected boys per family = 1.
2. Girls follow a geometric count (failures before first boy). Expected girls = 1 when births are fair.
3. Infinite series: boy mass `1/2 + 1/4 + 1/8 + ... = 1`. Girl mass sums to 1 too.
4. Each single birth is still 50/50. The rule only decides when to stop, not the sex of the next child.
5. Java: loop families, inner loop until boy, tally. Assert boys == family count; girl fraction near 0.5 for large n.

If you can write `E[G] = sum k/2^{k+1} = 1` on a whiteboard and say why the "more girls" gut feel fails, you own problem 6.7. Math chapter energy: intuition is the trap, expectation is the fix.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Blue-Eyed Island](/blog/en/ctci-6-6-blue-eyed-island)
* Next: [The Egg Drop Problem](/blog/en/ctci-6-8-the-egg-drop-problem)