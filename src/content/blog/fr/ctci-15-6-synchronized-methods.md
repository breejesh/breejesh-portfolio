---
title: "Synchronized Methods: Java Object Locks & Class Locks (CTCI 15.6)"
description: "CTCI problem 15.6: understanding thread blocking behavior between synchronized instance methods vs static class methods in Java."
date: "2026-03-14"
tags: [Algorithmes et Structures, Backend et Bases de Données]
coverImage: /assets/images/ctci-15-6-synchronized-methods.webp
previewImage: /assets/images/ctci-15-6-synchronized-methods.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 15.6 technical mechanics.
> * **The Approach:** CTCI problem 15.6: understanding thread blocking behavior between synchronized instance methods vs static class methods in Java.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **15.6**.

## 1. Context and Problem Statement
CTCI problem 15.6: understanding thread blocking behavior between synchronized instance methods vs static class methods in Java.

## 2. Technical Code & Mechanics

```java
public synchronized void methodA() {} // Locks on 'this'
public static synchronized void methodB() {} // Locks on 'Foo.class'
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.