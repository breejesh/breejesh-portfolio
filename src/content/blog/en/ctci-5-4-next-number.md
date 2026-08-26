---
title: "Next Number: Same Bit Count, Next Larger and Smaller (Java)"
description: "CTCI-style problem 5.4 for beginners: given a positive int, find the next larger and next smaller values that keep the same number of 1 bits. Count trailing zeros and ones, flip one bit, rearrange the rest."
date: "2026-05-31"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-4-next-number.webp
previewImage: /assets/images/ctci-5-4-next-number.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 5.4 for beginners: given a positive int, find the next larger and next smaller values that keep the same number of 1 bits. Count trailing zeros and ones, flip one bit, rearrange the rest.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You have a bag of binary digits with a fixed number of `1`s. You may rearrange them, but you cannot invent extra ones or throw any away. Among all numbers you can form that way, which one sits just above the current value, and which one sits just below? That is **Next Number**: same popcount, nearest neighbors on the integer line.

This post is original teaching for beginners in **Java**. Same problem family as classic interview bit-manipulation questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 5, bit manipulation.

---

## 1. Everyday analogy

Think of a row of light switches. Some are ON (`1`), some OFF (`0`). The rule for this puzzle: every legal pattern must keep **exactly the same count of ON switches**.

* The **next larger** pattern is the smallest integer larger than the current one that still has the same number of ONs.
* The **next smaller** pattern is the largest integer smaller than the current one with the same ON count.

Brute force would try `n+1`, `n+2`, ... and count bits each time. That works for tiny demos. Interviews want a direct bit construction: find the right place to flip one bit, then pack the remaining ones as tightly as the "next" direction needs.

---

## 2. Plain problem statement

