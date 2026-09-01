---
title: "Robot in a Grid: Maze Pathfinding with Memoized Backtracking (CTCI 8.2)"
description: "Find a path for a robot moving right and down through an r x c grid with off-limit obstacle cells using memoized DFS backtracking in O(R * C) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
previewImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
---

> **TL;DR**
> * **The Book Problem:** Imagine a robot sitting on the upper left corner of a grid with $r$ rows and $c$ columns. The robot can only move in two directions, right and down, but certain cells are "off limits" (obstacles). Design an algorithm to find a path for the robot from the top-left to the bottom-right.
> * **The Optimal Solution:** Memoized Reverse DFS / Backtracking: (1) Search backwards from destination $(r-1, c-1)$ to origin $(0, 0)$; (2) At each point $(row, col)$, if at origin or a path exists from $(row-1, col)$ or $(row, col-1)$, add $(row, col)$ to the result list; (3) Maintain a `HashSet<Point> failedPoints` to cache visited coordinates that cannot reach the origin, cutting runtime from $O(2^{R+C})$ down to strictly **$O(R \times C)$ time** and **$O(R + C)$ recursion stack space**.
> * **Production Reality:** Autonomous mobile robot (AMR) warehouse route planning (Amazon Kiva), VLSI Manhattan wire routing, and maze navigation search heuristics ($A^*$).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.2), we are asked:

*"Imagine a robot sitting on the upper left corner of grid with r rows and c columns. The robot can only move in two directions, right and down, but certain cells are 'off limits' such that the robot cannot step on them. Design an algorithm to find a path for the robot from the top left to the bottom right."*

## 2. Dynamic Programming & Failed Points Pruning

Without memoization, overlapping subproblems cause paths to branch exponentially ($O(2^{R+C})$).

### Why Search in Reverse?
Starting the recursive search at $(r - 1, c - 1)$ and moving toward $(0, 0)$ allows us to append points naturally to an `ArrayList` in chronological start-to-finish order as the recursion unwinds.

### The Memoization Cache: `failedPoints`
If we visit a point $(r, c)$ and discover neither moving up to $(r-1, c)$ nor moving left to $(r, c-1)$ leads to the origin, we record $(r, c)$ in a `HashSet<Point> failedPoints`. Any subsequent branch reaching $(r, c)$ terminates immediately in $O(1)$ time.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Objects;

public class RobotInGrid {
    public static class Point {
        public final int row;
        public final int col;

        public Point(int r, int c) {
            this.row = r;
            this.col = c;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Point)) return false;
            Point p = (Point) o;
            return row == p.row && col == p.col;
        }

        @Override
        public int hashCode() {
            return Objects.hash(row, col);
        }
    }

    /**
     * Finds a valid path from (0, 0) to (R-1, C-1) avoiding obstacles.
     * Time Complexity: O(R * C)
     * Space Complexity: O(R + C)
     */
    public static ArrayList<Point> getPath(boolean[][] maze) {
        if (maze == null || maze.length == 0) return null;
        ArrayList<Point> path = new ArrayList<>();
        HashSet<Point> failedPoints = new HashSet<>();

        if (getPathHelper(maze, maze.length - 1, maze[0].length - 1, path, failedPoints)) {
            return path;
        }
        return null;
    }

    private static boolean getPathHelper(boolean[][] maze, int row, int col,
                                         ArrayList<Point> path, HashSet<Point> failedPoints) {
        // Out of bounds or obstacle cell
        if (row < 0 || col < 0 || !maze[row][col]) {
            return false;
        }

        Point p = new Point(row, col);

        // Already visited and determined dead-end
        if (failedPoints.contains(p)) {
            return false;
        }

        boolean isAtOrigin = (row == 0) && (col == 0);

        // If path exists from top cell or left cell, or we are at origin
        if (isAtOrigin || getPathHelper(maze, row - 1, col, path, failedPoints)
                       || getPathHelper(maze, row, col - 1, path, failedPoints)) {
            path.add(p);
            return true;
        }

        failedPoints.add(p); // Cache as dead-end
        return false;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(R * C)` | Each grid cell is evaluated at most once due to `failedPoints` caching. |
| Auxiliary Space | `O(R * C)` | Hash set storing failed points and recursion call stack depth $O(R + C)$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Grid Routing & Manhattan Metrics

1. **Warehouse Robot Fleet Routing (Amazon Kiva):** Discrete grid reservation tables check spatial-temporal occupancy matrices to prevent robot collisions.
2. **VLSI Circuit Manhattan Routing:** Lee's routing algorithm and memoized maze search connect pins across semiconductor layers with minimum wire length.

## Edge Cases & Production Hardening

1. **Origin or Destination Blocked:** `maze[0][0] == false` or `maze[R-1][C-1] == false` immediately returns `null`.
2. **No valid path exists:** Traverses reachable cells and returns `null`.
