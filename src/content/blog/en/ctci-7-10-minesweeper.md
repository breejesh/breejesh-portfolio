---
title: "Minesweeper: Board, Cell, Bombs, and Zero Flood Fill (Java)"
description: "CTCI-style problem 7.10 for beginners: design a text Minesweeper with Cell and Board, random bomb placement, neighbor counts, click rules, and flood fill when you open a zero."
date: "2025-12-30"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-10-minesweeper.webp
previewImage: /assets/images/ctci-7-10-minesweeper.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 7.10 for beginners: design a text Minesweeper with Cell and Board, random bomb placement, neighbor counts, click rules, and flood fill when you open a zero.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

Design a **text-based Minesweeper**. An `N x N` board hides `B` bombs. Other cells hold a number (how many bombs sit in the eight neighbors) or zero (blank). Click a bomb and you lose. Click a number and that cell alone opens. Click a zero and the board expands: that blank, every connected blank, and the numbered ring around that blank region all open. Flag cells you think are bombs so you do not click them by accident. Win when every non-bomb cell is exposed.

This post is original teaching for beginners in **Java**. Same family as classic object-oriented game design interviews, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7, object-oriented design: Board, Cell, place bombs, click with flood fill on zeros.

---

## 1. Everyday analogy

Think of a paper grid covered with sticky notes. Under some notes there is a thumbtack (a bomb). Under the rest there is either a small count of nearby thumbtacks, or nothing.

You peel one sticky note:

* Thumbtack under it: game over.
* A number: only that note comes off.
* Blank: you keep peeling every blank sticky that touches this one, and you also peel the numbered notes that sit on the edge of that blank patch. You stop at numbers; you never peel through a number into the next blank unless that blank was already connected through zeros.

That blank expansion is **flood fill**. The board is a 2D grid of cells. The game object tracks whether you are still playing, already lost, or already won.

---

## 2. Plain problem statement

**Goal:** classes and methods for a playable text Minesweeper.

**Core pieces:**

| Piece | Role |
| --- | --- |
| `Cell` | one square: bomb or not, neighbor count, exposed?, flagged? |
| `Board` | grid of cells; place bombs; compute numbers; flip / flood fill |
| `Game` (optional but clean) | state, user click/flag, win/lose, print board |

**Rules:**

* Grid is `N x N` with exactly `B` bombs (or `rows x cols` if you generalize).
* A non-bomb cell's number is how many of its up to 8 neighbors are bombs.
* Left-click (uncover):
  * Bomb → lose (expose it; game ends).
  * Number > 0 → expose that cell only.
  * Number 0 → flood fill zeros and include bordering numbers.
* Right-click (flag): toggle a flag on a hidden cell. Flagged cells do not uncover on click.
* Win when every non-bomb cell is exposed. Flags do not have to match bombs to win (classic rule: only non-bombs must be open).

**Clarify in an interview:**

* Can the first click be guaranteed safe? (Nice product rule; not required for the classic statement.)
* Bomb placement: random unique cells, or a fixed list for tests?
* What does the text UI print for hidden, flagged, bomb, blank, number?
* Out-of-bounds clicks: ignore or throw?

**Signature shape:**

```java
class Cell { /* bomb, number, exposed, flagged */ }

class Board {
    Board(int n, int bombCount);
    void placeBombs(/* random or seed */);
    void setNumbers();
    // returns true if the click was safe (not a bomb), false if bomb hit
    boolean flipCell(int r, int c);
    void toggleFlag(int r, int c);
    boolean allNonBombsExposed();
    // optional: print for debugging
    void print(boolean revealAll);
}
```

---

## 3. Think first

### Classes first, pixels second

Interviewers want structure more than a polished UI.

* **`Cell`**: data for one square. Keep logic light (getters/setters, maybe `isBlank()`).
* **`Board`**: owns the 2D array, bomb placement, neighbor counts, uncover + flood fill.
* **`Game`**: loop, input, win/lose messages. Thin wrapper over `Board`.

You can merge Game into Board for a short interview. Prefer separation when you have time.

### Place bombs, then count neighbors

Order matters:

