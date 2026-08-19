---
title: "Pairwise Swap: Swap Odd and Even Bits With Masks (Java)"
description: "CTCI-style problem 5.7 for beginners: swap every pair of odd and even bits in an int. Mask with 0xaaaaaaaa and 0x55555555, shift once each way, OR the halves."
date: "2025-11-10"
tags: [Algorithms]
coverImage: /assets/images/ctci-5-7-pairwise-swap.webp
previewImage: /assets/images/ctci-5-7-pairwise-swap.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 5.7 for beginners: swap every pair of odd and even bits in an int. Mask with 0xaaaaaaaa and 0x55555555, shift once each way, OR the halves.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You line up 32 people on numbered spots 0 through 31. Spot 0 and spot 1 swap. Spot 2 and spot 3 swap. Spot 4 and 5, and so on. Everyone moves at the same time. Nobody walks past their pair. That is **pairwise swap** on the bits of an integer: each even bit trades places with the odd bit next to it.

This post is original teaching for beginners in **Java**. Same problem family as classic interview bit questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 5, bit manipulation, problem 5.7.

---

## 1. Everyday analogy

Think of a row of light switches. Switches sit in pairs: (0, 1), (2, 3), (4, 5), ... For every pair you flip which physical switch "owns" the on/off state of its partner. If switch 0 was on and switch 1 was off, after the swap switch 0 is off and switch 1 is on. Other pairs do the same in parallel.

You do **not** reverse the whole row. You do **not** rotate by one for the full word. You only swap inside each adjacent pair.

On paper that sounds like a loop over 16 pairs. In bits you can do every pair in a few instructions with masks.

---

## 2. Plain problem statement

**Input:** a 32-bit `int` value `x` (treat the bit layout as fixed width).

**Output:** an `int` where bit `0` and bit `1` have swapped, bit `2` and bit `3` have swapped, bit `4` and bit `5` have swapped, and so on through bit `30` and bit `31`.

**Naming (LSB = bit 0):**

* **Even bits:** positions `0, 2, 4, ..., 30`
* **Odd bits:** positions `1, 3, 5, ..., 31`

Pairwise swap means: for every `i` in `0, 2, 4, ...`, exchange bits at `i` and `i + 1`.

**Examples (8-bit for clarity, same idea scales to 32):**

| Input bits (MSB→LSB) | After pairwise swap | Why |
| --- | --- | --- |
| `0101 0110` | `1010 1001` | each pair `(b1 b0)` becomes `(b0 b1)` |
| `0000 0001` (1) | `0000 0010` (2) | bit 0 moved to bit 1 |
| `0000 0010` (2) | `0000 0001` (1) | bit 1 moved to bit 0 |
| `1111 1111` | `1111 1111` | all ones: swap is a no-op |
| `0000 0000` | `0000 0000` | zero stays zero |

Walk one pair: input `... ab` (a = odd bit, b = even bit) becomes `... ba`.

**Clarify before coding:**

* Bit 0 is the least significant bit? (Yes in this post and in normal Java `int` talk.)
* Signed `int` in Java? Yes. Prefer **unsigned right shift** `>>>` when you move the odd half down so the sign bit does not smear ones.
* Do we need O(1) bit ops, not a 16-iteration loop? Interviewers want the mask form when they say "as few instructions as possible."

---

## 3. Think first

### Naive loop

For `i = 0; i < 32; i += 2`:

1. Read bit `i` and bit `i + 1`.
2. Write bit `i` into position `i + 1` and bit `i + 1` into position `i`.

Works. About 16 iterations, each with shifts and masks. Fine for clarity. Not the "few instructions" answer.

### Better idea: move whole halves at once

If you could:

1. Pull out **only** the odd bits, shift them **one place right** (they land on the even slots).
2. Pull out **only** the even bits, shift them **one place left** (they land on the odd slots).
3. **OR** the two results.

Then every pair swaps in parallel. No loop.

You need two masks:

* **Odd mask** `0xaaaaaaaa` = binary `1010 1010 ... 1010`. Ones only on odd positions.
* **Even mask** `0x55555555` = binary `0101 0101 ... 0101`. Ones only on even positions.

Remember: `0xA` is `1010`, `0x5` is `0101`. Eight hex digits cover 32 bits.

```
x          =  ... a b a b a b a b   (a = odd, b = even pattern)
x & 0xAA.. =  ... a 0 a 0 a 0 a 0
>>> 1      =  ... 0 a 0 a 0 a 0 a   (odds moved to even slots)

x & 0x55.. =  ... 0 b 0 b 0 b 0 b
<< 1       =  ... b 0 b 0 b 0 b 0   (evens moved to odd slots)

OR         =  ... b a b a b a b a   (pairs swapped)
```

That is the whole algorithm.

### Why not `>>` for the odd half?

In Java, `>>` sign-extends. If bit 31 is 1, `x >> 1` fills the top with 1s. You only want the selected odd bits to move right by one. Use `>>>` (logical right shift) after masking, or mask after a careful shift. The clean form is mask first, then `>>> 1`.

