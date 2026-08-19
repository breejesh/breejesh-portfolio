---
title: "Rank from Stream: Track Stream Rank of Number in Real-Time (CTCI 10.10)"
description: "CTCI problem 10.10 in Java: design a Binary Search Tree with left subtree size tracking to efficiently compute rank of a number in a stream."
date: "2026-01-18"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-10-rank-from-stream.webp
previewImage: /assets/images/ctci-10-10-rank-from-stream.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 10.10 with production-grade efficiency.
> * **The Approach:** CTCI problem 10.10 in Java: design a Binary Search Tree with left subtree size tracking to efficiently compute rank of a number in a stream.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

You walk into an interview and get handed problem **10.10**: design a Binary Search Tree with left subtree size tracking to efficiently compute rank of a number in a stream. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

---

## 1. Everyday analogy

Think of CTCI problem 10.10 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 10.10:** CTCI problem 10.10 in Java: design a Binary Search Tree with left subtree size tracking to efficiently compute rank of a number in a stream.

---

## 3. Optimal approach and implementation

```java
public class RankNode {
    public int leftSize = 0;
    public RankNode left, right;
    public int data = 0;

    public RankNode(int d) { this.data = d; }

    public void insert(int d) {
        if (d <= data) {
            if (left != null) left.insert(d);
            else left = new RankNode(d);
            leftSize++;
        } else {
            if (right != null) right.insert(d);
            else right = new RankNode(d);
        }
    }

    public int getRank(int d) {
        if (d == data) return leftSize;
        else if (d < data) {
            if (left == null) return -1;
            return left.getRank(d);
        } else {
            int rightRank = (right == null) ? -1 : right.getRank(d);
            if (rightRank == -1) return -1;
            return leftSize + 1 + rightRank;
        }
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