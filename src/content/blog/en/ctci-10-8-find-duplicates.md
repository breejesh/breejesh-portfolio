---
title: "Find Duplicates: 4-Kilobyte BitSet Deduplication for 32,000 Integers (CTCI 10.8)"
description: "Print all duplicate numbers from an array of integers from 1 to 32,000 under a strict 4 KB memory limit using a compact custom bit vector in O(N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-8-find-duplicates.webp
previewImage: /assets/images/ctci-10-8-find-duplicates.webp
---

> **TL;DR**
> * **The Book Problem:** You have an array with all the numbers from 1 to $N$, where $N \le 32,000$. The array may have duplicate entries and you do not know what $N$ is. With only 4 kilobytes of memory available, how would you print all duplicate elements in the array?
> * **The Optimal Solution:** **4 KB Compact BitSet Array**: (1) $4\text{ KB} = 4 \times 1024\text{ bytes} = 4,096\text{ bytes} = 32,768\text{ bits}$; (2) Since $N \le 32,000$, we allocate a 32,000-bit vector consuming exactly $32,000 / 8 = 4,000\text{ bytes} \approx 3.91\text{ KB}$; (3) Iterate through the input: for each value $v$, check `bitSet.get(v - 1)`: if true, print as duplicate; else `bitSet.set(v - 1)`; (4) Runs in optimal **$O(N)$ time** and strictly **$< 4\text{ KB}$ auxiliary RAM**.
> * **Production Reality:** Embedded microcontroller sensor telemetry deduplication, network packet sequence window tracking, and database primary key collision detection.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.8), we are asked:

*"You have an array with all the numbers from 1 to N, where N is at most 32,000. The array may have duplicate entries and you do not know what N is. With only 4 kilobytes of memory available, how would you print all duplicate elements in the array?"*

## 2. Memory Sizing & Bit Manipulation

* Standard integer hash set storing 32,000 integers: $32,000 \times 4\text{ bytes} = 128\text{ KB}$ (exceeds 4 KB by $32\times$).
* **Bit Vector Solution:**
  $$\text{Required Bits} = 32,000\text{ bits} \implies \frac{32,000}{8 \times 1024}\text{ KB} = 3.906\text{ KB} \le 4\text{ KB}$$

Each integer $v \in [1, 32000]$ is mapped to 0-indexed bit position $v - 1$:
* Word index: $(v - 1) / 32$
* Bit offset: $(v - 1) \pmod{32}$

## Production Implementation

```java
public class FindDuplicates {
    public static class BitSet {
        private final int[] bitset;

        public BitSet(int size) {
            // Divide by 32 (1 int = 32 bits)
            this.bitset = new int[(size >> 5) + 1];
        }

        public boolean get(int pos) {
            int wordNumber = (pos >> 5); // pos / 32
            int bitNumber = (pos & 0x1F); // pos % 32
            return (bitset[wordNumber] & (1 << bitNumber)) != 0;
        }

        public void set(int pos) {
            int wordNumber = (pos >> 5);
            int bitNumber = (pos & 0x1F);
            bitset[wordNumber] |= (1 << bitNumber);
        }
    }

    /**
     * Prints all duplicates in the array using <= 4 KB of RAM.
     * Time Complexity: O(N)
     * Space Complexity: O(1) [Exact 4 KB]
     */
    public static void checkDuplicates(int[] array) {
        BitSet bs = new BitSet(32000);

        for (int i = 0; i < array.length; i++) {
            int num = array[i];
            int num0 = num - 1; // 0-indexed for 1..32000

            if (bs.get(num0)) {
                System.out.println(num);
            } else {
                bs.set(num0);
            }
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Exactly 1 pass over array of size $N$ with $O(1)$ bitwise operations. |
| Auxiliary Memory | `3.91 KB` | Exactly 1,000 32-bit integers in the backing array ($4,000\text{ bytes}$). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Embedded Bit Arrays

1. **Embedded Microcontroller Firmware (ARM Cortex-M):** Sensors reading continuous integer IDs operate under tight SRAM budgets (e.g. 8 KB–16 KB), relying on compact bit arrays for deduplication.
2. **TCP Sliding Window Sequence Tracking:** Sliding window acknowledgment masks track received packet numbers using fixed-size bit fields.

## Edge Cases & Production Hardening

1. **Boundary Elements ($1$ and $32,000$):** Mapped correctly to bit indices 0 and 31,999 without array overflow.
2. **Multiple Duplicates of Same Number:** Prints on each subsequent encounter.
