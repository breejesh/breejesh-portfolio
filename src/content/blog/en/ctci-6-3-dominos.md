---
title: "Dominos: Why a Mutilated Chessboard Cannot Be Tiled (Java)"
description: "CTCI-style problem 6.3 for beginners: 8x8 board with two opposite corners removed, 31 dominos. Coloring invariant proves it is impossible. Counts, board sketch, and optional Java visualization."
date: "2025-11-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-6-3-dominos.webp
previewImage: /assets/images/ctci-6-3-dominos.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 6.3 for beginners: 8x8 board with two opposite corners removed, 31 dominos. Coloring invariant proves it is impossible. Counts, board sketch, and optional Java visualization.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

An 8x8 chessboard has 64 squares. Chop off two opposite corners and you have 62 squares left. A domino covers two adjacent squares. So 31 dominos would cover exactly 62 squares if a tiling exists. The interview question is simple: **does it?**

The surprising answer is **no**. Not because you failed to find a clever layout, but because a **coloring argument** proves every layout is doomed. You never need to try all tilings.

This post is original teaching for beginners in **Java**. Same problem family as classic interview math and logic puzzles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 6, math and logic puzzles, problem 6.3.

---

## 1. Everyday analogy

Picture a checkerboard kitchen floor, black and white tiles alternating. You and a friend each own one color of tile glue. Every domino-shaped rug you lay must sit on **one black tile and one white tile**, because a domino is two squares side by side, and side-by-side squares always differ in color on a standard coloring.

Now someone rips out **two black tiles** from opposite corners of the room and hands you 31 rugs. You still have more white tiles than black. Every rug you place removes one of each color. You will always run out of black tiles first, with two white tiles left and no legal rug that covers two whites. That is the whole proof, dressed as floor work.

---

## 2. Plain problem statement

**Setup:**

* An **8x8** chessboard (64 squares).
* **Remove two opposite corners.** On a standard board those corners share a color (both "black" or both "white," depending on which corner you call black).
* You have **31 dominos**. Each domino covers **exactly two adjacent** squares (share an edge, not only a corner).

**Question:** Can the 31 dominos cover every remaining square with no overlaps and no gaps?

**Output of the reasoning (what interviewers want):** a clear **yes or no**, plus a **proof**, not a half-finished search.

**Numbers that matter:**

| Quantity | Value |
| --- | --- |
| Full board squares | 64 |
| Squares after two removals | 62 |
| Dominos needed for full cover | 31 |
| Black squares on a standard coloring | 32 |
| White squares on a standard coloring | 32 |
| Opposite corners removed | 2 of the **same** color |
| Remaining same-color count | 30 of one color, 32 of the other |

**Clarify before you "solve":**

* Adjacent means edge-sharing? (Yes.)
* Dominos may be rotated? (Horizontal or vertical, both fine.)
* Opposite corners only, or any two corners? (Classic statement: opposite. Adjacent corners are different colors; that variant is a different question.)
* Is the board always colored in the usual alternating pattern? (You may choose that coloring. It is a proof tool, not a rule the physical board must paint for you.)

---

## 3. Think first

### Naive urge: search for a tiling

You could backtrack: place a domino, recurse, undo. On 62 cells that search is large if you are not careful with symmetry. Interviews do not want you to code a general exact cover solver here. They want the invariant.

### Better: parity / coloring invariant

Color the board like a chessboard:

```
(r + c) even  -> black   (or white; pick one convention and stick to it)
(r + c) odd   -> white
```

Any two squares that share an edge have coordinates that differ by 1 in exactly one coordinate. So one has even `r+c`, one has odd `r+c`. **Every domino covers one black and one white.**

A perfect tiling of 31 dominos would cover **31 black and 31 white**.

What colors are the opposite corners?

Corners of an 8x8 board (0-indexed rows and cols `0..7`):

```
(0,0)  r+c = 0  even
(0,7)  r+c = 7  odd
(7,0)  r+c = 7  odd
(7,7)  r+c = 14 even
```

Opposite pairs:

* `(0,0)` and `(7,7)`: both **even** (same color).
* `(0,7)` and `(7,0)`: both **odd** (same color).

Remove two opposite corners and you remove **two squares of one color**. You are left with **30 of that color and 32 of the other**.

