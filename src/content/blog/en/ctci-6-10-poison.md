---
title: "Poison: Find One Poisoned Bottle with 10 Strips in One Month (Java)"
description: "CTCI-style problem 6.10 for beginners: 1000 bottles, one poisoned, 10 test strips, results take a month. Encode each bottle as a bit pattern so one round of sips names the bottle."
date: "2026-03-22"
tags: [Algorithms]
coverImage: /assets/images/ctci-6-10-poison.webp
previewImage: /assets/images/ctci-6-10-poison.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 6.10 for beginners: 1000 bottles, one poisoned, 10 test strips, results take a month. Encode each bottle as a bit pattern so one round of sips names the bottle.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You have **1000 bottles** of soda. Exactly **one** is poisoned. You have **10 test strips**. A strip either stays clean or turns positive after tasting poison. Each test needs a full **month** before you can read the result, and you only have one month. How do you find the poisoned bottle?

This is a reasoning puzzle first, code second. The move is binary: treat each bottle as a number, and let each strip act as one bit. This post is original teaching for beginners, with optional **Java** to encode sips and decode strip results. Same family as classic interview info-theory puzzles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 6, math and logic, ends here.

---

## 1. Everyday analogy

Imagine 1000 sealed juice cartons. One is spoiled. You have ten litmus papers and one night before the party. Each paper can only be checked in the morning, so you get **one batch** of tests, not a search tree of follow-ups.

If you dip strip 1 in carton 1, strip 2 in carton 2, and so on, you only cover ten cartons. Binary search needs many rounds because each result must land before you choose the next group. You do not have many rounds.

Give every carton a **binary ID**. Carton 13 is `0000001101` in ten bits. For each bit that is `1`, that carton drips a drop onto the matching paper. Overnight, the pattern of dirty papers is exactly the binary ID of the spoiled carton. Ten papers, ten bits, up to 1024 IDs. You only need 1000.

---

## 2. Plain problem statement

**Setup:**

* 1000 bottles, labeled `0` through `999` (or `1` through `1000`; pick one and stick to it).
* Exactly one bottle is poisoned. The rest are safe.
* 10 test strips. Each strip can be used in the single test round by sipping a mix of drops from several bottles.
* If a strip ever tastes the poison (even mixed with safe liquid), it turns **positive** after one month. Otherwise it stays **negative**.
* You run **one** test round now, wait one month, read all strips at once.

**Goal:** name the poisoned bottle from that one readout.

**Assumptions to state in an interview:**

* Poison is strong enough that any positive amount on a strip triggers positive (no dilution edge cases).
* Strips never false-positive or false-negative.
* Exactly one poisoned bottle (not zero, not two).
* Mixing drops on one strip is allowed and free.
* You cannot run a second round after seeing results (time budget is one month).

**Signature shape if you code a simulator:**

```java
// bottle ids 0..999; strips 0..9
// returns which bottles strip s should sip
int[] bottlesForStrip(int stripIndex, int bottleCount);

// after one month: positive[s] is true if strip s turned positive
// recover the poisoned bottle id
int decodePoisonedBottle(boolean[] positive);
```

Or, more honestly for the puzzle:

```java
// given the true poisoned bottle, simulate sips + one month, recover the id
int identifyPoisoned(int truePoisoned, int bottleCount, int stripCount);
```

**Tiny numeric preview (8 bottles, 3 strips):**

Bottles `0..7`, strips for bits `0, 1, 2` (bit 0 = least significant):

| Bottle | Binary | Sips strips |
| --- | --- | --- |
| 0 | 000 | none |
| 1 | 001 | 0 |
| 2 | 010 | 1 |
| 3 | 011 | 0, 1 |
| 4 | 100 | 2 |
| 5 | 101 | 0, 2 |
| 6 | 110 | 1, 2 |
| 7 | 111 | 0, 1, 2 |

If bottle **5** is poisoned, strips **0** and **2** go positive, strip **1** stays clean. Readout as bits: `101` binary = **5**.

With **10** strips you cover `2^10 = 1024` patterns, enough for 1000 bottles with room to spare.

---

## 3. Think first

### Why sequential or binary-search style fails

Test one bottle per strip: 10 bottles covered, 990 untouched. Useless.

Binary search: put half the bottles on strip 1, wait a month, then half of the remaining half, and so on. That is about `log2(1000) ≈ 10` **rounds**, so about **10 months**. The problem freezes you at **one** month.

### Information budget

Each strip has 2 outcomes: positive or negative. Ten independent strips give `2^10 = 1024` possible outcome patterns. You need to distinguish 1000 possibilities (which bottle is bad). **1024 ≥ 1000**, so in theory one round is enough. The question is how to map bottles to patterns.

