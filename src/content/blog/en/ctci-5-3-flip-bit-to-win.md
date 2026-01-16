---
title: "Flip Bit to Win: Longest Ones After One Flip (Java)"
description: "CTCI-style problem 5.3 for beginners: flip one 0-bit in an integer to maximize consecutive 1s. Track runs of ones separated by zeros, merge across a single zero, plain Java."
date: "2026-01-16"
tags: [Algorithms]
coverImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
previewImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 5.3 for beginners: flip one 0-bit in an integer to maximize consecutive 1s. Track runs of ones separated by zeros, merge across a single zero, plain Java.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You look at a row of light switches. Most are ON. A few are OFF. You may flip **exactly one** OFF switch to ON. You want the longest stretch of consecutive ON lights you can create. That is **Flip Bit to Win**: one free zero-to-one change, then measure the longest run of ones.

This post is original teaching for beginners in **Java**. Same problem family as classic interview bit-run questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 5, bit manipulation, problem 5.3.

---

## 1. Everyday analogy

Imagine a parking strip painted with spots in a line. A filled spot is a `1`. An empty spot is a `0`. You get **one** free fill: pick one empty spot and paint it full.

If two full blocks sit on either side of a single empty spot, filling that spot joins them into one long block. If two empties sit in a row, filling only one of them cannot join the full blocks on both outer sides. You still get a longer local run, but the gap of two empties stays broken.

So the job is not "count all ones." It is "find the best place to spend your one fill."

---

## 2. Plain problem statement

**Input:** a 32-bit integer `n` (treat as bits; interviews usually mean a fixed-width word, often 32).

**Output:** the length of the longest sequence of `1` bits you can create by flipping **at most one** `0` bit to `1`. (Flipping zero bits is allowed in spirit when the number is already all ones: the answer is the full word width.)

**Examples** (binary written with the least significant bit on the right):

