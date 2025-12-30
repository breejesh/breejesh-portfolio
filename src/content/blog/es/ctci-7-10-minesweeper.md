---
title: "Minesweeper: Board, Cell, bombas y flood fill de ceros (Java)"
description: "Problema estilo CTCI 7.10 para principiantes: diseña un Minesweeper de texto con Cell y Board, colocación aleatoria de bombas, contadores de vecinos, reglas de clic y flood fill al abrir un cero."
date: "2025-12-30"
tags: [Algoritmos]
coverImage: /assets/images/ctci-7-10-minesweeper.webp
previewImage: /assets/images/ctci-7-10-minesweeper.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.10 para principiantes: diseña un Minesweeper de texto con Cell y Board, colocación aleatoria de bombas, contadores de vecinos, reglas de clic y flood fill al abrir un cero.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Diseña un **Minesweeper de texto**. Un tablero `N x N` esconde `B` bombas. El resto de celdas guarda un número (cuántas bombas hay en los ocho vecinos) o cero (en blanco). Clic en una bomba y pierdes. Clic en un número y solo se abre esa celda. Clic en un cero y el tablero se expande: ese blanco, cada blanco conectado y el anillo de números alrededor de esa región se abren. Marca con bandera las celdas que crees bombas para no pulsarlas por accidente. Ganas cuando todas las celdas que no son bomba están expuestas.

Este post es enseñanza original para principiantes en **Java**. Misma familia de diseño orientado a objetos de juegos en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 7, diseño orientado a objetos: Board, Cell, colocar bombas, clic con flood fill en ceros.

---

## 1. Analogía cotidiana

Piensa en una cuadrícula de papel cubierta de notas adhesivas. Bajo algunas hay una chincheta (una bomba). Bajo el resto hay un pequeño conteo de chinchetas cercanas, o nada.

Pegas una nota:

* Chincheta debajo: se acabó el juego.
* Un número: solo se quita esa nota.
* En blanco: sigues quitando cada nota en blanco que toque esta, y también quitas las notas con número que bordean ese parche en blanco. Te detienes en los números; no atraviesas un número hacia el siguiente blanco salvo que ese blanco ya estuviera conectado por ceros.

Esa expansión del blanco es **flood fill**. El tablero es una rejilla 2D de celdas. El objeto juego lleva si sigues jugando, ya perdiste o ya ganaste.

---

## 2. Problema en palabras simples

**Objetivo:** clases y métodos para un Minesweeper de texto jugable.

**Piezas centrales:**

| Pieza | Rol |
| --- | --- |
| `Cell` | una casilla: bomba o no, conteo de vecinos, ¿expuesta?, ¿con bandera? |
| `Board` | rejilla de celdas; coloca bombas; calcula números; voltea / flood fill |
| `Game` (opcional pero limpio) | estado, clic/bandera del usuario, ganar/perder, imprimir tablero |

**Reglas:**

* La rejilla es `N x N` con exactamente `B` bombas (o `rows x cols` si generalizas).
* El número de una celda sin bomba es cuántos de sus hasta 8 vecinos son bombas.
* Clic izquierdo (descubrir):
  * Bomba → pierdes (se expone; el juego termina).
  * Número > 0 → solo se expone esa celda.
  * Número 0 → flood fill de ceros e incluye números del borde.
* Clic derecho (bandera): alterna bandera en una celda oculta. Las celdas con bandera no se descubren al clic.
* Ganas cuando toda celda que no es bomba está expuesta. Las banderas no tienen que coincidir con bombas para ganar (regla clásica: solo las celdas seguras deben abrirse).

**Aclara en una entrevista:**

* ¿El primer clic puede ser seguro por diseño? (Buena regla de producto; no es obligatoria en el enunciado clásico.)
* Colocación de bombas: celdas aleatorias únicas, o una lista fija para tests?
* ¿Qué imprime la UI de texto para oculta, bandera, bomba, blanco, número?
* Clics fuera de rango: ¿ignorar o lanzar excepción?

**Forma de las firmas:**

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

## 3. Piensa primero

### Primero clases, después píxeles

Los entrevistadores quieren estructura más que una UI pulida.

