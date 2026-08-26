---
title: "Operations: Implement Multiply, Subtract, Divide Using Only Addition (CTCI 16.9)"
description: "CTCI problem 16.9: write arithmetic operations (multiply, subtract, divide) for integers using only addition and bitwise ops."
date: "2025-09-07"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-9-operations.webp
previewImage: /assets/images/ctci-16-9-operations.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.9 technical mechanics.
> * **The Approach:** CTCI problem 16.9: write arithmetic operations (multiply, subtract, divide) for integers using only addition and bitwise ops.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **16.9**: write arithmetic operations (multiply, subtract, divide) for integers using only addition and bitwise ops. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 16.9: write arithmetic operations (multiply, subtract, divide) for integers using only addition and bitwise ops.

## 2. Technical Code & Mechanics

```java
public static int minus(int a, int b) { return a + negate(b); }
private static int negate(int a) {
    int neg = 0;
    int d = a < 0 ? 1 : -1;
    while (a != 0) { neg += d; a += d; }
    return neg;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.