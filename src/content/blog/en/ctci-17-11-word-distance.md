---
title: "Word Distance: Positional Inverted Index & Two-Pointer Proximity Search (CTCI 17.11)"
description: "Find the shortest distance between any two words in a document using single-pass tracking and precomputed positional inverted index two-pointer scans in O(A + B)."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-11-word-distance.webp
previewImage: /assets/images/ctci-17-11-word-distance.webp
---

> **TL;DR**
> * **The Book Problem:** Given a large text file, find the minimum distance (number of words apart) between two words. If queries are repeated frequently for the same file, optimize the data structure.
> * **The Optimal Solutions:**
>   1. **Single Query (Linear Scan)**:
>      * Traverse the array tracking `lastPos1` and `lastPos2`. Whenever either word is encountered, update `minDistance = min(minDistance, abs(lastPos1 - lastPos2))`.
>      * Runs in **$O(N)$ time** and **$O(1)$ space**.
>   2. **Repeated Queries (Positional Inverted Index + Two-Pointer Scan)**:
>      * Precompute `Map<String, List<Integer>>` mapping each word to its sorted array of word positions in the document.
>      * For query $(W_1, W_2)$, retrieve index lists $L_1$ and $L_2$ and converge two pointers $p_1$ and $p_2$ in **$O(|L_1| + |L_2|)$ time**.
> * **Production Reality:** Lucene / Elasticsearch proximity search (`SPAN_NEAR`), phrase query token scoring, and genomic motif pair distances.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.11), we are asked:

*"Find the shortest distance between two words in a document, supporting both one-off single scans and repeated multi-query search scenarios."*

## 2. Positional Postings Two-Pointer Convergence

```
Document Word Stream:
  0       1        2        3       4       5        6       7
"the", "quick", "brown", "fox", "the", "lazy", "brown", "dog"

Positional Inverted Index:
  "fox"   ──> [ 3 ]
  "brown" ──> [ 2, 6 ]

Two-Pointer Convergence:
  p1 at fox (pos 3), p2 at brown (pos 2): diff = |3 - 2| = 1 (Shortest Distance!)
  Advance p2 to pos 6: diff = |3 - 6| = 3.
  Min Distance = 1.
```

## Production Java Implementation

```java
import java.util.*;

public class WordDistance {

    /**
     * Single-Query Scan: O(N) time, O(1) space.
     */
    public static int findClosestSingleQuery(String[] words, String word1, String word2) {
        if (words == null || word1 == null || word2 == null) return -1;

        int lastPos1 = -1;
        int lastPos2 = -1;
        int minDistance = Integer.MAX_VALUE;

        for (int i = 0; i < words.length; i++) {
            String current = words[i];
            if (current.equals(word1)) {
                lastPos1 = i;
                if (lastPos2 >= 0) {
                    minDistance = Math.min(minDistance, lastPos1 - lastPos2);
                }
            } else if (current.equals(word2)) {
                lastPos2 = i;
                if (lastPos1 >= 0) {
                    minDistance = Math.min(minDistance, lastPos2 - lastPos1);
                }
            }
        }

        return (minDistance == Integer.MAX_VALUE) ? -1 : minDistance;
    }

    /**
     * Multi-Query Search Structure: Positional Inverted Index.
     */
    public static class WordDistanceMap {
        private final Map<String, List<Integer>> locations = new HashMap<>();

        public WordDistanceMap(String[] words) {
            for (int i = 0; i < words.length; i++) {
                locations.computeIfAbsent(words[i].toLowerCase(), k -> new ArrayList<>()).add(i);
            }
        }

        /**
         * Queries word pair proximity in O(A + B) time.
         */
        public int distance(String word1, String word2) {
            List<Integer> list1 = locations.get(word1.toLowerCase());
            List<Integer> list2 = locations.get(word2.toLowerCase());

            if (list1 == null || list2 == null || list1.isEmpty() || list2.isEmpty()) {
                return -1;
            }

            int p1 = 0;
            int p2 = 0;
            int minDistance = Integer.MAX_VALUE;

            while (p1 < list1.size() && p2 < list2.size()) {
                int pos1 = list1.get(p1);
                int pos2 = list2.get(p2);

                minDistance = Math.min(minDistance, Math.abs(pos1 - pos2));
                if (minDistance == 1) return 1; // Minimum possible word distance

                if (pos1 < pos2) {
                    p1++;
                } else {
                    p2++;
                }
            }

            return minDistance;
        }
    }
}
```

## Complexity Analysis

| Mode | Preprocessing Time | Query Time | Auxiliary Space |
|---|---|---|---|
| **Single Scan** | $O(0)$ | **$O(N)$** | **$O(1)$** |
| **Positional Inverted Index** | $O(N)$ | **$O(|L_1| + |L_2|)$** | **$O(N)$** |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Lucene Positional Posting Lists

1. **Lucene & Elasticsearch Phrase Queries (`"quick brown fox"`):** Search engines store document term occurrences inside delta-encoded posting lists (`.pos` files). Proximity queries evaluate term adjacency by merging sorted posting lists via two-pointer leapfrog scans.
2. **Genomic Motif Proximity:** Bioinformatic pipelines calculate genomic transcription factor binding site (TFBS) distances across chromosome coordinate lists.

## Edge Cases & Production Hardening

1. **Word Absent from Document:** Returns `-1` cleanly when `locations.get()` yields `null`.
2. **Adjacent Words ($|\text{pos}_1 - \text{pos}_2| = 1$):** Returns `1` early without evaluating remaining list elements.
