---
title: "One Away: Determine If Two Strings Are One Edit Distance Apart (CTCI 1.5)"
description: "Implement an algorithm to determine if two strings are within zero or one edit distance (insertion, deletion, replacement) in O(N) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-1-5-one-away.webp
previewImage: /assets/images/ctci-1-5-one-away.webp
---

> **TL;DR**
> * **The Book Problem:** There are three types of edits that can be performed on strings: insert a character, remove a character, or replace a character. Given two strings, write a function to check if they are one edit (or zero edits) away.
> * **The Optimal Solution:** Compare string lengths. If $|len_1 - len_2| > 1$, return false immediately. For equal lengths, check for at most one replacement; for length difference of 1, check for at most one insertion/removal via two pointers in $O(N)$ time and $O(1)$ auxiliary space.
> * **Production Reality:** Levenshtein distance thresholds in search query typo-tolerance, DNA sequence point mutations, and command-line fuzzy suggestion engines.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 1.5), we are asked:

*"There are three types of edits that can be performed on strings: insert a character, remove a character, or replace a character. Given two strings, write a function to check if they are one edit (or zero edits) away."*

**Example Test Cases:**
* `pale, ple -> true` (removal / insertion of 'a')
* `pales, pale -> true` (insertion / removal of 's')
* `pale, bale -> true` (replacement of 'p' with 'b')
* `pale, bake -> false` (two replacements: 'p'->'b' and 'l'->'k')

## 2. The Naive Approach & Inefficiencies

A naive approach might compute the full Levenshtein Distance Matrix between both strings using dynamic programming:
* **Time Complexity:** $O(N \times M)$ where $N$ and $M$ are string lengths.
* **Space Complexity:** $O(N \times M)$ auxiliary space (or $O(\min(N, M))$ with rolling arrays).

Computing the full dynamic programming matrix is massive overkill when we only care if the edit distance is $\le 1$. We can short-circuit the comparison in linear time.

## 3. Optimal Algorithmic Mechanics

We can solve this problem in two clean ways:

### Approach A: Separate Replacement and Insertion Checks
1. If lengths are equal: Check if strings differ by at most one character (`oneEditReplace`).
2. If lengths differ by 1: Check if inserting one character into the shorter string yields the longer string (`oneEditInsert`).
3. If length difference $> 1$: Return `false` immediately in $O(1)$ time.

### Approach B: Compact Combined One-Pass Scan
Merge both checks into a single loop with two pointers `index1` and `index2`:
1. Iterate while both pointers are within bounds.
2. When a mismatch is found:
   * If `foundDifference` is already `true`, return `false`.
   * Mark `foundDifference = true`.
   * If lengths are equal, advance both pointers (replacement).
   * If lengths differ, advance only the longer string pointer (insertion).
3. If no violation occurs, return `true`.

## Production Implementation

```java
public class OneAway {
    /**
     * Checks if two strings are zero or one edit away.
     * Time Complexity: O(N) where N is the length of the shorter string.
     * Space Complexity: O(1) auxiliary space.
     */
    public static boolean oneEditAway(String first, String second) {
        if (Math.abs(first.length() - second.length()) > 1) {
            return false;
        }

        // Identify shorter and longer strings
        String s1 = first.length() < second.length() ? first : second;
        String s2 = first.length() < second.length() ? second : first;

        int index1 = 0;
        int index2 = 0;
        boolean foundDifference = false;

        while (index2 < s2.length() && index1 < s1.length()) {
            if (s1.charAt(index1) != s2.charAt(index2)) {
                // Ensure this is the first difference encountered
                if (foundDifference) return false;
                foundDifference = true;

                if (s1.length() == s2.length()) {
                    // On replace, move shorter pointer
                    index1++;
                }
            } else {
                // If matching, move shorter pointer
                index1++;
            }
            // Always move longer pointer
            index2++;
        }

        return true;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Traverses strings in a single pass where $N = \min(|first|, |second|)$. |
| Auxiliary Space | `O(1)` | Uses only integer pointer registers without heap allocations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Fuzzy Search and CLI Suggestions

1. **Search Autocomplete & Typo Tolerance (Elasticsearch / Lucene):** Lucene builds Levenshtein Automata to match queries against index terms with max edit distance 1 or 2. Fast one-pass checks avoid expensive dictionary evaluations.
2. **Git / CLI Command Spelling Correction:** When entering `git stauts`, git checks candidate commands within distance 1 to suggest `git status`.
3. **Bioinformatics Point Mutations:** Detects single nucleotide polymorphisms (SNPs) and single insertion/deletion (indel) events in genomic sequences.

## Edge Cases & Production Hardening

1. **Identical strings (`"pale", "pale"`):** Returns `true` (zero edits away).
2. **Empty strings (`"", ""`):** Returns `true`.
3. **One empty string, one single char (`"", "a"`):** Returns `true`.
4. **Length difference $\ge 2$ (`"p", "pale"`):** Short-circuited in $O(1)$ without string scanning.
5. **Null inputs:** Defensive check `if (first == null || second == null) return false;`.
