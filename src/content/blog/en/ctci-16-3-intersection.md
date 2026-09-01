---
title: "Intersection: 2D Line Segment Intersection in Computational Geometry (CTCI 16.3)"
description: "Compute the exact intersection point of two 2D line segments, detailing vector cross products, Cramer's rule, and collinear overlap handling."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-3-intersection.webp
previewImage: /assets/images/ctci-16-3-intersection.webp
---

> **TL;DR**
> * **The Book Problem:** Given two straight line segments (each represented as a start point and an end point), compute the point of intersection, if any.
> * **The Optimal Solution:** **Linear Algebra Determinants (Cramer's Rule) + Bounding Box Containment**:
>   1. **Standard Line Form**: Convert lines to $A_1 x + B_1 y = C_1$ and $A_2 x + B_2 y = C_2$.
>   2. **Determinant ($\Delta$)**: $\Delta = (x_1 - x_2)(y_3 - y_4) - (y_1 - y_2)(x_3 - x_4)$.
>   3. **Parallel / Collinear Lines ($\Delta = 0$)**: Check if lines share the same $y$-intercept. If collinear, check for overlapping interval ranges; return the earliest overlapping endpoint. If parallel and disjoint, return `null`.
>   4. **Intersecting Infinite Lines ($\Delta \neq 0$)**: Solve for $(x, y)$ using 2D Cramer's determinant rule.
>   5. **Segment Range Check**: Verify that $(x, y)$ lies within the 2D bounding boxes of **both** line segments.
>   6. Runs in **$O(1)$ time** and **$O(1)$ space**.
> * **Production Reality:** Ray tracing rasterization in game engines (Unreal/Unity), GIS spatial indexing (PostGIS / R-Trees), and CAD polygon clipping algorithms.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.3), we are asked:

*"Given two line segments represented by Point start1, end1 and Point start2, end2, calculate the exact 2D intersection point, accounting for parallel, perpendicular, and collinear segments."*

## 2. Mathematical Vector Form & Cramer's Rule

```
Segment 1: (x1, y1) ─────── (x, y) ──────── (x2, y2)
                                 │
Segment 2: (x3, y3) ─────────────┼───────── (x4, y4)
```

$$\Delta = (x_1 - x_2)(y_3 - y_4) - (y_1 - y_2)(x_3 - x_4)$$

$$x = \frac{(x_1 y_2 - y_1 x_2)(x_3 - x_4) - (x_1 - x_2)(x_3 y_4 - y_3 x_4)}{\Delta}$$
$$y = \frac{(x_1 y_2 - y_1 x_2)(y_3 - y_4) - (y_1 - y_2)(x_3 y_4 - y_3 x_4)}{\Delta}$$

## Production Java Implementation

```java
public class LineIntersection {

    public static class Point {
        public final double x, y;
        public Point(double x, double y) {
            this.x = x;
            this.y = y;
        }

        @Override
        public String toString() {
            return String.format("(%.4f, %.4f)", x, y);
        }
    }

    public static Point intersection(Point p1, Point p2, Point p3, Point p4) {
        // Line 1 coefficients: A1*x + B1*y = C1
        double a1 = p2.y - p1.y;
        double b1 = p1.x - p2.x;
        double c1 = a1 * p1.x + b1 * p1.y;

        // Line 2 coefficients: A2*x + B2*y = C2
        double a2 = p4.y - p3.y;
        double b2 = p3.x - p4.x;
        double c2 = a2 * p3.x + b2 * p3.y;

        double delta = a1 * b2 - a2 * b1;
        double epsilon = 1e-9;

        // Case 1: Parallel or Collinear Lines (Delta ~ 0)
        if (Math.abs(delta) < epsilon) {
            // Check if collinear: p3 satisfies Line 1 equation
            if (Math.abs(a1 * p3.x + b1 * p3.y - c1) < epsilon) {
                // Find overlap interval on x (or y if vertical)
                return getCollinearOverlap(p1, p2, p3, p4);
            }
            return null; // Parallel and separate
        }

        // Case 2: Non-Parallel Lines - Compute theoretical intersection
        double intersectX = (b2 * c1 - b1 * c2) / delta;
        double intersectY = (a1 * c2 - a2 * c1) / delta;
        Point intersection = new Point(intersectX, intersectY);

        // Verify point lies within both segments' bounding boxes
        if (isBetween(p1, intersection, p2) && isBetween(p3, intersection, p4)) {
            return intersection;
        }

        return null;
    }

    private static boolean isBetween(Point start, Point middle, Point end) {
        double epsilon = 1e-9;
        return middle.x >= Math.min(start.x, end.x) - epsilon &&
               middle.x <= Math.max(start.x, end.x) + epsilon &&
               middle.y >= Math.min(start.y, end.y) - epsilon &&
               middle.y <= Math.max(start.y, end.y) + epsilon;
    }

    private static Point getCollinearOverlap(Point p1, Point p2, Point p3, Point p4) {
        // Sort endpoints by X, then Y
        Point left1 = (p1.x < p2.x || (p1.x == p2.x && p1.y < p2.y)) ? p1 : p2;
        Point right1 = (left1 == p1) ? p2 : p1;
        Point left2 = (p3.x < p4.x || (p3.x == p4.x && p3.y < p4.y)) ? p3 : p4;
        Point right2 = (left2 == p3) ? p4 : p3;

        // Overlap exists if left2 is within [left1, right1]
        if (isBetween(left1, left2, right1)) {
            return left2;
        }
        if (isBetween(left2, left1, right2)) {
            return left1;
        }
        return null; // Disjoint collinear segments
    }
}
```

## Complexity & Geometric Case Analysis

| Geometric Scenario | Determinant $\Delta$ | Outcome | Complexity |
|---|---|---|---|
| **Single Intersection** | $\Delta \neq 0$ | Point $(x, y)$ inside bounding boxes | $O(1)$ time, $O(1)$ space |
| **Non-Intersecting Crossing** | $\Delta \neq 0$ | Point $(x, y)$ outside bounding boxes | $O(1)$ time, $O(1)$ space |
| **Parallel Disjoint** | $\Delta = 0$ | `null` | $O(1)$ time, $O(1)$ space |
| **Collinear Overlapping** | $\Delta = 0$ | Overlap start point | $O(1)$ time, $O(1)$ space |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Robust Geometric Computing

1. **Floating-Point Epsilon Tolerances:** Direct comparisons (`x == y`) fail in floating-point math due to IEEE 754 precision drift. Robust geometric libraries (CGAL / JTS Topology Suite) use strict $\epsilon$-thresholds (`Math.abs(a - b) < 1e-9`) or exact rational arithmetic (`BigRational`).
2. **Spatial Index Filtering (R-Trees):** Before performing exact line intersection tests on millions of map vectors, GIS engines run fast Bounding Box intersection filters (Minimum Bounding Rectangles - MBR) using spatial R-Trees.

## Edge Cases & Production Hardening

1. **Vertical Line Segments:** $x_1 = x_2$ results in infinite slope $m$; standard form $A x + B y = C$ handles vertical lines cleanly without division-by-zero errors.
2. **Point-Sized Segments ($P_1 = P_2$):** Correctly evaluated as point containment.
