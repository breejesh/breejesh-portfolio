---
title: "Random Set: Generate Uniform Random Subset of Size M from Array of Size N (CTCI 17.3)"
description: "CTCI problem 17.3: sample a random subset of size m from an array of n elements uniformly."
date: "2025-08-29"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-3-random-set.webp
previewImage: /assets/images/ctci-17-3-random-set.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.3 technical mechanics.
> * **The Approach:** CTCI problem 17.3: sample a random subset of size m from an array of n elements uniformly.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **17.3**.

## 1. Context and Problem Statement
CTCI problem 17.3: sample a random subset of size m from an array of n elements uniformly.

## 2. Technical Code & Mechanics

```java
public static int[] pickRandomly(int[] original, int m) {
    int[] subset = new int[m];
    for (int i = 0; i < m; i++) subset[i] = original[i];
    Random rand = new Random();
    for (int i = m; i < original.length; i++) {
        int k = rand.nextInt(i + 1);
        if (k < m) subset[k] = original[i];
    }
    return subset;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.