---
title: "Conversion: Bit Flips Required to Convert Integer A to Integer B (CTCI 5.6)"
description: "Determine the number of bit flips needed to convert integer A to integer B using XOR and Brian Kernighan's bit-counting algorithm in O(k) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-5-6-conversion.webp
previewImage: /assets/images/ctci-5-6-conversion.webp
---

> **TL;DR**
> * **The Book Problem:** Write a function to determine the number of bits you would need to flip to convert integer A to integer B.
> * **The Optimal Solution:** Calculate $C = A \oplus B$ (XOR). Each 1-bit in $C$ represents a position where $A$ and $B$ differ. Count the 1-bits in $C$ using **Brian Kernighan's Algorithm** (`c = c & (c - 1)`), which runs in $O(k)$ time (where $k$ is the number of differing bits, $k \le 32$) and $O(1)$ auxiliary space.
> * **Production Reality:** Hamming distance calculations in error-correcting codes (ECC memory), locality-sensitive hashing (LSH) for duplicate document detection, and cryptographic cipher diffusion tests.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 5.6), we are asked:

*"Write a function to determine the number of bits you would need to flip to convert integer A to integer B."*

**Example:**
* Input: `29` (binary `11101_2`), `15` (binary `01111_2`)
* Output: `2` (bits at positions 1 and 4 must be flipped).

## 2. XOR & Brian Kernighan's Bit Counting

1. An XOR operation $A \oplus B$ sets a bit to 1 if and only if the corresponding bits in $A$ and $B$ differ.
2. Rather than shifting 32 times with `c >>>= 1`, we use **Brian Kernighan's Algorithm**:
   * The operation `c & (c - 1)` clears the least significant 1-bit of `c`.
   * By looping `while (c != 0) { count++; c = c & (c - 1); }`, the loop executes **only as many times as there are 1-bits** ($k$ iterations).

## Production Implementation

```java
public class BitConversion {
    /**
     * Determines the number of bit flips required to convert integer a to integer b.
     * Time Complexity: O(k) where k is the number of differing bits (k <= 32).
     * Space Complexity: O(1)
     */
    public static int bitSwapRequired(int a, int b) {
        int count = 0;
        // XOR highlights differing bit positions as 1s
        for (int c = a ^ b; c != 0; c = c & (c - 1)) {
            count++;
        }
        return count;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(k)` | Exactly $k$ iterations where $k$ is the Hamming distance between $A$ and $B$ ($k \le 32$). |
| Auxiliary Space | `O(1)` | Local register integer variable. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Hamming Distance in Fault-Tolerant Systems

1. **ECC Memory (Error-Correcting Code):** Single Error Correction / Double Error Detection (SECDED) architectures calculate Hamming distances to correct single-bit DRAM cosmic ray flips and detect dual-bit bus corruption.
2. **SimHash Near-Duplicate Detection (Google Web Search):** Compares 64-bit document fingerprint vectors by measuring Hamming distance thresholds.

## Edge Cases & Production Hardening

1. **Identical integers ($A == B$):** $A \oplus B = 0$, loop executes 0 times, returns `0`.
2. **Complement integers ($A == \sim B$):** Returns `32` (all bits differ).
3. **Negative numbers:** Handled seamlessly because bitwise XOR and two's complement operations work natively on sign bits without branch penalties.
