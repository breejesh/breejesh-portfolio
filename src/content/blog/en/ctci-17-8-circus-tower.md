---
title: "Circus Tower: Longest Increasing Subsequence for Height and Weight (CTCI 17.8)"
description: "CTCI problem 17.8: build tallest human tower where each person is shorter and lighter than the person below."
date: "2026-04-12"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-8-circus-tower.webp
previewImage: /assets/images/ctci-17-8-circus-tower.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 17.8 technical mechanics.
> * **The Approach:** CTCI problem 17.8: build tallest human tower where each person is shorter and lighter than the person below.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **17.8**: build tallest human tower where each person is shorter and lighter than the person below. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 17.8: build tallest human tower where each person is shorter and lighter than the person below.

## 2. Technical Code & Mechanics

```java
public class CircusTower {
    static class Person implements Comparable<Person> {
        int height, weight;
        public int compareTo(Person o) { return this.height != o.height ? Integer.compare(this.height, o.height) : Integer.compare(this.weight, o.weight); }
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.