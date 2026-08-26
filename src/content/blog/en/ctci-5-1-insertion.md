---
title: "Insertion: Slot Integer M into N Between Bits i and j (Java)"
description: "CTCI-style problem 5.1 for beginners: clear bits i through j in N, shift M by i, then OR. Bit masks, a walk-through on the classic example, and Java code."
date: "2025-10-17"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-1-insertion.webp
previewImage: /assets/images/ctci-5-1-insertion.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 5.1 for beginners: clear bits i through j in N, shift M by i, then OR. Bit masks, a walk-through on the classic example, and Java code.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You have a long shelf of books (integer `N`). A short run of slots in the middle is reserved for a new set (`M`). You empty those slots, slide the new books into place, and leave everything else alone. That is **bit insertion**: write the bits of `M` into `N` from bit `i` up through bit `j`.

This post is original teaching for beginners in **Java**. Same problem family as classic interview bit-manipulation warmups, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 5, bit manipulation, starts here.

---

## 1. Everyday analogy

Picture a hotel key card with a row of tiny lights. Some lights are already on or off (`N`). A guest code (`M`) must light a fixed window of those positions, say from light `i` through light `j` (bit 0 is the least significant bit on the right).

You do **not** flip lights one by one by hand if you can avoid it. You:

1. Turn **off** every light in the window (clear those bits).
2. Align the guest code so its lowest bit lands on light `i` (shift `M` left by `i`).
3. Merge with OR: where the code wants a light on, it turns on; where it wants off, the cleared window stays off; lights outside the window never change.

Same three moves show up in every solid answer.

---

## 2. Plain problem statement

**Input:** two integers `N` and `M`, and two bit indices `i` and `j` (0-based from the right). Assume a 32-bit `int` for interviews unless told otherwise.

**Output:** `N` with bits `i` through `j` replaced by the bits of `M`. Bit `0` of `M` lands at position `i` of the result. Higher bits of `M` fill toward `j`.

**Assumptions you should state:**

* The window `i..j` is wide enough for all bits of `M` that matter (book: `M` fits between `i` and `j`).
* `i <= j`.
* Bits outside `[i, j]` in `N` stay the same.
* Bits of `M` that would sit above `j` are out of scope if the fit assumption holds; still, some people mask `M` to the window width for safety.

**Classic example** (binary shown for clarity; bit 0 is the rightmost digit):

```
N = 10000000000   (binary)
M = 10011
i = 2
j = 6

Result = 10001001100
```

After the insert, bits 2-6 of the result are `10011` (the value of `M`), and the rest of `N` is unchanged.

**Clarify before coding:**

* Bit 0 is LSB (rightmost)? (Yes for this problem.)
* Signed `int` vs unsigned? In Java everything is signed two's complement, but for pure bit work you treat the pattern as 32 bits.
* Must `M` fit exactly, or only "at least" the needed width? (Assume fit; optional extra mask.)
* Return type: same width as `N` (`int` or `long` if you want headroom).

---

## 3. Think first

### Wrong instinct: set bits of M one by one

You *could* loop `k` from 0 to `j - i`, read bit `k` of `M`, and write it into bit `i + k` of `N`. That works, but interviews want the mask version: clear a range, align, OR. Fewer branches, and it shows you understand masks.

### Right shape: clear, shift, OR

1. **Clear** bits `i` through `j` in `N` using a mask that is 0 in that range and 1 elsewhere.
2. **Shift** `M` left by `i` so bit 0 of `M` sits at bit `i`.
3. **OR** the cleared `N` with the shifted `M`.

All three steps are O(1) word operations on a fixed-width integer.

### Building the clear mask

You want something like:

```
// for i=2, j=6 on a short word for illustration:
// ones, then zeros from j down to i, then ones again on the low side
// ...11110000011  (zeros in bits 2..6)
```

Build it in two pieces:

* **Left ones:** keep bits from `j + 1` upward.  
  `left = ~0 << (j + 1)`  
  In Java, `~0` is all bits 1 (`-1`). Shifting left by `j + 1` puts zeros in bits `0..j`.

* **Right ones:** keep bits from `0` up to `i - 1`.  
  `right = (1 << i) - 1`  
  That is `i` low ones. If `i == 0`, this is `0` (nothing to keep on the right).

* **Mask:** `mask = left | right`  
  Zeros exactly on bits `i..j`, ones everywhere else.

* **Cleared N:** `nCleared = N & mask`

* **Merged:** `nCleared | (M << i)`

Edge care in Java: if `j == 31`, then `j + 1 == 32`. Shifting an `int` by 32 is masked to 0 mod 32 in Java (`<< 32` is a no-op on `int`). For a full 32-bit window that reaches the top, use `long` for the shift math, or special-case `j == 31` so `left = 0`. Interviews often pick `j` safely below 31, but mention the trap.

