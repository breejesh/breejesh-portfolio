---
title: "Social Network: Find Shortest Connection Paths at Scale (CTCI 9.2)"
description: "CTCI problem 9.2: design a distributed system to calculate degree of separation and shortest paths between two users in a billion-node social graph."
date: "2026-04-26"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-2-social-network.webp
previewImage: /assets/images/ctci-9-2-social-network.webp
---


> **TL;DR**
> * **The Problem:** Mastering CTCI problem 9.2 with production-grade efficiency.
> * **The Approach:** CTCI problem 9.2: design a distributed system to calculate degree of separation and shortest paths between two users in a billion-node social graph.
> * **Complexity:** Optimal Time and Space complexity trade-offs.

You walk into an interview and get handed problem **9.2**: design a distributed system to calculate degree of separation and shortest paths between two users in a billion-node social graph. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

---

## 1. Everyday analogy

Think of CTCI problem 9.2 like organizing items efficiently in real life. When managing large volumes of elements, choosing the right data structure eliminates redundant iterations.

---

## 2. Plain problem statement

**Problem 9.2:** CTCI problem 9.2: design a distributed system to calculate degree of separation and shortest paths between two users in a billion-node social graph.

---

## 3. Optimal approach and implementation

```java
public class BidirectionalBreadthFirstSearch {
    public List<Long> findShortestPath(Map<Long, List<Long>> graph, long source, long target) {
        Queue<Long> qSource = new LinkedList<>(), qTarget = new LinkedList<>();
        Map<Long, Long> parentsSource = new HashMap<>(), parentsTarget = new HashMap<>();

        qSource.add(source); parentsSource.put(source, null);
        qTarget.add(target); parentsTarget.put(target, null);

        while (!qSource.isEmpty() && !qTarget.isEmpty()) {
            Long intersect = searchLevel(graph, qSource, parentsSource, parentsTarget);
            if (intersect != null) return mergePaths(parentsSource, parentsTarget, intersect);
            intersect = searchLevel(graph, qTarget, parentsTarget, parentsSource);
            if (intersect != null) return mergePaths(parentsSource, parentsTarget, intersect);
        }
        return Collections.emptyList();
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