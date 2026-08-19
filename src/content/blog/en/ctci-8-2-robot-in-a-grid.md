---
title: "Robot in a Grid: Find a Right/Down Path Around Blocked Cells (Java)"
description: "CTCI-style problem 8.2 for beginners: robot goes top-left to bottom-right with only right and down moves. Some cells are off. Memoized DFS (or DP) finds one path in Java."
date: "2026-05-10"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
previewImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 8.2 for beginners: robot goes top-left to bottom-right with only right and down moves. Some cells are off. Memoized DFS (or DP) finds one path in Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You stand at the northwest corner of a city block grid. You may only walk **east** or **south**. Some intersections are closed for construction. Can you reach the southeast corner, and if so, which sequence of corners do you walk through?

That is **robot in a grid**: a maze with two legal moves, optional blocked cells, and one path (not all paths) as the answer. Recursion draws the search tree. Memoization (or DP) stops you from re-solving the same dead cell over and over.

This post is original teaching for beginners in **Java**. Same problem family as classic interview grid path questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8 (recursion and dynamic programming) continues after [Triple Step](/blog/en/ctci-8-1-triple-step).

---

## 1. Everyday analogy

Picture a small downtown map drawn as rows and columns of intersections:

* You start at the top-left intersection `(0, 0)`.
* Goal is the bottom-right intersection `(r - 1, c - 1)`.
* From any open intersection you may move **right** one block or **down** one block. No left, no up, no diagonal.
* Some intersections are fenced off. You cannot stand on them.
* You need **any** legal walk from start to goal, listed as the sequence of intersections. You do not need every walk or the shortest one (every path has the same length: exactly `(r - 1) + (c - 1)` moves if only right and down are allowed).

Try a 3x3 grid with the center blocked:

```
S . .
. X .
. . E
```

One path: right, right, down, down (along the top then the right edge). Another: down, down, right, right (left edge then bottom). Both avoid the center.

If the top row and left column are both fully blocked after the start, you may be stuck even if the end cell is open. Reachability is not "is the end free?"; it is "is there a chain of free cells connected by right/down from start?"

---

## 2. Plain problem statement

**Input:** a grid with `r` rows and `c` columns. Each cell is either free or off-limits. Convention in code: `true` means you may step there, `false` means blocked. Start is `(0, 0)`. Goal is `(r - 1, c - 1)`.

**Output:** a list of points from start to goal forming a valid path, or `null` / empty if no path exists.

**Moves:** from `(row, col)` only to `(row, col + 1)` (right) or `(row + 1, col)` (down), and only if the target is in bounds and free.

**Point shape we use:**

```java
class Point {
    final int row;
    final int col;

    Point(int row, int col) {
        this.row = row;
        this.col = col;
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
        return 31 * row + col;
    }

    @Override
    public String toString() {
        return "(" + row + "," + col + ")";
    }
}
```

**Tiny examples:**

| Grid idea | Path? | Notes |
| --- | --- | --- |
| 1x1 free cell | yes: `(0,0)` | start equals goal |
| 1x1 blocked | no | cannot stand on start |
| 2x2 all free | yes | e.g. right then down, or down then right |
| 2x2 with only `(0,1)` blocked | yes | must go down then right |
| 2x2 with `(0,1)` and `(1,0)` blocked | no | both exits from start closed |
| start blocked or end blocked | no | path must include both endpoints |

**Clarify before coding:**

* Indexing: rows first, then columns. Say `maze[row][col]`, not "x/y" unless you define them carefully.
* Is start guaranteed free? Check it anyway.
* Return one path or all paths? **One path** for this problem.
* How are blocked cells represented? Boolean grid, `0/1` ints, or a set of forbidden points: pick one.
* Empty grid or null? Return null.

---

## 3. Think first

### Recursion matches the moves

From cell `(r, c)`, a path exists if the cell is free and either:

* you are at the goal, or
* there is a path from the right neighbor, or
* there is a path from the down neighbor.

