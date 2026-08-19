---
title: "Conversion: How Many Bits Flip to Turn A into B (Java)"
description: "CTCI-style problem 5.6 for beginners: count the bits you must flip to convert integer A into B. XOR the two numbers, then count the ones. Brian Kernighan loop and Integer.bitCount."
date: "2026-02-19"
tags: [Algorithms]
coverImage: /assets/images/ctci-5-6-conversion.webp
previewImage: /assets/images/ctci-5-6-conversion.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 5.6 for beginners: count the bits you must flip to convert integer A into B. XOR the two numbers, then count the ones. Brian Kernighan loop and Integer.bitCount.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You have two light switches, each with a row of on/off bulbs. Same number of bulbs, same positions. How many bulbs differ between the rows? That count is exactly how many times you need to flip a switch on the first row so it matches the second.

That is **conversion** on integers: the Hamming distance between A and B. Flip a bit means change 0 to 1 or 1 to 0. Count the positions where A and B disagree.

This post is original teaching for beginners in **Java**. Same problem family as classic interview bit-counting questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 5, bit manipulation.

---

## 1. Everyday analogy

Write two short binary strings on paper, one under the other:

```
A:  1 1 1 0 1
B:  0 1 1 1 1
    ^       ^
```

The carets mark columns that do not match. Two mismatches. Flip those two bits in A and you get B.

You do not need to rebuild the number from scratch. You only touch the disagreeing positions. The question is: how many of those positions are there?

---

## 2. Plain problem statement

**Input:** two integers `a` and `b` (Java `int` is fine for interviews; same idea works for `long`).

**Output:** the number of bit positions where `a` and `b` differ. That is how many flips turn `a` into `b`.

**Examples:**

| A (decimal) | B (decimal) | A binary (low bits) | B binary | Flips |
| --- | --- | --- | --- | --- |
| 29 | 15 | `11101` | `01111` | 2 |
| 0 | 0 | `0` | `0` | 0 |
| 1 | 0 | `1` | `0` | 1 |
| 7 | 0 | `111` | `000` | 3 |
| -1 | 0 | all ones (32-bit) | all zeros | 32 |

**Clarify before coding:**

* Signed `int` with two's complement? (Yes in Java. Negative numbers still work with XOR and bit counts.)
* Count only the useful low bits, or all 32 bits of `int`? (All 32 for a full answer; leading zeros match and add zero flips.)
* Do we need the list of positions, or only the count? (Count only.)
* `long` (64 bits) or just `int`? (Ask. Code below uses `int`.)

---

## 3. Think first

### What one flip does

Flipping bit `i` of A changes that bit and nothing else. To turn A into B you must flip every bit where they differ, and you must not flip bits where they already match. So the answer is exactly the number of differing bits. No clever shorter path exists in the bit-flip cost model.

### Spot the differences with XOR

XOR is 1 when inputs differ, 0 when they match:

| A bit | B bit | A XOR B |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

So `a ^ b` is a mask with 1s only where you need a flip. The problem shrinks to: **count the 1 bits in `a ^ b`**.

### Count the ones

Three common ways:

1. **Shift loop:** check the low bit, right-shift, repeat 32 times (or until the value is 0 if you only care about low set bits for non-negative numbers; for negatives in Java, arithmetic right shift keeps the sign bit, so prefer a fixed 32-step loop or unsigned style).
2. **Brian Kernighan:** `c = c & (c - 1)` clears the lowest set bit. Loop until `c` is 0. Iterations equal the number of 1s, not the bit width.
3. **Library:** `Integer.bitCount(c)` in Java. Hardware often maps this to a POPCNT instruction. Fine in production; some interviews still want you to write the loop.

Interviewers like hearing "XOR, then popcount" in one breath.

---

## 4. Java solutions

### (a) XOR + Brian Kernighan (classic interview)

```java
int bitFlipCount(int a, int b) {
    int c = a ^ b;
    int count = 0;
    while (c != 0) {
        // Clear the lowest set bit
        c = c & (c - 1);
        count++;
    }
    return count;
}
```

Walk-through for `a = 29`, `b = 15`:

```
29 = 11101
15 = 01111
XOR  = 10010   // two ones

c = 10010
c & (c-1) = 10000   // count 1
c & (c-1) = 00000   // count 2
return 2
```

### (b) XOR + Integer.bitCount

```java
int bitFlipCountLib(int a, int b) {
    return Integer.bitCount(a ^ b);
}
```

Same answer. Shorter. Mention both: the one-liner for real code, Kernighan when they ask how bitCount might work.

### (c) Shift and mask (explicit 32-bit walk)

```java
int bitFlipCountShift(int a, int b) {
    int c = a ^ b;
    int count = 0;
    for (int i = 0; i < 32; i++) {
        count += (c & 1);
        c >>>= 1; // unsigned shift, works for negative ints too
    }
    return count;
}
```

Always 32 iterations. Clear when you want every bit position examined. Slightly slower than Kernighan when few bits are set, same big-O.

### Full tiny demo

```java
public class Conversion {
    static int bitFlipCount(int a, int b) {
        int c = a ^ b;
        int count = 0;
        while (c != 0) {
            c &= (c - 1);
            count++;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(bitFlipCount(29, 15)); // 2
        System.out.println(bitFlipCount(0, 0));   // 0
        System.out.println(bitFlipCount(1, 0));   // 1
        System.out.println(bitFlipCount(7, 0));   // 3
        System.out.println(bitFlipCount(-1, 0));  // 32
    }
}
```

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| XOR + Kernighan | O(k) | O(1) | k = number of 1 bits in XOR |
| XOR + 32-step shift | O(1) for int | O(1) | Fixed 32 iterations |
| `Integer.bitCount` | O(1) typical | O(1) | Often a single CPU instruction |

All of these are constant for fixed-width integers. The interesting part is the idea (XOR then count), not asymptotic growth.

---

## 6. Edge cases

* **`a == b`** → 0 flips. XOR is 0.
* **One of them is 0** → answer is the number of 1s in the other number.
* **Negatives** → Java uses two's complement. XOR and Kernighan still work. `-1 ^ 0` has 32 ones.
* **`Integer.MIN_VALUE`** → still fine. You never divide or right-shift in a way that depends on magnitude if you use Kernighan or `>>>`.
* **Order** → `flip(a, b) == flip(b, a)`. Distance is symmetric.
* **Do not use `Math.abs` or string conversion** of the binary form. That is slower, messier, and fails the spirit of the bit chapter.
* **`long` version** → same code with `long c = a ^ b` and 64 steps if you use a shift loop, or `Long.bitCount`.

Minimal smoke checks:

```java
assert bitFlipCount(29, 15) == 2;
assert bitFlipCount(0, 0) == 0;
assert bitFlipCount(-1, 0) == 32;
assert bitFlipCount(7, 1) == 2; // 111 vs 001
```

---

## 7. Explain to a friend recap

Conversion asks: how many bit flips turn A into B?

1. Bits that already match need no flip. Bits that differ each need one flip.
2. `a ^ b` lights up exactly the differing positions.
3. Count the 1s in that XOR result. That count is the answer.
4. Brian Kernighan clears one set bit per loop: `c = c & (c - 1)`.
5. Or call `Integer.bitCount(a ^ b)` when library helpers are allowed.

If you can walk the 29 vs 15 example on a whiteboard, write the XOR, circle the two ones, and code Kernighan without freezing, you own problem 5.6.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Debugger](/blog/en/ctci-5-5-debugger)
* Next: [Pairwise Swap](/blog/en/ctci-5-7-pairwise-swap)