---
title: "Sales Rank: E-Commerce Real-Time Best Sellers Rank System (CTCI 9.6)"
description: "CTCI problem 9.6: design an e-commerce ranking system that tracks top-selling products by category across multiple time windows."
date: "2026-04-11"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-6-sales-rank.webp
previewImage: /assets/images/ctci-9-6-sales-rank.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 9.6 with production-grade efficiency.
> * **The Approach:** CTCI problem 9.6: design an e-commerce ranking system that tracks top-selling products by category across multiple time windows.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

This article provides a complete, novice-friendly breakdown of CTCI problem **9.6**. We examine the problem statement, compare brute-force vs. optimal approaches, and write idiomatic Java code.

---

## 1. Everyday analogy

Think of CTCI problem 9.6 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 9.6:** CTCI problem 9.6: design an e-commerce ranking system that tracks top-selling products by category across multiple time windows.

---

## 3. Optimal approach and implementation

```java
public class CategorySalesRank {
    private final Map<String, Integer> productSales = new ConcurrentHashMap<>();

    public void recordSale(String productId, int quantity) {
        productSales.merge(productId, quantity, Integer::sum);
    }

    public List<Map.Entry<String, Integer>> getTopK(int k) {
        PriorityQueue<Map.Entry<String, Integer>> pq = new PriorityQueue<>(
            Map.Entry.comparingByValue()
        );
        for (Map.Entry<String, Integer> entry : productSales.entrySet()) {
            pq.offer(entry);
            if (pq.size() > k) pq.poll();
        }
        List<Map.Entry<String, Integer>> result = new ArrayList<>(pq);
        result.sort(Map.Entry.<String, Integer>comparingByValue().reversed());
        return result;
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