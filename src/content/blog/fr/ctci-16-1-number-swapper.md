---
title: "Number Swapper: Swap Two Numbers In-Place Without Temporary Variables (CTCI 16.1)"
description: "CTCI problem 16.1: swap two numbers in-place using arithmetic addition/subtraction or bitwise XOR logic."
date: "2026-03-21"
tags: [Algorithms]
coverImage: /assets/images/ctci-16-1-number-swapper.webp
previewImage: /assets/images/ctci-16-1-number-swapper.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.1 technical mechanics.
> * **The Approach:** CTCI problem 16.1: swap two numbers in-place using arithmetic addition/subtraction or bitwise XOR logic.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.1**.

## 1. Context and Problem Statement
CTCI problem 16.1: swap two numbers in-place using arithmetic addition/subtraction or bitwise XOR logic.

## 2. Technical Code & Mechanics

```java
public static void swap(int a, int b) {
    a = a ^ b;
    b = a ^ b;
    a = a ^ b;
    System.out.println("a: " + a + ", b: " + b);
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.