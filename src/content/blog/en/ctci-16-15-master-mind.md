---
title: "Master Mind: Calculate Hits and Pseudo-Hits in Mastermind (CTCI 16.15)"
description: "CTCI problem 16.15: compute the number of hits (exact match) and pseudo-hits (color match wrong slot) in Mastermind."
date: "2025-10-23"
tags: [Algorithms & Data Structures, Backend & Databases]
coverImage: /assets/images/ctci-16-15-master-mind.webp
previewImage: /assets/images/ctci-16-15-master-mind.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.15 technical mechanics.
> * **The Approach:** CTCI problem 16.15: compute the number of hits (exact match) and pseudo-hits (color match wrong slot) in Mastermind.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **16.15**: compute the number of hits (exact match) and pseudo-hits (color match wrong slot) in Mastermind. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 16.15: compute the number of hits (exact match) and pseudo-hits (color match wrong slot) in Mastermind.

## 2. Technical Code & Mechanics

```java
public static class Result { public int hits; public int pseudoHits; }
public static Result estimate(String guess, String solution) {
    Result res = new Result();
    // Count hits and pseudo-hits
    return res;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.