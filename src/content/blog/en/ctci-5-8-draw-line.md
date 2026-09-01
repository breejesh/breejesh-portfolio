---
title: "Draw Line: Rasterizing Horizontal Lines in a Monochrome Screen (CTCI 5.8)"
description: "Implement a function to draw a horizontal line from (x1, y) to (x2, y) on a byte-array monochrome screen using bitmasks in O(w / 8) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-8-draw-line.webp
previewImage: /assets/images/ctci-5-8-draw-line.webp
---

> **TL;DR**
> * **The Book Problem:** A monochrome screen is stored as a single array of bytes, allowing eight consecutive pixels to be stored in one byte. The screen has width $w$, where $w$ is divisible by 8 (no byte is split across a row). Implement a function `drawLine(byte[] screen, int width, int x1, int x2, int y)` that draws a horizontal line from $(x_1, y)$ to $(x_2, y)$.
> * **The Optimal Solution:** Byte-Aligned Fast Fill with Bitmask Edges: (1) Find start and end byte offsets `first_full_byte = y * (width / 8) + (x1 / 8)` and `last_full_byte = y * (width / 8) + (x2 / 8)`; (2) Fill all full intermediate bytes with `(byte) 0xFF` in bulk; (3) Compute start mask `(byte) (0xFF >> (x1 % 8))` and end mask `(byte) ~(0xFF >> ((x2 % 8) + 1))` to set boundary pixels in $O(x_2 - x_1)$ bit operations ($O(w / 8)$ time).
> * **Production Reality:** E-ink display buffer rendering, monochrome thermal receipt printers, and font glyph bitmap rasterizers (FreeType).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 5.8), we are asked:

*"A monochrome screen is stored as a single array of bytes, allowing eight consecutive pixels to be stored in one byte. The screen has width w, where w is divisible by 8 (that is, no byte is split across a row). The height of the screen, of course, can be derived from the length of the array and the width. Implement a function that draws a horizontal line from (x1, y) to (x2, y)."*

## 2. Byte Layout & Bitmask Computation

Each row contains `width / 8` bytes.
1. The start pixel $x_1$ lies in byte: `start_offset = x1 % 8`, byte index `first_full_byte = (width / 8) * y + x1 / 8`.
2. The end pixel $x_2$ lies in byte: `end_offset = x2 % 8`, byte index `last_full_byte = (width / 8) * y + x2 / 8`.

### Case A: $x_1$ and $x_2$ Lie Within the Same Byte
`first_full_byte == last_full_byte`:
* Combine both masks: `mask = (byte) ((0xFF >> start_offset) & ~(0xFF >> (end_offset + 1)))`.
* Apply: `screen[first_full_byte] |= mask`.

### Case B: $x_1$ and $x_2$ Span Multiple Bytes
1. Start mask: `start_mask = (byte) (0xFF >> start_offset)` $\to$ `screen[first_full_byte] |= start_mask`.
2. Full bytes: `for (int b = first_full_byte + 1; b < last_full_byte; b++) screen[b] = (byte) 0xFF;`.
3. End mask: `end_mask = (byte) ~(0xFF >> (end_offset + 1))` $\to$ `screen[last_full_byte] |= end_mask`.

## Production Implementation

```java
public class DrawLine {
    /**
     * Draws a horizontal line on a monochrome screen.
     * Time Complexity: O(w / 8) or O(length / 8) where length = x2 - x1
     * Space Complexity: O(1)
     */
    public static void drawLine(byte[] screen, int width, int x1, int x2, int y) {
        int start_offset = x1 % 8;
        int first_full_byte = x1 / 8;
        if (start_offset != 0) {
            first_full_byte++;
        }

        int end_offset = x2 % 8;
        int last_full_byte = x2 / 8;
        if (end_offset != 7) {
            last_full_byte--;
        }

        // Set full bytes
        for (int b = first_full_byte; b <= last_full_byte; b++) {
            screen[(width / 8) * y + b] = (byte) 0xFF;
        }

        // Create masks for start and end of line
        byte start_mask = (byte) (0xFF >> start_offset);
        byte end_mask = (byte) ~(0xFF >> (end_offset + 1));

        // Set start and end of line
        if ((x1 / 8) == (x2 / 8)) { // x1 and x2 are in the same byte
            byte mask = (byte) (start_mask & end_mask);
            screen[(width / 8) * y + (x1 / 8)] |= mask;
        } else {
            if (start_offset != 0) {
                int byte_number = (width / 8) * y + first_full_byte - 1;
                screen[byte_number] |= start_mask;
            }
            if (end_offset != 7) {
                int byte_number = (width / 8) * y + last_full_byte + 1;
                screen[byte_number] |= end_mask;
            }
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(length / 8)` | Fills whole bytes directly in bulk rather than setting individual bits. |
| Auxiliary Space | `O(1)` | In-place byte array mutation without buffer duplication. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Low-Level Framebuffers

1. **E-Paper & OLED Monochrome Displays (SSD1306):** Microcontroller display drivers transfer byte rows via SPI/I2C using aligned byte fills.
2. **Font Rasterization Engines (FreeType):** Fills horizontal scanline spans into 1-bit monochrome glyph bitmaps during font rendering.

## Edge Cases & Production Hardening

1. **Start and end in exact same byte (`x1 = 2, x2 = 5`):** Handled via combined single-byte mask.
2. **Exact byte boundaries (`x1 = 0, x2 = 7`):** Full byte filled without partial mask overhead.
