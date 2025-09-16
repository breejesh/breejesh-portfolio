---
title: "Eight Queens: Place 8 Non-Attacking Queens with Backtracking (Java)"
description: "CTCI-style problem 8.12 for beginners: put eight queens on an 8x8 board so none share a row, column, or diagonal. Column-by-column placement, conflict checks, and clean Java backtracking."
date: "2025-09-16"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-12-eight-queens.webp
previewImage: /assets/images/ctci-8-12-eight-queens.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 8.12 for beginners: put eight queens on an 8x8 board so none share a row, column, or diagonal. Column-by-column placement, conflict checks, and clean Java backtracking.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A chess queen eats anything on her **row**, **column**, or either **diagonal**. Put eight queens on an 8x8 board so no one can capture anyone else. That is the classic **Eight Queens** puzzle, and in interviews it is the cleanest way to show you can **backtrack**: try a placement, go deeper, undo when you hit a dead end.

This post is original teaching for beginners in **Java**. Same problem family as classic recursion interview questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide).

---

## 1. Everyday analogy

Imagine eight managers who must sit at eight desks in a grid of rooms. Each manager insists:

* nobody else on my **floor** (row),
* nobody else in my **corridor** (column),
* nobody else on either **diagonal hallway** that crosses my desk.

You walk **column by column**. In column 0 you try each floor. For each try, you move to column 1 and try every free, non-attacking floor. When a column has no legal floor left, you back up one column and change that earlier choice. When you fill all eight columns, you have one full seating plan. Keep going to list **all** valid plans.

That undo-and-retry walk is backtracking. You do not invent all 8! permutations of floors first and filter later if you can prune earlier.

---

## 2. Plain problem statement

**Input:** board size `n` (classic case: `n = 8`).

**Output:** every way to place `n` queens on an `n x n` board so that no two queens attack each other. Attack means same row, same column, or same diagonal.

**What to return in code:**

* A list of solutions. Each solution can be an array of column indices per row, or a list of board strings (the LeetCode style), or printed boards. Pick one and say it.
* Count of solutions is a fine follow-up (`92` for `n = 8`).

**Rules that matter:**

* Queens attack any distance on row, column, and both diagonals (no blockers).
* Exactly one queen per solution on each row **and** each column if you use the usual optimization (see below). You never need two in the same row.
* Empty board is not a solution for `n > 0`. You need all `n` queens placed.

**Small example (`n = 4`):** there are exactly 2 solutions (up to how you print them). One is:

```
. Q . .
. . . Q
Q . . .
. . Q .
```

No two queens share a row, column, or diagonal. For `n = 8` there are **92** distinct solutions (12 if you ignore board symmetries).

**Clarify before coding:**

* Fixed `n = 8` or general `n`? Write general `n`; demo with 8.
* Return all boards, or only the count? All boards is the classic ask.
* Board representation? `int[] columns` where `columns[row] = col` is enough for logic; pretty-print later.
* 0-indexed rows and columns? Yes in code.

---

## 3. Think first

### Brute force is huge

There are `C(64, 8)` ways to pick 8 squares, or `64 P 8` if order matters. Most are illegal. You need structure.

### One queen per row (and per column)

If two queens share a row, they attack. So a solution is a **permutation** of columns for rows `0 .. n-1`: row `r` has exactly one queen in column `columns[r]`, and all `columns[r]` values are distinct.

That drops the search to at most `n!` permutations, and diagonals still filter most of them.

You can place **row by row** or **column by column**. Same idea. This post places by **row**: for row `r`, try each column `c`.

### What "under attack" means

When you try to put a queen at `(row, col)`, every earlier queen at `(r2, c2)` with `r2 < row` must not attack it:

1. **Same column:** `col == c2`
2. **Same diagonal:** `|col - c2| == |row - r2|`  
   (same distance down and across)

Same row never happens if you place one per row.

### Backtracking skeleton

```
place(row):
  if row == n:
    record a copy of columns
    return
  for col in 0 .. n-1:
    if isSafe(row, col):
      columns[row] = col
      place(row + 1)
      // no explicit undo needed if the next write overwrites columns[row]
```