---

## 4. Java solution

```java
/**
 * Swap odd and even bits of a 32-bit int.
 * Bit 0 <-> 1, bit 2 <-> 3, ..., bit 30 <-> 31.
 */
int swapOddEvenBits(int x) {
    int oddsMovedRight = (x & 0xaaaaaaaa) >>> 1;
    int evensMovedLeft = (x & 0x55555555) << 1;
    return oddsMovedRight | evensMovedLeft;
}
```

One-liner (same ops):

```java
int swapOddEvenBits(int x) {
    return ((x & 0xaaaaaaaa) >>> 1) | ((x & 0x55555555) << 1);
}
```

Hex literals are fine. If a teammate dislikes magic numbers, name them:

```java
private static final int ODD_BITS  = 0xaaaaaaaa; // 1010...
private static final int EVEN_BITS = 0x55555555; // 0101...

int swapOddEvenBits(int x) {
    return ((x & ODD_BITS) >>> 1) | ((x & EVEN_BITS) << 1);
}
```

### Optional: walk with a small value

Take `x = 0b_0000_0000_0000_0000_0000_0000_0010_0110` which is `38` decimal.

Bits near the bottom (positions 7..0): `0010 0110`

Low 8 bits of 38, written MSB→LSB as `00100110` (bit 0 on the right is 0):

| Step | Low 8 bits | Note |
| --- | --- | --- |
| `x` | `00100110` | bit0=0, bit1=1, bit2=1, bit3=0, bit4=0, bit5=1, bit6=0, bit7=0 |
| `x & 0xAA` | `00100010` | keep odd positions only |
| `>>> 1` | `00010001` | odds moved into even slots |
| `x & 0x55` | `00000100` | keep even positions only (bit2) |
| `<< 1` | `00001000` | evens moved into odd slots |
| OR | `00011001` | value 25 |

Manual pair check:

* bits (1,0): `10` → `01`
* bits (3,2): `01` → `10`
* bits (5,4): `10` → `01`
* bits (7,6): `00` → `00`

Result low 8: `00011001`. Matches.

---

## 5. Complexity and "few instructions"

| Approach | Time | Extra space | Instruction feel |
| --- | --- | --- | --- |
| Loop over 16 pairs | O(1) still (fixed 32 bits), more ops | O(1) | many shifts/masks |
| Two masks + shift + OR | O(1) | O(1) | about 5 bit ops |

Interviews care about the **mask form**, not asymptotic big-O. Thirty-two is constant either way. "As few instructions as possible" means: do not walk bit by bit when a word-level mask works.

On a 64-bit `long` you would use `0xaaaaaaaaaaaaaaaaL` and `0x5555555555555555L` the same way.

---

## 6. Edge cases and common mistakes

* **All zeros / all ones** → identity. Swap leaves the value unchanged.
* **Negative numbers** → still just a bit pattern. `>>>` on the odd half keeps the result correct; do not use arithmetic `>>` after the odd mask if you rely on clean zeros in emptied slots.
* **Using only `<< 1` on the whole number** → that is a multiply by 2 / left shift of everything, not pairwise swap.
* **Swapping adjacent bytes or nibbles** → different problem (think endian or nibble reverse). Pairwise swap is **bit** pairs only.
* **Wrong masks** → `0xaaaaaaaa` for odds, `0x55555555` for evens when LSB is bit 0. Mixing them up swaps nothing useful.
* **Forgetting the OR** → you only keep one half of the bits.
* **Loop that mutates while reading** → easy to clobber a bit you still need; prefer build a new result.

Minimal smoke test:

```java
System.out.println(swapOddEvenBits(0));          // 0
System.out.println(swapOddEvenBits(1));          // 2
System.out.println(swapOddEvenBits(2));          // 1
System.out.println(swapOddEvenBits(38));         // 25
System.out.println(swapOddEvenBits(0xffffffff)); // -1 (all bits still set)
System.out.println(swapOddEvenBits(0xaaaaaaaa)); // 0x55555555
System.out.println(swapOddEvenBits(0x55555555)); // 0xaaaaaaaa
```

If `swap(swap(x)) == x` for random ints, your function is an involution, which pairwise swap should be. That is a cheap property check in a unit test.

---

## 7. Explain to a friend recap

Pairwise Swap asks: swap bit 0 with 1, bit 2 with 3, and so on, with almost no instructions.

1. Mask odd bits with `0xaaaaaaaa`, shift right by 1 (`>>>`).
2. Mask even bits with `0x55555555`, shift left by 1.
3. OR the two halves.
4. That moves every pair in parallel. No loop over pairs.
5. Use logical `>>>` so a set high bit does not fill with ones the wrong way.

If you can draw an 8-bit example, name both masks from memory, and say why `>>>` beats `>>` here, you own problem 5.7. Next up in the chapter is drawing a horizontal line into a bit-packed screen buffer.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Conversion](/blog/en/ctci-5-6-conversion)
* Next: [Draw Line](/blog/en/ctci-5-8-draw-line)