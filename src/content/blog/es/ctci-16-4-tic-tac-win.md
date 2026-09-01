---
title: "Victoria en Tres en Raya: Precomputación de Estados y Validación Incremental (CTCI 16.4)"
description: "Disena algoritmos eficientes para verificar si un jugador ha ganado en Tres en Raya para tableros 3x3 y tableros genericos NxN en tiempo O(1) y O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-4-tic-tac-win.webp
previewImage: /assets/images/ctci-16-4-tic-tac-win.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena un algoritmo para determinar si un jugador ha ganado una partida de Tres en Raya (Tic-Tac-Toe).
> * **Las Soluciones Óptimas:**
>   1. **Consultas Repetidas ($3 \times 3$)**: Precomputar los $3^9 = 19.683$ estados posibles en un array de busqueda en base 3. Resuelve en **tiempo $O(1)$**.
>   2. **Tablero Genérico $N \times N$**: Comprobar $N$ filas, $N$ columnas y 2 diagonales en **tiempo $O(N)$** y **espacio $O(1)$**.
>   3. **Seguimiento Incremental ($N \times N$)**: Actualizar acumuladores por fila, columna y diagonales en cada jugada en **tiempo $O(1)$** por movimiento.
> * **Realidad en Producción:** Servidores de juegos por turnos y tablas de transposicion con hash de Zobrist en motores de IA.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.4), se nos plantea:

*"Determina si alguien ha ganado en Tres en Raya, analizando enfoques estaticos, precomputados e incrementales para tableros NxN."*

## 2. Clasificación de Enfoques

* **Precomputación Base-3:** Convierte el tablero $3 \times 3$ en un entero entre 0 y 19.682 para responder instantaneamente.
* **Contadores Incrementales:** Suma $+1$ para X y $-1$ para O; si una linea alcanza $\pm N$, hay un ganador inmediato.

## Implementación de Producción

```java
public class TicTacToe {
    public enum Piece { Empty, X, O }

    public static class TicTacToeGame {
        private final int n;
        private final int[] rows;
        private final int[] cols;
        private int diagonal = 0;
        private int antiDiagonal = 0;

        public TicTacToeGame(int n) {
            this.n = n;
            this.rows = new int[n];
            this.cols = new int[n];
        }

        public Piece move(int r, int c, Piece player) {
            if (player == Piece.Empty) return Piece.Empty;
            int val = (player == Piece.X) ? 1 : -1;

            rows[r] += val;
            cols[c] += val;
            if (r == c) diagonal += val;
            if (r + c == n - 1) antiDiagonal += val;

            int target = (player == Piece.X) ? n : -n;
            if (rows[r] == target || cols[c] == target || diagonal == target || antiDiagonal == target) {
                return player;
            }
            return Piece.Empty;
        }
    }
}
```

## Análisis de Complejidad

| Estrategia | Tiempo por Jugada | Espacio Auxiliar | Aplicación Ideal |
|---|---|---|---|
| **Contadores Incrementales** | **$O(1)$** | $O(N)$ | Partidas activas en tiempo real. |
| **Escaneo Completo** | $O(N)$ | $O(1)$ | Validacion externa de tableros. |
| **Precomputación Base-3** | **$O(1)$** | $19{,}7\text{ KB}$ | Tableros $3 \times 3$ estaticos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Tablas de Transposición y Bitboards

1. **Tablas de Transposición:** Los motores de ajedrez y damas almacenan estados evaluados en tablas hash de 64 bits (Hash de Zobrist) para evitar reevaluar subarboles identicos en el algoritmo Minimax.
2. **Bitboards:** Representacion de tableros en registros enteros de 64 bits (`long`) para verificar victorias mediante operaciones a nivel de bits.

## Casos Límite y Robustez en Producción

1. **Empate:** Tablero lleno sin lineas completas declarado como empate.
