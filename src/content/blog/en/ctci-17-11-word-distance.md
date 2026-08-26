---
title: "Word Distance: Shortest Distance Between Two Words in Large Text (CTCI 17.11)"
description: "CTCI problem 17.11: compute minimum word index distance between two words in a file in O(N) single pass time."
date: "2026-04-19"
tags: [Algorithms & Data Structures, Developer Tools]
coverImage: /assets/images/ctci-17-11-word-distance.webp
previewImage: /assets/images/ctci-17-11-word-distance.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.11 technical mechanics.
> * **The Approach:** CTCI problem 17.11: compute minimum word index distance between two words in a file in O(N) single pass time.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.11**: compute minimum word index distance between two words in a file in O(N) single pass time. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.11: compute minimum word index distance between two words in a file in O(N) single pass time.

## 2. Technical Code & Mechanics

```java
public static int findClosest(String[] words, String word1, String word2) {
    int min = Integer.MAX_VALUE;
    int last1 = -1, last2 = -1;
    for (int i = 0; i < words.length; i++) {
        if (words[i].equals(word1)) {
            last1 = i;
            if (last2 >= 0) min = Math.min(min, last1 - last2);
        } else if (words[i].equals(word2)) {
            last2 = i;
            if (last1 >= 0) min = Math.min(min, last2 - last1);
        }
    }
    return min;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.