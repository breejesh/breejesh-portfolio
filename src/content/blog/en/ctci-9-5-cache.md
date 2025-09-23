---
title: "Cache: Design a Search Engine In-Memory Query Cache (CTCI 9.5)"
description: "CTCI problem 9.5: design a multi-tiered in-memory caching system for a search engine serving millions of queries per second."
date: "2025-09-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-5-cache.webp
previewImage: /assets/images/ctci-9-5-cache.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 9.5 with production-grade efficiency.
> * **The Approach:** CTCI problem 9.5: design a multi-tiered in-memory caching system for a search engine serving millions of queries per second.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

This article provides a complete, novice-friendly breakdown of CTCI problem **9.5**. We examine the problem statement, compare brute-force vs. optimal approaches, and write idiomatic Java code.

---

## 1. Everyday analogy

Think of CTCI problem 9.5 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 9.5:** CTCI problem 9.5: design a multi-tiered in-memory caching system for a search engine serving millions of queries per second.

---

## 3. Optimal approach and implementation

```java
public class LRUCache<K, V> {
    private final int capacity;
    private final Map<K, V> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > capacity;
            }
        };
    }

    public synchronized V get(K key) { return map.get(key); }
    public synchronized void put(K key, V value) { map.put(key, value); }
}
```

---

## 4. Time & Space Complexity

| Metric | Complexity | Explanation |
| --- | --- | --- |
| Time Complexity | O(N) / O(log N) | Optimal pass through data |
| Space Complexity | O(1) / O(N) | Memory bounds maintained |

---

## 5. Edge Cases & Friend Recap

Always check for boundary conditions, null inputs, duplicate values, or array size limits in coding interviews.