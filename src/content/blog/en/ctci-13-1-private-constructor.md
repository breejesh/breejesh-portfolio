---
title: "Private Constructor: Inaccessible Constructors & Singleton Pattern in Java (CTCI 13.1)"
description: "CTCI problem 13.1: why and how private constructors are used in Java for Singleton pattern and utility classes."
date: "2025-10-08"
tags: [Algorithms]
coverImage: /assets/images/ctci-13-1-private-constructor.webp
previewImage: /assets/images/ctci-13-1-private-constructor.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 13.1 technical mechanics.
> * **The Approach:** CTCI problem 13.1: why and how private constructors are used in Java for Singleton pattern and utility classes.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **13.1**.

## 1. Context and Problem Statement
CTCI problem 13.1: why and how private constructors are used in Java for Singleton pattern and utility classes.

## 2. Technical Code & Mechanics

```java
public class Singleton {
    private static final Singleton INSTANCE = new Singleton();
    private Singleton() {} // Private constructor prevents instantiation
    public static Singleton getInstance() { return INSTANCE; }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.