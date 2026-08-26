---
title: "Dining Philosophers: Preventing Deadlock with Resource Ordering (CTCI 15.3)"
description: "CTCI problem 15.3: solving the classic Dining Philosophers deadlock using lock hierarchy and strict resource acquisition order."
date: "2026-04-27"
tags: [Algorithmes et Structures, Backend et Bases de Données]
coverImage: /assets/images/ctci-15-3-dining-philosophers.webp
previewImage: /assets/images/ctci-15-3-dining-philosophers.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 15.3 technical mechanics.
> * **The Approach:** CTCI problem 15.3: solving the classic Dining Philosophers deadlock using lock hierarchy and strict resource acquisition order.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **15.3**.

## 1. Context and Problem Statement
CTCI problem 15.3: solving the classic Dining Philosophers deadlock using lock hierarchy and strict resource acquisition order.

## 2. Technical Code & Mechanics

```java
public void pickUpChopsticks(int left, int right) {
    int first = Math.min(left, right);
    int second = Math.max(left, right);
    synchronized (chopsticks[first]) {
        synchronized (chopsticks[second]) {
            // Eat safely without deadlock
        }
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.