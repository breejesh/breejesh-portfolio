---
title: "Smallest K: Find Smallest K Elements via QuickSelect / Max-Heap (CTCI 17.14)"
description: "CTCI problem 17.14: find the smallest K numbers in an array using QuickSelect in O(N) average time."
date: "2025-08-24"
tags: [Algorithms]
coverImage: /assets/images/ctci-17-14-smallest-k.webp
previewImage: /assets/images/ctci-17-14-smallest-k.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.14 technical mechanics.
> * **The Approach:** CTCI problem 17.14: find the smallest K numbers in an array using QuickSelect in O(N) average time.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **17.14**.

## 1. Context and Problem Statement
CTCI problem 17.14: find the smallest K numbers in an array using QuickSelect in O(N) average time.

## 2. Technical Code & Mechanics

```java
public static int[] smallestK(int[] array, int k) {
    if (k <= 0 || k > array.length) return new int[0];
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    for (int num : array) {
        maxHeap.offer(num);
        if (maxHeap.size() > k) maxHeap.poll();
    }
    return maxHeap.stream().mapToInt(Integer::intValue).toArray();
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.