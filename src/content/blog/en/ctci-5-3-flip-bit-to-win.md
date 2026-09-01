---
title: "Flip Bit to Win: Longest Sequence of 1s Created by Single Bit Flip (CTCI 5.3)"
description: "Find the length of the longest sequence of 1s created by flipping exactly one 0 to a 1 in an integer in O(b) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
previewImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
---

> **TL;DR**
> * **The Book Problem:** You have an integer and you can flip exactly one bit from a 0 to a 1. Write code to find the length of the longest sequence of 1s you could create.
> * **The Optimal Solution:** Single-Pass Run-Length Tracking: Maintain two counters, `currentLength` and `previousLength`. When encountering a `0`, if the next bit is `1`, `previousLength = currentLength`; if the next bit is `0`, `previousLength = 0`. At each step, update $\text{maxLength} = \max(\text{maxLength}, \text{previousLength} + \text{currentLength} + 1)$ in $O(b)$ time (where $b$ is the number of bits in the integer) and $O(1)$ auxiliary space.
> * **Production Reality:** Run-length encoding (RLE) error correction, TCP sliding window continuous packet sequence detection, and memory page allocation bitmap scanning.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 5.3), we are asked:

*"You have an integer and you can flip exactly one bit from a 0 to a 1. Write code to find the length of the longest sequence of 1s you could create."*

**Example:**
* Input: `1775` (binary `11011101111_2`)
* Output: `8` (by flipping the 0 at index 4 between the groups of 3 and 4 ones).

## 2. Algorithmic Mechanics (Run-Length Counter)

Instead of allocating an array to store contiguous run lengths of 0s and 1s, we can track only the last two consecutive sequences of 1s:
1. Initialize `currentLength = 0`, `previousLength = 0`, `maxLength = 1`.
2. Inspect the least significant bit (`a & 1`):
   * If `(a & 1) == 1`: Increment `currentLength++`.
   * If `(a & 1) == 0`:
     * Check the adjacent bit: If `(a & 2) == 0` (two consecutive zeros), reset `previousLength = 0`.
     * Else, set `previousLength = currentLength`.
     * Reset `currentLength = 0`.
3. Update `maxLength = Math.max(previousLength + currentLength + 1, maxLength)`.
4. Shift logically right (`a >>>= 1`) and repeat until $a == 0$.

## Production Implementation

```java
public class FlipBitToWin {
    /**
     * Finds the maximum sequence of 1s achievable with one bit flip.
     * Time Complexity: O(b) where b is the number of bits (<= 32 for int).
     * Space Complexity: O(1)
     */
    public static int flipBit(int a) {
        // If all 1s, the entire integer is already a sequence of 1s
        if (~a == 0) return Integer.BYTES * 8;

        int currentLength = 0;
        int previousLength = 0;
        int maxLength = 1; // We can always have a sequence of at least 1

        while (a != 0) {
            if ((a & 1) == 1) {
                currentLength++;
            } else if ((a & 1) == 0) {
                // Check if next bit is also 0
                previousLength = ((a & 2) == 0) ? 0 : currentLength;
                currentLength = 0;
            }
            maxLength = Math.max(previousLength + currentLength + 1, maxLength);
            a >>>= 1;
        }

        return maxLength;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(b)` | Inspects at most 32 bits using bitwise operations. |
| Auxiliary Space | `O(1)` | Uses three integer variables without dynamic allocations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Run-Length Bitmaps

1. **Operating System Page Frame Allocators:** Free memory bitmap managers scan for the longest contiguous blocks of allocatable pages.
2. **Lossless Data Compression (Snappy / LZ4):** Scans for byte runs and single-byte divergence points to optimize dictionary encoding.

## Edge Cases & Production Hardening

1. **All 1s (`-1` / `0xFFFFFFFF`):** Handled via `if (~a == 0) return 32`.
2. **All 0s (`0`):** Returns `1` (flipping any single bit creates a sequence of length 1).
3. **Alternating bits (`10101010`):** Groups of 1 can be merged into length 3 ($1 + 1 + 1$).
