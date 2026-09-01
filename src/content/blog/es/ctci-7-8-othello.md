---
title: "Othello: Arquitectura de Juego Orientada a Objetos y Lógica de Volteo (CTCI 7.8)"
description: "Disena las clases y motor de juego para Othello (Reversi) con volteo direccional en 8 direcciones y puntuacion por turnos en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-8-othello.webp
previewImage: /assets/images/ctci-7-8-othello.webp
---

> **TL;DR**
> * **El Problema del Libro:** En Othello cada ficha es blanca por un lado y negra por el otro. Al atrapar fichas contrarias en linea horizontal, vertical o diagonal, se voltean al color propio. Disena el juego.
> * **La Solución Óptima:** Arquitectura de Raycasting Direccional: (1) Enums `Color` (`Black`, `White`) y `Direction` (8 direcciones cartesianas y diagonales); (2) Entidad `Piece` con metodo `flip()`; (3) Tablero $8 \times 8$ con `placeColor()` que proyecta rayos direccionales para voltear fichas atrapadas; (4) Controlador `Game` que gestiona turnos y puntuaciones en tiempo $O(1)$.
> * **Realidad en Producción:** Motores de juegos por turnos (Ajedrez / Go) y algoritmos Minimax con poda Alpha-Beta.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 7.8), se nos plantea:

*"Disena el juego de Othello (Reversi) definiendo las clases, estructuras de datos y la logica para voltear fichas en todas las direcciones validas."*

## 2. Arquitectura de Clases

1. **`Color` & `Direction` (Enums):** Colores de fichas y vectores de desplazamiento en 8 direcciones.
2. **`Piece`:** Representa una ficha sobre el tablero con soporte para `flip()`.
3. **`Board`:** Matriz $8 \times 8$, contadores de puntuacion y logica `placeColor()`.
4. **`Game`:** Orquesta el ciclo de turnos y fin de partida.

## Implementación de Producción

```java
public class OthelloGame {
    public enum Color {
        White, Black;
        public Color getOpposite() { return this == White ? Black : White; }
    }

    public enum Direction {
        UP(-1, 0), DOWN(1, 0), LEFT(0, -1), RIGHT(0, 1),
        UP_LEFT(-1, -1), UP_RIGHT(-1, 1), DOWN_LEFT(1, -1), DOWN_RIGHT(1, 1);

        public final int dRow;
        public final int dCol;
        Direction(int dr, int dc) { this.dRow = dr; this.dCol = dc; }
    }

    public static class Piece {
        private Color color;
        public Piece(Color c) { this.color = c; }
        public void flip() { color = color.getOpposite(); }
        public Color getColor() { return color; }
    }

    public static class Board {
        public static final int ROWS = 8;
        public static final int COLS = 8;
        private final Piece[][] board = new Piece[ROWS][COLS];
        private int blackCount = 2;
        private int whiteCount = 2;

        public Board() {
            board[3][3] = new Piece(Color.White);
            board[3][4] = new Piece(Color.Black);
            board[4][3] = new Piece(Color.Black);
            board[4][4] = new Piece(Color.White);
        }

        public boolean placeColor(int row, int col, Color color) {
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS || board[row][col] != null) {
                return false;
            }

            int flipped = 0;
            for (Direction dir : Direction.values()) {
                flipped += flipSection(row, col, color, dir);
            }

            if (flipped <= 0) return false;

            board[row][col] = new Piece(color);
            if (color == Color.Black) {
                blackCount += flipped + 1;
                whiteCount -= flipped;
            } else {
                whiteCount += flipped + 1;
                blackCount -= flipped;
            }
            return true;
        }

        private int flipSection(int row, int col, Color color, Direction dir) {
            int r = row + dir.dRow;
            int c = col + dir.dCol;
            int count = 0;

            while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] != null) {
                if (board[r][c].getColor() == color) {
                    if (count == 0) return 0;
                    int currR = row + dir.dRow;
                    int currC = col + dir.dCol;
                    while (currR != r || currC != c) {
                        board[currR][currC].flip();
                        currR += dir.dRow;
                        currC += dir.dCol;
                    }
                    return count;
                }
                count++;
                r += dir.dRow;
                c += dir.dCol;
            }
            return 0;
        }

        public int getBlackCount() { return blackCount; }
        public int getWhiteCount() { return whiteCount; }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Colocar Ficha | `O(1)` | Inspecciona como maximo 64 casillas en un tablero fijo de $8 \times 8$. |
| Espacio Auxiliar | `O(1)` | Matriz de tamano fijo $8 \times 8$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores de Juego

1. **Bitboards en Motores de IA:** Representacion del tablero de $8 \times 8$ como dos enteros de 64 bits (`long`) para calcular volteos simultaneos mediante mascaras binarias.
2. **Arboles de Decision Minimax:** Evaluacion de movilidad y esquinas estables en partidas competitivas.

## Casos Límite y Robustez en Producción

1. **Movimiento sin capturas:** Rechazado retornando `false` sin modificar el tablero.
