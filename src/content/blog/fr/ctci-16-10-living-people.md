---
title: "Living People: Find Year with Maximum Living Population (CTCI 16.10)"
description: "CTCI problem 16.10: find the calendar year with the maximum number of living people using prefix sum array."
date: "2025-11-05"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-10-living-people.webp
previewImage: /assets/images/ctci-16-10-living-people.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.10 technical mechanics.
> * **The Approach:** CTCI problem 16.10: find the calendar year with the maximum number of living people using prefix sum array.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.10**.

## 1. Context and Problem Statement
CTCI problem 16.10: find the calendar year with the maximum number of living people using prefix sum array.

## 2. Technical Code & Mechanics

```java
public static int maxAliveYear(int[][] people, int minYear, int maxYear) {
    int[] deltas = new int[maxYear - minYear + 2];
    for (int[] p : people) {
        deltas[p[0] - minYear]++;
        deltas[p[1] - minYear + 1]--;
    }
    int maxAlive = 0, maxYearIdx = 0, current = 0;
    for (int year = 0; year < deltas.length; year++) {
        current += deltas[year];
        if (current > maxAlive) { maxAlive = current; maxYearIdx = year; }
    }
    return minYear + maxYearIdx;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.