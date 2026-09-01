---
title: "Missing Int: Bit Vector and Two-Pass Block Counting Algorithms (CTCI 10.7)"
description: "Find a missing integer among four billion numbers under 1 GB and 10 MB memory constraints using bit vectors and two-pass block frequency partitioning."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-7-missing-int.webp
previewImage: /assets/images/ctci-10-7-missing-int.webp
---

> **TL;DR**
> * **The Book Problem:** Given an input file with four billion non-negative integers, provide an algorithm to generate an integer that is not in the file. Assume you have 1 GB of memory. FOLLOW UP: What if you have only 10 MB of memory and at most one billion distinct integers?
> * **The Optimal Solution:** **Bit Vector & Two-Pass Block Counting**: (1) **1 GB Memory**: A 32-bit bit vector of size $2^{31}\text{ bits} = 256\text{ MB}$ (or $2^{32}\text{ bits} = 512\text{ MB}$) tracks all seen integers in a single pass; (2) **10 MB Memory (Follow-up)**: Pass 1 uses a block count array of size $2^{16}$ ($256\text{ KB}$ RAM) to count integer frequencies in ranges of size $2^{16}$. By the Pigeonhole Principle, at least one range has count $< 2^{16}$; (3) Pass 2 allocates an $8\text{ KB}$ bit vector ($2^{16}\text{ bits}$) for the deficient block and re-scans the file to pinpoint the exact missing integer in $O(N)$ time.
> * **Production Reality:** IPv4 address allocation tables, database bitmap index compression (Roaring Bitmaps), and distributed unique ID generator sequence gaps.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.7), we are asked:

*"Given an input file with four billion non-negative integers, provide an algorithm to generate an integer that is not in the file. Assume you have 1 GB of memory available for this task. FOLLOW UP: What if you have only 10 MB of memory?"*

## 2. Memory Sizing & Pigeonhole Derivation

Total non-negative 32-bit integers $= 2^{31} \approx 2.147 \times 10^9$ (or $2^{32} \approx 4.295 \times 10^9$ for unsigned).

### Case 1: 1 GB Memory (Single Pass Bit Vector)
* Array of bits representing every 32-bit integer:
  $$\text{Memory} = 2^{32}\text{ bits} = \frac{2^{32}}{8 \times 1024^2}\text{ MB} = 512\text{ MB}$$
* Fits comfortably inside 1 GB RAM.

---

### Case 2: 10 MB Memory (Two-Pass Block Counting)
With only 10 MB RAM, a 512 MB bit vector cannot be allocated.

1. **Pass 1 (Block Frequency Count):**
   * Divide the integer space into $2^{16} = 65,536$ blocks of size $2^{16}$.
   * Integer array `int[] blocks = new int[65536];` consumes $65,536 \times 4\text{ bytes} = 256\text{ KB}$ RAM.
   * Increment `blocks[n / 65536]` for each number in the file.
   * Find any block $B$ where `blocks[B] < 65536`.
2. **Pass 2 (Targeted Bit Vector):**
   * Allocate a bit vector of $65,536\text{ bits} = 8\text{ KB}$ RAM for block $B$.
   * Re-scan the file, setting bit $n \pmod{65536}$ for all $n$ belonging to block $B$.
   * Find the first zero bit in the 8 KB vector.

## Production Implementation

```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class MissingIntFinder {
    /**
     * 1 GB RAM Solution: 512MB Single-Pass Bit Vector.
     */
    public static int findMissingInt1GB(String filename) throws IOException {
        byte[] bitfield = new byte[1 << 26]; // 2^29 bits = 2^26 bytes = 64MB - 512MB
        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                bitfield[n / 8] |= (1 << (n % 8));
            }
        }

        for (int i = 0; i < bitfield.length; i++) {
            for (int b = 0; b < 8; b++) {
                if ((bitfield[i] & (1 << b)) == 0) {
                    return i * 8 + b;
                }
            }
        }
        return -1;
    }

    /**
     * 10 MB RAM Solution: Two-Pass Block Counting (Gayle Laakmann McDowell Solution).
     */
    public static int findMissingInt10MB(String filename) throws IOException {
        int rangeSize = 1 << 16; // 65,536 numbers per block
        int[] blocks = new int[rangeSize]; // 256KB RAM

        // Pass 1: Count numbers per block
        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                blocks[n / rangeSize]++;
            }
        }

        // Find a block with missing elements
        int selectedBlock = -1;
        for (int i = 0; i < blocks.length; i++) {
            if (blocks[i] < rangeSize) {
                selectedBlock = i;
                break;
            }
        }
        if (selectedBlock == -1) return -1;

        // Pass 2: Bit vector for the selected block (8KB RAM)
        byte[] bitVector = new byte[rangeSize / 8];
        int startingInt = selectedBlock * rangeSize;
        int endingInt = startingInt + rangeSize;

        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                if (n >= startingInt && n < endingInt) {
                    int offset = n - startingInt;
                    bitVector[offset / 8] |= (1 << (offset % 8));
                }
            }
        }

        // Find the missing offset
        for (int i = 0; i < bitVector.length; i++) {
            for (int b = 0; b < 8; b++) {
                if ((bitVector[i] & (1 << b)) == 0) {
                    return startingInt + i * 8 + b;
                }
            }
        }

        return -1;
    }
}
```

## Complexity & Memory Analysis

| Mode | Time Complexity | Auxiliary RAM | Disk Passes |
|---|---|---|---|
| 1 GB Solution | `O(N)` | `512 MB` | 1 Pass |
| 10 MB Solution | `O(N)` | `264 KB` | 2 Passes |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Roaring Bitmaps & IP Exhaustion

1. **IPv4 Address Allocation Maps:** Regional internet registries (ARIN/RIPE) utilize 512 MB dense bit vectors to find unallocated 32-bit IPv4 subnets in $O(1)$ time.
2. **Roaring Bitmaps in Apache Lucene / Spark:** Automatically switches between integer arrays (sparse) and raw bitsets (dense) depending on block cardinality to optimize cache locality.

## Edge Cases & Production Hardening

1. **All Numbers Present:** Returns `-1` if every integer in the universe is present.
2. **First Element Missing ($n = 0$):** Correctly detected at bit 0 of block 0.
