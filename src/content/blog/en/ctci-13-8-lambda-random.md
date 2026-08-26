---
title: "Lambda Random: Random Subset Generation with Java Streams (CTCI 13.8)"
description: "CTCI problem 13.8: generating a random subset of a list using Java Streams and lambda expressions."
date: "2026-02-14"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-13-8-lambda-random.webp
previewImage: /assets/images/ctci-13-8-lambda-random.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 13.8 technical mechanics.
> * **The Approach:** CTCI problem 13.8: generating a random subset of a list using Java Streams and lambda expressions.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **13.8**: generating a random subset of a list using Java Streams and lambda expressions. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 13.8: generating a random subset of a list using Java Streams and lambda expressions.

## 2. Technical Code & Mechanics

```java
public List<Integer> getRandomSubset(List<Integer> list) {
    Random rand = new Random();
    return list.stream()
        .filter(item -> rand.nextBoolean())
        .collect(Collectors.toList());
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.