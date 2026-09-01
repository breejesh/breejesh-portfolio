---
title: "Bisect Squares: Center-Point Geometry and Dual Area Bisection (CTCI 16.13)"
description: "Compute the exact line cutting two 2D axis-aligned squares in half by connecting their geometric centroids and computing outer boundary intersection points in O(1)."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-13-bisect-squares.webp
previewImage: /assets/images/ctci-16-13-bisect-squares.webp
---

> **TL;DR**
> * **The Book Problem:** Given two squares on a 2D plane (with top and bottom edges parallel to the x-axis), find a line that cuts both squares in half.
> * **The Geometric Breakthrough:** **Dual Centroid Collinearity**:
>   1. Any straight line passing through the exact geometric center (centroid) of a square bisects its area into two equal halves.
>   2. Therefore, the unique line passing through the center of Square 1 ($C_1$) and the center of Square 2 ($C_2$) **simultaneously bisects both squares**.
>   3. **Perimeter Extents**: Calculate the line's intersection points with the outer perimeter boundaries of both squares to return the bounding line segment.
>   4. **Concentric Edge Case**: If $C_1 == C_2$, any line through $C_1$ (e.g., vertical $x = C_1.x$) bisects both.
>   5. Runs in **$O(1)$ time** and **$O(1)$ space**.
> * **Production Reality:** Spatial partitioning in GIS polygon clipping, Voronoi diagrams, and collision boundary slicing in physics engines.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.13), we are asked:

*"Given two axis-aligned squares on a 2D coordinate plane, compute the line segment that cuts both squares exactly in half."*

## 2. Geometric Centroid Mechanics

```
Square 1 (Center C1)                 Square 2 (Center C2)
┌───────────┐                            ┌─────────────────┐
│     • C1  │ ──────── Bisecting Line ───│       • C2      │
└───────────┘                            └─────────────────┘
```

$$C = \left(x_{\text{left}} + \frac{\text{size}}{2}, y_{\text{bottom}} + \frac{\text{size}}{2}\right)$$

Slope $m = \frac{C_2.y - C_1.y}{C_2.x - C_1.x}$. The segment extends from the boundary of the outermost square on one side to the outermost square on the opposite side.

## Production Java Implementation

```java
public class BisectSquares {

    public static class Point {
        public final double x, y;
        public Point(double x, double y) {
            this.x = x;
            this.y = y;
        }

        @Override
        public String toString() {
            return String.format("(%.2f, %.2f)", x, y);
        }
    }

    public static class Square {
        public final double left, right, top, bottom, size;

        public Square(double left, double top, double size) {
            this.left = left;
            this.top = top;
            this.bottom = top - size;
            this.right = left + size;
            this.size = size;
        }

        public Point middle() {
            return new Point(left + size / 2.0, bottom + size / 2.0);
        }

        public Point getIntersection(Point mid, double slope) {
            // Check vertical / horizontal boundaries
            if (slope == Double.POSITIVE_INFINITY || slope == Double.NEGATIVE_INFINITY) {
                return new Point(mid.x, top);
            }

            if (Math.abs(slope) <= 1.0) {
                // Intersects left or right edges
                double x = (mid.x >= this.middle().x) ? right : left;
                double y = slope * (x - mid.x) + mid.y;
                return new Point(x, y);
            } else {
                // Intersects top or bottom edges
                double y = (mid.y >= this.middle().y) ? top : bottom;
                double x = (y - mid.y) / slope + mid.x;
                return new Point(x, y);
            }
        }
    }

    public static class LineSegment {
        public final Point p1;
        public final Point p2;

        public LineSegment(Point p1, Point p2) {
            this.p1 = p1;
            this.p2 = p2;
        }
    }

    public static LineSegment cut(Square sq1, Square sq2) {
        Point c1 = sq1.middle();
        Point c2 = sq2.middle();

        // If centers are identical, vertical line through center works
        if (c1.x == c2.x && c1.y == c2.y) {
            return new LineSegment(new Point(c1.x, sq1.top), new Point(c1.x, sq2.bottom));
        }

        double slope;
        if (c1.x == c2.x) {
            slope = Double.POSITIVE_INFINITY;
        } else {
            slope = (c2.y - c1.y) / (c2.x - c1.x);
        }

        Point p1 = sq1.getIntersection(c1, slope);
        Point p2 = sq2.getIntersection(c2, slope);

        return new LineSegment(p1, p2);
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(1)` | Direct geometric point calculations and slope checks. |
| Auxiliary Space | `O(1)` | Constant memory allocations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Computational Geometry in CAD & GIS

1. **Polygon Bisection in GIS Engines (PostGIS):** Centroid-based cutting lines are used to partition large geospatial land parcels into equal-area zoning sections.
2. **Convex Polygon Centroids:** For general convex polygons, computing the center of mass $\mathbf{C} = \frac{1}{6A} \sum (x_i + x_{i+1})(x_i y_{i+1} - x_{i+1} y_i)$ generalizes this bisection invariant.

## Edge Cases & Production Hardening

1. **Vertical Connecting Lines ($C_1.x = C_2.x$):** Slope is infinite; handled with vertical line bounds $(C_1.x, \text{top})$ and $(C_2.x, \text{bottom})$.
2. **Concentric Squares ($C_1 = C_2$):** Correctly returns a vertical bisecting line.