`isSafe` only looks at rows `0 .. row-1`.

### Faster safety checks (optional)

Scanning previous queens is `O(n)` per try. You can keep three boolean arrays for O(1) checks:

| Array | Marks | Index idea |
| --- | --- | --- |
| `usedCol[c]` | column taken | `c` |
| `usedDiag1[d]` | one diagonal family | `row - col + (n - 1)` |
| `usedDiag2[d]` | other diagonal family | `row + col` |

Set the three flags when you place, clear them when you backtrack. Same solutions; tighter constant factors. Interview-friendly either way. Start with the simple scan; mention the arrays if they ask to speed it up.

### Why backtracking, not pure DP

You need **every valid full placement**, not a single max score. States branch on choices, and illegal partial boards die early. That is search with prune, not a classic table DP.

### Whiteboard sketch for `n = 4`

1. Row 0, try col 0. Place.
2. Row 1: col 0 blocked (column). col 1 blocked (diagonal). Try col 2.
3. Row 2: many cells blocked; maybe dead end.
4. Undo row 1, try col 3, continue.
5. Eventually hit both complete boards. Count = 2.

Saying this out loud shows you understand prune-and-retry, not just "recurse somehow."

---

## 4. Java solution

Teaching version: general `n`, place one queen per row, validate against earlier queens, collect column maps and optional string boards.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * n-queens via backtracking.
 * columns[row] = column of the queen in that row.
 */
public class EightQueens {
    private final int n;
    private final List<int[]> placements = new ArrayList<>();

    public EightQueens(int n) {
        if (n < 1) {
            throw new IllegalArgumentException("n must be positive");
        }
        this.n = n;
    }

    /** All solutions as column arrays (length n). */
    public List<int[]> solvePlacements() {
        placements.clear();
        int[] columns = new int[n];
        Arrays.fill(columns, -1);
        place(0, columns);
        return new ArrayList<>(placements);
    }

    /** LeetCode-style boards: list of strings with 'Q' and '.'. */
    public List<List<String>> solveBoards() {
        List<List<String>> boards = new ArrayList<>();
        for (int[] cols : solvePlacements()) {
            boards.add(toBoard(cols));
        }
        return boards;
    }

    private void place(int row, int[] columns) {
        if (row == n) {
            placements.add(columns.clone());
            return;
        }
        for (int col = 0; col < n; col++) {
            if (isSafe(columns, row, col)) {
                columns[row] = col;
                place(row + 1, columns);
                // columns[row] will be overwritten on the next try
            }
        }
    }

    /** True if (row, col) does not attack any queen in rows 0 .. row-1. */
    private boolean isSafe(int[] columns, int row, int col) {
        for (int r = 0; r < row; r++) {
            int c = columns[r];
            if (c == col) {
                return false; // same column
            }
            // same diagonal: equal row distance and column distance
            if (Math.abs(c - col) == row - r) {
                return false;
            }
        }
        return true;
    }

    private List<String> toBoard(int[] columns) {
        List<String> board = new ArrayList<>(n);
        for (int r = 0; r < n; r++) {
            char[] line = new char[n];
            Arrays.fill(line, '.');
            line[columns[r]] = 'Q';
            board.add(new String(line));
        }
        return board;
    }