---

## 4. Java solution

```java
/**
 * Insert M into N between bits i and j (inclusive).
 * Bit 0 is the least significant bit.
 * Assumes M fits in the window [i, j].
 */
int insertion(int N, int M, int i, int j) {
    // 1) Mask with 0s from bit i through bit j, 1s elsewhere.
    int allOnes = ~0;                 // 0xFFFFFFFF as a pattern
    int left = allOnes << (j + 1);    // 1s, then 0s from bit j downward
    int right = (1 << i) - 1;         // 1s in bits 0..i-1
    int mask = left | right;          // 0s only in [i, j]

    // 2) Clear the window in N.
    int nCleared = N & mask;

    // 3) Align M and merge.
    int mShifted = M << i;
    return nCleared | mShifted;
}
```

### Safer when j might be 31

```java
int insertionSafe(int N, int M, int i, int j) {
    int right = (1 << i) - 1;
    int left;
    if (j >= 31) {
        left = 0; // no bits above 31 on a 32-bit int
    } else {
        left = (~0) << (j + 1);
    }
    int mask = left | right;
    return (N & mask) | (M << i);
}
```

### Optional: clamp M to the window width

If you do not fully trust the "M fits" assumption:

```java
int width = j - i + 1;
int mMasked = M & ((width >= 32) ? ~0 : (1 << width) - 1);
return (N & mask) | (mMasked << i);
```

Still O(1). Good follow-up if the interviewer asks about garbage high bits in `M`.

---

## 5. Walk through the classic example

```
N = 10000000000   (binary)   // think of this as bits; leading 1 is bit 10
M = 10011
i = 2, j = 6
```

**Step A: clear mask**

* `left = ~0 << 7` → low 7 bits 0, higher bits 1  
* `right = (1 << 2) - 1` → `11` in binary  
* `mask = left | right` → zeros in bits 2-6, ones elsewhere  

**Step B: clear N**

* `nCleared = N & mask`  
* Bits 2-6 of `N` become 0. In the classic drawing, that middle run is already 0, so `N` looks the same after clear, but the step still matters when those bits were 1.

**Step C: shift and OR**

* `M << 2` = `10011` moved two places left → bits 2-6 hold `10011`  
* OR into cleared `N` → `10001001100`

Sanity check in code:

```java
int N = 0b10000000000;
int M = 0b10011;
int result = insertion(N, M, 2, 6);
// result binary: 10001001100
// Integer.toBinaryString(result) -> "10001001100"
```

Another quick check: if `N` had garbage in the window, clear still wipes it first so OR cannot leave a sticky 1 where `M` wanted 0.

```java
// N has 1s in bits 2-6; after insert they must match M, not the old 1s
int dirty = 0b10001111100;
int cleaned = insertion(dirty, 0b10011, 2, 6);
// still 10001001100 in the low part of interest
```

---

## 6. Complexity, edges, interview tips

| Topic | Answer |
| --- | --- |
| Time | O(1) for fixed-width ints |
| Extra space | O(1) |
| Bit order | 0 = LSB (right) |
| `i == 0` | `right = 0`; window starts at the least significant bit |
| `i == j` | window is one bit; `M` should be 0 or 1 for a clean fit |
| `j == 31` | careful with `<< (j + 1)` on `int` in Java |
| Negatives | same bit ops; do not think in decimal until you print |

**Common bugs:**

* Off-by-one on `j + 1` when building `left`.
* Shifting `M` by `j` instead of `i`.
* Using AND to merge instead of OR after clear (AND would wipe `M`'s 1s against zeros in `N`).
* Forgetting to clear first: OR alone can never turn a 1 in `N` into a 0 for a 0-bit of `M`.

**How to talk it:**

1. Restate: "Replace bits i through j of N with M, M's LSB at i."
2. Draw a short bit string and mark the window.
3. Say clear, shift, OR.
4. Write the mask from left and right halves.
5. Mention the `j == 31` Java shift quirk if you have 10 seconds left.

---

## 7. Explain to a friend recap

Insertion (problem 5.1) asks: put integer `M` into integer `N` so `M` occupies bits `i` through `j`.

1. Build a mask that is 0 on bits `i..j` and 1 everywhere else: `left | right` with `left = ~0 << (j + 1)` and `right = (1 << i) - 1`.
2. Clear: `N & mask`.
3. Align: `M << i`.
4. Merge: cleared `N` OR shifted `M`.
5. Watch Java shifts when `j` is 31. Optionally mask `M` to the window width.

If you can draw the classic `10000000000` / `10011` / `i=2,j=6` example and explain why clear must happen before OR, you own the start of chapter 5.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Paths with Sum](/blog/en/ctci-4-12-paths-with-sum)
* Next: [Binary to String](/blog/en/ctci-5-2-binary-to-string)