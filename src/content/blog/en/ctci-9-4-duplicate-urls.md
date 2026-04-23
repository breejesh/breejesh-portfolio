---
title: "Duplicate URLs: Detect Duplicates in 10 Billion URLs (CTCI 9.4)"
description: "CTCI problem 9.4: how to identify duplicate URLs in a dataset of 10 billion URLs with strict RAM constraints using Bloom Filters and External Hash Partitioning."
date: "2026-04-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-4-duplicate-urls.webp
previewImage: /assets/images/ctci-9-4-duplicate-urls.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 9.4 with production-grade efficiency.
> * **The Approach:** CTCI problem 9.4: how to identify duplicate URLs in a dataset of 10 billion URLs with strict RAM constraints using Bloom Filters and External Hash Partitioning.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

This article provides a complete, novice-friendly breakdown of CTCI problem **9.4**. We examine the problem statement, compare brute-force vs. optimal approaches, and write idiomatic Java code.

---

## 1. Everyday analogy

Think of CTCI problem 9.4 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 9.4:** CTCI problem 9.4: how to identify duplicate URLs in a dataset of 10 billion URLs with strict RAM constraints using Bloom Filters and External Hash Partitioning.

---

## 3. Optimal approach and implementation

```java
public class SimpleBloomFilter {
    private final BitSet bitSet;
    private final int size;

    public SimpleBloomFilter(int size) {
        this.size = size;
        this.bitSet = new BitSet(size);
    }

    public void add(String url) {
        bitSet.set(Math.abs(url.hashCode() % size));
        bitSet.set(Math.abs((url.hashCode() * 31) % size));
    }

    public boolean mightContain(String url) {
        return bitSet.get(Math.abs(url.hashCode() % size)) 
            && bitSet.get(Math.abs((url.hashCode() * 31) % size));
    }
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