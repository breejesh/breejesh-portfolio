---
title: "Draw Line: Paint a Horizontal Line on a Byte-Packed Screen (Java)"
description: "CTCI-style problem 5.8 for beginners: monochrome screen stored as a byte array, eight pixels per byte. Draw a horizontal line from (x1, y) to (x2, y) with bit masks on partial bytes and 0xFF on full ones."
date: "2026-02-16"
tags: [Algorithms]
coverImage: /assets/images/ctci-5-8-draw-line.webp
previewImage: /assets/images/ctci-5-8-draw-line.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 5.8 for beginners: monochrome screen stored as a byte array, eight pixels per byte. Draw a horizontal line from (x1, y) to (x2, y) with bit masks on partial bytes and 0xFF on full ones.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A cheap old display has no color. Every pixel is on or off. Memory is tight, so the hardware packs **eight pixels into one byte**. You get a flat `byte[]` and a width. Your job: light every pixel on one horizontal line, from column `x1` to column `x2` on row `y`, without wasting a loop on every single bit when whole bytes sit in the middle.

This post is original teaching for beginners in **Java**. Same problem family as classic interview bit-buffer drawing questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 5, bit manipulation, ends here.

---

## 1. Everyday analogy

Think of a row of light switches on a long wall. Switches come in gangs of eight: each gang is one plastic strip, one byte. Flip a switch on and that pixel lights.

You need a straight horizontal bar of lights from switch `x1` to switch `x2` on one shelf (row `y`).

If the bar is short and sits inside one gang, you carefully flip only those switches inside that strip. If the bar is long, the middle is whole gangs fully on: slap every switch on those strips at once (`0xFF`). Only the first strip and the last strip need careful partial flips. That is the whole idea.

---

## 2. Plain problem statement

**Input:**

* `byte[] screen`: packed monochrome framebuffer. Bit `1` means pixel on, `0` means off.
* `int width`: screen width in **pixels**. Guaranteed divisible by 8, so a row never splits a byte across two rows.
* `int x1`, `int x2`: inclusive start and end columns of the line (pixels).
* `int y`: row index.

**Output:** mutate `screen` so every pixel from `(x1, y)` through `(x2, y)` is on. Other pixels stay as they were (use OR, not blind overwrite on partial bytes).

**Layout (MSB left):**

* Bytes per row: `width / 8`.
* Byte index of pixel `(x, y)`: `(width / 8) * y + (x / 8)`.
* Bit inside that byte: pixel offset `x % 8` maps to bit `(7 - (x % 8))`. Leftmost pixel of a byte is the high bit.

**Signature shape:**

```java
void drawLine(byte[] screen, int width, int x1, int x2, int y)
```

**Tiny example:** width `16` (two bytes per row). Draw from `x1 = 3` to `x2 = 12` on `y = 0`.

```
byte 0 of row 0          byte 1 of row 0
pixels 0 1 2 3 4 5 6 7   8 9 10 11 12 13 14 15
bits   7 6 5 4 3 2 1 0   7 6  5  4  3  2  1  0

before: 00000000 00000000
after:  00011111 11111000
        ^^^start mask     end mask^^^
        full run in the middle is just those bits; no full middle byte here
```

If the line were longer and crossed three or more byte columns, the middle columns would be set to `0xFF` in one write each.

**Clarify before coding:**

* Are `x1` and `x2` inclusive? (Yes.)
* What if `x1 > x2`? (Swap, or treat as empty. Interviews usually allow a swap.)
* MSB or LSB left? (State your convention. We use MSB = leftmost pixel.)
* Should draw clear other pixels? (No. Partial bytes use `|=` so neighbors stay.)
* Is width always a multiple of 8? (Yes, per the classic statement.)

---

## 3. Think first

### Naive: set one pixel at a time

```
for x from x1 to x2:
    setBit(screen, width, x, y)
```

`setBit` finds the byte, builds a one-bit mask, ORs it in. Correct. Simple. For a line of length L you touch L bits, each with its own mask work. Fine for tiny lines. Bad when L is thousands and most of those bits live in full middle bytes you could fill in bulk.

### Better: full bytes + edge masks

Find the byte columns for `x1` and `x2` on row `y`.

