---
title: "Othello: tablero, color, partida y reglas de volteo en Java OOD"
description: "Problema estilo CTCI 7.8 para principiantes: diseña Othello (Reversi) con Board, color de Piece, flujo de Game y lógica de captura. Esbozo Java original, no copia de libro."
date: "2025-08-23"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-8-othello.webp
previewImage: /assets/images/ctci-7-8-othello.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.8 para principiantes: diseña Othello (Reversi) con Board, color de Piece, flujo de Game y lógica de captura. Esbozo Java original, no copia de libro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

**Othello** (también Reversi) es un juego de mesa para dos. Cada ficha es negra por un lado y blanca por el otro. Cuando atrapas fichas rivales entre tu ficha nueva y otra tuya, esas fichas cambian a tu color. En tu turno debes capturar al menos una. Cuando nadie tiene jugada legal, termina la partida. Gana quien tenga más fichas.

Esto es un problema de **diseño orientado a objetos**. El entrevistador quiere clases, responsabilidades y un algoritmo de volteo claro, no una IA completa. Este post es enseñanza original para principiantes con un esbozo en **Java**: `Color`, `Piece`, `Board`, `Player`, `Game`. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 7, diseño orientado a objetos.

---

## 1. Analogía cotidiana

Imagina un tablero verde de plástico y un montón de monedas de dos caras. Negro y blanco empiezan en el centro en un pequeño rombo. Dejas una moneda de tu color de modo que apriete una línea recta del otro color contra una moneda tuya ya puesta. Volteas cada moneda de esa línea. Luego juega el otro.

El trabajo de diseño no es "escribir Stockfish para Othello". Es: quién posee la rejilla, quién sabe el color actual de una ficha, quién decide si un movimiento es legal, y quién lleva el turno cuando ya no hay jugadas.

---

## 2. Problema en palabras simples

**Reglas que conviene decir en voz alta:**

* Dos jugadores: Negro y Blanco. El tablero estándar es **8x8** (confirma el tamaño; algunos esbozos usan 10x10).
* Empiezas con cuatro fichas en el centro: dos negras, dos blancas, alternadas.
* Una jugada legal coloca tu color en una casilla **vacía** de forma que, en al menos una línea recta (fila, columna o diagonal), encierras una o más fichas rivales entre la nueva y otra tuya.
* Todas las fichas rivales encerradas en esas líneas **se voltean** a tu color.
* Debes voltear al menos una. No puedes pasar si aún tienes jugada. Si no tienes, pasas (o la partida termina cuando ambos no pueden; di qué regla eliges).
* Fin: no quedan jugadas legales para nadie (o el tablero está lleno). Gana quien tenga más fichas de su color. Empate si hay igualdad.

**Othello clásico vs un enunciado más delgado:** el Othello completo voltea en **ocho** direcciones (incluidas diagonales). Algunos textos solo hablan de izquierda/derecha y arriba/abajo. En entrevista, pregunta. Aquí implementamos **ocho direcciones**, porque es el juego real y el caso más exigente.

**Qué diseñar:**

* Clases y enums
* Cómo se valida y aplica un movimiento
* Quién lleva el marcador y el turno
* Cómo se decide que la partida terminó

**No hace falta salvo que lo pidan:** IA minimax, multijugador en red, gráficos, historial de deshacer.

---

## 3. Piensa antes de codificar

### Objetos centrales

| Objeto | Trabajo |
| --- | --- |
| `Color` | `BLACK`, `WHITE`, y quizá `EMPTY` para casillas |
| `Piece` | Una ficha: color actual, `flip()` |
| `Board` | Rejilla, colocar, voltear líneas, conteos |
| `Player` | Color, intentar un movimiento |
| `Game` | Dos jugadores, turno, inicio, fin, ganador |

### Bifurcaciones de diseño que conviene verbalizar

**¿Subclases BlackPiece y WhitePiece?** Casi nunca. Una ficha se voltea muchas veces. Destruir un objeto negro y crear uno blanco en cada flip es ruido. Un `Piece` con un campo `Color` es más simple.

**¿`Game` y `Board` separados?** Sí si puedes permitirte la capa. `Board` conoce geometría y flips. `Game` conoce turnos, pases y "quién ganó". Fusionarlos vale en un esbozo mínimo; clases separadas se leen mejor en entrevista.

**¿Quién lleva el marcador?** `Board` puede mantener conteos black/white y actualizarlos al añadir o voltear. Escanear el tablero tras cada jugada también vale en 8x8 (`O(1)` de tamaño fijo).

**¿`Game` singleton?** Opcional. Cómodo si todo llega al tablero por una instancia. Incómodo si quieres dos partidas concurrentes en tests. Prefiere una instancia normal salvo que empujen el singleton.

**Casillas vacías:** `null` en `Piece[][]`, o un color centinela `EMPTY`. Ambos sirven. Null pide cuidado. Un enum `Color` con `EMPTY` a veces limpia los chequeos.

### Algoritmo de volteo (el núcleo duro)

Ocho vectores de dirección:

