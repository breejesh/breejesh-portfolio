---
title: "LRU Cache: Implement Least Recently Used Cache (CTCI 16.25)"
description: "CTCI problem 16.25: design and build a data structure for Least Recently Used (LRU) cache with O(1) get and put."
date: "2026-04-09"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-25-lru-cache.webp
previewImage: /assets/images/ctci-16-25-lru-cache.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.25 technical mechanics.
> * **The Approach:** CTCI problem 16.25: design and build a data structure for Least Recently Used (LRU) cache with O(1) get and put.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.25**.

## 1. Context and Problem Statement
CTCI problem 16.25: design and build a data structure for Least Recently Used (LRU) cache with O(1) get and put.

## 2. Technical Code & Mechanics

```java
public class LRUCacheCustom {
    class Node { int key, value; Node prev, next; }
    private final Map<Integer, Node> map = new HashMap<>();
    private final int capacity;
    public LRUCacheCustom(int capacity) { this.capacity = capacity; }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.