* **`Cell`**: datos de una casilla. Lógica ligera (getters/setters, quizá `isBlank()`).
* **`Board`**: posee el array 2D, colocación de bombas, conteos de vecinos, descubrir + flood fill.
* **`Game`**: bucle, entrada, mensajes de ganar/perder. Capa fina sobre `Board`.

Puedes fusionar Game en Board en una entrevista corta. Prefiere separarlos si hay tiempo.

### Coloca bombas, luego cuenta vecinos

El orden importa:

1. Crea todas las celdas como no bomba, número 0, ocultas, sin bandera.
2. Coloca `B` bombas en celdas aleatorias distintas.
3. Para cada celda sin bomba, cuenta vecinos bomba en las 8 direcciones y guarda ese conteo.

Si cuentas primero y colocas bombas después, cada número queda mal.

```
directions (dr, dc):
  (-1,-1) (-1,0) (-1,1)
  ( 0,-1)        ( 0,1)
  ( 1,-1) ( 1,0) ( 1,1)
```

Omite coordenadas fuera del tablero. Una esquina tiene 3 vecinos, un borde 5, una celda interior 8.

### Reglas de clic y flood fill

```
flip(r, c):
  if out of bounds or already exposed or flagged: return (no-op / still safe)
  if cell is bomb: expose it; return false (lose)
  // safe cell
  flood from (r, c) using BFS or DFS
  return true
```

Flood fill (esquema BFS):

1. Empieza una cola con `(r, c)`.
2. Mientras la cola no esté vacía, toma una celda:
   * Si ya está expuesta, sáltala.
   * Expónla.
   * Si su número es **mayor que 0**, **no** expandas más desde esta celda (es el borde de la región en blanco).
   * Si su número es **0**, encola los 8 vecinos dentro de límites que sigan ocultos, sin bandera (y no bombas; los ceros no se sientan sobre bombas si los números se calcularon bien).

Eso coincide con el Minesweeper clásico: los números del borde se abren, pero el flood no cava a través de ellos hacia regiones de ceros desconectadas.

### ¿Por qué no abrir solo el cero pulsado?

Si abres solo un blanco, el juego se siente roto. Los jugadores esperan la cascada. Los entrevistadores también quieren oír "BFS/DFS flood fill" como algoritmo de blancos conectados.

### Banderas

Las banderas son un seguro de UI:

* Alternan en una celda oculta.
* Una celda con bandera ignora clics de descubrir.
* La bandera no cambia el mapa de bombas ni los números vecinos.
* Debes quitar la bandera antes de poder abrir esa celda.

### Condición de victoria

Tras un flip seguro:

* Cuenta celdas no bomba expuestas, o lleva `remaining = N*N - B` y decrementa al exponer.
* Cuando remaining llega a 0, el estado pasa a WON.
* Tocar una bomba pone LOST al momento.

Un contador da comprobaciones de victoria O(1). Escanear la rejilla tras cada clic es O(N²) y vale para tableros pequeños.

### Qué no sobrecargar

* No hace falta un framework gráfico completo.
* No hace falta multijugador ni temporizadores salvo que lo pidan.
* Árboles de herencia "NumberCell vs BombCell" casi nunca compensan; un simple `boolean isBomb` más `int adjacent` basta.

---

## 4. Solución en Java

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

### Board: construir, colocar bombas, fijar números

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

### Board: bandera y clic con flood fill

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

### Impresión de texto (ayuda opcional)

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

### Recorrido pequeño

Supón un tablero 3x3 con una bomba en `(1,1)`. Los números a su alrededor son todos `1`. El centro es `*`. Esquinas y bordes que tocan la bomba muestran `1`. No hay región de ceros, así que cada clic seguro abre exactamente una celda. Ocho clics seguros ganan; clic en el centro pierde.

Ahora un tablero 5x5 con bombas solo cerca de las esquinas, de modo que el centro es un mar de ceros. Clic en el centro:

1. El centro es 0 → encola vecinos.
2. Cada 0 vecino se expone y se expande.
3. Las celdas numeradas en el borde de ese lago de ceros se exponen una vez y detienen el flood.
4. Un clic puede abrir docenas de celdas. Esa es la pieza que los entrevistadores quieren ver bien hecha.

### Tests deterministas sin UI completa

