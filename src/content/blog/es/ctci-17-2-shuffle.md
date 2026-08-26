---
title: "Shuffle: Fisher-Yates Card Deck Shuffling Algorithm (CTCI 17.2)"
description: "CTCI problem 17.2: shuffle a deck of cards uniformly using the Fisher-Yates (Knuth) in-place algorithm."
date: "2026-05-23"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-2-shuffle.webp
previewImage: /assets/images/ctci-17-2-shuffle.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.2 technical mechanics.
> * **The Approach:** CTCI problem 17.2: shuffle a deck of cards uniformly using the Fisher-Yates (Knuth) in-place algorithm.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **17.2**.

## 1. Context and Problem Statement
CTCI problem 17.2: shuffle a deck of cards uniformly using the Fisher-Yates (Knuth) in-place algorithm.

## 2. Technical Code & Mechanics

```java
public static void shuffleArray(int[] cards) {
    Random rand = new Random();
    for (int i = 0; i < cards.length; i++) {
        int k = rand.nextInt(i + 1);
        int temp = cards[i];
        cards[i] = cards[k];
        cards[k] = temp;
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.