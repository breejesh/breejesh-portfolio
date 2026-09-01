---
title: "Dominos: Tiling a Mutilated Chessboard with 31 Dominos Proof (CTCI 6.3)"
description: "Mathematical proof of the impossibility of tiling an 8x8 chessboard with diagonally opposite corners removed using 31 dominos via bipartite coloring invariants."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-3-dominos.webp
previewImage: /assets/images/ctci-6-3-dominos.webp
---

> **TL;DR**
> * **The Book Problem:** There is an $8 \times 8$ chessboard in which two diagonally opposite corners have been cut off. You are given 31 dominos, and a single domino can cover exactly two adjacent squares. Can you use the 31 dominos to cover the entire board? Prove your answer.
> * **The Optimal Solution:** **Bipartite Invariant Proof**: A full $8 \times 8$ board has 32 white and 32 black squares. Diagonally opposite corners always share the **exact same color** (e.g. both white). Removing them leaves 30 white squares and 32 black squares (62 total squares). Because every $2 \times 1$ domino strictly covers exactly 1 white and 1 black square, 31 dominos must cover exactly 31 white and 31 black squares. Therefore, complete tiling is mathematically **impossible**.
> * **Production Reality:** Bipartite graph maximum matching (Hopcroft-Karp), resource allocation invariant auditing, and memory bank interleaving conflicts.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 6.3), we are asked:

*"There is an 8x8 chessboard in which two diagonally opposite corners have been cut off. You are given 31 dominos, and a single domino can cover exactly two adjacent squares. Can you use the 31 dominos to cover the entire board? Prove your answer."*

## 2. Invariant Proof by Graph Bipartiteness

1. **Standard Chessboard Coloring:**
   * Rows and columns alternate colors: $(r + c) \pmod 2 = 0 \implies \text{Black}$, $(r + c) \pmod 2 = 1 \implies \text{White}$.
   * Total squares = 64 (32 Black, 32 White).
2. **Opposite Corner Parity:**
   * Top-left corner $(0, 0) \implies 0 + 0 = 0$ (Black).
   * Bottom-right corner $(7, 7) \implies 7 + 7 = 14$ (Black).
   * Removing two diagonally opposite corners removes **two squares of identical color**.
3. **Remaining Board Configuration:**
   * 30 Black squares, 32 White squares (or vice-versa).
4. **Domino Tiling Constraint:**
   * Any $1 \times 2$ domino placed horizontally or vertically covers two adjacent squares.
   * Adjacent squares in a grid always have different colors. Thus, 1 domino $\equiv$ (1 Black, 1 White).
   * 31 dominos strictly cover **31 Black and 31 White squares**.
5. **Conclusion:**
   * $31 \ne 30 \implies$ It is impossible to tile the board.

## Production Implementation

```java
public class DominosChessboard {
    /**
     * Verifies whether an arbitrary board configuration with removed squares can be tiled.
     * Based on bipartite coloring parity matching.
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     */
    public static boolean canTileMutilatedBoard(int rows, int cols, int removedR1, int removedC1,
                                                int removedR2, int removedC2) {
        int totalSquares = (rows * cols) - 2;
        if (totalSquares % 2 != 0) return false;

        // Parity of removed squares: 0 for Black, 1 for White
        int color1 = (removedR1 + removedC1) % 2;
        int color2 = (removedR2 + removedC2) % 2;

        // If both removed squares are the same color, tiling is impossible
        if (color1 == color2) {
            return false;
        }

        // Gomory's Theorem guarantees a Hamiltonian cycle can tile if 1 black & 1 white removed
        return true;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Evaluation Time | `O(1)` | Direct parity check on grid coordinates. |
| Auxiliary Space | `O(1)` | Zero memory allocations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Bipartite Matching Invariants

1. **Worker-Task Schedulers (Kubernetes Pod Scheduling):** Validates affinity and anti-affinity rules using bipartite graph coloring invariants to prove resource deadlock impossibility.
2. **DRAM Memory Bank Interleaving:** Alternates even/odd memory bank access lines to avoid bus contention collisions.

## Edge Cases & Production Hardening

1. **Removing 1 White and 1 Black corner:** By Gomory's Theorem, any grid with 1 white and 1 black cell removed always has a valid domino tiling.
2. **Odd grid dimensions ($7 \times 7$):** Total squares is odd, cannot be tiled by dominos.
