---
title: "Palindrome Permutation: Checking String Permutation for Palindromes (CTCI 1.4)"
description: "How to check if a string is a permutation of a palindrome in O(N) time using bit vectors, verifying that at most one character has an odd frequency count."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-4-palindrome-permutation.webp
previewImage: /assets/images/ctci-1-4-palindrome-permutation.webp
---

> **TL;DR**
> * **The Book Problem:** Given a string, write a function to check if it is a permutation of a palindrome. Ignore casing and non-letter characters.
> * **The Core Breakthrough:** A palindrome permutation has at most ONE character with an odd frequency count. Toggle bits in an integer (`bitVector ^= (1 << val)`) and check `(bitVector & (bitVector - 1)) == 0` in $O(N)$ time and $O(1)$ space.
> * **Production Reality:** DNA palindrome motif search in bioinformatics and query normalization.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 1.4), we are asked:

*"Given a string, write a function to check if it is a permutation of a palindrome."*

Example: `"Tact Coa"` $\to$ `true` (permutations include `"taco cat"`, `"atco cta"`).

## 2. The Parity Invariant & Bit-Vector Solution

A palindrome can have at most one odd-count character (the center character of an odd-length string).

Instead of allocating a hash map or integer array, we can use a single 32-bit integer as a bit vector where the $i$-th bit toggles between 0 (even count) and 1 (odd count):
* For each letter: `bitVector ^= (1 << (c - 'a'))`.
* At the end, the string is a valid palindrome permutation if the bit vector is either 0 (all even) or has exactly one 1-bit set: `(bitVector & (bitVector - 1)) == 0`.

## Production Implementation

```java
public class PalindromePermutation {
    public static boolean isPermutationOfPalindrome(String phrase) {
        int bitVector = 0;
        for (char c : phrase.toCharArray()) {
            int x = getCharNumber(c);
            if (x >= 0) {
                bitVector ^= (1 << x); // Toggle bit
            }
        }
        // At most one bit is 1
        return (bitVector == 0) || ((bitVector & (bitVector - 1)) == 0);
    }

    private static int getCharNumber(char c) {
        int a = Character.getNumericValue('a');
        int z = Character.getNumericValue('z');
        int val = Character.getNumericValue(c);
        if (a <= val && val <= z) return val - a;
        return -1;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Single pass over phrase characters. |
| Auxiliary Space | `O(1)` | Single 32-bit integer bit vector. |

## Real-World Systems Engineering Discussion

Genomic sequence alignment algorithms search for inverted repeat DNA palindromes (restriction enzyme recognition sites) using SIMD bit parity masks.

## Edge Cases & Production Hardening

1. Strings with punctuation and whitespace: Filtered cleanly.
2. Empty string: Returns true.
