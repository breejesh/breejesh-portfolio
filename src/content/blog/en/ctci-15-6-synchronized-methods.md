---
title: "Synchronized Methods: Java Object Locks & Class Locks (CTCI 15.6)"
description: "CTCI problem 15.6: understanding thread blocking behavior between synchronized instance methods vs static class methods in Java."
date: "2026-03-14"
tags: [Algorithms & Data Structures, Backend & Databases]
coverImage: /assets/images/ctci-15-6-synchronized-methods.webp
previewImage: /assets/images/ctci-15-6-synchronized-methods.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 15.6 technical mechanics.
> * **The Approach:** CTCI problem 15.6: understanding thread blocking behavior between synchronized instance methods vs static class methods in Java.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **15.6**: understanding thread blocking behavior between synchronized instance methods vs static class methods in Java. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 15.6: understanding thread blocking behavior between synchronized instance methods vs static class methods in Java.

## 2. Technical Code & Mechanics

```java
public synchronized void methodA() {} // Locks on 'this'
public static synchronized void methodB() {} // Locks on 'Foo.class'
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.