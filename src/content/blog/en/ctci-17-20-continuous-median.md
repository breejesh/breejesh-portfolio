---
title: "Continuous Median: Dual-Heap Streaming Median Maintenance (CTCI 17.20)"
description: "Maintain the running median of a live data stream in O(log N) per insertion and O(1) per query using a max-heap for the lower half and min-heap for the upper half."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-20-continuous-median.webp
previewImage: /assets/images/ctci-17-20-continuous-median.webp
---

> **TL;DR**
> * **The Book Problem:** You are receiving a stream of numbers. After each number is received, compute the median of all numbers seen so far.
> * **The Optimal Solution:** **Dual-Heap (Lower Max-Heap + Upper Min-Heap)**:
>   1. Maintain two heaps: `lower` (Max-Heap for the smaller half) and `upper` (Min-Heap for the larger half).
>   2. **Balance Invariant**: `lower.size() == upper.size()` or `lower.size() == upper.size() + 1`.
>   3. **Insert**: Route new number to the correct heap, then rebalance if sizes differ by more than 1.
>   4. **Query**: If even count, median = `(lower.top() + upper.top()) / 2.0`. If odd, median = `lower.top()`.
>   5. **$O(\log N)$ insert**, **$O(1)$ query**.
> * **Production Reality:** Median latency tracking in Prometheus/Grafana dashboards, real-time network RTT anomaly detection, and financial market tick-by-tick P50 latency.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.20), we are asked:

*"Numbers are randomly generated and passed to a method. Write a program to find and maintain the median value as new values are generated."*

## 2. Dual-Heap Partition Invariant

```
Stream: [5, 2, 4, 1, 7]

After 5:   lower=[5]      upper=[]       median=5
After 2:   lower=[2]      upper=[5]      median=(2+5)/2=3.5
After 4:   lower=[2,4]    upper=[5]      median=4
After 1:   lower=[1,2]    upper=[4,5]    median=(2+4)/2=3.0
After 7:   lower=[1,2,4]  upper=[5,7]    median=4
```

## Production Java Implementation

```java
import java.util.*;

public class ContinuousMedian {

    private final PriorityQueue<Integer> lower = new PriorityQueue<>(Collections.reverseOrder()); // Max-Heap
    private final PriorityQueue<Integer> upper = new PriorityQueue<>(); // Min-Heap

    public void addNumber(int num) {
        if (lower.isEmpty() || num <= lower.peek()) {
            lower.add(num);
        } else {
            upper.add(num);
        }
        rebalance();
    }

    private void rebalance() {
        if (lower.size() > upper.size() + 1) {
            upper.add(lower.poll());
        } else if (upper.size() > lower.size()) {
            lower.add(upper.poll());
        }
    }

    public double getMedian() {
        if (lower.isEmpty()) throw new IllegalStateException("No numbers added yet.");
        if (lower.size() == upper.size()) {
            return (lower.peek() + upper.peek()) / 2.0;
        }
        return lower.peek();
    }
}
```

## Complexity Analysis

| Operation | Complexity | Detail |
|---|---|---|
| `addNumber()` | $O(\log N)$ | Heap insertion and at most one rebalance poll. |
| `getMedian()` | $O(1)$ | Peek at heap tops. |
| Space | $O(N)$ | Both heaps combined store all N elements. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Streaming Percentile Metrics

1. **Prometheus / Grafana P50 Latency:** Streaming median computation feeds live SLO dashboards, signaling degraded API response percentiles without buffering the full distribution.
2. **Financial Market Tick Analytics:** Real-time order book median price computation for algorithmic trading strategies that trigger on median-crossing signals.

## Edge Cases & Production Hardening

1. **Empty Stream:** Guard with `IllegalStateException` before first query.
2. **Duplicate Values:** Both heaps handle duplicates naturally; routing direction is stable.