You can also search **backward** from the goal: a cell is reachable if free and you can reach it from the cell above or the cell to the left (working from goal toward origin). Same asymptotics. Forward from the origin feels natural when you build the path as you go.

### Brute force is exponential

At each step you may try two branches. A path has about `r + c` steps, so a naive search tree is on the order of `O(2^(r+c))` work in the worst case. Worse: many different routes visit the **same cell**. If that cell is a dead end, you rediscover the failure again and again.

### Memoize failures (and success)

The key optimization: for each cell, ask once "is there a path from here to the goal?" Cache **no** answers in a set of failed points (or a 2D boolean memo). If you already proved a cell cannot reach the goal, never expand it again.

With that cache, each cell is fully explored a constant number of times. Time drops to **O(r * c)**. Space is O(r * c) for the memo plus O(r + c) for the path and recursion depth.

You can also cache successful reachability in a DP table `canReach[row][col]` filled bottom-up from the goal, then walk from the start greedily (prefer right or down when the next cell can reach). Same O(r * c).

### Building the path

Two clean styles:

1. **On the way down:** when a recursive call from here succeeds, append this point after the recursive path (or prepend if you recurse first and add on the way back).
2. **On the way back from the goal:** start recursion at the goal, work toward the origin by trying left and up; when a subpath to origin exists, append the current point. The list then runs origin → goal in order if you append after the recursive success.

Either is fine. Below we use **forward** search from the origin with a failed-cell set, adding the point when the subcall succeeds.

### Whiteboard sketch

1. Draw a 3x3, block the center.
2. DFS from `(0,0)`: try right, recurse; try down, recurse.
3. Mark a cell failed only after both directions fail.
4. When you hit `(2,2)`, success bubbles up and each frame adds its point to the list.

---

## 4. Java solution

Memoized DFS from the start. Free cells are `true`.

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Find one path from top-left to bottom-right.
 * Moves: right or down only. maze[r][c] == true means free.
 */
public class RobotInAGrid {

    public List<Point> getPath(boolean[][] maze) {
        if (maze == null || maze.length == 0 || maze[0].length == 0) {
            return null;
        }
        List<Point> path = new ArrayList<>();
        Set<Point> failed = new HashSet<>();
        if (findPath(maze, 0, 0, path, failed)) {
            return path;
        }
        return null;
    }

    /**
     * Returns true if there is a path from (row, col) to the goal.
     * On success, path contains points from (row, col) through the goal in order.
     */
    private boolean findPath(
            boolean[][] maze,
            int row,
            int col,
            List<Point> path,
            Set<Point> failed) {

        int rows = maze.length;
        int cols = maze[0].length;

        if (row < 0 || col < 0 || row >= rows || col >= cols || !maze[row][col]) {
            return false;
        }

        Point here = new Point(row, col);
        if (failed.contains(here)) {
            return false;
        }

        boolean atGoal = (row == rows - 1) && (col == cols - 1);

        if (atGoal
                || findPath(maze, row, col + 1, path, failed)
                || findPath(maze, row + 1, col, path, failed)) {
            // Recursion filled the suffix (right or down branch).
            // Add this cell at the front so the full list is start -> goal.
            path.add(0, here);
            return true;
        }

        failed.add(here);
        return false;
    }
}
```

`path.add(0, here)` keeps start-to-goal order when we add on the way out of a successful call. If you prefer O(1) appends only, push points while unwinding and reverse at the end, or collect from goal backward and reverse once.

### Variant: bottom-up DP then reconstruct

```java
public List<Point> getPathDp(boolean[][] maze) {
    if (maze == null || maze.length == 0 || maze[0].length == 0) {
        return null;
    }
    int rows = maze.length;
    int cols = maze[0].length;
    if (!maze[0][0] || !maze[rows - 1][cols - 1]) {
        return null;
    }

    // canReach[r][c]: can we reach the goal from (r, c)?
    boolean[][] canReach = new boolean[rows][cols];
    canReach[rows - 1][cols - 1] = true;

    for (int r = rows - 1; r >= 0; r--) {
        for (int c = cols - 1; c >= 0; c--) {
            if (!maze[r][c]) {
                canReach[r][c] = false;
                continue;
            }
            if (r == rows - 1 && c == cols - 1) {
                continue;
            }
            boolean right = (c + 1 < cols) && canReach[r][c + 1];
            boolean down = (r + 1 < rows) && canReach[r + 1][c];
            canReach[r][c] = right || down;
        }
    }

    if (!canReach[0][0]) {
        return null;
    }

    List<Point> path = new ArrayList<>();
    int r = 0;
    int c = 0;
    path.add(new Point(0, 0));
    while (r != rows - 1 || c != cols - 1) {
        if (c + 1 < cols && canReach[r][c + 1]) {
            c++;
        } else if (r + 1 < rows && canReach[r + 1][c]) {
            r++;
        } else {
            return null; // should not happen if table is correct
        }
        path.add(new Point(r, c));
    }
    return path;
}
```

Same big-O. Nice when you want an iterative story with no recursion stack.

### Minimal smoke checks

```java
boolean[][] open2 = {
    {true, true},
    {true, true}
};
// path length 3, e.g. (0,0)-(0,1)-(1,1) or (0,0)-(1,0)-(1,1)

