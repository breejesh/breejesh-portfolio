---
title: "Diving Board: Generate All Possible Board Lengths (CTCI 16.11)"
description: "CTCI problem 16.11: compute all possible total lengths of a diving board built using K planks of shorter or longer size."
date: "2025-11-23"
tags: [Algorithms & Data Structures, Developer Tools]
coverImage: /assets/images/ctci-16-11-diving-board.webp
previewImage: /assets/images/ctci-16-11-diving-board.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.11 technical mechanics.
> * **The Approach:** CTCI problem 16.11: compute all possible total lengths of a diving board built using K planks of shorter or longer size.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **16.11**: compute all possible total lengths of a diving board built using K planks of shorter or longer size. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 16.11: compute all possible total lengths of a diving board built using K planks of shorter or longer size.

## 2. Technical Code & Mechanics

```java
public static Set<Integer> allLengths(int k, int shorter, int longer) {
    Set<Integer> lengths = new HashSet<>();
    for (int i = 0; i <= k; i++) {
        int length = i * shorter + (k - i) * longer;
        lengths.add(length);
    }
    return lengths;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.