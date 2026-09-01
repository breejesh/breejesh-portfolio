---
title: "Permutations with Dups: Unique Permutations from Repeated Characters (CTCI 8.8)"
description: "Compute all unique permutations of a string with duplicate characters without generating redundant branches using character frequency backtracking in O(N! / (n1! n2!...)) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-8-permutations-with-dups.webp
previewImage: /assets/images/ctci-8-8-permutations-with-dups.webp
---

> **TL;DR**
> * **The Book Problem:** Write a method to compute all permutations of a string whose characters are not necessarily unique. The list of permutations should not have duplicates.
> * **The Optimal Solution:** Frequency Map Backtracking: (1) Construct a character frequency count table `Map<Character, Integer> freqMap`; (2) At each recursive depth $d$, branch **only once** for each distinct character with count $> 0$; (3) Decrement the character count, recurse to depth $d + 1$, and backtrack by restoring the count; (4) Total permutations $= \frac{N!}{n_1! n_2! \dots n_k!}$, executing in strictly **$O\left(\frac{N!}{n_1! \dots n_k!} \cdot N\right)$ time** and $O(N)$ auxiliary stack space without ever generating redundant duplicate strings.
> * **Production Reality:** Multiset permutation generators in genomics (DNA k-mer frequency assemblies), query permutation pruning in database optimizers, and automated regression test matrix deduplication.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.8), we are asked:

*"Write a method to compute all permutations of a string whose characters are not necessarily unique. The list of permutations should not have duplicates."*

## 2. Character Frequency Hash Table Pruning

Generating all $N!$ permutations and filtering duplicates with a `HashSet` wastes exponential time on redundant work.

### Optimal Approach: Frequency Map Backtracking
1. Count character occurrences: e.g., `"aab"` $\to \{'a': 2, 'b': 1\}$.
2. At the first character position, try choosing each unique character:
   * Choice 1: `'a'` $\to$ remaining $\{'a': 1, 'b': 1\} \implies \text{Produces } ["aab", "aba"]$.
   * Choice 2: `'b'` $\to$ remaining $\{'a': 2, 'b': 0\} \implies \text{Produces } ["baa"]$.
3. Total unique permutations $= \frac{3!}{2! \cdot 1!} = 3$. Every recursive path produces a unique string directly.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PermutationsWithDups {
    /**
     * Computes all unique permutations of a string containing duplicate characters.
     * Time Complexity: O(N * (N! / (n1! * n2! * ... * nk!)))
     * Space Complexity: O(N) auxiliary stack space
     */
    public static List<String> printPerms(String s) {
        List<String> result = new ArrayList<>();
        Map<Character, Integer> map = buildFreqTable(s);
        printPermsHelper(map, "", s.length(), result);
        return result;
    }

    private static Map<Character, Integer> buildFreqTable(String s) {
        Map<Character, Integer> map = new HashMap<>();
        for (char c : s.toCharArray()) {
            map.put(c, map.getOrDefault(c, 0) + 1);
        }
        return map;
    }

    private static void printPermsHelper(Map<Character, Integer> map, String prefix,
                                         int remaining, List<String> result) {
        // Base case: entire string constructed
        if (remaining == 0) {
            result.add(prefix);
            return;
        }

        for (Character c : map.keySet()) {
            int count = map.get(c);
            if (count > 0) {
                map.put(c, count - 1);
                printPermsHelper(map, prefix + c, remaining - 1, result);
                map.put(c, count); // Backtrack
            }
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | $O\left(\frac{N!}{n_1! \dots n_k!} \cdot N\right)$ | Generates exactly the multinomial coefficient count of unique permutations without redundant branches. |
| Auxiliary Space | `O(N)` | Call stack depth bounded by string length $N$ and $O(\Sigma)$ frequency map. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Multiset Permutations

1. **Genomic Sequencing (DNA K-mer Reassembly):** Assembles de Bruijn graphs from multiset overlapping k-mer nucleotide fragments without redundant sequence permutations.
2. **Database Query Optimizer Predicate Reordering:** Commutative join order trees evaluate distinct relational permutations without re-evaluating duplicate sub-expressions.

## Edge Cases & Production Hardening

1. **All identical characters (`"aaaa"`):** Generates exactly $1$ string `["aaaa"]` in $O(N)$ operations.
2. **All distinct characters:** Smoothly degenerates into standard $N!$ factorial permutation generation.
3. **Empty String:** Returns `[""]`.