### Encode bottle index as the strip pattern

Number bottles from `0` to `999`. Write each index in binary with up to 10 bits:

```
bottle b -> bits b0 b1 ... b9
  where bi = 1 if (b & (1 << i)) != 0
```

**Encoding (what you do today):**

* For each strip `i` in `0..9`:
  * strip `i` sips a drop from every bottle `b` where bit `i` of `b` is set.

**Decoding (what you do in one month):**

* Let `result = 0`.
* For each strip `i`, if strip `i` is positive, set bit `i` in `result`: `result |= (1 << i)`.
* `result` is the poisoned bottle index.

Why it works: only the poisoned bottle contributes poison. Strip `i` goes positive **if and only if** the poisoned bottle has bit `i` set. So the vector of strip results is exactly the binary representation of that bottle.

### Labeling 1..1000 vs 0..999

Both work.

* **0..999:** patterns are the numbers themselves. Bottle 0 sips nothing. If all strips stay negative, bottle 0 is poisoned (only if you allow bottle 0).
* **1..1000:** use the binary of the label, or of `label - 1`. State it. `2^10 = 1024` still covers 1..1000.

Interviewers care that you **invent the bit map**, not that you memorize "use 0-based indices."

### Variants people bring up

* **Multiple poisoned bottles:** one pattern can collide. You need more strips or a different code (error-correcting / combinatorial group testing).
* **Strips that can be reused across multiple timed rounds:** different problem; more information over time.
* **Only k strips, n bottles:** need `2^k >= n` for one round, or more rounds if time allows.
* **False positives:** then you need redundant coding. Out of scope for classic 6.10.

---

## 4. Java solution (simulation)

The puzzle is solved with reasoning. Code shows you can implement encode and decode without off-by-ones on bit indices.

### Decode strip results to a bottle id

```java
/**
 * positive[i] == true means strip i turned positive after one month.
 * Returns bottle id in 0 .. (2^strips - 1).
 */
static int decodePoisonedBottle(boolean[] positive) {
    int id = 0;
    for (int i = 0; i < positive.length; i++) {
        if (positive[i]) {
            id |= (1 << i);
        }
    }
    return id;
}
```

### Which bottles does strip i sip?

```java
/**
 * Bottles are 0 .. bottleCount-1.
 * Strip i sips every bottle whose bit i is set.
 */
static boolean stripSipsBottle(int stripIndex, int bottleId) {
    return ((bottleId >> stripIndex) & 1) == 1;
}
```

### Simulate one true poisoned bottle

```java
/**
 * bottleCount typically 1000, stripCount typically 10.
 * truePoisoned is 0-based in [0, bottleCount).
 */
static int identifyPoisoned(int truePoisoned, int bottleCount, int stripCount) {
    if (truePoisoned < 0 || truePoisoned >= bottleCount) {
        throw new IllegalArgumentException("truePoisoned out of range");
    }
    if ((1 << stripCount) < bottleCount) {
        throw new IllegalArgumentException("not enough strips for one round");
    }

    boolean[] positive = new boolean[stripCount];
    for (int strip = 0; strip < stripCount; strip++) {
        // strip turns positive iff the poisoned bottle has this bit set
        // (equivalent to mixing all bottles with that bit and waiting)
        positive[strip] = stripSipsBottle(strip, truePoisoned);
    }
    int found = decodePoisonedBottle(positive);
    if (found >= bottleCount) {
        throw new IllegalStateException("decoded id outside bottle range: " + found);
    }
    return found;
}
```

The loop above is the mathematical shortcut: you do not need to walk every bottle if you already know which one is poisoned. In a "real lab" version you would build each strip's mixture from all matching bottles, then only the true poison would flip the strips the same way.

### Explicit mixture build (clearer for teaching)

```java
static int identifyPoisonedByMixing(int truePoisoned, int bottleCount, int stripCount) {
    boolean[] positive = new boolean[stripCount];
    for (int strip = 0; strip < stripCount; strip++) {
        boolean gotPoison = false;
        for (int bottle = 0; bottle < bottleCount; bottle++) {
            if (!stripSipsBottle(strip, bottle)) {
                continue;
            }
            // drop from this bottle goes on the strip
            if (bottle == truePoisoned) {
                gotPoison = true;
            }
        }
        positive[strip] = gotPoison;
    }
    return decodePoisonedBottle(positive);
}
```

### Self-check all 1000 cases

```java
static void verifyAll() {
    int bottles = 1000;
    int strips = 10;
    for (int p = 0; p < bottles; p++) {
        int a = identifyPoisoned(p, bottles, strips);
        int b = identifyPoisonedByMixing(p, bottles, strips);
        if (a != p || b != p) {
            throw new AssertionError("failed for bottle " + p);
        }
    }
    System.out.println("ok: all " + bottles + " bottles identified");
}
```