31 dominos would need 31+31. You have 30+32. **Impossible.**

### What the proof is and is not

* It is a **necessary condition** argument: if a tiling existed, black count would equal white count. It does not. So no tiling exists.
* It does **not** say "every board with equal black and white tiles can be tiled." Equal counts are necessary, not always sufficient. Here inequality is enough to kill the problem.

### Contrast: remove two different-colored squares

If you remove one black and one white (for example two adjacent corners), the counts stay 31 and 31. The coloring argument no longer forbids a tiling. In fact many such boards **can** be tiled. That is why "opposite" is load-bearing wording.

---

## 4. Java solution (reasoning helpers + optional board sketch)

You do not need production code for the proof. Still, a tiny Java helper that colors the board, removes opposite corners, and prints counts makes the invariant concrete in an interview IDE.

```java
public final class DominosBoard {
    private static final int N = 8;

    /** Color: 0 = black (even r+c), 1 = white (odd r+c). */
    public static int color(int r, int c) {
        return (r + c) & 1;
    }

    /**
     * Count remaining black (0) and white (1) after removing two opposite corners.
     * pair 0: (0,0) and (N-1,N-1); pair 1: (0,N-1) and (N-1,0).
     */
    public static int[] remainingColorCounts(int oppositePair) {
        boolean[][] removed = new boolean[N][N];
        if (oppositePair == 0) {
            removed[0][0] = true;
            removed[N - 1][N - 1] = true;
        } else {
            removed[0][N - 1] = true;
            removed[N - 1][0] = true;
        }

        int black = 0;
        int white = 0;
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                if (removed[r][c]) {
                    continue;
                }
                if (color(r, c) == 0) {
                    black++;
                } else {
                    white++;
                }
            }
        }
        return new int[] {black, white};
    }

    /** True only if remaining black == remaining white (necessary for any domino tiling). */
    public static boolean colorCountsAllowTiling(int oppositePair) {
        int[] counts = remainingColorCounts(oppositePair);
        return counts[0] == counts[1];
    }

    /** ASCII board: B/W for colors, . for removed. */
    public static String sketch(int oppositePair) {
        boolean[][] removed = new boolean[N][N];
        if (oppositePair == 0) {
            removed[0][0] = true;
            removed[N - 1][N - 1] = true;
        } else {
            removed[0][N - 1] = true;
            removed[N - 1][0] = true;
        }

        StringBuilder sb = new StringBuilder();
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                if (removed[r][c]) {
                    sb.append('.');
                } else {
                    sb.append(color(r, c) == 0 ? 'B' : 'W');
                }
                if (c + 1 < N) {
                    sb.append(' ');
                }
            }
            if (r + 1 < N) {
                sb.append('\n');
            }
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        for (int pair = 0; pair <= 1; pair++) {
            int[] counts = remainingColorCounts(pair);
            System.out.println("pair=" + pair
                    + " black=" + counts[0]
                    + " white=" + counts[1]
                    + " allowTiling=" + colorCountsAllowTiling(pair));
            System.out.println(sketch(pair));
            System.out.println();
        }
        // pair=0 black=30 white=32 allowTiling=false
        // pair=1 black=32 white=30 allowTiling=false
    }
}
```

### Optional: naive backtracking (shows search fails; not required)

If you want to contrast "search" vs "proof," a small solver on a **smaller** board is enough for demos. Full 8x8 with two corners removed will thrash unless you prune hard. The point of the interview is you should **not** need that search.

```java
// Illustration only: try to tile a board represented as free cells.
// Returns true if some complete domino cover exists.
static boolean canTile(boolean[][] free) {
    int r = -1, c = -1;
    outer:
    for (int i = 0; i < free.length; i++) {
        for (int j = 0; j < free[i].length; j++) {
            if (free[i][j]) {
                r = i;
                c = j;
                break outer;
            }
        }
    }
    if (r < 0) {
        return true; // no free cells left: success
    }

    // place horizontal
    if (c + 1 < free[r].length && free[r][c + 1]) {
        free[r][c] = false;
        free[r][c + 1] = false;
        if (canTile(free)) {
            return true;
        }
        free[r][c] = true;
        free[r][c + 1] = true;
    }
    // place vertical
    if (r + 1 < free.length && free[r + 1][c]) {
        free[r][c] = false;
        free[r + 1][c] = false;
        if (canTile(free)) {
            return true;
        }
        free[r][c] = true;
        free[r + 1][c] = true;
    }
    return false;
}
```