**Input:** a positive `int n` (for interviews, treat it as a 32-bit two's complement pattern; focus on non-negative values unless told otherwise).

**Output:**

* `getNext(n)`: the smallest number **greater than** `n` with the same number of `1` bits, or a sentinel (for example `-1`) if none exists in the word width.
* `getPrev(n)`: the largest number **less than** `n` with the same number of `1` bits, or a sentinel if none exists.

**Same number of 1 bits** means same popcount: `Integer.bitCount(result) == Integer.bitCount(n)`.

**Examples:**

| n (binary) | Ones | Next larger | Next smaller |
| --- | --- | --- | --- |
| `11011001111100` (13948) | 9 | `11011010001111` (13967) | (exists; see walk-through idea below) |
| `10110` (22) | 3 | `11001` (25) | `10101` (21) |
| `10011100` (156) | 4 | `10100011` (163) | `10011010` (154) |
| `1` | 1 | `10` (2) | none (return `-1`) |
| all ones in the low k bits only, nothing higher free | k | may not exist if no zero can flip up | often still exists if zeros sit above |

**Clarify before coding:**

* Positive only, or full 32-bit including sign bit? (Start with positive; mention 31 as the practical high bit for positive `int`.)
* What if no next/prev exists? (`-1` or throw; pick one and stick to it.)
* Is `n == 0` allowed? (Zero ones: only zero has zero ones. No next, no prev.)
* Do we need both answers from one method, or two helpers?

---

## 3. Think first

### Brute (fine as a warm-up)

```
next = n + 1
while bitCount(next) != bitCount(n): next++
```

Same idea downward for prev. Correct for small n. Worst case can walk far, and on a fixed word you must stop at overflow. Interviewers usually want O(1) or O(word size) bit work.

### Insight for next larger

You want the **smallest** increase that preserves the 1-count.

That means:

1. Find the **rightmost non-trailing zero**: the lowest `0` that has at least one `1` to its right. Call its index `p`.
2. Flip that `0` to `1`. You just increased the number, and you temporarily have one extra `1`.
3. Clear every bit below `p`.
4. Put back the ones you "owe" on the **rightmost** positions under `p`, but only `c1 - 1` of them (you already spent one flip for the extra 1 at `p`). That minimizes the value below `p`.

How to find `p` without scanning randomly:

* `c0` = count of trailing `0`s (from bit 0 upward).
* `c1` = count of `1`s after those zeros (a run of ones).
* Then `p = c0 + c1`. Bit `p` is the zero sitting just left of that ones-run (or the zero after trailing zeros if `c1 == 0` is impossible for a non-trailing zero... if `c1 == 0`, there is no 1 to the right of any candidate, so no next larger with the same count in that pattern class; classic check: if `c0 + c1 == 31` or `0`, fail for 32-bit positive cases as in the book-style guard).

### Insight for next smaller

Mirror the idea.

1. Count trailing `1`s (`c1`), then the zeros above them (`c0`).
2. Position `p = c0 + c1` is the **rightmost non-trailing one** (a `1` with a `0` somewhere to its right after the trailing ones).
3. Flip that `1` down to `0` (shrink the number) and clear bits below.
4. Place `c1 + 1` ones as far **left** as you still can under the old region... the standard packing puts a block of `(c1 + 1)` ones immediately to the right of the zeros you leave under `p`, specifically shifted by `(c0 - 1)`.

If there is no zero above the low ones (pattern like `000...00111`), you cannot go smaller with the same count.

### Arithmetic shortcuts (same counts)

Once you have `c0` and `c1`:

* Next larger: `n + (1 << c0) + (1 << (c1 - 1)) - 1`
* Next smaller: `n - (1 << c1) - (1 << (c0 - 1)) + 1`

Same results as the flip-and-repack versions. Nice as a second implementation after you explain the bit picture.

---

## 4. Java solution

### Count helpers (optional clarity)

```java
// Trailing zeros on the low end of n (only while n is even and non-zero).
// We usually count while walking a copy of n, not with Integer.numberOfTrailingZeros alone,
// because getNext needs zeros then ones in one pass.
```

### getNext: next larger with same bit count

```java
/**
 * Smallest number greater than n with the same number of 1 bits.
 * Returns -1 if none exists within a 32-bit positive pattern.
 */
int getNext(int n) {
    if (n <= 0) {
        return -1;
    }

    int c = n;
    int c0 = 0; // trailing zeros
    int c1 = 0; // ones right after those zeros

    // count trailing zeros
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }
    // count ones after that
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }

    // no larger number with same 1-count in 32-bit space
    // (e.g. 111...11000...0 with no non-trailing zero to flip)
    if (c0 + c1 == 31 || c0 + c1 == 0) {
        return -1;
    }

    int p = c0 + c1; // position of rightmost non-trailing zero

    // Flip the zero at p to one.
    n |= (1 << p);

    // Clear all bits to the right of p.
    n &= ~((1 << p) - 1);

    // Insert (c1 - 1) ones on the right.
    n |= (1 << (c1 - 1)) - 1;

    return n;
}
```

**Arithmetic twin:**

```java
int getNextArithmetic(int n) {
    if (n <= 0) {
        return -1;
    }
    int c = n;
    int c0 = 0;
    int c1 = 0;
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }
    if (c0 + c1 == 31 || c0 + c1 == 0 || c1 == 0) {
        return -1;
    }
    return n + (1 << c0) + (1 << (c1 - 1)) - 1;
}
```

### getPrev: next smaller with same bit count

```java
/**
 * Largest number less than n with the same number of 1 bits.
 * Returns -1 if none exists.
 */
int getPrev(int n) {
    if (n <= 0) {
        return -1;
    }

    int c = n;
    int c0 = 0; // zeros after the trailing ones
    int c1 = 0; // trailing ones

    // count trailing ones
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }
    if (c == 0) {
        // pattern like 00...00111: no smaller with same ones
        return -1;
    }

    // count zeros after those ones
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }

    int p = c0 + c1; // rightmost non-trailing one

    // Clear bits from p down through 0.
    n &= (-1 << (p + 1)); // same as ~0 << (p + 1)

    // Sequence of (c1 + 1) ones.
    int mask = (1 << (c1 + 1)) - 1;

    // Place that block as far right as allowed: leave (c0 - 1) zeros at the bottom.
    n |= mask << (c0 - 1);

    return n;
}
```

**Arithmetic twin:**

```java
int getPrevArithmetic(int n) {
    if (n <= 0) {
        return -1;
    }
    int c = n;
    int c0 = 0;
    int c1 = 0;
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }
    if (c == 0) {
        return -1;
    }
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }
    if (c0 == 0) {
        return -1;
    }
    return n - (1 << c1) - (1 << (c0 - 1)) + 1;
}
```

Use `>>>` (unsigned shift) when walking `c` so a high `1` (sign bit) does not keep the loop on forever with arithmetic `>>`. For strictly positive interview inputs, either shift is fine; `>>>` is safer habit.

---

## 5. Walk-throughs

### Next larger: 13948

```
n  = 11011001111100
       trailing zeros: 00  → c0 = 2
       then ones: 11111    → c1 = 5
       p = 7  (0-based from the right)

Flip bit 7:     11011011111100
Clear below 7:  11011010000000
Add c1-1 = 4 ones on the right:
                11011010001111  = 13967
```

Check: both have nine `1`s, and nothing between 13948 and 13967 has nine `1`s.

### Next smaller: 156 (`10011100`)

```
n  = 10011100
       trailing ones: none → c1 = 0
       then zeros: 00      → c0 = 2
       next bit is 1, so p = 2

Clear from bit 2 down:  10011000
mask = (c1 + 1) ones = 1
shift by (c0 - 1) = 1:  10011010  = 154
```

Four ones each. 155 has five ones, so 154 is the neighbor.

### Tiny case: 22 (`10110`)

| Direction | Counts | Result binary | Decimal |
| --- | --- | --- | --- |
| next | c0=1, c1=2, p=3 | `11001` | 25 |
| prev | c1=0, c0=1, p=1 | `10101` | 21 |

---

## 6. Complexity, edges, interview tips

| Topic | Answer |
| --- | --- |
| Time | O(b) to count runs, b = word size (32). Flip and mask work is O(1). |
| Extra space | O(1) |
| Brute alternative | O(gap) increments; gap can be large |
| No next | Patterns with no non-trailing zero to flip (guard with `c0 + c1`) |
| No prev | All ones packed at the bottom only (`c == 0` after counting trailing ones) |
| `n = 0` | Only zero has zero ones; return `-1` for both |
| Sign bit | Prefer `>>>` when scanning; stay in positive range in interviews |

**Common bugs:**

1. Using arithmetic `>>` on a negative intermediate when practicing wider cases.
2. Off-by-one: inserting `c1` ones instead of `c1 - 1` after flipping up.
3. Forgetting to clear below `p` before inserting ones (leftover bits corrupt the count).
4. Claiming no solution exists without checking the trailing-run structure.
5. Confusing "next larger by value" with "next larger when bits are rotated". This problem is about **integer order**, not rotation.

**How to talk it:**

1. Restate: same popcount, nearest larger and nearest smaller.
2. Draw one bit string. Mark trailing zeros, then ones, then the flip position.
3. Flip, clear right, repack ones.
4. Mirror for prev.
5. Optional: show the arithmetic form matches on your example.

---

## 7. Explain to a friend recap

Next Number (problem 5.4) asks: from a positive int, find the next larger and next smaller ints that keep the same number of `1` bits.

1. **Next larger:** count trailing zeros (`c0`) then ones (`c1`). Flip the zero at position `p = c0 + c1`. Clear below `p`. Put `c1 - 1` ones on the far right.
2. **Next smaller:** count trailing ones (`c1`) then zeros (`c0`). Flip the one at `p = c0 + c1` down by clearing from `p` through 0. Place `c1 + 1` ones shifted by `c0 - 1`.
3. **Arithmetic:** `n + (1<<c0) + (1<<(c1-1)) - 1` and `n - (1<<c1) - (1<<(c0-1)) + 1` once the counts are known.
4. Return a sentinel when the bit pattern has no room to move (no non-trailing zero for next, no non-trailing one for prev).
5. Prefer unsigned shifts when walking bits.

If you can walk 13948 to 13967 by hand and explain why the ones settle on the right after the flip, you own 5.4.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Flip Bit to Win](/blog/en/ctci-5-3-flip-bit-to-win)
* Next: [Debugger](/blog/en/ctci-5-5-debugger)