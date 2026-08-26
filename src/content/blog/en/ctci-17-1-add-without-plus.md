---
title: "Add Without Plus: Arithmetic Addition via Bitwise XOR and AND (CTCI 17.1)"
description: "CTCI problem 17.1: add two numbers without using + or any arithmetic operators using bitwise XOR for sum and bitwise AND for carry."
date: "2026-02-21"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-1-add-without-plus.webp
previewImage: /assets/images/ctci-17-1-add-without-plus.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.1 technical mechanics.
> * **The Approach:** CTCI problem 17.1: add two numbers without using + or any arithmetic operators using bitwise XOR for sum and bitwise AND for carry.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.1**: add two numbers without using + or any arithmetic operators using bitwise XOR for sum and bitwise AND for carry. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.1: add two numbers without using + or any arithmetic operators using bitwise XOR for sum and bitwise AND for carry.

## 2. Technical Code & Mechanics

```java
public static int add(int a, int b) {
    while (b != 0) {
        int sum = a ^ b; // Sum without carry
        int carry = (a & b) << 1; // Carry shifted left
        a = sum;
        b = carry;
    }
    return a;
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.