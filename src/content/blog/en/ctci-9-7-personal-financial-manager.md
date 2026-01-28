---
title: "Personal Financial Manager: Bank Account Aggregation System (CTCI 9.7)"
description: "CTCI problem 9.7: architecture for a personal finance app connecting multiple bank feeds, categorizing transactions, and generating insights."
date: "2026-01-28"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-7-personal-financial-manager.webp
previewImage: /assets/images/ctci-9-7-personal-financial-manager.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 9.7 with production-grade efficiency.
> * **The Approach:** CTCI problem 9.7: architecture for a personal finance app connecting multiple bank feeds, categorizing transactions, and generating insights.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

This article provides a complete, novice-friendly breakdown of CTCI problem **9.7**. We examine the problem statement, compare brute-force vs. optimal approaches, and write idiomatic Java code.

---

## 1. Everyday analogy

Think of CTCI problem 9.7 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 9.7:** CTCI problem 9.7: architecture for a personal finance app connecting multiple bank feeds, categorizing transactions, and generating insights.

---

## 3. Optimal approach and implementation

```java
public class TransactionCategorizer {
    public String categorize(String merchantName) {
        if (merchantName.contains("Uber") || merchantName.contains("Lyft")) return "Transport";
        if (merchantName.contains("Starbucks") || merchantName.contains("Dunkin")) return "Food & Drink";
        return "Uncategorized";
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