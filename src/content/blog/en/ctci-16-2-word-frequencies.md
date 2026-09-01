---
title: "Word Frequencies: Inverted Indexing & Hash Table Preprocessing (CTCI 16.2)"
description: "Design efficient word frequency algorithms for single-pass and repetitive queries using HashMaps, tokenization pipelines, and Lucene inverted index patterns."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-2-word-frequencies.webp
previewImage: /assets/images/ctci-16-2-word-frequencies.webp
---

> **TL;DR**
> * **The Book Problem:** Design a method to find the frequency of occurrences of any given word in a book. What if we were running this algorithm multiple times?
> * **The Algorithmic Solutions:**
>   1. **Single Query**: Scan the book once, normalizing case and stripping punctuation. Runs in **$O(N)$ time** and **$O(1)$ space**.
>   2. **Repetitive Queries**: Preprocess the entire book into a `HashMap<String, Integer>` frequency dictionary during initialization.
>      * Preprocessing: **$O(N)$ time**, **$O(U)$ space** ($U = \text{unique words}$).
>      * Query Time: **$O(1)$ amortized lookup**.
> * **Production Reality:** Inverted Index engines in Apache Lucene, Elasticsearch, and SQLite FTS5.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.2), we are asked:

*"Design an algorithm to find the frequency of occurrence of a word in a book. Optimize for single vs. repetitive multi-query workloads."*

## 2. Architecture Comparison: Single Scan vs. Precomputed Hash Index

```
[Single Query Mode: O(N) Scan]
Book Array ───> [Linear Tokenizer Scan] ───> Return Count

[Repetitive Query Mode: Inverted Index / HashMap]
Book Array ───> [Tokenize & Normalize] ───> HashMap<String, Integer>
                                                   │
Query("algorithm") ───────────────────────────────> O(1) Lookup -> 42
```

## Production Implementation

```java
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class WordFrequencyAnalyzer {
    private final Map<String, Integer> frequencyMap;

    /**
     * Preprocesses the entire text for O(1) repetitive queries.
     */
    public WordFrequencyAnalyzer(String[] book) {
        this.frequencyMap = buildDictionary(book);
    }

    private Map<String, Integer> buildDictionary(String[] book) {
        if (book == null) return Collections.emptyMap();
        Map<String, Integer> map = new HashMap<>();

        for (String word : book) {
            if (word == null) continue;
            String normalized = normalize(word);
            if (!normalized.isEmpty()) {
                map.put(normalized, map.getOrDefault(normalized, 0) + 1);
            }
        }
        return map;
    }

    /**
     * O(1) Repetitive Query Lookup
     */
    public int getFrequency(String word) {
        if (word == null) return 0;
        return frequencyMap.getOrDefault(normalize(word), 0);
    }

    /**
     * O(N) Single-Pass Query (Zero Preprocessing Memory)
     */
    public static int getFrequencySingleQuery(String[] book, String targetWord) {
        if (book == null || targetWord == null) return 0;
        String normalizedTarget = normalize(targetWord);
        if (normalizedTarget.isEmpty()) return 0;

        int count = 0;
        for (String word : book) {
            if (normalizedTarget.equals(normalize(word))) {
                count++;
            }
        }
        return count;
    }

    private static String normalize(String word) {
        return word.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
    }
}
```

## Complexity Analysis

| Workload Pattern | Preprocessing Time | Preprocessing Space | Query Time Complexity |
|---|---|---|---|
| **Single Query** | $0$ (None) | $O(1)$ | $O(N)$ scan |
| **$Q$ Repetitive Queries** | $O(N)$ single pass | $O(U)$ unique vocabulary | **$O(1)$ per query** ($O(N + Q)$ total) |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Apache Lucene Inverted Index

1. **Term Dictionary & Posting Lists:** Production full-text search systems (Elasticsearch / Solr) do not merely count occurrences; they construct an Inverted Index storing a Term Dictionary mapped to Posting Lists (`Term -> [DocID, TF, [Positions]]`) compressed via Roaring Bitmaps or Frame-of-Reference (FoR).
2. **Stop Word & Stemming Pipelines:** Tokenizers apply Porter Stemming (`running` $\to$ `run`) and prune high-frequency stop words (`the`, `is`, `at`) to optimize memory footprint.

## Edge Cases & Production Hardening

1. **Punctuation & Case Normalization:** Words with attached punctuation (e.g. `"apple,"` vs `"Apple."`) are normalized to `"apple"` to prevent undercounting.
2. **Null and Empty Inputs:** Handled gracefully returning `0` without throwing `NullPointerException`.
