---
title: "Debugger: What ((n & (n-1)) == 0) Really Checks (Java)"
description: "CTCI-style problem 5.5 for beginners: prove that n & (n-1) equals zero only when n has at most one bit set. Power of two, the zero trap, binary walk-throughs, and Java code."
date: "2026-01-25"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-5-debugger.webp
previewImage: /assets/images/ctci-5-5-debugger.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 5.5 for beginners: prove that n & (n-1) equals zero only when n has at most one bit set. Power of two, the zero trap, binary walk-throughs, and Java code.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

Someone pastes this line into a code review and asks what it is for:

```java
((n & (n - 1)) == 0)
```

It looks like a riddle. No loop. No division. One subtraction, one AND, one compare. The short answer is: **it is true when `n` has at most one bit set to 1**. For positive integers, that is exactly "is `n` a power of two?" (`1, 2, 4, 8, 16, ...`). Zero also makes the expression true, so production code usually adds `n > 0`.

This post is original teaching for beginners in **Java**. Same problem family as classic interview bit questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 5, bit manipulation, problem 5.5.

---

## 1. Everyday analogy

Picture a hallway of light switches. Each switch is one bit: on = 1, off = 0. A **power of two** is a hallway with **exactly one** light on. One lamp, any position. That is `1` (only the rightmost light), `2` (only the next), `4`, `8`, and so on. Two lights on means the number is a sum of two different powers of two, not a pure power of two.

Now the clever move: **turn off the rightmost light that is currently on**, without walking the whole hallway.

That is what `n & (n - 1)` does. Subtracting one flips every bit from the lowest 1 down through the trailing zeros. AND with the original `n` kills that lowest 1 and leaves every higher bit alone.

* If the hallway had only one light on, after you kill it the hallway is dark: result `0`.
* If two or more lights were on, killing the rightmost still leaves the others: result not `0`.

So `((n & (n - 1)) == 0)` asks: "is the hallway dark after I snuff the lowest lit lamp?" That is "zero or one bit was set."

---

## 2. Plain problem statement

**Input:** an integer `n` (interviews usually mean a non-negative `int`, or at least you state that).

**Task:** explain what this expression checks, and when you would use it:

```java
(n & (n - 1)) == 0
```

**What it means in plain words:**

