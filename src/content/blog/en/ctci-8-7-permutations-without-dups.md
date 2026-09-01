---
title: "Permutations without Dups: Generating String Permutations of Unique Characters (CTCI 8.7)"
description: "Compute all N! permutations of a string of unique characters using prefix slicing and insertion recursion in optimal O(N! * N) time and space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-7-permutations-without-dups.webp
previewImage: /assets/images/ctci-8-7-permutations-without-dups.webp
---

> **TL;DR**
> * **The Book Problem:** Write a method to compute all permutations of a string of unique characters.
> * **The Optimal Solution:** Substring Insertion Recursion: (1) Base case: for a 1-character string `"a"`, the only permutation is `["a"]`; (2) For string $S$, separate the first character $c = S[0]$ and recursively compute all $(N - 1)!$ permutations of substring $S[1\dots]$; (3) For each sub-permutation, insert $c$ into every possible slot index $0 \dots |word|$; (4) Total permutations $= N!$, taking optimal **$O(N! \cdot N)$ time** and **$O(N! \cdot N)$ memory**.
> * **Production Reality:** Lexicographical word puzzle anagram solvers, cryptographic password permutation cracking engines, and combinatorial test case generation matrices.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.7), we are asked:

*"Write a method to compute all permutations of a string of unique characters."*

## 2. Recursive Insertion Algorithm

Consider $S = \text{"abc"}$:
1. Permutations of `"c"`: `["c"]`.
2. Insert `'b'` into all positions of `"c"`:
   * Slot 0: `"bc"`
   * Slot 1: `"cb"`
   * Result: `["bc", "cb"]`.
3. Insert `'a'` into all positions of `"bc"` and `"cb"`:
   * From `"bc"` $\to$ `"abc"`, `"bac"`, `"bca"`.
   * From `"cb"` $\to$ `"acb"`, `"cab"`, `"cba"`.
   * Total permutations $= 6 = 3!$.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class PermutationsWithoutDups {
    /**
     * Computes all permutations of a string of unique characters.
     * Time Complexity: O(N! * N)
     * Space Complexity: O(N! * N)
     */
    public static List<String> getPerms(String str) {
        if (str == null) return null;
        List<String> permutations = new ArrayList<>();

        if (str.length() == 0) { // Base case
            permutations.add("");
            return permutations;
        }

        char first = str.charAt(0); // Get first char
        String remainder = str.substring(1); // Get remainder
        List<String> words = getPerms(remainder);

        for (String word : words) {
            for (int j = 0; j <= word.length(); j++) {
                String s = insertCharAt(word, first, j);
                permutations.add(s);
            }
        }

        return permutations;
    }

    private static String insertCharAt(String word, char c, int i) {
        String start = word.substring(0, i);
        String end = word.substring(i);
        return start + c + end;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N! * N)` | Generates $N!$ strings, each string construction taking $O(N)$ string copying time. |
| Auxiliary Space | `O(N! * N)` | Stores all $N!$ permutation string objects in the output list. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Combinatorial Test Engines

1. **Orthogonal Array Testing Engines:** Generates exhaustive permutations of configuration flags to verify multi-tenant isolation across all possible feature combinations.
2. **Cryptographic Key Permutation Search:** High-performance wordlist generators (John the Ripper / Hashcat) parallelize permutation generation across GPU thread warps.

## Edge Cases & Production Hardening

1. **Empty String (`""`):** Returns `[""]`.
2. **Single Character (`"a"`):** Returns `["a"]`.
3. **Large strings ($N \ge 11$):** $11! = 39,916,800$ permutations; guarded with size limits to prevent out-of-memory errors.
