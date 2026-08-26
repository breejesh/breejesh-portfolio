---
title: "Paint Fill: Flood Fill a Color Region with DFS or BFS (Java)"
description: "CTCI-style problem 8.10 for beginners: paint-bucket fill on a 2D screen of colors. Replace a connected region with a new color using recursive DFS or iterative BFS in Java."
date: "2025-12-26"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-10-paint-fill.webp
previewImage: /assets/images/ctci-8-10-paint-fill.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 8.10 for beginners: paint-bucket fill on a 2D screen of colors. Replace a connected region with a new color using recursive DFS or iterative BFS in Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

Image editors have a **paint bucket** tool. You click a pixel, pick a new color, and the whole connected blob of the old color flips. The screen is a 2D array of color values. The click is a row and column. The job is to recolor every pixel you can reach by stepping up, down, left, and right without leaving the original color.

This post is original teaching for beginners in **Java**. Same problem family as classic flood-fill interview questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8, recursion and DP: a graph search on a grid, not a memo table this time.

---

## 1. Everyday analogy

Think of a tile floor painted in big color patches. You stand on one blue tile and want every blue tile you can walk to (sharing an edge, not only a corner) painted red.

* Start on the clicked tile. Remember it was blue.
* Paint it red.
* Look at the four neighbors: north, south, east, west.
* For each neighbor that is still blue, walk there and do the same.
* Stop when a neighbor is out of bounds, already red, or was never blue (wall, green patch, anything else).

You do not hop diagonally unless the interviewer says eight-way connectivity. You do not repaint tiles that were not the original color. That is flood fill: grow a connected region until the color boundary.

If the click is already the new color, do nothing. Painting blue to blue forever is a real bug (infinite recursion or a spinning BFS).

---

## 2. Plain problem statement

**Input:**

* `screen`: a 2D array of colors (ints, enums, or chars; interviews often use `int[][]` or `Color[][]`)
* `r`, `c`: the click coordinates
* `newColor`: the fill color

**Output:** the same screen, with the connected region of the original color at `(r, c)` replaced by `newColor`. Mutate in place or return the array; say which.

**Connectivity (default for this problem):** four directions, edge neighbors only:

```
(-1, 0), (1, 0), (0, -1), (0, 1)
```

**Signature shape:**

```java
void paintFill(int[][] screen, int r, int c, int newColor);
// or with an enum / Color type
boolean paintFill(Color[][] screen, int r, int c, Color newColor);
```

Returning `boolean` (did we fill?) is optional polish from some textbook sketches. Void mutate is enough.

**Clarify in the interview:**

* Four-way or eight-way neighbors?
* In-bounds rules and empty screen?
* What if `(r, c)` is out of bounds?
* Same color click: no-op?
* Can colors be null (if object type)?
* Mutate input or copy?

**Tiny example:**

```
Before (click on (1,1), new color = 9):

  1 1 1 2
  1 1 0 2
  1 0 1 2

After (four-way fill of the top-left 1-region):

  9 9 9 2
  9 9 0 2
  9 0 1 2
```

The lone `1` at bottom center stays. It shares only a corner with the filled region, not an edge.

---

## 3. Think first

### This is a graph search

Each cell is a node. An edge exists to a neighbor if that neighbor is in bounds and still has the **original** color. Flood fill is "visit every node in the connected component of the start cell, and recolor."

DFS (recursion or explicit stack) and BFS (queue) both work. Interviewers accept either. Say the graph framing out loud; it shows you are not only copying a paint-tool story.

### Capture original color first

```
oldColor = screen[r][c]
if oldColor == newColor: return
// then flood only cells equal to oldColor
```

If you recolor the start before reading `oldColor`, you lose the target. If you skip the early exit when colors match, DFS re-enters cells you just painted with `newColor` when `newColor` equals what you test for... actually you test for `oldColor`, so if `oldColor == newColor` every recolored cell still "matches" and you recurse forever. Guard it.

### Recursive DFS sketch

```
function fill(r, c):
  if out of bounds: return
  if screen[r][c] != oldColor: return
  screen[r][c] = newColor
  fill(r-1, c); fill(r+1, c); fill(r, c-1); fill(r, c+1)
```

Entry:

```
oldColor = screen[r][c]
if oldColor == newColor: return
fill(r, c)
```

### Iterative BFS sketch

```
queue.push(start)
screen[start] = newColor
while queue not empty:
  cell = queue.pop
  for each neighbor:
    if in bounds and screen[neighbor] == oldColor:
      screen[neighbor] = newColor
      queue.push(neighbor)
```

Paint when you enqueue (or mark visited) so you never enqueue the same cell twice. On a grid, recoloring away from `oldColor` is the visited mark. No separate `boolean[][]` needed.

### DFS vs BFS in the interview

| | Recursive DFS | Iterative BFS |
| --- | --- | --- |
| Code length | Short | A bit more (queue + dirs) |
| Stack risk | Deep recursion on a long snake region can blow the call stack | Heap queue; safer on huge screens |
| Order | Depth-first | Level-order; same final result |

For interview sizes, either is fine. Mention stack depth for DFS on an `N x M` all-one-color screen: worst depth about `N*M`.

### Why this sits in "Recursion and DP"

The natural write-up is recursive. There is no fancy memo table. The "subproblems" are neighbors. Still chapter-aligned: recursion on a grid, same family as robot paths and maze flood.

### Design sketch on the whiteboard

1. Draw a 3x4 grid with a blob of color `1` and other colors.
2. Mark the click. Write `old = 1`, `new = 9`.
3. Recolor start, then chase the four directions.
4. Show a cell that stops the flood (different color or bound).
5. Note the early exit if `old == new`.

---

## 4. Java solution

### Shared helpers

```java
static final int[][] DIRS = {
    {-1, 0}, {1, 0}, {0, -1}, {0, 1}
};

static boolean inBounds(int[][] screen, int r, int c) {
    return r >= 0 && r < screen.length
        && c >= 0 && c < screen[0].length;
}
```

Assume a non-empty rectangular screen for the teaching code. Guard empty arrays in production.

### Recursive DFS

```java
/**
 * Paint-bucket fill: recolor the 4-connected region of screen[r][c].
 * Mutates screen in place.
 */
void paintFillDfs(int[][] screen, int r, int c, int newColor) {
    if (screen == null || screen.length == 0 || screen[0].length == 0) {
        return;
    }
    if (!inBounds(screen, r, c)) {
        return;
    }
    int oldColor = screen[r][c];
    if (oldColor == newColor) {
        return;
    }
    fill(screen, r, c, oldColor, newColor);
}

void fill(int[][] screen, int r, int c, int oldColor, int newColor) {
    if (!inBounds(screen, r, c)) {
        return;
    }
    if (screen[r][c] != oldColor) {
        return;
    }
    screen[r][c] = newColor;
    for (int[] d : DIRS) {
        fill(screen, r + d[0], c + d[1], oldColor, newColor);
    }
}
```

### Iterative BFS

```java
void paintFillBfs(int[][] screen, int r, int c, int newColor) {
    if (screen == null || screen.length == 0 || screen[0].length == 0) {
        return;
    }
    if (!inBounds(screen, r, c)) {
        return;
    }
    int oldColor = screen[r][c];
    if (oldColor == newColor) {
        return;
    }

    java.util.ArrayDeque<int[]> q = new java.util.ArrayDeque<>();
    screen[r][c] = newColor;
    q.add(new int[] {r, c});

    while (!q.isEmpty()) {
        int[] cell = q.removeFirst();
        int cr = cell[0];
        int cc = cell[1];
        for (int[] d : DIRS) {
            int nr = cr + d[0];
            int nc = cc + d[1];
            if (inBounds(screen, nr, nc) && screen[nr][nc] == oldColor) {
                screen[nr][nc] = newColor;
                q.add(new int[] {nr, nc});
            }
        }
    }
}
```

`ArrayDeque` as a queue is clear and fast enough. A manual linked queue is fine on a whiteboard.

### Optional Color enum style

Some write-ups use an enum to mirror "real" pixels:

```java
enum Color { RED, GREEN, BLUE, YELLOW }

boolean paintFill(Color[][] screen, int r, int c, Color newColor) {
    if (screen == null || screen.length == 0) {
        return false;
    }
    if (!inBoundsColor(screen, r, c)) {
        return false;
    }
    Color oldColor = screen[r][c];
    if (oldColor == newColor) {
        return false;
    }
    fillColor(screen, r, c, oldColor, newColor);
    return true;
}

void fillColor(Color[][] screen, int r, int c, Color oldColor, Color newColor) {
    if (!inBoundsColor(screen, r, c)) {
        return;
    }
    if (screen[r][c] != oldColor) {
        return;
    }
    screen[r][c] = newColor;
    fillColor(screen, r - 1, c, oldColor, newColor);
    fillColor(screen, r + 1, c, oldColor, newColor);
    fillColor(screen, r, c - 1, oldColor, newColor);
    fillColor(screen, r, c + 1, oldColor, newColor);
}

boolean inBoundsColor(Color[][] screen, int r, int c) {
    return r >= 0 && r < screen.length
        && c >= 0 && c < screen[0].length;
}
```

Same algorithm. Enums read well when you talk about "colors" instead of magic ints.

### Minimal smoke checks

```java
int[][] g = {
    {1, 1, 1, 2},
    {1, 1, 0, 2},
    {1, 0, 1, 2}
};
paintFillDfs(g, 1, 1, 9);
assert g[0][0] == 9 && g[0][1] == 9 && g[0][2] == 9;
assert g[1][0] == 9 && g[1][1] == 9;
assert g[2][0] == 9;
assert g[1][2] == 0; // not part of the 1-region via edges
assert g[2][1] == 0;
assert g[2][2] == 1; // diagonal only; four-way leaves it
assert g[0][3] == 2;

int[][] same = {{3, 3}, {3, 3}};
paintFillBfs(same, 0, 0, 3); // no-op, must not hang
assert same[1][1] == 3;

int[][] one = {{5}};
paintFillBfs(one, 0, 0, 7);
assert one[0][0] == 7;
```

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Recursive DFS | O(R * C) | O(R * C) call stack worst case | Visits each cell in the region once; worst region is the whole screen |
| Iterative BFS | O(R * C) | O(R * C) queue worst case | Same visit bound; no JVM stack risk |
| Eight-way variant | O(R * C) | same | More edges per cell; still linear in cells |

You never need more than a constant amount of work per cell. Do not claim O(1) space for recursive DFS on large fills; the stack is real.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Click color already equals new color:** return immediately. Infinite recursion / infinite queue otherwise.
* **Out-of-bounds click:** return; do not throw unless the API promises validation.
* **1x1 screen:** single assignment if colors differ.
* **Whole screen one color:** every cell flips; DFS depth can be huge.
* **Region touches borders:** bounds checks on every neighbor, not only the start.
* **Jagged rows:** teaching code assumes rectangle; say so if rows can differ in length.
* **Eight-way vs four-way:** wrong diagonal bleed changes the answer (see example cell `(2,2)`).
* **Recoloring before saving `oldColor`:** you cannot know what to match.

Common mistakes:

1. **Forgetting the `oldColor == newColor` guard.**
2. **Checking `!= newColor` instead of `== oldColor`** when expanding (would crawl into every non-new cell).
3. **Missing a direction** in the four-way list.
4. **Using eight directions by accident.**
5. **Enqueue without recoloring** (BFS revisits forever) or recoloring without a visit mark.
6. **Off-by-one bounds** (`<= length` instead of `< length`).
7. **Assuming the screen is square** when only `screen[0].length` is used for width (OK if rectangular; state the assumption).

---

## 7. Explain to a friend recap

Paint fill in one breath:

1. Screen is a grid of colors. Click a cell and a new color.
2. Remember `oldColor`. If it already equals `newColor`, stop.
3. Recolor every cell reachable by up/down/left/right steps that stay on `oldColor`.
4. DFS recursion or BFS queue: same final picture.
5. Recolor (or mark visited) when you enter a cell so you never process it twice.
6. Time and space are linear in the size of the filled region (worst case whole grid).

If you can walk the 3x4 example by hand, write the early-exit guard, and explain why four-way leaves a diagonal cell alone, you own problem 8.10. Next in the chapter is coin change style counting with DP.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Parens](/blog/en/ctci-8-9-parens)
* Next: [Coins](/blog/en/ctci-8-11-coins)