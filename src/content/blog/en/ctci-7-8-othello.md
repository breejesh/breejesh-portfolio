---
title: "Othello: Board, Color, Game, and Flip Rules in Java OOD"
description: "CTCI-style problem 7.8 for beginners: design Othello (Reversi) with Board, Piece color, Game flow, and capture flip logic. Original Java sketch, not a book copy."
date: "2025-08-23"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-7-8-othello.webp
previewImage: /assets/images/ctci-7-8-othello.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 7.8 for beginners: design Othello (Reversi) with Board, Piece color, Game flow, and capture flip logic. Original Java sketch, not a book copy.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

**Othello** (also called Reversi) is a two-player board game. Each disc is black on one face and white on the other. When you sandwich opponent discs between your new disc and another of yours, those discs flip to your color. On your turn you must capture at least one piece. When neither player has a legal move, the game ends. Whoever has more discs wins.

This is an **object-oriented design** problem. Interviewers want classes, responsibilities, and a clear flip algorithm, not a full AI. This post is original teaching for beginners with a **Java** sketch: `Color`, `Piece`, `Board`, `Player`, `Game`. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7, object-oriented design.

---

## 1. Everyday analogy

Think of a green plastic board and a pile of two-sided coins. Black and white sit in the center in a small diamond. You drop a coin of your color so it pinches a straight line of the other color against one of your coins already on the board. Flip every coin in that line. Then it is the other person's turn.

The design job is not "write Stockfish for Othello." It is: who owns the grid, who knows the current color of a disc, who decides if a move is legal, and who tracks whose turn it is when the board has no legal moves left.

---

## 2. Plain problem statement

**Rules you should state out loud:**

* Two players: Black and White. Standard board is **8x8** (confirm size with the interviewer; some sketches use 10x10).
* Start with four discs in the center: two black, two white, alternating.
* A legal move places your color on an **empty** cell such that, in at least one straight line (row, column, or diagonal), you enclose one or more opponent discs between the new disc and another disc of yours.
* All enclosed opponent discs on those lines **flip** to your color.
* You must flip at least one disc. Passing when you still have a move is not allowed. If you have no move, you skip (or the game ends when both cannot move; say which rule you pick).
* End: no legal moves remain for either side (or the board is full). Winner = more discs of your color. Tie if equal.

**Classic Othello vs a thinner problem statement:** full Othello flips in **eight** directions (including diagonals). Some problem blurbs only mention left/right and up/down. In an interview, ask. Below we implement **eight directions**, because that matches the real game and is the harder case.

**What to design:**

* Classes and enums
* How a move is validated and applied
* Who keeps score and turn order
* How the game decides it is over

**Not required unless asked:** minimax AI, network multiplayer, graphics, undo history.

---

## 3. Think first

### Core objects

| Object | Job |
| --- | --- |
| `Color` | `BLACK`, `WHITE`, and maybe `EMPTY` for cells |
| `Piece` | One disc: current color, `flip()` |
| `Board` | Grid, place move, flip lines, score counts |
| `Player` | Color, attempt a move |
| `Game` | Two players, whose turn, start, end, winner |

### Design forks worth saying out loud

**BlackPiece and WhitePiece subclasses?** Usually no. A disc flips many times. Destroying a black object and creating a white one on every flip is noisy. One `Piece` with a `Color` field is simpler.

**Separate `Game` and `Board`?** Yes if you can afford the layer. `Board` knows geometry and flips. `Game` knows turn order, pass rules, and "who won." Merging them works for a tiny sketch; separate classes read better in interviews.

**Who keeps score?** `Board` can keep running black/white counts and update them when pieces are added or flipped. Scanning the grid after every move is fine for 8x8 too (`O(1)` board size).

**Singleton `Game`?** Optional. Handy if everything reaches the board through one instance. Awkward if you ever want two concurrent games in tests. Prefer a normal instance unless the interviewer pushes singleton.

**Empty cells:** `null` in `Piece[][]`, or a sentinel color `EMPTY`. Either works. Null needs care. A `Color` enum with `EMPTY` makes bounds checks cleaner in some sketches.

### Flip algorithm (the hard kernel)

Eight direction vectors:

```
(-1,-1) (-1,0) (-1,1)
( 0,-1)        ( 0,1)
( 1,-1) ( 1,0) ( 1,1)
```

For a candidate cell `(r, c)` and color `me`:

1. Cell must be in bounds and empty.
2. For each direction `d`:
   * Step once: you need at least one opponent disc.
   * Keep stepping while cells are opponent discs.
   * If you then hit a disc of `me`, this direction is a **capture line**. Collect those intermediate cells (or count them).
   * If you hit empty or edge before `me`, this direction fails.
3. If no direction captured anything, the move is illegal.
4. If legal: place `me` at `(r, c)`, flip every collected opponent cell, update scores, switch turn.

That loop is the whole game. UI is decoration around it.

### Initialization