1. Create all cells as non-bombs, number 0, hidden, unflagged.
2. Place `B` bombs on distinct random cells.
3. For every non-bomb cell, count bomb neighbors in the 8 directions and store that count.

If you count first and place bombs second, every number is wrong.

```
directions (dr, dc):
  (-1,-1) (-1,0) (-1,1)
  ( 0,-1)        ( 0,1)
  ( 1,-1) ( 1,0) ( 1,1)
```

Skip coordinates outside the board. A corner has 3 neighbors, an edge has 5, a middle cell has 8.

### Click rules and flood fill

```
flip(r, c):
  if out of bounds or already exposed or flagged: return (no-op / still safe)
  if cell is bomb: expose it; return false (lose)
  // safe cell
  flood from (r, c) using BFS or DFS
  return true
```

Flood fill (BFS sketch):

1. Start a queue with `(r, c)`.
2. While the queue is not empty, take a cell:
   * If already exposed, skip.
   * Expose it.
   * If its number is **greater than 0**, do **not** expand further from this cell (it is the border of the blank region).
   * If its number is **0**, enqueue all 8 in-bounds neighbors that are still hidden and not flagged (and not bombs; zeros never sit on bombs if numbers were computed correctly).

That matches classic Minesweeper: numbers at the edge open, but the flood does not dig past them into disconnected zero regions.

### Why not only open the single zero?

If you open only one blank, the game feels broken. Players expect the cascade. Interviewers also want to hear "BFS/DFS flood fill" as the algorithm for connected blanks.

### Flagging

Flags are a UI safety latch:

* Toggle on a hidden cell.
* A flagged cell ignores uncover clicks.
* Flagging does not change bomb layout or neighbor numbers.
* Unflag before you can open that cell.

### Win condition

After a successful flip:

* Count exposed non-bomb cells, or track `remaining = N*N - B` and decrement as you expose.
* When remaining hits 0, state becomes WON.
* Hitting a bomb sets LOST immediately.

Tracking a counter is O(1) win checks. Scanning the grid after every click is O(N²) and fine for small boards.

### What not to overbuild

* No need for a full graphics framework.
* No need for multiplayer or timers unless asked.
* Inheritance trees for "NumberCell vs BombCell" rarely pay off; a simple `boolean isBomb` plus `int adjacent` is enough.

---

## 4. Java solution

### Cell

```java
class Cell {
    private final int row;
    private final int col;
    private boolean bomb;
    private boolean exposed;
    private boolean flagged;
    private int adjacentBombs; // 0..8 for non-bombs; unused or 0 for bombs

    Cell(int row, int col) {
        this.row = row;
        this.col = col;
    }

    int getRow() { return row; }
    int getCol() { return col; }

    boolean isBomb() { return bomb; }
    void setBomb(boolean bomb) { this.bomb = bomb; }

    boolean isExposed() { return exposed; }
    void setExposed(boolean exposed) { this.exposed = exposed; }

    boolean isFlagged() { return flagged; }
    void setFlagged(boolean flagged) { this.flagged = flagged; }

    int getAdjacentBombs() { return adjacentBombs; }
    void setAdjacentBombs(int n) { this.adjacentBombs = n; }

    boolean isBlank() {
        return !bomb && adjacentBombs == 0;
    }
}
```

### Board: construct, place bombs, set numbers

