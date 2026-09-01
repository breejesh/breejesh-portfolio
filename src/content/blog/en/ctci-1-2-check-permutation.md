---
title: "Check Permutation: Decide If One String Is a Permutation of Another (CTCI 1.2)"
description: "How to check if one string is a permutation of another in linear time O(N) using character frequency count arrays versus sorting."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-2-check-permutation.webp
previewImage: /assets/images/ctci-1-2-check-permutation.webp
---

> **TL;DR**
> * **The Book Problem:** Given two strings, write a method to decide if one is a permutation of the other.
> * **The Core Breakthrough:** Character Frequency Array: Verify equal lengths, then increment character counts for string 1 and decrement for string 2. If any count drops below 0, return `false` in $O(N)$ time and $O(1)$ auxiliary space.
> * **Production Reality:** Anagram matching in search engines, cryptographic ciphertext frequency analysis, and DNA sequence matching.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 1.2), we are asked:

*"Given two strings, write a method to decide if one is a permutation of the other."*

*Key Clarification:* Permutations must have identical character counts in different orders. We must confirm if comparison is case-sensitive (`"God"` vs `"dog"`) and whether whitespace is significant (`"a b"` vs `"ab"`).

## 2. Comparing Approaches

1. **Sorting ($O(N \log N)$ Time, $O(N)$ Space):** Sort both strings and check `sort(s1).equals(sort(s2))`. While clean to write, sorting incurs $O(N \log N)$ runtime and allocates new string buffers.
2. **Frequency Array ($O(N)$ Time, $O(1)$ Space):** For ASCII, allocate `int[128] letters`. Traverse `s1` incrementing counts, then traverse `s2` decrementing counts. If any letter count goes negative, `s2` contains a character not in `s1` in equal frequency.

## Production Implementation

```java
public class CheckPermutation {
    /**
     * Checks if s1 is a permutation of s2 using a character frequency array.
     * Time: O(N) where N is length of the strings
     * Space: O(1) (fixed 128-element ASCII array)
     */
    public static boolean permutation(String s, String t) {
        if (s.length() != t.length()) return false;

        int[] letters = new int[128]; // Assuming standard ASCII
        for (int i = 0; i < s.length(); i++) {
            letters[s.charAt(i)]++;
        }

        for (int i = 0; i < t.length(); i++) {
            int c = (int) t.charAt(i);
            letters[c]--;
            if (letters[c] < 0) {
                return false; // Character count mismatch
            }
        }
        return true;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Single pass over each string. |
| Auxiliary Space | `O(1)` | Fixed 128-element integer buffer. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Cryptanalysis and Anagram Search

1. **Search Engine Query Normalization:** Search engines match token permutations by sorting word vectors or comparing character bag-of-words hashes.
2. **Frequency Cryptanalysis:** Classical cipher breaking relies on character frequency histogram matching against expected language distributions.

## Edge Cases & Production Hardening

1. Strings of different lengths: Exits immediately in O(1).
2. Identical strings: Returns true in O(N).