* True when `n` has **zero or one** bits set to 1 in its two's-complement bit pattern (for the bits that participate the way you expect for non-negative values).
* For **`n > 0`**, that is equivalent to: **`n` is a power of two**.
* For **`n == 0`**, the expression is also true (`0 & (-1) == 0` in two's complement), but **0 is not a power of two**.

**Examples (positive side):**

| `n` | Binary (low bits) | `n - 1` | `n & (n - 1)` | Expression | Power of 2? |
| --- | --- | --- | --- | --- | --- |
| 1 | `0001` | `0000` | `0000` | true | yes |
| 2 | `0010` | `0001` | `0000` | true | yes |
| 3 | `0011` | `0010` | `0010` | false | no |
| 4 | `0100` | `0011` | `0000` | true | yes |
| 5 | `0101` | `0100` | `0100` | false | no |
| 6 | `0110` | `0101` | `0100` | false | no |
| 8 | `1000` | `0111` | `0000` | true | yes |
| 0 | `0000` | all 1s | `0000` | true | **no** (trap) |

**Clarify before coding:**

* Do we treat 0 as a special case? (Yes: require `n > 0` for "power of two".)
* Negative inputs? In Java, `int` is signed. Powers of two are defined for positive magnitudes. Prefer reject `n <= 0`.
* 32-bit or 64-bit? The trick is the same on `int` and `long`.
* Do they want an explanation only, or a helper method? Both show up. This problem is often "what does this check?" not "implement from scratch."

---

## 3. Think first

### What "power of two" looks like in binary

Any positive power of two is a single `1` bit followed by zeros:

```
 1 = 0000 0001
 2 = 0000 0010
 4 = 0000 0100
 8 = 0000 1000
16 = 0001 0000
```

Any other positive integer has at least two `1` bits, or a messy mix (for example `6 = 0110`, `7 = 0111`, `12 = 1100`).

So "is power of two" = "exactly one bit set" for `n > 0`.

### Why subtract one, then AND

Take `n = 12` (`1100` in the low bits). The lowest set bit is bit 2 (value 4).

```
n     = ... 1100
n - 1 = ... 1011
AND   = ... 1000   // lowest 1 gone; higher 1 remains
```

Take `n = 8` (`1000`):

```
n     = ... 1000
n - 1 = ... 0111
AND   = ... 0000   // only one 1 existed; now none
```

Rule of thumb you can say out loud:

> **`n & (n - 1)` clears the least significant 1-bit of `n`.**

If clearing that bit yields zero, there was no other 1-bit left. So either `n` was 0, or `n` had exactly one 1-bit.

### Why this is a favorite "debugger" question

Interviewers like it because:

1. You either know the lowest-bit-clear trick or you rediscover it with a few examples on paper.
2. The zero edge case separates people who memorize the line from people who understand it.
3. It is O(1) and branch-light compared to looping over bits or calling library bit-count helpers (though `Integer.bitCount(n) == 1` is fine to mention as a readable alternative).

### Other ways that also work (and when to prefer them)

* **Loop / bit count:** count set bits; power of two iff count is 1. Clearer for some readers. Slightly more work unless the hardware has a popcount instruction and the library uses it.
* **Division by two:** while even, divide by 2; end at 1. Easy to mess up on 0 and negatives. Not the bit-idiom answer.
* **`n > 0 && (n & -n) == n`:** another classic. `n & -n` isolates the lowest set bit. If that equals `n`, only that bit was set. Same idea family as `n & (n - 1)`.

For this problem, stick to explaining `n & (n - 1)`.

---

## 4. Java solution

### Explain-only form (what the expression checks)

```java
// True when n has at most one bit set (includes n == 0).
boolean atMostOneBitSet(int n) {
    return (n & (n - 1)) == 0;
}
```

### Power of two (what you almost always want)

```java
/**
 * Returns true if n is a positive power of two (1, 2, 4, 8, ...).
 * Uses the fact that n & (n - 1) clears the lowest set bit.
 */
boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

### Same idea on long

```java
boolean isPowerOfTwo(long n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

### Readable alternative (good in production, still mention in interviews)

```java
boolean isPowerOfTwoBitCount(int n) {
    return n > 0 && Integer.bitCount(n) == 1;
}
```

Interviewers may still want the mask form so you can prove you understand bits without leaning on the library.

### Optional: isolate lowest set bit (related trick)

```java
// Isolates the lowest 1-bit of n (for n != 0).
int lowestSetBit(int n) {
    return n & -n;
}

boolean isPowerOfTwoIsolate(int n) {
    return n > 0 && (n & -n) == n;
}
```

Same yes/no answers as `n & (n - 1)` for powers of two, different micro-expression. Know both names if you have seen them.

---

## 5. Walk through the classic cases

### Case A: power of two (`n = 16`)

```
n        = 0001 0000
n - 1    = 0000 1111
n & (n-1)= 0000 0000   → expression true
n > 0    → isPowerOfTwo true
```

### Case B: not a power of two (`n = 10`)

```
n        = 0000 1010
n - 1    = 0000 1001
n & (n-1)= 0000 1000   → not zero → false
```

Two 1-bits (8 and 2). Clearing the lowest leaves the 8.

### Case C: the zero trap (`n = 0`)

```
n        = 0000 0000
n - 1    = 1111 1111   // for int: -1, all bits 1
n & (n-1)= 0000 0000   → expression true, but not a power of two
```

Always say: **raw expression accepts 0; power-of-two helpers must reject it.**

### Case D: one (`n = 1`)

```
1 is 2^0. One bit set. Expression true. isPowerOfTwo true.
```

People forget that 1 is a power of two. It is.

### Quick smoke test

```java
public static void main(String[] args) {
    int[] samples = {0, 1, 2, 3, 4, 5, 6, 7, 8, 15, 16, 17, 32};
    for (int n : samples) {
        boolean raw = (n & (n - 1)) == 0;
        boolean pow = n > 0 && (n & (n - 1)) == 0;
        System.out.println(n + " raw=" + raw + " powerOfTwo=" + pow);
    }
    // 0  raw=true  powerOfTwo=false
    // 1  raw=true  powerOfTwo=true
    // 2  raw=true  powerOfTwo=true
    // 3  raw=false powerOfTwo=false
    // ...
}
```

---

## 6. Complexity, edges, interview tips

| Topic | Answer |
| --- | --- |
| Time | O(1) word operations |
| Extra space | O(1) |
| Core identity | `n & (n - 1)` clears the lowest set bit |
| Power of two | `n > 0 && (n & (n - 1)) == 0` |
| Zero | expression true; not a power of two |
| One | power of two (`2^0`) |
| Negatives | do not call them powers of two here; use `n > 0` |
| Related use | Kernighan's bit-count loop: `while (n != 0) { n &= n - 1; count++; }` counts set bits by repeatedly clearing the lowest one |

**Common mistakes:**

1. **Forgetting `n > 0`.** You ship a "power of two" check that returns true for 0.
2. **Saying the expression "checks power of two" without the zero caveat.** Precise wording: at most one bit set; power of two only with positivity.
3. **Thinking `n & (n + 1)` does the same thing.** It does not. Stick to `n - 1`.
4. **Mixing up "clears lowest set bit" with "toggles all bits".** Only the lowest 1 and the trailing zeros are involved in the subtract; AND then removes that lowest 1.
5. **Hand-waving negatives.** In Java, prefer an explicit positive check instead of inventing meaning for negative powers of two in an interview unless asked.

**How to talk it (30-second version):**

1. Powers of two have exactly one bit set.
2. `n & (n - 1)` turns off the lowest set bit.
3. If the result is 0, there were zero or one set bits.
4. Add `n > 0` so zero does not pass as a power of two.

**Where this shows up outside the riddle:**

* Validating buffer sizes that must be a power of two (some ring buffers, hash table capacities in older designs).
* Fast checks before algorithms that use bit masks of width `n`.
* Inside bit-count and bit-twiddling loops (clear lowest set bit repeatedly).

---

## 7. Explain to a friend recap

Debugger (problem 5.5) is not "build a debugger." It is: **what does `((n & (n - 1)) == 0)` check?**

1. Subtracting one, then AND, clears the least significant 1-bit of `n`.
2. If that product is zero, `n` had no second 1-bit: zero or one bits set.
3. Positive integers with exactly one bit set are the powers of two: `1, 2, 4, 8, ...`.
4. Write `n > 0 && (n & (n - 1)) == 0` when you mean power of two.
5. Zero makes the raw expression true. That is the trap that earns follow-up points.

If you can walk `8` and `10` in binary, explain why zero is special, and write the one-liner with the positive check, you own problem 5.5.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Next Number](/blog/en/ctci-5-4-next-number)
* Next: [Conversion](/blog/en/ctci-5-6-conversion)