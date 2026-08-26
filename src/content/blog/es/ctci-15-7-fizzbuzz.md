---
title: "FizzBuzz: Multi-Threaded Concurrent FizzBuzz in Java (CTCI 15.7)"
description: "CTCI problem 15.7: multi-threaded FizzBuzz using 4 concurrent threads for numbers divisible by 3, 5, 15, and others."
date: "2026-03-19"
tags: [Algoritmos y Estructuras, Backend y Bases de Datos]
coverImage: /assets/images/ctci-15-7-fizzbuzz.webp
previewImage: /assets/images/ctci-15-7-fizzbuzz.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 15.7 technical mechanics.
> * **The Approach:** CTCI problem 15.7: multi-threaded FizzBuzz using 4 concurrent threads for numbers divisible by 3, 5, 15, and others.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **15.7**.

## 1. Context and Problem Statement
CTCI problem 15.7: multi-threaded FizzBuzz using 4 concurrent threads for numbers divisible by 3, 5, 15, and others.

## 2. Technical Code & Mechanics

```java
public class MultithreadedFizzBuzz {
    private int n;
    private int current = 1;
    public synchronized void fizz() throws InterruptedException {
        while (current <= n) {
            if (current % 3 == 0 && current % 5 != 0) {
                System.out.println("Fizz");
                current++;
                notifyAll();
            } else wait();
        }
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.