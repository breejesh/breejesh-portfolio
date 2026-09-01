---
title: "Best Line: Maximum Collinear Points via Exact Slope Hashing (CTCI 16.14)"
description: "Find the 2D straight line passing through the maximum number of points using slope hashing, GCD reduced rational fractions, and O(N^2) pairwise analysis."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-14-best-line.webp
previewImage: /assets/images/ctci-16-14-best-line.webp
---

> **TL;DR**
> * **The Book Problem:** Given a 2D graph with points on it, find a straight line that passes through the most number of points.
> * **The Optimal Solution:** **Exact Rational Slope Hashing**:
>   1. **The Floating-Point Trap**: Hashing floating-point slopes (`double slope = dy / dx`) causes hash collisions and precision drift under IEEE 754 floating-point math.
>   2. **Exact Rational Representation**: Represent slope as a simplified fraction $\frac{\Delta y}{\Delta x} = \frac{dy / \gcd(dx, dy)}{dx / \gcd(dx, dy)}$ normalized with a positive denominator.
>   3. **Anchor Iteration**: For each anchor point $P_i$, compute slopes to all other points $P_j$ ($j > i$) and store counts in a `HashMap<RationalSlope, Integer>`.
>   4. **Track Maximum**: Record the line that accumulates the maximum collinear count across all anchors.
>   5. Runs in **$O(N^2)$ time** and **$O(N)$ auxiliary space**.
> * **Production Reality:** Computer vision feature detection (Hough Transform for line extraction), LiDAR point-cloud planar fitting (RANSAC), and astronomical star constellation alignment.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.14), we are asked:

*"Given an array of 2D coordinates (Point[] points), identify the line that intersects the maximum number of collinear points."*

## 2. Rational Slope Hashing Pipeline

```
Anchor Point P1 (2, 3)
  ├──> P2 (4, 7)  ──> dy = 4, dx = 2 ──> gcd=2 ──> Slope Fraction (2 / 1)
  ├──> P3 (6, 11) ──> dy = 8, dx = 4 ──> gcd=4 ──> Slope Fraction (2 / 1)  [Count = 3!]
  └──> P4 (5, 2)  ──> dy = -1, dx = 3 ──> gcd=1 ──> Slope Fraction (-1 / 3) [Count = 2]
```

## Production Java Implementation

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class BestLine {

    public static class Point {
        public final int x, y;
        public Point(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }

    public static class SlopeFraction {
        public final int dy;
        public final int dx;

        public SlopeFraction(int dy, int dx) {
            if (dx == 0) { // Vertical line
                this.dy = 1;
                this.dx = 0;
            } else if (dy == 0) { // Horizontal line
                this.dy = 0;
                this.dx = 1;
            } else {
                int g = gcd(Math.abs(dy), Math.abs(dx));
                int sign = (dx < 0) ? -1 : 1; // Normalize denominator to be non-negative
                this.dy = (dy / g) * sign;
                this.dx = (dx / g) * sign;
            }
        }

        private static int gcd(int a, int b) {
            while (b != 0) {
                int temp = b;
                b = a % b;
                a = temp;
            }
            return a;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SlopeFraction)) return false;
            SlopeFraction that = (SlopeFraction) o;
            return dy == that.dy && dx == that.dx;
        }

        @Override
        public int hashCode() {
            return Objects.hash(dy, dx);
        }
    }

    public static int findBestLine(Point[] points) {
        if (points == null || points.length == 0) return 0;
        if (points.length <= 2) return points.length;

        int maxCollinear = 0;

        for (int i = 0; i < points.length; i++) {
            Map<SlopeFraction, Integer> slopeCounts = new HashMap<>();
            int duplicates = 1;
            int localMax = 0;

            for (int j = i + 1; j < points.length; j++) {
                int dx = points[j].x - points[i].x;
                int dy = points[j].y - points[i].y;

                if (dx == 0 && dy == 0) {
                    duplicates++;
                    continue;
                }

                SlopeFraction slope = new SlopeFraction(dy, dx);
                int count = slopeCounts.getOrDefault(slope, 0) + 1;
                slopeCounts.put(slope, count);
                localMax = Math.max(localMax, count);
            }

            maxCollinear = Math.max(maxCollinear, localMax + duplicates);
        }

        return maxCollinear;
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N^2)` | $N(N-1)/2$ pairwise slope calculations with $O(\log(\min(dx, dy)))$ GCD. |
| Auxiliary Space | `O(N)` | Per-anchor hash map storing at most $N$ unique slope fractions. |
| Precision Guarantee | `100% Exact` | Uses integer GCD arithmetic, eliminating floating-point drift. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Computer Vision & LiDAR Fitting

1. **Hough Transform in Image Processing (OpenCV):** Detects lines in edge-detected raster images by mapping pixels into a parameterized accumulator space $(\rho, \theta) = x \cos \theta + y \sin \theta$.
2. **RANSAC Robust Plane Estimation:** In autonomous vehicle LiDAR point clouds with $500,000$ points, finding planar road surfaces uses randomized sample consensus (RANSAC) rather than deterministic $O(N^2)$ scans.

## Edge Cases & Production Hardening

1. **Duplicate Points ($P_i = P_j$):** Tracked via explicit `duplicates` counter, adding to the anchor's collinear total.
2. **Vertical Lines ($dx = 0$):** Canonicalized cleanly as $(1, 0)$ without division-by-zero exceptions.
