---
title: "Langton's Ant: Simulate Grid Cellular Automata Ant Traversal (CTCI 16.22)"
description: "CTCI problem 16.22: simulate K steps of Langton's Ant cellular automata on an infinite grid."
date: "2026-03-24"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-22-langton-s-ant.webp
previewImage: /assets/images/ctci-16-22-langton-s-ant.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.22 technical mechanics.
> * **The Approach:** CTCI problem 16.22: simulate K steps of Langton's Ant cellular automata on an infinite grid.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **16.22**: simulate K steps of Langton's Ant cellular automata on an infinite grid. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 16.22: simulate K steps of Langton's Ant cellular automata on an infinite grid.

## 2. Technical Code & Mechanics

```java
public class LangtonsAnt {
    private final Set<String> blackCells = new HashSet<>();
    // Simulate ant orientation turn and step
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.