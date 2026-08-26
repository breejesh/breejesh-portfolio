---
title: "The Masseuse: Maximize Non-Adjacent Appointment Minutes (CTCI 17.16)"
description: "CTCI problem 17.16: optimal dynamic programming allocation of appointments with mandatory 15-min break between bookings."
date: "2026-06-01"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-16-the-masseuse.webp
previewImage: /assets/images/ctci-17-16-the-masseuse.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.16 technical mechanics.
> * **The Approach:** CTCI problem 17.16: optimal dynamic programming allocation of appointments with mandatory 15-min break between bookings.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **17.16**.

## 1. Context and Problem Statement
CTCI problem 17.16: optimal dynamic programming allocation of appointments with mandatory 15-min break between bookings.

## 2. Technical Code & Mechanics

```java
public static int maxMinutes(int[] requests) {
    int oneAway = 0, twoAway = 0;
    for (int i = requests.length - 1; i >= 0; i--) {
        int bestWith = requests[i] + twoAway;
        int bestWithout = oneAway;
        int current = Math.max(bestWith, bestWithout);
        twoAway = oneAway;
        oneAway = current;
    }
    return oneAway;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.