1. **Start partial byte** (if `x1` is not on a byte boundary, or even if it is, handle carefully with ranges): mask from the start offset through the end of that byte.
2. **Middle full bytes**: every complete byte strictly between start and end becomes `0xFF` (or `|= 0xFF`).
3. **End partial byte**: mask from the start of that byte through the end offset.
4. **Same-byte special case**: when `x1` and `x2` share one byte, AND the start mask with the end mask and apply once. Do not run full-byte logic or you will double-count or wipe the range.

Offsets:

```
startOffset = x1 % 8
endOffset   = x2 % 8
startByte   = x1 / 8   // column of bytes in the row
endByte     = x2 / 8
```

Start mask (turn on from `startOffset` to bit 7 of the pixel packing, i.e. remaining bits of the byte):

```
startMask = 0xFF >>> startOffset
// startOffset 0 -> 11111111
// startOffset 3 -> 00011111
```

End mask (turn on from bit 0 of packing through `endOffset`):

```
endMask = 0xFF << (7 - endOffset)   // then keep low 8 bits as a byte
// endOffset 0 -> 10000000
// endOffset 3 -> 11110000
// endOffset 7 -> 11111111
```

First full byte index and last full byte index:

* If the line starts mid-byte, the first *full* byte is `startByte + 1`.
* If the line ends mid-byte (not on the last bit of a byte), the last *full* byte is `endByte - 1`.
* If `firstFull > lastFull`, there are no full middle bytes. That covers short lines and same-byte lines.

Height of the screen is `screen.length / (width / 8)`. You usually do not need it if `y` is trusted in range.

---

## 4. Java solution

### Helpers (optional but clear)

```java
/** Bytes in one scanline. width is in pixels and divisible by 8. */
static int bytesPerRow(int width) {
    return width / 8;
}

static int byteIndex(int width, int x, int y) {
    return bytesPerRow(width) * y + (x / 8);
}
```

### Primary: masks + full bytes

```java
void drawLine(byte[] screen, int width, int x1, int x2, int y) {
    if (screen == null || width <= 0 || (width % 8) != 0) {
        return;
    }
    if (x1 > x2) {
        int t = x1;
        x1 = x2;
        x2 = t;
    }
    // optional: clamp or reject out-of-range x/y in a real graphics API

    int bytesPerRow = width / 8;
    int rowBase = bytesPerRow * y;

    int startOffset = x1 % 8;
    int endOffset = x2 % 8;
    int startByte = x1 / 8;
    int endByte = x2 / 8;

    // masks use int then cast; Java bytes are signed
    int startMask = 0xFF >>> startOffset;
    int endMask = 0xFF << (7 - endOffset);
    endMask &= 0xFF;

    if (startByte == endByte) {
        // both ends inside one byte
        int mask = startMask & endMask;
        screen[rowBase + startByte] |= (byte) mask;
        return;
    }

    // left partial (if any bits remain from startOffset to end of byte)
    screen[rowBase + startByte] |= (byte) startMask;

    // full middle bytes
    for (int b = startByte + 1; b <= endByte - 1; b++) {
        screen[rowBase + b] = (byte) 0xFF;
        // or |= (byte) 0xFF if you prefer pure OR everywhere
    }

    // right partial
    screen[rowBase + endByte] |= (byte) endMask;
}
```

Walkthrough, width `32` (4 bytes/row), line `x1 = 5`, `x2 = 26`, `y = 0`:

| Piece | Byte col | Mask / value | Meaning |
| --- | --- | --- | --- |
| start | 0 | `0xFF >>> 5` = `0x07` | pixels 5,6,7 |
| full | 1 | `0xFF` | pixels 8-15 |
| full | 2 | `0xFF` | pixels 16-23 |
| end | 3 | `0xFF << (7-2)` = `0xE0` | pixels 24,25,26 (`endOffset = 2`) |

`startByte = 0`, `endByte = 3`. Middle loop runs `b = 1` and `b = 2`. Same-byte path is not taken.

### Same-byte check

`x1 = 10`, `x2 = 13`, width `32`: both in byte column `1`, offsets `2` and `5`.

```
startMask = 0xFF >>> 2 = 00111111
endMask   = 0xFF << (7-5) = 11111100   (low 8)
combined  = 00111100
```

Pixels 10,11,12,13 light. Neighbors 8,9,14,15 stay off if they were off.

### Naive reference (use in tests)

```java
void drawLineNaive(byte[] screen, int width, int x1, int x2, int y) {
    if (x1 > x2) {
        int t = x1;
        x1 = x2;
        x2 = t;
    }
    for (int x = x1; x <= x2; x++) {
        int index = (width / 8) * y + (x / 8);
        int bit = 7 - (x % 8);
        screen[index] |= (byte) (1 << bit);
    }
}
```