Standard 8x8 center (0-based rows/cols, board size `n = 8`):

```
(n/2-1, n/2-1) = WHITE
(n/2-1, n/2)   = BLACK
(n/2,   n/2-1) = BLACK
(n/2,   n/2)   = WHITE
```

Black usually moves first. Say it.

---

## 4. Java solution (design sketch)

This is a teaching skeleton, not a shipping product. Focus on clear ownership and correct flips.

### Color and directions

```java
public enum Color {
    BLACK,
    WHITE,
    EMPTY;

    public Color opposite() {
        if (this == BLACK) return WHITE;
        if (this == WHITE) return BLACK;
        return EMPTY;
    }
}

/** Eight rays used by classic Othello / Reversi. */
public final class Directions {
    public static final int[][] DIRS = {
        {-1, -1}, {-1, 0}, {-1, 1},
        { 0, -1},          { 0, 1},
        { 1, -1}, { 1, 0}, { 1, 1}
    };

    private Directions() {}
}
```

### Piece

```java
public class Piece {
    private Color color;

    public Piece(Color color) {
        if (color == null || color == Color.EMPTY) {
            throw new IllegalArgumentException("piece needs BLACK or WHITE");
        }
        this.color = color;
    }

    public Color getColor() {
        return color;
    }

    public void flip() {
        color = color.opposite();
    }
}
```

### Board: place, flip, score

```java
import java.util.ArrayList;
import java.util.List;

public class Board {
    private final int size;
    private final Piece[][] grid;
    private int blackCount;
    private int whiteCount;

    public Board(int size) {
        if (size < 2 || size % 2 != 0) {
            throw new IllegalArgumentException("size should be even and >= 2");
        }
        this.size = size;
        this.grid = new Piece[size][size];
    }

    public void initialize() {
        // clear
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                grid[r][c] = null;
            }
        }
        blackCount = 0;
        whiteCount = 0;

        int m = size / 2;
        setPiece(m - 1, m - 1, Color.WHITE);
        setPiece(m - 1, m, Color.BLACK);
        setPiece(m, m - 1, Color.BLACK);
        setPiece(m, m, Color.WHITE);
    }

    private void setPiece(int r, int c, Color color) {
        grid[r][c] = new Piece(color);
        if (color == Color.BLACK) blackCount++;
        else whiteCount++;
    }

    public boolean inBounds(int r, int c) {
        return r >= 0 && r < size && c >= 0 && c < size;
    }

    public Color colorAt(int r, int c) {
        if (!inBounds(r, c) || grid[r][c] == null) return Color.EMPTY;
        return grid[r][c].getColor();
    }

    /**
     * Returns cells that would flip if me plays at (r, c).
     * Empty list means illegal move.
     */
    public List<int[]> capturesIfPlace(int r, int c, Color me) {
        List<int[]> all = new ArrayList<>();
        if (!inBounds(r, c) || grid[r][c] != null || me == Color.EMPTY) {
            return all;
        }
        Color opp = me.opposite();

        for (int[] d : Directions.DIRS) {
            int nr = r + d[0];
            int nc = c + d[1];
            List<int[]> line = new ArrayList<>();

            // need at least one opponent
            while (inBounds(nr, nc) && colorAt(nr, nc) == opp) {
                line.add(new int[] { nr, nc });
                nr += d[0];
                nc += d[1];
            }

            // line ends with our color
            if (!line.isEmpty() && inBounds(nr, nc) && colorAt(nr, nc) == me) {
                all.addAll(line);
            }
        }
        return all;
    }

    public boolean isLegalMove(int r, int c, Color me) {
        return !capturesIfPlace(r, c, me).isEmpty();
    }

    /** Place me at (r, c). Returns false if illegal. */
    public boolean place(int r, int c, Color me) {
        List<int[]> flips = capturesIfPlace(r, c, me);
        if (flips.isEmpty()) return false;

        grid[r][c] = new Piece(me);
        if (me == Color.BLACK) blackCount++;
        else whiteCount++;

        for (int[] cell : flips) {
            Piece p = grid[cell[0]][cell[1]];
            Color before = p.getColor();
            p.flip();
            // one less for opponent, one more for me
            if (before == Color.BLACK) {
                blackCount--;
                whiteCount++;
            } else {
                whiteCount--;
                blackCount++;
            }
        }
        return true;
    }

    public boolean hasAnyMove(Color me) {
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                if (isLegalMove(r, c, me)) return true;
            }
        }
        return false;
    }

    public int getScore(Color c) {
        if (c == Color.BLACK) return blackCount;
        if (c == Color.WHITE) return whiteCount;
        return 0;
    }

    public int getSize() {
        return size;
    }
}
```

### Player and Game