boolean[][] blockedCenter = {
    {true, true, true},
    {true, false, true},
    {true, true, true}
};
// still possible via top-right or bottom-left corridor

boolean[][] wall = {
    {true, false},
    {false, true}
};
// null path: both exits from start blocked
```

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Naive DFS, no memo | O(2^(r+c)) worst | O(r + c) stack + path | Revisits dead cells |
| Memo DFS (failed set) | O(r * c) | O(r * c) memo + O(r + c) path/stack | Each cell expanded once |
| Bottom-up DP + walk | O(r * c) | O(r * c) table | No recursion; reconstruct one path |
| Path length (when found) | - | O(r + c) points | Always `(r - 1) + (c - 1) + 1` cells |

Interviewers want you to name the exponential trap, then show the memo set (or DP table) that brings it to linear in the number of cells.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Start or goal blocked:** immediate failure.
* **1x1 free:** path is the single cell.
* **Single row or single column:** only one corridor; any block in that corridor kills the path.
* **Null or zero-size maze:** return null; do not index `maze[0]`.
* **Jagged rows:** assume rectangular; if not, validate `maze[i].length`.
* **Using x/y without defining which is row:** prefer `row` and `col`.

Common mistakes:

1. **Forgetting memoization.** Code looks right, times out on large open grids with many blocks near the end.
2. **Memoizing only visited for cycles.** There are no cycles with only right/down, but **failed** cells still need caching because many parents share a child.
3. **Marking a cell failed too early** (before trying both directions).
4. **Off-by-one on goal** (`rows` vs `rows - 1`).
5. **Mutating the maze as visited** without restoring, then failing a second call on the same grid.
6. **Returning all cells in wrong order** (goal to start) without reversing.
7. **Treating blocked as free** by mixing `true`/`false` conventions.

---

## 7. Explain to a friend recap

Robot on a grid, interview version:

1. Start top-left, goal bottom-right. Moves: **right** or **down** only. Some cells off-limits.
2. Recurse: from a free cell, try right, try down; success if you reach the goal.
3. Without a cache, the same dead cell is explored via many parents: exponential time.
4. **Memo:** remember cells that cannot reach the goal. Each cell once → O(r * c).
5. Build one path by recording points on successful returns (or DP table + greedy walk).
6. Check start/goal free, bounds, and empty input.

If you can draw a small maze, mark a failed cell so a second parent skips it, and write the memoized recursive method without index bugs, you own problem 8.2. Next in the chapter: [Magic Index](/blog/en/ctci-8-3-magic-index).

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Triple Step](/blog/en/ctci-8-1-triple-step)
* Next: [Magic Index](/blog/en/ctci-8-3-magic-index)