```java
import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.Queue;
import java.util.Random;
import java.util.Set;

class Board {
    private static final int[][] DIRS = {
        {-1, -1}, {-1, 0}, {-1, 1},
        {0, -1},           {0, 1},
        {1, -1},  {1, 0},  {1, 1}
    };

    private final int n;
    private final int bombCount;
    private final Cell[][] grid;
    private int unexposedSafe; // non-bomb cells still hidden
    private boolean exploded;

    Board(int n, int bombCount, long seed) {
        if (n <= 0) {
            throw new IllegalArgumentException("n must be positive");
        }
        if (bombCount < 0 || bombCount > n * n) {
            throw new IllegalArgumentException("invalid bombCount");
        }
        this.n = n;
        this.bombCount = bombCount;
        this.grid = new Cell[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                grid[r][c] = new Cell(r, c);
            }
        }
        placeBombs(seed);
        setNumbers();
        this.unexposedSafe = n * n - bombCount;
        this.exploded = false;
    }

    private void placeBombs(long seed) {
        Random rng = new Random(seed);
        Set<Integer> used = new HashSet<>();
        while (used.size() < bombCount) {
            int idx = rng.nextInt(n * n);
            if (!used.add(idx)) {
                continue;
            }
            int r = idx / n;
            int c = idx % n;
            grid[r][c].setBomb(true);
        }
    }

    private void setNumbers() {
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c].isBomb()) {
                    continue;
                }
                int count = 0;
                for (int[] d : DIRS) {
                    int nr = r + d[0];
                    int nc = c + d[1];
                    if (inBounds(nr, nc) && grid[nr][nc].isBomb()) {
                        count++;
                    }
                }
                grid[r][c].setAdjacentBombs(count);
            }
        }
    }

    private boolean inBounds(int r, int c) {
        return r >= 0 && r < n && c >= 0 && c < n;
    }

    Cell getCell(int r, int c) {
        return grid[r][c];
    }

    boolean hasExploded() {
        return exploded;
    }

    boolean isWon() {
        return !exploded && unexposedSafe == 0;
    }
}
```

### Board: flag and click with flood fill

```java
    /** Toggle flag on a hidden cell. No-op if already exposed. */
    void toggleFlag(int r, int c) {
        if (!inBounds(r, c) || exploded || isWon()) {
            return;
        }
        Cell cell = grid[r][c];
        if (cell.isExposed()) {
            return;
        }
        cell.setFlagged(!cell.isFlagged());
    }

    /**
     * Uncover cell (r, c). Returns false if a bomb was hit.
     * Returns true if the click was safe or ignored (flagged / already open).
     */
    boolean flipCell(int r, int c) {
        if (!inBounds(r, c) || exploded || isWon()) {
            return !exploded;
        }
        Cell start = grid[r][c];
        if (start.isExposed() || start.isFlagged()) {
            return true;
        }
        if (start.isBomb()) {
            start.setExposed(true);
            exploded = true;
            return false;
        }

        // BFS flood fill for zeros; expose bordering numbers
        Queue<Cell> q = new ArrayDeque<>();
        q.add(start);

        while (!q.isEmpty()) {
            Cell cur = q.poll();
            if (cur.isExposed() || cur.isFlagged() || cur.isBomb()) {
                continue;
            }
            cur.setExposed(true);
            unexposedSafe--;

            if (cur.getAdjacentBombs() > 0) {
                // number cell: stop expanding through it
                continue;
            }

            // blank (zero): expand to all neighbors
            int cr = cur.getRow();
            int cc = cur.getCol();
            for (int[] d : DIRS) {
                int nr = cr + d[0];
                int nc = cc + d[1];
                if (!inBounds(nr, nc)) {
                    continue;
                }
                Cell next = grid[nr][nc];
                if (!next.isExposed() && !next.isFlagged() && !next.isBomb()) {
                    q.add(next);
                }
            }
        }
        return true;
    }
```

### Text print (optional helper)

```java
    /**
     * Text view. If revealAll is true, show bombs and numbers regardless of exposed.
     * Hidden: '.', flagged: 'F', bomb: '*', blank: ' ', number: digit char.
     */
    void print(boolean revealAll) {
        for (int r = 0; r < n; r++) {
            StringBuilder line = new StringBuilder();
            for (int c = 0; c < n; c++) {
                Cell cell = grid[r][c];
                char ch;
                if (!revealAll && cell.isFlagged() && !cell.isExposed()) {
                    ch = 'F';
                } else if (!revealAll && !cell.isExposed()) {
                    ch = '.';
                } else if (cell.isBomb()) {
                    ch = '*';
                } else if (cell.getAdjacentBombs() == 0) {
                    ch = ' ';
                } else {
                    ch = (char) ('0' + cell.getAdjacentBombs());
                }
                line.append(ch).append(' ');
            }
            System.out.println(line.toString().trim());
        }
    }
```

### Tiny walkthrough

Suppose a 3x3 board with one bomb at `(1,1)`. Numbers around it are all `1`. Center is `*`. Corners and edges that touch the bomb show `1`. There is no zero region, so every safe click opens exactly one cell. Eight safe clicks win; clicking the center loses.