```java
public class Player {
    private final Color color;

    public Player(Color color) {
        this.color = color;
    }

    public Color getColor() {
        return color;
    }
}

public class Game {
    public enum State { RUNNING, BLACK_WINS, WHITE_WINS, DRAW }

    private final Board board;
    private final Player black;
    private final Player white;
    private Color turn;
    private State state;

    public Game(int size) {
        board = new Board(size);
        black = new Player(Color.BLACK);
        white = new Player(Color.WHITE);
        turn = Color.BLACK;
        state = State.RUNNING;
        board.initialize();
    }

    public Color getTurn() {
        return turn;
    }

    public State getState() {
        return state;
    }

    public Board getBoard() {
        return board;
    }

    /**
     * Current player tries (r, c).
     * Returns true if the disc was placed.
     */
    public boolean play(int r, int c) {
        if (state != State.RUNNING) return false;
        if (!board.place(r, c, turn)) return false;
        advanceTurnOrFinish();
        return true;
    }

    private void advanceTurnOrFinish() {
        Color next = turn.opposite();
        if (board.hasAnyMove(next)) {
            turn = next;
            return;
        }
        // opponent must pass
        if (board.hasAnyMove(turn)) {
            // same player moves again
            return;
        }
        // neither can move
        finish();
    }

    private void finish() {
        int b = board.getScore(Color.BLACK);
        int w = board.getScore(Color.WHITE);
        if (b > w) state = State.BLACK_WINS;
        else if (w > b) state = State.WHITE_WINS;
        else state = State.DRAW;
    }
}
```

### Tiny play sequence (mental check)

After `initialize()` on 8x8, Black plays a legal opening (for example a classic center-adjacent square). `place` must:

1. Reject empty lines that do not sandwich white.
2. Flip exactly the sandwiched whites on each successful ray.
3. Leave `blackCount + whiteCount` equal to discs on the board.

If a later position has no moves for White but Black still has one, Black plays again. If both have none, call `finish()`.

---

## 5. Complexity

Board size `n` is fixed at 8 in the real game, so everything is constant time in practice. If `n` is general:

| Operation | Time | Space |
| --- | --- | --- |
| `capturesIfPlace` | O(n) worst (8 rays, each up to n steps) | O(n) for flip list |
| `place` | O(n) | O(n) |
| `hasAnyMove` | O(n² · n) = O(n³) naive | O(n) |
| Full game (at most n² moves) | O(n⁵) with naive hasAnyMove each turn | O(n²) board |

For interviews, say: **8x8 is tiny**. Correctness of flips beats asymptotic cleverness. If they push optimization, precompute legal moves after each place, or scan only empties.

---

## 6. Edge cases and pitfalls

* **Playing on occupied cell:** illegal.
* **Playing with zero flips:** illegal even if empty.
* **Edge and corner cells:** fewer directions; still use the same loop.
* **Diagonal-only capture:** must work if you claim eight directions.
* **Pass when opponent has no move but you do:** same color plays again; do not end early.
* **Both stuck with empty squares left:** still end the game; empty squares do not flip by themselves.
* **Score drift:** if you flip a piece, adjust both counts. Easy off-by-one if you only increment the winner of the flip.
* **Subclassing Black/White pieces:** avoid; color is state, not type.
* **Forgetting diagonals** when the interviewer expects real Othello.
* **Hardcoding 10x10** without asking; standard is 8x8.

Common mistakes:

1. Flipping the whole ray including empty cells.
2. Flipping when the ray hits the edge without a matching disc of yours.
3. Allowing a move that only "touches" one opponent with no closing disc.
4. Ending the game on the first pass instead of checking the other player.
5. Putting all rules only in `Player` so the board cannot validate AI or network moves the same way.

Minimal smoke ideas:

```java
Game g = new Game(8);
// center is set; try an illegal far corner
System.out.println(g.play(0, 0)); // false
// try a known legal opening for Black on standard setup
// (exact coordinates depend on your center convention; assert isLegalMove first)
Board b = g.getBoard();
for (int r = 0; r < 8; r++) {
    for (int c = 0; c < 8; c++) {
        if (b.isLegalMove(r, c, Color.BLACK)) {
            System.out.println("legal " + r + "," + c);
        }
    }
}
```

---

## 7. Explain to a friend recap

1. Othello is sandwich-and-flip on a grid. Your new disc must trap opponent discs in a straight line against another of yours.
2. Model **color as data**, not as two subclasses that you rebuild on every flip.
3. `Board` owns the grid and the flip math. `Game` owns turns and end conditions.
4. Check eight directions. A direction counts only if you walk through one or more opponents and then hit yourself.
5. Illegal move = empty cell with zero capture lines. Legal move places, flips, updates scores.
6. If the opponent has no move, you may play again. If neither has a move, compare counts.

If you can draw the ray walk on paper and name which class owns it, you own problem 7.8. Object design here is mostly "put flip logic in one place and keep turn rules boring."

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Chat Server](/blog/en/ctci-7-7-chat-server)
* Next: [Circular Array](/blog/en/ctci-7-9-circular-array)