```java
// fixed seed so bomb layout is stable in unit tests
Board board = new Board(5, 3, 42L);
assert board.flipCell(2, 2); // hope safe; adjust seed if needed
board.toggleFlag(0, 0);
assert !board.hasExploded();
// after enough safe flips:
// assert board.isWon();
```

Para demos de entrevista, fija posiciones de bomba en lugar de aleatorio si quieres un guion fijo.

```java
// alternative for demos: placeBombsFromList(List of [r,c])
```

---

## 5. Tabla de complejidad

| Operación | Tiempo | Notas de espacio |
| --- | --- | --- |
| Construir rejilla | O(N²) | N² celdas |
| Colocar B bombas | O(B) esperado con set; peor O(N²) reintentos si denso | set de índices |
| setNumbers | O(N²) | 8 chequeos de vecino por celda |
| flipCell en un número | O(1) | expone una celda |
| flipCell en una gran región de ceros | O(K) para K celdas abiertas (hasta O(N²)) | cola BFS O(K) |
| toggleFlag | O(1) | |
| Victoria con contador | O(1) | `unexposedSafe` |
| Victoria con barrido completo | O(N²) | sin campo extra |

Para tamaños de entrevista (N entre 8 y 30), todo lo anterior vale. Di el bound del flood fill como "trabajo proporcional a las celdas reveladas."

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **N = 1, B = 1:** la única celda es bomba. El primer clic pierde. Ganar es imposible sin una regla especial.
* **N = 1, B = 0:** un blanco. Un clic y ganas.
* **B = 0:** todo el tablero son ceros. Un clic hace flood fill de todo y ganas.
* **B = N²:** toda celda es bomba. No hay clic seguro.
* **Clic fuera de rango:** ignora o lanza; fija el contrato.
* **Clic en celda con bandera:** no se descubre (hay que quitar la bandera antes).
* **Clic ya expuesta:** no-op, sigue siendo seguro.
* **Doble exposición en BFS:** protege con `isExposed` para no decrementar `unexposedSafe` dos veces.
* **Flood a través de números:** incorrecto. Los números se abren pero no encolan vecinos.
* **Flood hacia bombas:** nunca encoles celdas bomba. Aun así comprueba `!isBomb()` por seguridad.

Errores comunes:

1. **Contar vecinos antes de colocar bombas.**
2. **Solo 4 direcciones** en lugar de 8 (Minesweeper usa diagonales).
3. **Abrir solo el cero pulsado** sin flood fill.
4. **Expandir más allá de los números** hacia regiones no relacionadas.
5. **Olvidar que las banderas bloquean clics.**
6. **Ganar cuando todas las bombas tienen bandera** en lugar de cuando todas las no bomba están abiertas (la victoria clásica es exponer celdas seguras).
7. **Error de uno en `unexposedSafe`** al revisitar una celda en la cola.
8. **Imprimir bombas al jugador** mientras el juego sigue (vista debug vs vista jugador).

Idea mínima de smoke:

```java
Board empty = new Board(3, 0, 1L);
assert empty.flipCell(1, 1);
assert empty.isWon(); // all zeros opened in one flood

Board one = new Board(1, 1, 1L);
assert !one.flipCell(0, 0);
assert one.hasExploded();
```

---

## 7. Resumen para contárselo a un amigo

Minesweeper como problema de OOD son tres ideas:

1. **`Cell`** guarda bomba, número, expuesta, bandera de una casilla.
2. **`Board`** coloca `B` bombas y luego escribe conteos de vecinos con 8 direcciones.
3. **Clic** o pierde en bomba, o abre un número, o hace **flood fill BFS/DFS** de una región de ceros y su borde numerado. Las banderas solo evitan clics accidentales. Ganas cuando toda celda no bomba está expuesta.

Si puedes dibujar un tablero pequeño, colocar bombas, rellenar números y recorrer un flood fill a mano, dominas el problema 7.10. Los entrevistadores quieren que tus clases coincidan con los nombres del juego y que la expansión de ceros sea una búsqueda real en la rejilla, no un vago "abrir celdas cercanas."

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Circular Array](/blog/es/ctci-7-9-circular-array)
* Siguiente: [File System](/blog/es/ctci-7-11-file-system)