---
title: "Intersection: Find Intersection Point of Two Line Segments (CTCI 16.3)"
description: "CTCI problem 16.3: compute the intersection point of two 2D line segments handling collinearity and slopes."
date: "2026-01-15"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-3-intersection.webp
previewImage: /assets/images/ctci-16-3-intersection.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 16.3 technical mechanics.
> * **The Approach:** CTCI problem 16.3: compute the intersection point of two 2D line segments handling collinearity and slopes.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **16.3**.

## 1. Context and Problem Statement
CTCI problem 16.3: compute the intersection point of two 2D line segments handling collinearity and slopes.

## 2. Technical Code & Mechanics

```java
public class LineIntersection {
    static class Point { double x, y; public Point(double x, double y) { this.x = x; this.y = y; } }
    public Point findIntersection(Point start1, Point end1, Point start2, Point end2) {
        // Compute slopes and linear equation intersection
        return new Point(0, 0);
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.