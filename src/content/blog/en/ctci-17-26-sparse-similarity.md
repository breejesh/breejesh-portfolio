---
title: "Sparse Similarity: Compute Jaccard Similarity Over Documents (CTCI 17.26)"
description: "CTCI problem 17.26: compute Jaccard similarity for pairs of documents with overlapping elements using Inverted Index in O(K) time."
date: "2025-11-15"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-26-sparse-similarity.webp
previewImage: /assets/images/ctci-17-26-sparse-similarity.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.26 technical mechanics.
> * **The Approach:** CTCI problem 17.26: compute Jaccard similarity for pairs of documents with overlapping elements using Inverted Index in O(K) time.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.26**: compute Jaccard similarity for pairs of documents with overlapping elements using Inverted Index in O(K) time. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.26: compute Jaccard similarity for pairs of documents with overlapping elements using Inverted Index in O(K) time.

## 2. Technical Code & Mechanics

```java
public class SparseSimilarity {
    public static Map<String, Double> computeSimilarities(Map<Integer, List<Integer>> documents) {
        // Build inverted index from element to document IDs
        return new HashMap<>();
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.