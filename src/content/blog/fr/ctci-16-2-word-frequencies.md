---
title: "Word Frequencies: Efficient Frequency Lookup in Large Text (CTCI 16.2)"
description: "CTCI problem 16.2: design a precomputed HashMap lookup table to query word frequencies in O(1) time."
date: "2025-12-24"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-2-word-frequencies.webp
previewImage: /assets/images/ctci-16-2-word-frequencies.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.2 technical mechanics.
> * **The Approach:** CTCI problem 16.2: design a precomputed HashMap lookup table to query word frequencies in O(1) time.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.2**.

## 1. Context and Problem Statement
CTCI problem 16.2: design a precomputed HashMap lookup table to query word frequencies in O(1) time.

## 2. Technical Code & Mechanics

```java
public class WordFrequency {
    private final Map<String, Integer> dictionary = new HashMap<>();
    public void setup(String[] book) {
        for (String word : book) {
            word = word.trim().toLowerCase();
            if (!word.isEmpty()) dictionary.put(word, dictionary.getOrDefault(word, 0) + 1);
        }
    }
    public int getFrequency(String word) { return dictionary.getOrDefault(word.toLowerCase(), 0); }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.