| Input idea | Binary (low bits) | Best flip | Result length |
| --- | --- | --- | --- |
| classic 1775 | `11011101111` | the zero between `111` and `1111` | 8 |
| `0b11011` | `11011` | the middle zero | 5 |
| `0b110011` | `110011` | either isolated zero | 3 (cannot join both pairs) |
| `0` | all zeros | any single bit | 1 |
| `-1` (all ones in two's complement) | 32 ones | none needed | 32 |
| `0b111` | `111` | a zero above the run | 4 |

**Clarify before coding:**

* Word size? (32-bit `int` is the default here. Use `Integer.SIZE`.)
* Must we flip, or is "already best" allowed? (If already all ones, return 32. You do not need a zero to flip.)
* Signed ints: scan with **unsigned** shift `>>>` so the sign bit does not stick forever.
* Return the length, not the flipped integer (unless the interviewer asks for both).

---

## 3. Think first

### Brute idea (say it, then skip coding it)

For each bit position that is 0, flip it, scan for the longest run of ones, flip back. That is O(b²) for word width b (32 or 64). Fine for a tiny b, weak as a habit.

### Better idea: runs of ones separated by zeros

Walk the bits once. Keep:

* `currentLength`: how many ones you have seen in a row ending at the bit you just processed.
* `previousLength`: how many ones sat **immediately before the most recent zero** you can still use as a bridge.
* `maxLength`: best answer so far.

When the current bit is `1`, grow `currentLength`.

When the current bit is `0`:

* The run of ones that just ended may become the left side of a future merge.
* Look one bit ahead. If the **next** bit is also `0`, two zeros in a row: you cannot use this zero as a bridge to a later ones-run that still has another zero in the way. Set `previousLength = 0`.
* If the next bit is `1` (or you will treat the window carefully), set `previousLength = currentLength`.
* Reset `currentLength = 0`.

After every bit, the best merge that uses the most recent zero as the flip is:

```
previousLength + 1 + currentLength
```

The `+ 1` is the flipped zero. Update `maxLength` with that value.

If the number is all ones (`~n == 0` for a full-width word), return the word size immediately.

### Why looking one bit ahead works

You only need to know whether the zero you just hit is a **single** separator or the start of a double gap. `(n & 2) == 0` means "the next bit (after one shift of thinking) is also zero" while you still hold the current zero in the low bit. In code you check before shifting, using the current value of `n`.

### Alternative mental model: sequence list

Build a list of run lengths alternating zeros and ones, for example:

```
11011101111  →  ones:2, zero:1, ones:3, zero:1, ones:4
```

For every zero-run of length 1, candidate = left ones + 1 + right ones. For a zero-run longer than 1, the best local flip only extends one neighboring ones-run by 1. Take the global max. Same answer, more memory. The O(1) prev/curr scan is the interview default.

---

## 4. Java solution

```java
/**
 * Longest run of 1-bits after flipping at most one 0-bit to 1.
 * Assumes a 32-bit word (Integer.SIZE).
 */
int flipBitToWin(int n) {
    // Already all ones: no flip needed.
    if (~n == 0) {
        return Integer.SIZE;
    }

    int currentLength = 0;
    int previousLength = 0;
    int maxLength = 1; // flipping one zero in a sea of zeros still yields length 1

    while (n != 0) {
        if ((n & 1) == 1) {
            currentLength++;
        } else {
            // Current bit is 0. If the next bit is also 0, no useful left run to keep.
            previousLength = ((n & 2) == 0) ? 0 : currentLength;
            currentLength = 0;
        }
        maxLength = Math.max(previousLength + 1 + currentLength, maxLength);
        n >>>= 1; // logical shift; do not sign-extend
    }

    return maxLength;
}
```

### Walkthrough: 1775 (`11011101111`)

Bits from low to high as the loop sees them: `1 1 1 1 0 1 1 1 0 1 1`.

| Bit | Action | prev | curr | max |
| --- | --- | --- | --- | --- |
| 1 | ones++ | 0 | 1 | 2 |
| 1 | ones++ | 0 | 2 | 3 |
| 1 | ones++ | 0 | 3 | 4 |
| 1 | ones++ | 0 | 4 | 5 |
| 0 | next is 1 → prev=4, curr=0 | 4 | 0 | 5 |
| 1 | ones++ | 4 | 1 | 6 |
| 1 | ones++ | 4 | 2 | 7 |
| 1 | ones++ | 4 | 3 | 8 |
| 0 | next is 1 → prev=3, curr=0 | 3 | 0 | 8 |
| 1 | ones++ | 3 | 1 | 8 |
| 1 | ones++ | 3 | 2 | 8 |

Answer **8**: flip the zero between the block of three ones and the block of four ones.

### Walkthrough: `0b110011` (cannot merge both pairs)

Ones, ones, zero, zero, ones, ones. When the first zero is processed, the next bit is also zero, so `previousLength` becomes 0. Later ones never join the first pair. Best length is 3.

### Minimal smoke tests

```java
public static void main(String[] args) {
    System.out.println(flipBitToWin(1775));      // 8
    System.out.println(flipBitToWin(0b11011));   // 5
    System.out.println(flipBitToWin(0b110011));  // 3
    System.out.println(flipBitToWin(0));         // 1
    System.out.println(flipBitToWin(-1));        // 32
    System.out.println(flipBitToWin(0b111));     // 4
}
```

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Flip each zero, rescan | O(b²) | O(1) | b = word width (32/64); simple but weak |
| Prev/curr one-pass | O(b) | O(1) | preferred interview answer |
| Build run-length list | O(b) | O(b) | clear picture; more allocation |

For a fixed 32-bit `int`, O(b) is constant time in practice. Still say O(b) out loud.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **All ones (`-1`)** → return `Integer.SIZE` (32). Special case up front.
* **All zeros (`0`)** → return 1 (flip any bit).
* **Single one** → return 2 if any zero exists to flip beside it; the loop's `previousLength + 1 + currentLength` covers it.
* **Two consecutive zeros** → do not keep a stale `previousLength`. The `(n & 2) == 0` branch clears it.
* **Ones at the high end** → when `n` becomes 0 the loop stops; leading high zeros were never "needed" as merge points beyond what the formula already scored while consuming ones.
* **Arithmetic `>>` instead of `>>>`** → on negative numbers the sign bit repeats forever. Always use logical shift for bit scans.

Common mistakes:

1. **Forgetting the all-ones fast path.** Without it, some codes still work, but the intent is clearer with `if (~n == 0)`.
2. **Using `maxLength = 0` as the start.** Then all-zero input returns 0. You can always create one one.
3. **Resetting `previousLength` to `currentLength` on every zero without checking the next bit.** Double gaps would incorrectly merge.
4. **Returning the flipped number instead of the length.** Read the ask again.
5. **Building a 32-char string of bits and scanning with charAt.** Works, slower thinking, easy off-by-ones. Prefer arithmetic on `n`.

---

## 7. Explain to a friend recap

Flip Bit to Win asks: flip at most one zero to one, then how long is the longest streak of ones?

1. If the word is already all ones, answer is the word width (32).
2. Walk bits with a logical shift. Track the current ones-run and the ones-run before the last useful zero.
3. On a zero, if the next bit is also zero, drop the saved left run. Otherwise save the run you just finished as the left side.
4. After every bit, candidate length is left run + 1 (the flip) + right run so far.
5. One pass, constant extra memory, easy to draw with the 1775 example that becomes 8.

If you can mark the best zero to flip on `11011101111` and explain why `110011` only reaches 3, you own problem 5.3.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Binary to String](/blog/en/ctci-5-2-binary-to-string)
* Next: [Next Number](/blog/en/ctci-5-4-next-number)