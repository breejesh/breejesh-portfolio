---
title: "Group Anagrams: Bucketing Anagrams with Canonical Key Hashing (CTCI 10.2)"
description: "Sort an array of strings so that all anagrams appear adjacent to one another using character sort bucketing and hash maps in O(N * K log K) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-2-group-anagrams.webp
previewImage: /assets/images/ctci-10-2-group-anagrams.webp
---

> **TL;DR**
> * **The Book Problem:** Write a method to sort an array of strings so that all the anagrams are next to each other.
> * **The Optimal Solution:** Canonical Key Bucket Hashing: (1) Anagrams share an identical sorted character signature (e.g. `"acre"`, `"race"`, `"care"` all sort to `"acer"`); (2) Map each word into a bucket using `HashMap<String, ArrayList<String>>` where key is `sortChars(word)`; (3) Re-flatten the hash table buckets back into the original array; (4) Executes in **$O(N \cdot K \log K)$ time** (where $N$ is array length and $K$ is max string length) and **$O(N \cdot K)$ space**, outperforming comparison-based custom sorting.
> * **Production Reality:** Search engine spell-correction suggestions, lexical rhyme/anagram lookup engines, and genomic codon permutation grouping.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.2), we are asked:

*"Write a method to sort an array of strings so that all the anagrams are next to each other."*

## 2. Canonical Key Hashing vs Comparator Sort

### Why not `Arrays.sort(array, new AnagramComparator())`?
A custom comparator sorting $N$ strings by comparing their sorted forms requires $O(N \log N)$ string comparisons, each taking $O(K \log K)$, yielding $O(N \log N \cdot K \log K)$.

### Optimal Hash Bucketing ($O(N \cdot K \log K)$)
By using a hash map to group words into buckets by their sorted canonical representation, we make only **1 pass** over the array ($N$ string sorts), cutting complexity from $O(N \log N \cdot K \log K)$ to $O(N \cdot K \log K)$.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GroupAnagrams {
    /**
     * Groups all anagrams adjacent to one another in the array.
     * Time Complexity: O(N * K log K)
     * Space Complexity: O(N * K)
     */
    public static void sort(String[] array) {
        Map<String, List<String>> mapList = new HashMap<>();

        // Group words by sorted canonical anagram key
        for (String s : array) {
            String key = sortChars(s);
            mapList.putIfAbsent(key, new ArrayList<>());
            mapList.get(key).add(s);
        }

        // Flatten buckets back into the original array
        int index = 0;
        for (String key : mapList.keySet()) {
            List<String> list = mapList.get(key);
            for (String t : list) {
                array[index] = t;
                index++;
            }
        }
    }

    private static String sortChars(String s) {
        char[] content = s.toCharArray();
        Arrays.sort(content);
        return new String(content);
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N * K log K)` | $N$ strings of max length $K$ sorted individually via Dual-Pivot Quicksort. |
| Auxiliary Space | `O(N * K)` | Hash table storing grouped string bucket lists. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Lexical Indices & Search

1. **Search Engine "Did You Mean" Suggestions:** Inverted character-frequency trie structures group anagrammatic and transposed search typos to suggest closest semantic queries.
2. **Genomic Codon Hashing:** Identifies nucleotide base permutations across short-read sequence libraries.

## Edge Cases & Production Hardening

1. **Empty Strings & Single Characters:** Hashed and grouped seamlessly into `""` or `"a"` buckets.
2. **Strings with special characters & whitespace:** Preserved across character sort and restitution.
