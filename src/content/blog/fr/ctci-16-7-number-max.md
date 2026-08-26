---
title: "Number Max: Find Maximum of Two Numbers Without Comparison Operators (CTCI 16.7)"
description: "CTCI problem 16.7: find maximum of two integers without using if-else or comparison operators using bitwise sign shift."
date: "2026-01-03"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-7-number-max.webp
previewImage: /assets/images/ctci-16-7-number-max.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.7 technical mechanics.
> * **The Approach:** CTCI problem 16.7: find maximum of two integers without using if-else or comparison operators using bitwise sign shift.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.7**.

## 1. Context and Problem Statement
CTCI problem 16.7: find maximum of two integers without using if-else or comparison operators using bitwise sign shift.

## 2. Technical Code & Mechanics

```java
public static int getMax(int a, int b) {
    int k = sign(a - b);
    int q = flip(k);
    return a * k + b * q;
}
private static int sign(int a) { return flip((a >> 31) & 0x1); }
private static int flip(int bit) { return 1 ^ bit; }
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.