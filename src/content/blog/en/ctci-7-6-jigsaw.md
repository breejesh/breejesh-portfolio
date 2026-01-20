---
title: "Jigsaw: Match Piece Edges IN OUT FLAT to Solve the Board (Java)"
description: "CTCI-style problem 7.6 for beginners: model jigsaw pieces with four edges (INNER, OUTER, FLAT), rotate them, and fill an N by N board by matching opposite sides. Object design plus a simple solver sketch in Java."
date: "2026-01-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-6-jigsaw.webp
previewImage: /assets/images/ctci-7-6-jigsaw.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 7.6 for beginners: model jigsaw pieces with four edges (INNER, OUTER, FLAT), rotate them, and fill an N by N board by matching opposite sides. Object design plus a simple solver sketch in Java.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A jigsaw is a board of pieces. Each piece has four sides. A side is either a **tab** (sticks out), a **socket** (cuts in), or **flat** (straight, only on the outer rim of the finished puzzle). Two pieces lock when a tab meets a socket. Flat sides only sit against the table edge, not against another piece's flat in the middle.

This is classic object-oriented design with a thin algorithm layer on top. You need classes that hold edges and orientation, rules for "do these two edges fit," and a way to try pieces into empty cells until the board is full. Original teaching for beginners in **Java**. Same problem family as interview OOD puzzles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide).

---

## 1. Everyday analogy

Think of a 3 by 3 kids' puzzle on the coffee table.

* The **four corner** pieces each have two flat sides. You can feel them first.
* The **edge** pieces (not corners) have exactly one flat side.
* The **center** piece has no flats: only tabs and sockets.

You never force two flats together in the middle. You never put two tabs against each other. Tab goes into socket. After you place a piece, its right edge must fit the left edge of the neighbor to the right, and so on for up and down.

Rotation matters. The same physical piece can sit in four orientations. In code you either rotate the edge array or store an orientation index and map "top" to the correct physical side.

---

## 2. Plain problem statement

**Goal:** design types and methods for an **N by N** jigsaw and a solver that places every piece so all adjacent edges match.

**Edge shapes (typical interview model):**

| Shape | Meaning |
| --- | --- |
| `FLAT` | Straight border. On the outer rim of the finished puzzle. |
| `INNER` | Socket / indent. Accepts an `OUTER`. |
| `OUTER` | Tab / protrusion. Fits into an `INNER`. |

Some writeups use `IN` / `OUT` instead of `INNER` / `OUTER`. Same idea.

**Piece:**

* Four edges in order: top, right, bottom, left (or any fixed order you stick to).
* Optional id so you can track which physical piece is where.
* Ability to **rotate** 90 degrees clockwise (or counterclockwise). Four orientations.

**Puzzle / board:**

* Grid of size `N x N`, each cell empty or holding one piece (with orientation).
* Pool of free pieces not yet placed.
* Method to **solve**: fill the grid so every shared border matches and outer cells use flats on the true outer sides.

**Matching rule:**

* `INNER` fits `OUTER` and `OUTER` fits `INNER`.
* `FLAT` fits only another `FLAT` if you ever compare flats (border logic usually checks "this side faces outside, so it must be FLAT" rather than pairing flat to flat between two pieces).
* Two pieces that share a side must present complementary shapes on the touching edges.

**Clarify in an interview:**

* Is the puzzle always square? (Usually yes, `N x N`.)
* Unique solution assumed? (Often yes for the toy model.)
* Are edge profiles unique enough that only true mates match, or do many edges share the same shape type? (Type-only matching is weaker; real puzzles have unique curves. Interviews usually use the three-type model.)
* Can pieces flip (mirror)? Classic CTCI-style often allows **rotate only**, no flip.

**Signature sketch:**

```java
enum EdgeType { INNER, OUTER, FLAT }

boolean fitsWith(EdgeType a, EdgeType b); // INNER+OUTER or OUTER+INNER

class Piece {
    void rotateClockwise();
    EdgeType edgeAt(Orientation side); // TOP, RIGHT, BOTTOM, LEFT after rotation
}

class Puzzle {
    boolean solve();
    Piece[][] getBoard();
}
```

---

## 3. Think first

