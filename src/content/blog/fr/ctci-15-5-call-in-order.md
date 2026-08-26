---
title: "Call In Order: Synchronizing Method Execution Sequence (CTCI 15.5)"
description: "CTCI problem 15.5: enforce execution order of first(), second(), third() methods across concurrent threads using CountDownLatch / Semaphores."
date: "2026-06-02"
tags: [Algorithmes et Structures, Backend et Bases de Données]
coverImage: /assets/images/ctci-15-5-call-in-order.webp
previewImage: /assets/images/ctci-15-5-call-in-order.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 15.5 technical mechanics.
> * **The Approach:** CTCI problem 15.5: enforce execution order of first(), second(), third() methods across concurrent threads using CountDownLatch / Semaphores.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **15.5**.

## 1. Context and Problem Statement
CTCI problem 15.5: enforce execution order of first(), second(), third() methods across concurrent threads using CountDownLatch / Semaphores.

## 2. Technical Code & Mechanics

```java
public class Foo {
    private final Semaphore s1 = new Semaphore(0);
    private final Semaphore s2 = new Semaphore(0);

    public void first(Runnable r) { r.run(); s1.release(); }
    public void second(Runnable r) throws InterruptedException { s1.acquire(); r.run(); s2.release(); }
    public void third(Runnable r) throws InterruptedException { s2.acquire(); r.run(); }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.