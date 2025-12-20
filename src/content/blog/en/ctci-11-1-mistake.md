---
title: "Mistake: Debugging an Unsigned Loop Bug in C/Java (CTCI 11.1)"
description: "CTCI problem 11.1: find the flaw in an unsigned integer countdown loop causing an infinite execution bug."
date: "2025-12-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-11-1-mistake.webp
previewImage: /assets/images/ctci-11-1-mistake.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 11.1 technical mechanics.
> * **The Approach:** CTCI problem 11.1: find the flaw in an unsigned integer countdown loop causing an infinite execution bug.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **11.1**.

## 1. Context and Problem Statement
CTCI problem 11.1: find the flaw in an unsigned integer countdown loop causing an infinite execution bug.

## 2. Technical Code & Mechanics

```java
void printCountdown() {
    unsigned int i;
    for (i = 100; i >= 0; --i) {
        printf("%d\n", i); // Flaw: i >= 0 is always true for unsigned int!
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.