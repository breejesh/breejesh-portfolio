---
title: "Chess Test: Comprehensive Unit Testing Strategy for canMoveTo (CTCI 11.3)"
description: "Formulate a rigorous testing framework for the canMoveTo(x, y) chess piece move validator covering boundary conditions, piece-specific geometry, and check invariants."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-11-3-chess-test.webp
previewImage: /assets/images/ctci-11-3-chess-test.webp
---

> **TL;DR**
> * **The Book Problem:** We have the following method in a chess game: `boolean canMoveTo(int x, int y)`. This method is part of the `Piece` class, where `x` and `y` represent chessboard coordinates ($0 \dots 7$). How would you test this method?
> * **The Optimal Solution:** **Three-Tier Testing Matrix**: (1) **Boundary & Spatial Extremes**: Out-of-bound coordinates ($(-1, 0)$, $(8, 8)$, $(100, -50)$), board corners ($(0,0), (7,7)$), and current position ($(x, y)$); (2) **Piece-Specific Geometric Rules**: Test every subclass (Pawn double-advance, Knight L-jumps, Bishop diagonals, Rook orthogonals, Queen omnidirectional, King 1-step & Castling); (3) **Board Collision & Game State Invariants**: Blocked paths, friendly piece collision (illegal), opponent piece capture (legal), pins, en passant, and moving into/out of check.
> * **Production Reality:** Chess engine regression test suites (Stockfish / Lichess), board game rules engines, and physical robot movement validation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 11.3), we are asked:

*"Formulate a structured test plan and test suite for the Piece method boolean canMoveTo(int x, int y) across all edge cases, piece behaviors, and game-level constraints."*

## 2. Test Architecture Matrix

| Test Category | Test Cases | Expected Output |
|---|---|---|
| **Boundary / Extremes** | $x < 0$, $y < 0$, $x > 7$, $y > 7$ (e.g. $(-1, 4), (8, 0)$) | `false` |
| **Identity Movement** | Moving piece to its own current coordinate $(x_0, y_0)$ | `false` |
| **Knight Geometry** | $|\Delta x| \cdot |\Delta y| == 2$ ($(\pm 1, \pm 2)$ or $(\pm 2, \pm 1)$) | `true` (even over obstacles) |
| **Path Obstruction** | Rook/Bishop/Queen with intervening piece along trajectory | `false` |
| **Check Invariants** | Move leaves own King in check (absolute pin) | `false` |
| **Castling** | King moves 2 squares through check or when pieces have moved | `false` |

## Production JUnit 5 Test Harness

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

public class ChessPieceTest {
    private Board board;

    @BeforeEach
    public void setup() {
        board = new Board(); // Initializes standard 8x8 chessboard
    }

    @ParameterizedTest
    @DisplayName("Out of bounds coordinates must always return false")
    @CsvSource({
        "-1, 0", "0, -1", "8, 0", "0, 8", "-5, -5", "100, 100"
    })
    public void testOutOfBounds(int x, int y) {
        Piece knight = new Knight(board, 4, 4, Color.WHITE);
        assertFalse(knight.canMoveTo(x, y), "Out of bounds target must be invalid");
    }

    @Test
    @DisplayName("Knight can jump over intervening friendly and enemy pieces")
    public void testKnightObstacleJump() {
        Piece knight = new Knight(board, 1, 0, Color.WHITE); // Standard b1 knight
        // Place obstructing pawns at (1, 1), (2, 0), (0, 1)
        board.placePiece(new Pawn(board, 1, 1, Color.WHITE), 1, 1);
        
        // Knight should jump to c3 (2, 2) and a3 (0, 2)
        assertTrue(knight.canMoveTo(2, 2));
        assertTrue(knight.canMoveTo(0, 2));
        assertFalse(knight.canMoveTo(1, 2)); // Invalid non-L move
    }

    @Test
    @DisplayName("Pinned piece cannot move if it exposes King to check")
    public void testPinnedPieceMovement() {
        King whiteKing = new King(board, 4, 0, Color.WHITE);
        Bishop whiteBishop = new Bishop(board, 4, 2, Color.WHITE); // Pinned on e-file
        Rook blackRook = new Rook(board, 4, 7, Color.BLACK);

        board.placePiece(whiteKing, 4, 0);
        board.placePiece(whiteBishop, 4, 2);
        board.placePiece(blackRook, 4, 7);

        // Bishop cannot move off the e-file (would expose King to check)
        assertFalse(whiteBishop.canMoveTo(5, 3));
    }
}
```

## Complexity & Execution Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Boundary Checks | `O(1)` | Constant-time integer bounds evaluation. |
| Raycast Path Traversal | `O(1)` | At most 7 ray steps across 8x8 grid. |
| Check Invariant Simulation | `O(1)` | Board copy and opponent attack raycast. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Chess Engines (Stockfish)

1. **Bitboard Move Generation:** Modern engines represent piece positions as 64-bit integers (`long`), performing `canMoveTo` lookups via hardware bitwise AND masks in $< 5\text{ ns}$.
2. **Property-Based Testing (QuickCheck / jqwik):** Generates thousands of random legal chess game boards to fuzz invariant violations.

## Edge Cases & Production Hardening

1. **En Passant Capture:** Target square is empty, but move captures enemy pawn on adjacent rank.
2. **Promoted Pawns:** Transition state validation when reaching 8th rank.