    public static void main(String[] args) {
        EightQueens eq = new EightQueens(8);
        List<int[]> all = eq.solvePlacements();
        System.out.println("solutions for n=8: " + all.size()); // 92

        EightQueens four = new EightQueens(4);
        List<List<String>> boards = four.solveBoards();
        System.out.println("solutions for n=4: " + boards.size()); // 2
        for (List<String> b : boards) {
            for (String row : b) {
                System.out.println(row);
            }
            System.out.println();
        }
    }
}
```

Walkthrough for the first `n = 4` solution the search finds depends on column order, but both valid boards will appear.

| Step | Action | Notes |
| --- | --- | --- |
| start | `place(0)` | try cols 0..3 for row 0 |
| place | set `columns[0]`, call `place(1)` | deeper row |
| reject | `isSafe` false | shared column or diagonal with earlier queen |
| accept full | `row == n` | clone `columns` into results |
| continue | next `col` at current row | explores other branches |
| done | loops exhaust | `n=4` → 2, `n=8` → 92 |

O(1) flag variant for the same search (sketch only):

```java
// usedCol[c], diag1[row - col + n - 1], diag2[row + col]
private void placeFast(int row, int[] columns,
                       boolean[] usedCol, boolean[] d1, boolean[] d2) {
    if (row == n) {
        placements.add(columns.clone());
        return;
    }
    for (int col = 0; col < n; col++) {
        int i1 = row - col + n - 1;
        int i2 = row + col;
        if (usedCol[col] || d1[i1] || d2[i2]) {
            continue;
        }
        usedCol[col] = d1[i1] = d2[i2] = true;
        columns[row] = col;
        placeFast(row + 1, columns, usedCol, d1, d2);
        usedCol[col] = d1[i1] = d2[i2] = false; // backtrack
    }
}
```

Same tree of decisions. The flags make "is this square free?" constant time.

---

## 5. Complexity table

| Piece | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Full search tree | O(n!) upper bound | O(n) recursion + O(n) columns | pruning cuts most branches early |
| `isSafe` scan version | O(n) per candidate | O(1) beyond columns | simple to code and explain |
| Flag arrays version | O(1) per candidate | O(n) for three boolean arrays | same asymptotic outer search |
| Output size | Θ(S · n) to copy | Θ(S · n) | S = number of solutions (92 for n=8) |
| `n = 8` in practice | small | small | finishes instantly on a laptop |

Interviewers care that you forced one queen per row, checked columns and diagonals, and cloned the board when recording a solution (not storing a live mutable array).

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **`n = 1`:** one solution, single queen. Do not special-case unless asked.
* **`n = 2` and `n = 3`:** zero solutions. Empty list is correct.
* **`n = 4`:** exactly 2. Good unit smoke test.
* **`n = 8`:** 92 solutions. If you get another number, a diagonal check is probably wrong.
* **Storing the live `columns` array** in the result list without `clone()`. Every entry ends up as the last permutation.
* **Forgetting absolute value on the diagonal** or using only one diagonal direction.
* **Allowing two queens in one column** because you only checked diagonals.
* **Off-by-one on flag indices** for `row - col + n - 1` (must stay non-negative).
* **Mutating the board while iterating results** after the search.

Common mistakes:

1. **Placing freely on all 64 squares** without one-per-row. Code balloons and confuses the interviewer.
2. **Checking only adjacent cells.** Queens attack any distance.
3. **Using the same list/array reference** for every solution.
4. **No backtrack on flag arrays.** Once a column is marked used, it never frees.
5. **Counting symmetries as the main answer** when the problem asked for all distinct boards (92, not 12).
6. **Returning pretty boards only** and never proving the count for `n = 8`.

Minimal smoke idea:

```java
assert new EightQueens(1).solvePlacements().size() == 1;
assert new EightQueens(2).solvePlacements().size() == 0;
assert new EightQueens(3).solvePlacements().size() == 0;
assert new EightQueens(4).solvePlacements().size() == 2;
assert new EightQueens(8).solvePlacements().size() == 92;
```

---

## 7. Explain to a friend recap

Eight Queens asks: put eight queens on a chessboard so none can attack.

1. Put **one queen per row**. The choice per row is which **column**.
2. Columns must all differ. Diagonals must not line up (`|Δcol| == |Δrow|`).
3. **Backtrack:** try a column, recurse to the next row, undo and try the next column when stuck or after recording a full board.
4. Record a **copy** of each complete placement. For `n = 8` you should find **92** ways.
5. Optional speedup: boolean arrays for used columns and both diagonal families so each try is O(1) to validate.

If you can sketch `n = 4`, show a failed partial placement, and say why cloning the solution array matters, you own problem 8.12. Recursion here is not "magic memoization." It is disciplined search with undo.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Coins](/blog/en/ctci-8-11-coins)
* Next: [Stack of Boxes](/blog/en/ctci-8-13-stack-of-boxes)