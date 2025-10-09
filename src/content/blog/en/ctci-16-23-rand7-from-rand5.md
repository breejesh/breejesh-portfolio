---
title: "Rand7 from Rand5: Implement Random Number Generator 1 to 7 (CTCI 16.23)"
description: "CTCI problem 16.23: generate uniform random number from 1 to 7 using only a rand5() random generator."
date: "2025-10-09"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-23-rand7-from-rand5.webp
previewImage: /assets/images/ctci-16-23-rand7-from-rand5.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.23 technical mechanics.
> * **The Approach:** CTCI problem 16.23: generate uniform random number from 1 to 7 using only a rand5() random generator.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.23**.

## 1. Context and Problem Statement
CTCI problem 16.23: generate uniform random number from 1 to 7 using only a rand5() random generator.

## 2. Technical Code & Mechanics

```java
public static int rand7() {
    while (true) {
        int num = 5 * rand5() + rand5(); // 0 to 24 uniform
        if (num < 21) return num % 7;
    }
}
private static int rand5() { return (int)(Math.random() * 5); }
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.