Compare both on random ranges. If they disagree, the mask version is wrong.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Per-pixel setBit loop | O(L) | O(1) | L = x2 - x1 + 1 |
| Full bytes + 2 edge masks | O(B) | O(1) | B = number of byte columns the line touches, about L/8 |
| Build a whole new row array | O(width) | O(width/8) | Overkill for one line |

B is roughly eight times smaller than L on long lines. That is why interviewers want the bulk fill. On short lines both are fine; the mask version still wins on constant factors and shows you understand packing.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **`x1 == x2`**: one pixel. Same-byte path with a one-bit combined mask.
* **`x1` and `x2` in the same byte, multi-pixel**: must AND masks. Forgetting this is the classic bug.
* **Line spans exactly whole bytes** (`x1 % 8 == 0` and `x2 % 8 == 7`): start mask is `0xFF`, end mask is `0xFF`. You can still treat start/end as partial ORs; full middle is the bytes strictly between, or you fold start/end into the full range carefully. The same-byte-vs-multi structure above stays correct.
* **No middle full bytes**: line covers two adjacent partial bytes only (`startByte + 1 > endByte - 1`). Loop body never runs.
* **`x1 > x2`**: swap first or define empty. Do not silently draw nothing without saying so.
* **`y` out of range / `x` past width**: real code should guard. Interview sketch can note it.
* **Signed `byte` in Java**: `(byte) 0xFF` is `-1`. That is fine for bit patterns. Prefer `|=` with masks computed in `int`, then cast once.
* **Using `>>` on negative mask ints**: build masks from positive `0xFF` shifts, then cast. Avoid arithmetic right shift surprises on already-negative values.
* **Overwriting partial bytes with `=` instead of `|=`**: wipes pixels on that byte that are not on the line.
* **Assuming LSB is the leftmost pixel**: state MSB-left (or flip your masks). Inconsistent convention fails visual tests.

Common mistakes:

1. **No same-byte branch.** Start mask ORed, then end mask ORed, and maybe a full-byte write in between that should not exist. Garbage on that byte.
2. **Off-by-one on full byte range.** Including `startByte` or `endByte` in the `0xFF` loop destroys the need for careful partial bits, or skips a full column.
3. **Wrong end mask formula.** A common broken form is integer negation of a shift. Prefer `0xFF << (7 - endOffset)` with an 8-bit mask.
4. **Forgetting `width / 8` row stride.** Index must be `rowBase + byteCol`, not a flat `x`.
5. **Treating width as bytes already.** The parameter is pixels in the classic statement.
6. **Clearing the screen.** Draw means turn bits on for the line, not fill the buffer with only that line.

Minimal smoke test:

```java
byte[] screen = new byte[4]; // width 16, height 2
drawLine(screen, 16, 3, 12, 0);
// row 0: expect roughly 00011111 11111000
System.out.printf("%8s %8s%n",
    String.format("%8s", Integer.toBinaryString(screen[0] & 0xFF)).replace(' ', '0'),
    String.format("%8s", Integer.toBinaryString(screen[1] & 0xFF)).replace(' ', '0'));

byte[] a = new byte[8];
byte[] b = new byte[8];
drawLine(a, 32, 5, 26, 0);
drawLineNaive(b, 32, 5, 26, 0);
// assert Arrays.equals(a, b)
```

---

## 7. Explain to a friend recap

Draw Line packs a monochrome screen as bytes, eight pixels each. You paint one horizontal segment.

1. Map `(x, y)` to a byte index with row stride `width / 8` and bit position from `x % 8` (MSB left).
2. Naive: loop every pixel and OR a one-bit mask. Correct, O(line length).
3. Better: mask the first partial byte, write `0xFF` on every full middle byte, mask the last partial byte.
4. If start and end share one byte, AND the two masks and apply once.
5. Use `|=` on edges so you do not erase neighbors. Watch Java signed bytes and off-by-ones on the full-byte range.

If you can draw a 16-pixel-wide row on paper, mark `x1` and `x2`, write the two masks in binary, and say why same-byte is special, you own problem 5.8. Chapter 5 closes on a graphics nibble that is really range updates over a bitset.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Pairwise Swap](/blog/en/ctci-5-7-pairwise-swap)
* Next: [The Heavy Pill](/blog/en/ctci-6-1-the-heavy-pill)