```
(-1,-1) (-1,0) (-1,1)
( 0,-1)        ( 0,1)
( 1,-1) ( 1,0) ( 1,1)
```

Para una casilla candidata `(r, c)` y color `me`:

1. La casilla debe estar en rango y vacía.
2. Para cada dirección `d`:
   * Un paso: necesitas al menos una ficha rival.
   * Sigue mientras haya fichas rivales.
   * Si luego encuentras una ficha de `me`, esa dirección es una **línea de captura**. Reúne las casillas intermedias.
   * Si chocas con vacío o borde antes de `me`, esa dirección falla.
3. Si ninguna dirección capturó, el movimiento es ilegal.
4. Si es legal: coloca `me` en `(r, c)`, voltea cada rival recogido, actualiza marcadores, cambia el turno.

Ese bucle es casi todo el juego. La UI es decoración alrededor.

### Inicialización

Centro estándar 8x8 (filas/cols 0-based, tamaño `n = 8`):

```
(n/2-1, n/2-1) = WHITE
(n/2-1, n/2)   = BLACK
(n/2,   n/2-1) = BLACK
(n/2,   n/2)   = WHITE
```

Negro suele mover primero. Diló.

---

## 4. Solución Java (esbozo de diseño)

Esqueleto didáctico, no producto final. Importan la propiedad clara y los flips correctos.

### Color y direcciones

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

### Board: colocar, voltear, marcador

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

### Player y Game

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

### Secuencia mental rápida

Tras `initialize()` en 8x8, Negro juega una apertura legal. `place` debe:

1. Rechazar líneas vacías que no encierren blancas.
2. Voltear exactamente las blancas atrapadas en cada rayo válido.
3. Dejar `blackCount + whiteCount` igual al número de fichas en el tablero.

Si más tarde Blanco no tiene jugadas pero Negro sí, Negro juega otra vez. Si ninguno puede, `finish()`.

---

## 5. Complejidad

El tamaño `n` es 8 en el juego real, así que en la práctica todo es tiempo constante. Si `n` es general:

| Operación | Tiempo | Espacio |
| --- | --- | --- |
| `capturesIfPlace` | O(n) peor caso (8 rayos, cada uno hasta n pasos) | O(n) lista de flips |
| `place` | O(n) | O(n) |
| `hasAnyMove` | O(n² · n) = O(n³) ingenuo | O(n) |
| Partida completa (como mucho n² jugadas) | O(n⁵) con hasAnyMove ingenuo cada turno | O(n²) tablero |

En entrevista di: **8x8 es minúsculo**. La corrección del volteo gana a la astucia asintótica. Si empujan optimización, precalcula jugadas legales tras cada place, o solo mira casillas vacías.

---

## 6. Casos límite y trampas

* **Jugar en casilla ocupada:** ilegal.
* **Jugar con cero flips:** ilegal aunque esté vacía.
* **Bordes y esquinas:** menos direcciones; el mismo bucle basta.
* **Captura solo diagonal:** debe funcionar si afirmas ocho direcciones.
* **Pase cuando el rival no puede pero tú sí:** el mismo color juega otra vez; no termines pronto.
* **Ambos atascados con casillas vacías:** igual se acaba; las vacías no se voltean solas.
* **Marcador desfasado:** al voltear, ajusta ambos conteos. Fácil equivocarse si solo sumas al ganador del flip.
* **Subclasificar piezas negras/blancas:** evítalo; el color es estado, no tipo.
* **Olvidar diagonales** cuando esperan Othello real.
* **Fijar 10x10** sin preguntar; el estándar es 8x8.

Errores habituales:

1. Voltear todo el rayo incluyendo vacíos.
2. Voltear cuando el rayo llega al borde sin tu ficha de cierre.
3. Permitir un movimiento que solo "toca" un rival sin ficha tuya al final.
4. Terminar en el primer pase en vez de mirar al otro jugador.
5. Meter todas las reglas solo en `Player` y que el tablero no pueda validar igual una IA o un cliente de red.

Ideas mínimas de humo:

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

## 7. Recap para contárselo a un amigo

1. Othello es sándwich y volteo en una rejilla. Tu ficha nueva debe atrapar rivales en línea recta contra otra tuya.
2. Modela el **color como dato**, no como dos subclases que reconstruyes en cada flip.
3. `Board` posee la rejilla y la matemática del volteo. `Game` posee turnos y fin de partida.
4. Mira ocho direcciones. Una dirección cuenta solo si pasas por uno o más rivales y luego te encuentras a ti.
5. Ilegal = casilla vacía con cero líneas de captura. Legal = colocar, voltear, actualizar marcadores.
6. Si el rival no tiene jugada, puedes jugar otra vez. Si nadie tiene, compara conteos.

Si puedes dibujar el paseo del rayo en papel y nombrar qué clase lo posee, dominas el 7.8. Aquí el diseño es sobre todo "pon la lógica de flip en un solo sitio y deja las reglas de turno aburridas."

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Chat Server](/blog/es/ctci-7-7-chat-server)
* Siguiente: [Circular Array](/blog/es/ctci-7-9-circular-array)