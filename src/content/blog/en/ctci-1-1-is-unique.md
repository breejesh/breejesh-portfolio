---
title: "Is Unique: Determine If a String Has All Unique Characters (CTCI 1.1)"
description: "Implement an algorithm to determine if a string has all unique characters without additional data structures, using bit vectors and ASCII bounds."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-1-is-unique.webp
previewImage: /assets/images/ctci-1-1-is-unique.webp
---

> **TL;DR**
> * **The Book Problem:** Implement an algorithm to determine if a string has all unique characters. What if you cannot use additional data structures?
> * **The Bit-Vector Solution:** Use a 32-bit integer as a bit vector (`checker |= (1 << val)`) to track character occurrences in $O(1)$ auxiliary space and $O(N)$ time (bounded by alphabet size $\le 128$).
> * **Production Reality:** V8 JavaScript engine string interning, UTF-8 character deduplication, and database bitmap indexes.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 1.1), we are asked:

*"Implement an algorithm to determine if a string has all unique characters. What if you cannot use additional data structures?"*

*Key Clarification:* We must first ask the interviewer if the character set is ASCII (128 standard or 256 extended) or Unicode. If the length of the string exceeds the alphabet size ($N > 128$ for ASCII), by the **Pigeonhole Principle**, the string must contain duplicates, returning `false` in $O(1)$ time.

## 2. The Naive Approach & Inefficiencies

1. **Brute Force ($O(N^2)$ Time, $O(1)$ Space):** Compare every character against every other character using nested loops. For long strings, this triggers $N(N-1)/2$ comparisons.
2. **Sorting ($O(N \log N)$ Time, $O(1)$ Space):** Sort the string in-place (if mutable) and scan linearly for adjacent identical characters. However, string sorting incurs $O(N \log N)$ CPU time and mutates the input.
3. **Boolean Array ($O(N)$ Time, $O(1)$ Space):** Use `boolean[128] seen`. While $O(N)$, it allocates extra memory.

## 3. The Optimal Bit-Vector Solution

If the string uses lowercase letters `a` through `z` (26 characters), we can reduce space to a single 32-bit `int checker`:
1. For each character $c$, compute offset `val = c - 'a'`.
2. Check if the $val$-th bit is set: `(checker & (1 << val)) > 0`. If true, return `false` (duplicate found).
3. Otherwise, set the bit: `checker |= (1 << val)`.

This executes in $O(1)$ auxiliary space without heap allocations.

## Production Implementation

```java
public class IsUnique {
    /**
     * Checks if a string has all unique lowercase ASCII characters using a bit vector.
     * Time: O(min(c, N)) where c is alphabet size (128) -> O(1)
     * Space: O(1) auxiliary space (single 32-bit integer)
     */
    public static boolean isUniqueChars(String str) {
        if (str == null || str.length() > 128) return false;

        int checker = 0;
        for (int i = 0; i < str.length(); i++) {
            int val = str.charAt(i) - 'a';
            if ((checker & (1 << val)) > 0) {
                return false; // Character already seen
            }
            checker |= (1 << val);
        }
        return true;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(min(c, N))` | Never iterates more than 128 times due to Pigeonhole check. |
| Auxiliary Space | `O(1)` | Uses a single 32-bit integer register. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: String Interning in V8 & Bitmaps

1. **V8 String Interning (Symbol Tables):** The Chrome V8 JavaScript engine deduplicates strings by computing 32-bit hash seeds to check uniqueness before allocating string objects in heap memory.
2. **Database Bitmap Indexing (ClickHouse / PostgreSQL):** Bitmap indexes represent distinct low-cardinality values as bit arrays, executing fast bitwise `AND`/`OR` operations across millions of records per second.

## Edge Cases & Production Hardening

1. String length > 128: Handled by upfront check in O(1).
2. Empty string `""`: Returns true.
3. Case sensitivity: Discuss with interviewer whether 'A' and 'a' are considered distinct.
