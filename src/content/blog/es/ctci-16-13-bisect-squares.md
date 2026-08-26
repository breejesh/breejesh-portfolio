---
title: "Bisect Squares: Find Line Bisecting Two Squares in 2D Space (CTCI 16.13)"
description: "CTCI problem 16.13: compute the 2D line equation that cuts two arbitrary squares in half by connecting their center points."
date: "2025-09-15"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-13-bisect-squares.webp
previewImage: /assets/images/ctci-16-13-bisect-squares.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.13 technical mechanics.
> * **The Approach:** CTCI problem 16.13: compute the 2D line equation that cuts two arbitrary squares in half by connecting their center points.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.13**.

## 1. Context and Problem Statement
CTCI problem 16.13: compute the 2D line equation that cuts two arbitrary squares in half by connecting their center points.

## 2. Technical Code & Mechanics

```java
public class SquareBisector {
    static class Square { double x, y, width; public double[] center() { return new double[]{x + width/2, y + width/2}; } }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.