Now a 5x5 board with bombs only near the corners so the middle is a sea of zeros. Click the center:

1. Center is 0 → enqueue neighbors.
2. Each neighboring 0 exposes and expands.
3. Numbered cells on the rim of that zero lake expose once and stop the flood.
4. One click can open dozens of cells. That is the feature interviewers want you to implement carefully.

### Deterministic tests without full UI

```java
// fixed seed so bomb layout is stable in unit tests
Board board = new Board(5, 3, 42L);
assert board.flipCell(2, 2); // hope safe; adjust seed if needed
board.toggleFlag(0, 0);
assert !board.hasExploded();
// after enough safe flips:
// assert board.isWon();
```

For interview demos, hardcode bomb positions instead of random if you want a fixed storyboard.

```java
// alternative for demos: placeBombsFromList(List of [r,c])
```

---

## 5. Complexity table

| Operation | Time | Space notes |
| --- | --- | --- |
| Construct grid | O(N²) | N² cells |
| Place B bombs | O(B) expected with set; worst O(N²) retries if dense | set of indices |
| setNumbers | O(N²) | 8 neighbor checks per cell |
| flipCell on a number | O(1) | expose one cell |
| flipCell on a large zero region | O(K) for K cells opened (up to O(N²)) | BFS queue O(K) |
| toggleFlag | O(1) | |
| Win check with counter | O(1) | `unexposedSafe` |
| Full scan win check | O(N²) | no extra field |

For interview sizes (N around 8 to 30), every approach above is fine. State the flood fill bound as "work proportional to cells revealed."

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **N = 1, B = 1:** only cell is a bomb. First click loses. Win is impossible without a special rule.
* **N = 1, B = 0:** one blank. Click it once and you win.
* **B = 0:** whole board is zeros. One click flood-fills everything and wins.
* **B = N²:** every cell is a bomb. No safe click.
* **Click out of bounds:** ignore or throw; state the contract.
* **Click flagged cell:** no uncover (must unflag first).
* **Click already exposed:** no-op, still safe.
* **Double expose in BFS:** guard with `isExposed` so you do not decrement `unexposedSafe` twice.
* **Flood through numbers:** wrong. Numbers open but do not enqueue their neighbors.
* **Flood into bombs:** never enqueue bomb cells. Zeros never have bomb neighbors in the "is bomb" sense for expansion, but still check `!isBomb()` for safety.

Common mistakes:

1. **Counting neighbors before placing bombs.**
2. **Only 4 directions** instead of 8 (Minesweeper uses diagonals).
3. **Opening only the clicked zero** with no flood fill.
4. **Expanding past numbers** into unrelated regions.
5. **Forgetting flags block clicks.**
6. **Win when all bombs are flagged** instead of when all non-bombs are open (classic win is exposure of safe cells).
7. **Off-by-one on `unexposedSafe`** when re-visiting a cell in the queue.
8. **Printing bombs to the player** while the game is still running (debug view vs player view).

Minimal smoke idea:

```java
Board empty = new Board(3, 0, 1L);
assert empty.flipCell(1, 1);
assert empty.isWon(); // all zeros opened in one flood

Board one = new Board(1, 1, 1L);
assert !one.flipCell(0, 0);
assert one.hasExploded();
```

---

## 7. Explain to a friend recap

Minesweeper as an OOD problem is three ideas:

1. **`Cell`** holds bomb, number, exposed, flagged for one square.
2. **`Board`** places `B` bombs, then writes neighbor counts with 8 directions.
3. **Click** either loses on a bomb, opens one number, or **BFS/DFS flood fills** a zero region and its numbered border. Flags only block accidental clicks. You win when every non-bomb cell is exposed.

If you can draw a small board, place bombs, fill numbers, and walk a flood fill by hand, you own problem 7.10. Interviewers care that your classes match the nouns of the game and that zero expansion is a real graph search on the grid, not a vague "open nearby cells."

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Circular Array](/blog/en/ctci-7-9-circular-array)
* Next: [File System](/blog/en/ctci-7-11-file-system)