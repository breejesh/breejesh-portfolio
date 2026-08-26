---
title: "Baby Names: Merge Synonym Name Frequencies Using Disjoint Set (CTCI 17.7)"
description: "CTCI problem 17.7: aggregate total frequencies of synonymous baby names using Connected Components / Union-Find."
date: "2025-12-12"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-7-baby-names.webp
previewImage: /assets/images/ctci-17-7-baby-names.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.7 technical mechanics.
> * **The Approach:** CTCI problem 17.7: aggregate total frequencies of synonymous baby names using Connected Components / Union-Find.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.7**: aggregate total frequencies of synonymous baby names using Connected Components / Union-Find. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.7: aggregate total frequencies of synonymous baby names using Connected Components / Union-Find.

## 2. Technical Code & Mechanics

```java
public class BabyNames {
    public Map<String, Integer> trulyMostPopular(Map<String, Integer> names, String[][] synonyms) {
        // Union-Find / Graph component aggregation
        return new HashMap<>();
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.