### Classes you almost always want

1. **`EdgeType`** (or `Shape`): the three values.
2. **`Orientation`**: `TOP`, `RIGHT`, `BOTTOM`, `LEFT` (and maybe rotation helpers).
3. **`Piece`**: four edges, id, rotate, get edge facing a direction.
4. **`Puzzle`**: board, free list, place/remove, solve.

Some solutions also add an `Edge` object with a pointer to the parent piece and a "matched" flag. Useful if you group edges by type. Not required for a small solver.

### Where each piece can go (geometry filter)

Before you try every free piece in every cell:

| Location | Flat count / rule |
| --- | --- |
| Corner (4 cells) | Exactly two flats, on the two outer sides of that corner |
| Border non-corner | Exactly one flat, on the outer side |
| Interior | Zero flats |

That cuts the search space hard. You do not try a center-style piece in a corner.

### Solver strategies

**A. Group then place (greedy-ish)**

1. Split free pieces into corners, edges, interior by flat count.
2. Place four corners (try orientations that put flats on the outside).
3. Fill border cells, then interior.
4. At each cell, try remaining candidates in each rotation; accept the first that fits neighbors already placed; backtrack on failure.

**B. Pure backtracking cell by cell**

Walk cells in row-major order. For each empty cell, try every remaining piece and every rotation. Check fit against already filled neighbors (left and above are enough if you fill left-to-right, top-to-bottom). Recurse. Undo on failure.

Both are fine in an interview. Grouping by corner/edge/interior shows you thought about structure. Pure backtracking is easier to code under time pressure.

### Fit check against neighbors

When placing piece `p` at `(r, c)`:

* If `c > 0` and left cell filled: `p`'s LEFT must fit neighbor's RIGHT.
* If `r > 0` and above filled: `p`'s TOP must fit neighbor's BOTTOM.
* If on outer rim: the outer-facing side(s) must be `FLAT`.
* Optionally, if right/below already filled (rare if you fill in order): check those too.

```java
static boolean edgesMatch(EdgeType a, EdgeType b) {
    if (a == EdgeType.FLAT || b == EdgeType.FLAT) {
        return a == EdgeType.FLAT && b == EdgeType.FLAT; // rarely used mid-board
    }
    return (a == EdgeType.INNER && b == EdgeType.OUTER)
        || (a == EdgeType.OUTER && b == EdgeType.INNER);
}
```

For the border, prefer an explicit "outer side must be FLAT" check over inventing a phantom neighbor with flat edges.

### Rotation model

Store edges in an array of length 4: index `0 = TOP`, `1 = RIGHT`, `2 = BOTTOM`, `3 = LEFT`.

Clockwise 90 degrees:

```
new[0] = old[3]  // old LEFT becomes TOP
new[1] = old[0]  // old TOP becomes RIGHT
new[2] = old[1]
new[3] = old[2]
```

Or keep original edges fixed and store `orientation` in `0..3`, then map:

```
physicalIndex = (requestedSide + orientation) % 4
```

Either style works. Pick one and use it everywhere.

---

## 4. Java solution

Compact model: piece with four edge types, board, and recursive solve left-to-right, top-to-bottom. Pieces are unique objects in a free list.

