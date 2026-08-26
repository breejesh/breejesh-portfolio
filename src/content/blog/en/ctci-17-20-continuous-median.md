---
title: "Continuous Median: Track Streaming Median via Dual Heaps (CTCI 17.20)"
description: "CTCI problem 17.20: track and maintain the median of a numerical data stream using a Max-Heap and Min-Heap."
date: "2025-10-29"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-20-continuous-median.webp
previewImage: /assets/images/ctci-17-20-continuous-median.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.20 technical mechanics.
> * **The Approach:** CTCI problem 17.20: track and maintain the median of a numerical data stream using a Max-Heap and Min-Heap.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.20**: track and maintain the median of a numerical data stream using a Max-Heap and Min-Heap. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.20: track and maintain the median of a numerical data stream using a Max-Heap and Min-Heap.

## 2. Technical Code & Mechanics

```java
public class ContinuousMedian {
    private final PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder()); // Left lower half
    private final PriorityQueue<Integer> minHeap = new PriorityQueue<>(); // Right upper half
    public void insert(int num) {
        if (maxHeap.isEmpty() || num <= maxHeap.peek()) maxHeap.offer(num);
        else minHeap.offer(num);
        if (maxHeap.size() > minHeap.size() + 1) minHeap.offer(maxHeap.poll());
        else if (minHeap.size() > maxHeap.size()) maxHeap.offer(minHeap.poll());
    }
    public double getMedian() {
        if (maxHeap.size() == minHeap.size()) return (maxHeap.peek() + minHeap.peek()) / 2.0;
        return maxHeap.peek();
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.