---
title: "Word Frequencies: Efficient Frequency Lookup in Large Text (CTCI 16.2)"
description: "CTCI problem 16.2: design a precomputed HashMap lookup table to query word frequencies in O(1) time."
date: "2025-12-24"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-2-word-frequencies.webp
previewImage: /assets/images/ctci-16-2-word-frequencies.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.2 technical mechanics.
> * **The Approach:** CTCI problem 16.2: design a precomputed HashMap lookup table to query word frequencies in O(1) time.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **16.2**: design a precomputed HashMap lookup table to query word frequencies in O(1) time. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

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