For the mutilated 8x8 board, `colorCountsAllowTiling` already returns false, so you can skip calling `canTile`.

---

## 5. Walk through the classic cases

### Case A: opposite corners `(0,0)` and `(7,7)`

Both have even `r+c` (black in our convention).

```
Full board:  32 B, 32 W
Remove 2 B:  30 B, 32 W
Dominos need equal counts per color → impossible
```

### Case B: opposite corners `(0,7)` and `(7,0)`

Both odd `r+c` (white).

```
Remove 2 W:  32 B, 30 W
Still unequal → impossible
```

### Case C: mental mini-board 2x2, remove opposite corners

```
B W
W B
```

Remove both B: left with two W on a diagonal. No edge-adjacent pair remains. Two squares of the same color that only touch at a corner cannot take a domino. Same invariant, smaller picture.

### Case D: remove one black and one white

Counts: 31 B, 31 W. Coloring no longer forbids a tiling. Many configurations work. Say that out loud so the interviewer sees you know the boundary of the argument.

### Smoke test

```java
public static void main(String[] args) {
    int[] a = DominosBoard.remainingColorCounts(0);
    int[] b = DominosBoard.remainingColorCounts(1);
    assert a[0] + a[1] == 62;
    assert b[0] + b[1] == 62;
    assert a[0] != a[1];
    assert b[0] != b[1];
    assert !DominosBoard.colorCountsAllowTiling(0);
    assert !DominosBoard.colorCountsAllowTiling(1);
    System.out.println("counts invariant ok");
}
```

---

## 6. Complexity, edges, interview tips

| Topic | Answer |
| --- | --- |
| Decision for this instance | Impossible (no tiling) |
| Proof tool | Chessboard coloring; each domino takes one black + one white |
| After removing opposite corners | 30 of one color, 32 of the other |
| Time to "solve" with the proof | O(1) reasoning; O(n²) if you scan an n×n board to count |
| Extra space for a sketch | O(n²) for an explicit board, or O(1) if you only reason |
| Search alternative | Exponential backtracking; unnecessary once invariant fails |

**Common mistakes:**

1. **Trying to invent a special tiling layout** instead of looking for an invariant.
2. **Forgetting opposite corners are the same color.** Draw the four corners and mark colors first.
3. **Saying "62 is even so it works."** Even total size is necessary for dominos, not sufficient.
4. **Claiming equal black/white always tiles.** Necessary, not sufficient. Here you only need necessity.
5. **Mixing up opposite vs adjacent corners.** Adjacent corners differ in color; the classic trap uses opposite.
6. **Over-coding.** A correct two-minute proof beats a buggy thirty-minute solver.

**How to talk it (30-second version):**

1. Color the board black/white.
2. Each domino covers one of each.
3. Opposite corners are the same color, so removal leaves 30 and 32.
4. Therefore 31 dominos cannot cover the board.

**Where the idea shows up later:**

* Invariant arguments in puzzles (balance, parity, modular arithmetic).
* Matching theory intuition: dominos are edges in a bipartite graph of black vs white cells; unequal parts mean no perfect matching.
* Other "mutilated" board and grid-tiling questions in interviews.

---

## 7. Explain to a friend recap

Dominos (problem 6.3) is a **logic** problem, not a coding grind.

1. 8x8 board, two opposite corners gone: 62 squares, so 31 dominos would fit by count alone.
2. Color the board. Adjacent squares always have different colors.
3. Every domino covers one black and one white.
4. Opposite corners are the **same** color, so you remove two of one color.
5. Left with 30 and 32. A full tiling would need 31 and 31. Impossible.

If you can mark the four corners, state the same-color fact, and finish with the 30/32 count, you own problem 6.3. No need to place a single domino on the page.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Basketball](/blog/en/ctci-6-2-basketball)
* Next: [Ants on a Triangle](/blog/en/ctci-6-4-ants-on-a-triangle)