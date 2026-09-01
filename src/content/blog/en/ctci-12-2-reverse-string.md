---
title: "Reverse String: In-Place Two-Pointer Null-Terminated C-String Inversion (CTCI 12.2)"
description: "Reverse a null-terminated C-style character string in-place using two raw pointers in O(N) time and O(1) space without allocating heap buffers."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-12-2-reverse-string.webp
previewImage: /assets/images/ctci-12-2-reverse-string.webp
---

> **TL;DR**
> * **The Book Problem:** Implement a function `void reverse(char* str)` in C or C++ which reverses a null-terminated string in-place.
> * **The Optimal Solution:** **Two-Pointer Pointer Arithmetic Inversion**: (1) If `str` is `NULL`, return immediately; (2) Advance an `end` pointer until reaching the null terminator `*end == '\0'`, then decrement `end--` to point to the last valid character; (3) Set `start = str`; (4) While `start < end`, swap `*start` with `*end`, increment `start++`, and decrement `end--`; (5) Runs in **$O(N)$ time** and **$O(1)$ space**.
> * **Production Reality:** Network packet payload byte-swapping, embedded string manipulation in C, and UTF-8 code point reversal engines.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 12.2), we are asked:

*"Implement a function void reverse(char* str) in C or C++ which reverses a null-terminated string."*

## 2. In-Place Pointer Arithmetic Mechanics

A C-style string is an array of `char` terminated by a sentinel `'\0'` byte:
```
['h', 'e', 'l', 'l', 'o', '\0']
  ▲                   ▲
start                end
```

### Steps:
1. Advance `end` until `*end == '\0'`.
2. Step back `end--` so `end` points to `'o'`.
3. Swap `*start` and `*end` iteratively until `start >= end`.

## Production Implementation

```c
#include <stdio.h>

/**
 * Reverses a null-terminated C-string in-place.
 * Time Complexity: O(N)
 * Space Complexity: O(1)
 */
void reverse(char* str) {
    if (!str) return; // Null pointer guard

    char* end = str;
    char temp;

    // Advance end pointer to the null terminator
    while (*end) {
        end++;
    }
    end--; // Step back to the last non-null character

    // Swap characters from outer bounds inward
    char* start = str;
    while (start < end) {
        temp = *start;
        *start = *end;
        *end = temp;

        start++;
        end--;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Exactly $N$ pointer increments to find `\0` + $N / 2$ character swaps. |
| Auxiliary Space | `O(1)` | Two pointer variables (`start`, `end`) and one scalar `temp` register. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Endianness & Hardware Protocols

1. **Network Byte Order Manipulation:** Reversing byte sequences across Big-Endian and Little-Endian network boundaries (`ntohl` / `htonl`).
2. **String Literals vs Stack Arrays:** Calling `reverse("hello")` causes a Segmentation Fault (`SIGSEGV`) because string literals reside in read-only `.rodata` memory pages. Reversal requires a mutable buffer (`char str[] = "hello";`).

## Edge Cases & Production Hardening

1. **Null Pointer (`str == NULL`):** Caught by early guard clause.
2. **Empty String (`""`):** `end` initially points to `\0`, `end--` makes `end < start`, loop does not execute.
3. **Single Character String (`"a"`):** `start == end`, loop terminates with zero swaps.