```java
import java.util.ArrayList;
import java.util.List;

enum EdgeType {
    INNER, OUTER, FLAT
}

enum Side {
    TOP, RIGHT, BOTTOM, LEFT;

    int index() {
        return ordinal(); // TOP=0 ... LEFT=3
    }
}

final class Piece {
    private final int id;
    // edges[0]=TOP, [1]=RIGHT, [2]=BOTTOM, [3]=LEFT in current orientation
    private final EdgeType[] edges;

    Piece(int id, EdgeType top, EdgeType right, EdgeType bottom, EdgeType left) {
        this.id = id;
        this.edges = new EdgeType[] { top, right, bottom, left };
    }

    int getId() {
        return id;
    }

    EdgeType edge(Side side) {
        return edges[side.index()];
    }

    void rotateClockwise() {
        EdgeType top = edges[0];
        edges[0] = edges[3];
        edges[3] = edges[2];
        edges[2] = edges[1];
        edges[1] = top;
    }

    int flatCount() {
        int n = 0;
        for (EdgeType e : edges) {
            if (e == EdgeType.FLAT) {
                n++;
            }
        }
        return n;
    }
}

final class Puzzle {
    private final int n;
    private final Piece[][] board;
    private final List<Piece> free;

    Puzzle(int n, List<Piece> pieces) {
        if (pieces.size() != n * n) {
            throw new IllegalArgumentException("Need n*n pieces");
        }
        this.n = n;
        this.board = new Piece[n][n];
        this.free = new ArrayList<>(pieces);
    }

    Piece[][] getBoard() {
        return board;
    }

    static boolean complementary(EdgeType a, EdgeType b) {
        return (a == EdgeType.INNER && b == EdgeType.OUTER)
            || (a == EdgeType.OUTER && b == EdgeType.INNER);
    }

    private boolean fits(Piece p, int r, int c) {
        // Outer rim must be FLAT on the outside
        if (r == 0 && p.edge(Side.TOP) != EdgeType.FLAT) {
            return false;
        }
        if (r == n - 1 && p.edge(Side.BOTTOM) != EdgeType.FLAT) {
            return false;
        }
        if (c == 0 && p.edge(Side.LEFT) != EdgeType.FLAT) {
            return false;
        }
        if (c == n - 1 && p.edge(Side.RIGHT) != EdgeType.FLAT) {
            return false;
        }

        // Interior sides that face inside should not be FLAT
        if (r > 0 && p.edge(Side.TOP) == EdgeType.FLAT) {
            return false;
        }
        if (r < n - 1 && p.edge(Side.BOTTOM) == EdgeType.FLAT) {
            return false;
        }
        if (c > 0 && p.edge(Side.LEFT) == EdgeType.FLAT) {
            return false;
        }
        if (c < n - 1 && p.edge(Side.RIGHT) == EdgeType.FLAT) {
            return false;
        }

        if (c > 0) {
            Piece left = board[r][c - 1];
            if (left != null && !complementary(left.edge(Side.RIGHT), p.edge(Side.LEFT))) {
                return false;
            }
        }
        if (r > 0) {
            Piece up = board[r - 1][c];
            if (up != null && !complementary(up.edge(Side.BOTTOM), p.edge(Side.TOP))) {
                return false;
            }
        }
        return true;
    }

    boolean solve() {
        return solveCell(0, 0);
    }

    private boolean solveCell(int r, int c) {
        if (r == n) {
            return true; // filled every row
        }
        int nextR = (c == n - 1) ? r + 1 : r;
        int nextC = (c == n - 1) ? 0 : c + 1;

        // Snapshot free list size; we remove/add by index
        for (int i = 0; i < free.size(); i++) {
            Piece p = free.remove(i);
            for (int rot = 0; rot < 4; rot++) {
                if (fits(p, r, c)) {
                    board[r][c] = p;
                    if (solveCell(nextR, nextC)) {
                        return true;
                    }
                    board[r][c] = null;
                }
                p.rotateClockwise();
            }
            free.add(i, p); // restore at same index so order stays stable
        }
        return false;
    }
}
```

Tiny 2 by 2 smoke idea (four corner pieces only):

```java
// Each piece: two flats on outer sides after correct rotation.
// Piece A intended top-left: FLAT top, OUTER right, INNER bottom, FLAT left
List<Piece> pieces = new ArrayList<>();
pieces.add(new Piece(0, EdgeType.FLAT, EdgeType.OUTER, EdgeType.INNER, EdgeType.FLAT));
pieces.add(new Piece(1, EdgeType.FLAT, EdgeType.FLAT, EdgeType.OUTER, EdgeType.INNER));
pieces.add(new Piece(2, EdgeType.OUTER, EdgeType.INNER, EdgeType.FLAT, EdgeType.FLAT));
pieces.add(new Piece(3, EdgeType.INNER, EdgeType.FLAT, EdgeType.FLAT, EdgeType.OUTER));

Puzzle puzzle = new Puzzle(2, pieces);
System.out.println(puzzle.solve()); // true if the mates line up
```

Walkthrough for one placement:

| Step | Action | Check |
| --- | --- | --- |
| 1 | Try piece at (0,0) | TOP and LEFT must be FLAT; BOTTOM/RIGHT not FLAT |
| 2 | Try piece at (0,1) | TOP and RIGHT FLAT; LEFT complements (0,0)'s RIGHT |
| 3 | Try piece at (1,0) | BOTTOM and LEFT FLAT; TOP complements (0,0)'s BOTTOM |
| 4 | Try piece at (1,1) | BOTTOM and RIGHT FLAT; matches left and above |
| 5 | No cells left | `solve` returns true |

If a cell has no candidate in any rotation, backtrack: clear the cell, rotate or swap the previous piece, continue.

### Optional: group corners first

```java
List<Piece> corners = new ArrayList<>();
List<Piece> borders = new ArrayList<>();
List<Piece> interior = new ArrayList<>();
for (Piece p : all) {
    int f = p.flatCount();
    if (f == 2) {
        corners.add(p);
    } else if (f == 1) {
        borders.add(p);
    } else if (f == 0) {
        interior.add(p);
    } else {
        throw new IllegalStateException("Odd flat count: " + f);
    }
}
// For N=2 there is no interior and no single-flat border pieces.
// For N>=3: 4 corners, 4*(N-2) edge pieces, (N-2)*(N-2) interior.
```

Use the right list when filling each cell type. Same `fits` and backtracking, smaller candidate sets.

---

## 5. Complexity table

| Piece | Time | Notes |
| --- | --- | --- |
| `rotateClockwise` | O(1) | four edge slots |
| `fits` | O(1) | a few neighbor checks |
| `solve` worst case | O((N^2)! * 4^{N^2}) naive | every permutation and rotation; pruning helps a lot |
| Grouped candidates | still exponential | fewer tries per cell in practice |
| Space | O(N^2) | board + free list |

Interviewers care more that you name the exponential search and the pruning (rim flats, neighbor complements, corner groups) than that you invent a polynomial jigsaw algorithm. Real puzzle apps add unique edge signatures so matching is nearly deterministic.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **N = 1:** single piece, all four sides FLAT. Solve is "place it if all flat."
* **N = 2:** only corners (each two flats). No pure edge or interior pieces.
* **Wrong flat on outer side:** piece might match a neighbor but still be illegal on the rim.
* **FLAT inside:** never put a flat against another piece's INNER/OUTER.
* **Forgetting rotation:** a correct piece fails every cell until you try all four turns.
* **Mutating free list wrong:** remove/add bugs skip pieces or infinite-loop.
* **Comparing same absolute edge after rotate without updating:** stick to one rotation model.

Common mistakes:

1. **Only modeling pieces as images**, no edge types. Then you cannot write `fits`.
2. **Matching INNER with INNER.** Tabs do not click into tabs.
3. **Treating FLAT as complementary to everything.** Flat is for the rim.
4. **No backtracking.** First legal-looking piece in cell 0 can block cell 3.
5. **Allowing flips without saying so.** Mirrors change the edge cycle; mention rotate-only unless asked.
6. **Checking only left neighbor**, forgetting the piece above (or the outer FLAT rules).

Minimal checks to mention out loud:

```java
// After solve, for every adjacent pair:
// complementary(left.RIGHT, right.LEFT)
// complementary(up.BOTTOM, down.TOP)
// For every outer cell side facing out: edge == FLAT
```

---

## 7. Explain to a friend recap

Jigsaw is OOD first, search second:

1. Each piece has four edges: `INNER`, `OUTER`, or `FLAT`.
2. `INNER` locks with `OUTER`. Outer rim sides must be `FLAT`.
3. Rotate a piece by cycling its four edges (four orientations).
4. Board is `N x N`. Corners have two flats, border pieces one, interior zero.
5. Solver: for each empty cell, try free pieces and rotations; check rim + left + above; recurse; undo on fail.
6. Grouping corner/edge/interior shrinks the try list but is optional.

If you can draw four edges on a square, say how tab meets socket, and walk one backtracking step on a 2 by 2, you own problem 7.6. The design is the product; the solver proves the design works.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Online Book Reader](/blog/en/ctci-7-5-online-book-reader)
* Next: [Chat Server](/blog/en/ctci-7-7-chat-server)