### Worked numbers

Bottle **326** poisoned, 10 strips, 0-based ids:

```
326 in binary (bits 0 = LSB on the right when written normally):
  326 = 256 + 64 + 4 + 2
      = 2^8 + 2^6 + 2^2 + 2^1
  bits set: 1, 2, 6, 8

Strips that go positive: 1, 2, 6, 8
decode: (1<<1) | (1<<2) | (1<<6) | (1<<8) = 2 + 4 + 64 + 256 = 326
```

Tiny 3-strip case, bottle 5:

```
positive = [true, false, true]  // strips 0 and 2
id = 1 | 4 = 5
```

### Optional: list bottles for a strip (prep day)

```java
static java.util.List<Integer> bottlesForStrip(int stripIndex, int bottleCount) {
    java.util.ArrayList<Integer> list = new java.util.ArrayList<>();
    for (int b = 0; b < bottleCount; b++) {
        if (stripSipsBottle(stripIndex, b)) {
            list.add(b);
        }
    }
    return list;
}
```

Strip 0 sips every odd bottle. Strip 9 sips bottles with the `2^9 = 512` bit set (512..1023 in the full 10-bit space; only those under 1000 matter).

---

## 5. Complexity table

| Approach | Test rounds | Strips used | Notes |
| --- | --- | --- | --- |
| One bottle per strip | 1 | 10 | only 10 bottles covered |
| Binary search groups | ~10 | 1+ | needs a result before the next split; ~10 months |
| Binary bit encoding | **1** | 10 | covers up to 1024 bottles |
| Naive "test all combos" without a plan | 1 | 10 | random mixes usually collide or leave gaps |

In code, building all mixtures the long way is `O(bottles * strips)`. Decoding is `O(strips)`. The interesting cost in the interview is **rounds of waiting = 1**, not big-O on a CPU.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Bottle 0 is poisoned (0-based):** all strips negative. That is a valid codeword. If labels start at 1, say so and never claim "all negative means no poison" unless the problem allows zero poison.
* **Bottle 999:** bits of 999 fit in 10 bits (`999 < 1024`). Fine.
* **Bottle 1000 with 1-based labels:** still fine; 1000 needs bits up through `2^9` and `2^3` etc., still under 1024.
* **Not enough strips:** 9 strips cover only 512 bottles. State the `2^k >= n` check.
* **MSB vs LSB strip numbering:** pick strip `i` = bit `i` and stay consistent in encode and decode.
* **Re-testing after results:** forbidden by the time limit. Do not describe a multi-round algorithm unless asked for a follow-up.
* **Two poisoned bottles:** the OR of two bit patterns can look like a third bottle. Classic problem assumes exactly one.
* **Strip capacity / drop count:** ignore unless the interviewer adds constraints.

Common mistakes:

1. **Describing binary search** and ignoring the one-month lock on each test.
2. **Using strips as "groups of 100"** without a unique signature per bottle.
3. **Off-by-one on bottle labels** (0 vs 1) so decode is shifted by one.
4. **Mixing up bit index and strip index** (encode with bit 0 on strip 0, decode with bit 0 on strip 9).
5. **Saying you need 1000 strips** or one strip per bottle.
6. **Forgetting that bottle 0 sips nothing** and panicking when all strips are clean.

Minimal smoke idea:

```java
verifyAll();
System.out.println(identifyPoisoned(0, 1000, 10));   // 0
System.out.println(identifyPoisoned(5, 1000, 10));   // 5
System.out.println(identifyPoisoned(326, 1000, 10)); // 326
System.out.println(identifyPoisoned(999, 1000, 10)); // 999
System.out.println(bottlesForStrip(0, 8)); // odds: 1,3,5,7
```

---

## 7. Explain to a friend recap

One thousand bottles, one poisoned, ten strips, one month.

1. You only get **one** test round. Binary search is too slow in calendar time.
2. Ten strips give `2^10 = 1024` outcome patterns. That is enough to name any of 1000 bottles.
3. Number bottles `0..999`. Write each number in binary.
4. Strip `i` sips every bottle whose bit `i` is `1`.
5. After a month, positive strips form a binary number. That number **is** the poisoned bottle.
6. In code, encode with `(bottle >> i) & 1`, decode with `id |= (1 << i)` for each positive strip.

If you can explain why the strip vector equals the bottle id without coding, you own problem 6.10. Chapter 6 closes on pure information design: measure once, read a bit pattern, walk away.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [100 Lockers](/blog/en/ctci-6-9-100-lockers)
* Next: [Deck of Cards](/blog/en/ctci-7-1-deck-of-cards)