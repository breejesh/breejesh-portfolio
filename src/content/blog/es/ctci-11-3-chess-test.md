---
title: "Pruebas de Ajedrez: Estrategia de Pruebas Unitarias para canMoveTo (CTCI 11.3)"
description: "Formula un marco exhaustivo de pruebas unitarias para validar canMoveTo(x, y) en ajedrez cubriendo condiciones limite, geometria de piezas e invariantes de jaque."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-11-3-chess-test.webp
previewImage: /assets/images/ctci-11-3-chess-test.webp
---

> **TL;DR**
> * **El Problema del Libro:** Tenemos el metodo `boolean canMoveTo(int x, int y)` en la clase `Piece` de un juego de ajedrez, donde `x` e `y` son coordenadas de 0 a 7. ¿Como probarias este metodo?
> * **La Solución Óptima:** **Matriz de Pruebas en Tres Niveles**: (1) **Extremos y Límites**: Coordenadas fuera de tablero ($(-1, 0), (8, 8)$) y esquinas ($(0,0), (7,7)$); (2) **Reglas Geométricas por Pieza**: Peon (avance doble, captura diagonal), Caballo (saltos en L), Alfil (diagonales), Torre (ortogonales), Dama y Rey (1 paso y enroque); (3) **Invariantes de Estado de Juego**: Obstrucciones de camino, colision con piezas amigas (prohibido), captura enemiga, piezas clavadas y movimientos que dejan al rey en jaque.
> * **Realidad en Producción:** Motores de ajedrez (Stockfish / Lichess) y motores de reglas.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 11.3), se nos plantea:

*"Disena una suite de pruebas unitarias exhaustiva para validar el metodo canMoveTo(x, y) en un juego de ajedrez."*

## 2. Matriz de Categorías de Prueba

1. **Pruebas de Límites:** Coordenadas negativas o superiores a 7 retornan `false`.
2. **Geometría de Piezas:** Validacion de movimientos especificos (ej. Caballo saltando piezas).
3. **Restricciones de Tablero y Jaque:** Piezas clavadas que no pueden abandonar la linea de proteccion del Rey.

## Implementación de Producción

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

public class ChessPieceTest {
    private Board board;

    @BeforeEach
    public void setup() {
        board = new Board();
    }

    @ParameterizedTest
    @CsvSource({ "-1, 0", "0, -1", "8, 0", "0, 8", "-5, -5", "100, 100" })
    public void testOutOfBounds(int x, int y) {
        Piece knight = new Knight(board, 4, 4, Color.WHITE);
        assertFalse(knight.canMoveTo(x, y));
    }

    @Test
    public void testKnightObstacleJump() {
        Piece knight = new Knight(board, 1, 0, Color.WHITE);
        board.placePiece(new Pawn(board, 1, 1, Color.WHITE), 1, 1);
        
        assertTrue(knight.canMoveTo(2, 2));
        assertTrue(knight.canMoveTo(0, 2));
        assertFalse(knight.canMoveTo(1, 2));
    }

    @Test
    public void testPinnedPieceMovement() {
        King whiteKing = new King(board, 4, 0, Color.WHITE);
        Bishop whiteBishop = new Bishop(board, 4, 2, Color.WHITE);
        Rook blackRook = new Rook(board, 4, 7, Color.BLACK);

        board.placePiece(whiteKing, 4, 0);
        board.placePiece(whiteBishop, 4, 2);
        board.placePiece(blackRook, 4, 7);

        assertFalse(whiteBishop.canMoveTo(5, 3));
    }
}
```

## Análisis de Complejidad y Rendimiento

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Evaluación de Límites | `O(1)` | Verificación de enteros en tiempo constante. |
| Trayectoria de Rayo | `O(1)` | Máximo 7 casillas de inspección en tablero 8x8. |
| Invariante de Jaque | `O(1)` | Simulación de movimiento sobre copia ligera de tablero. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores de Ajedrez (Stockfish)

1. **Bitboards de 64 bits:** Representacion de posiciones mediante enteros `long` para evaluar movimientos mediante operaciones a nivel de bit en menos de 5 nanosegundos.
2. **Pruebas Basadas en Propiedades (Fuzzing):** Generacion automatica de millones de partidas para validar invariantes.

## Casos Límite y Robustez en Producción

1. **Captura al Paso (En Passant):** Validacion de casilla destino vacia con peon adyacente capturado.
2. **Enroque a Través de Jaque:** Prohibido por las reglas internacionales de ajedrez.
