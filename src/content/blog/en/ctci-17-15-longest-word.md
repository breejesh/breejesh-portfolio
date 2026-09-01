---
title: "Longest Word: Memoized Recursive Decomposition of Composite Strings (CTCI 17.15)"
description: "Find the longest word formed by concatenating other words in a dictionary using length-descending sorting and memoized recursive prefix splitting in O(N · L^2) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-15-longest-word.webp
previewImage: /assets/images/ctci-17-15-longest-word.webp
---

> **TL;DR**
> * **The Book Problem:** Given an array of words, find the longest word that can be built by concatenating other words in the list.
> * **The Optimal Solution:** **Length-Descending Sorting + Memoized Recursive Prefix Splitting**:
>   1. **Sort by Length**: Sort words in descending order of length ($\text{length} \downarrow$).
>   2. **Dictionary Map**: Store all words in `Map<String, Boolean>` (mapping word to boolean memoization state).
>   3. **Recursive Splitting**: For each word in descending order, iterate split point $i \in [1, \text{length}-1]$:
>      * Check if left prefix $\text{word}[0..i)$ is in dictionary AND recursive `canBuild(right, false)` evaluates to true.
>   4. The first word in sorted order that evaluates to `true` is mathematically guaranteed to be the longest composite word.
>   5. Runs in **$O(N \log N + N \cdot L^2)$ time** (where $L$ is the maximum word length) and **$O(N \cdot L)$ space**.
> * **Production Reality:** German / Scandinavian compound word lemmatization (morphological decompounding in Lucene analyzers), domain name brand squatting detection, and chemical nomenclature parsers.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.15), we are asked:

*"Identify the longest single word in a wordlist composed entirely of two or more other words from the same list."*

## 2. Recursive Prefix Decomposition

```
Dictionary: ["cat", "banana", "dog", "nana", "walk", "walker", "dogwalker"]
Sorted by Length:
  1. "dogwalker" (len 9) ──> Left: "dog" (in dict) + Right: "walker" (in dict) ──> VALID! (Returns "dogwalker")
```

## Production Java Implementation

```java
import java.util.*;

public class LongestWord {

    /**
     * Finds the longest composite word.
     * Time Complexity: O(N log N + N * L^2)
     * Space Complexity: O(N * L)
     */
    public static String printLongestWord(String[] list) {
        if (list == null || list.length == 0) return "";

        // 1. Sort descending by length
        Arrays.sort(list, (a, b) -> Integer.compare(b.length(), a.length()));

        // 2. Populate memoization map
        Map<String, Boolean> map = new HashMap<>();
        for (String w : list) {
            map.put(w, true);
        }

        // 3. Evaluate each word from longest to shortest
        for (String w : list) {
            if (canBuildWord(w, true, map)) {
                return w; // First valid word is the longest!
            }
        }

        return "";
    }

    private static boolean canBuildWord(String str, boolean isOriginalWord, Map<String, Boolean> map) {
        // If already evaluated in memoization table and not the original root call
        if (map.containsKey(str) && !isOriginalWord) {
            return map.get(str);
        }

        for (int i = 1; i < str.length(); i++) {
            String left = str.substring(0, i);
            String right = str.substring(i);

            if (map.containsKey(left) && map.get(left) && canBuildWord(right, false, map)) {
                map.put(str, true);
                return true;
            }
        }

        map.put(str, false);
        return false;
    }
}
```

## Complexity Analysis

| Phase | Time Complexity | Auxiliary Space | Early Exit Strategy |
|---|---|---|---|
| **Array Sorting** | $O(N \log N)$ | $O(1)$ | Length Descending |
| **Recursive Parsing** | **$O(N \cdot L^2)$** | **$O(N \cdot L)$** | **Terminates on first match** |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Germanic Decompounding Analyzers

1. **Lucene Decompounding Token Filter (`DictionaryCompoundWordTokenFilter`):** German words (*Donaudampfschifffahrt*) consist of chained compound nouns without spaces. Lucene search analyzers decompose compound queries into sub-word tokens using memoized dictionary splitting.
2. **Domain Name Squatting Detection:** Cybersecurity threat scanners detect malicious URL permutations by splitting domain tokens into brand dictionary components.

## Edge Cases & Production Hardening

1. **No Composite Words Exist:** Returns empty string `""` safely.
2. **Original Word Recursion Trap:** The `isOriginalWord` boolean flag prevents a word from trivializing the check by matching itself (`"cat"` matching `"cat"`).
