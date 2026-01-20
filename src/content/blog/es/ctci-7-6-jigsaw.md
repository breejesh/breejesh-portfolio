---
title: "Jigsaw: Emparejar bordes IN OUT FLAT para armar el tablero (Java)"
description: "Problema 7.6 estilo CTCI para principiantes: modela piezas de rompecabezas con cuatro bordes (INNER, OUTER, FLAT), rotalas y llena un tablero N por N emparejando lados opuestos. Diseño de objetos y un esbozo de solver en Java."
date: "2026-01-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-6-jigsaw.webp
previewImage: /assets/images/ctci-7-6-jigsaw.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema 7.6 estilo CTCI para principiantes: modela piezas de rompecabezas con cuatro bordes (INNER, OUTER, FLAT), rotalas y llena un tablero N por N emparejando lados opuestos. Diseño de objetos y un esbozo de solver en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un jigsaw es un tablero de piezas. Cada pieza tiene cuatro lados. Un lado es una **pestaña** (sale hacia fuera), una **ranura** (entra hacia dentro) o **plano** (recto, solo en el borde exterior del puzzle terminado). Dos piezas encajan cuando una pestaña encuentra una ranura. Los lados planos solo tocan el borde de la mesa, no el plano de otra pieza en el centro.

Es diseño orientado a objetos clásico con una capa fina de algoritmo encima. Necesitas clases que guarden bordes y orientación, reglas de "encajan estos dos bordes" y una forma de probar piezas en celdas vacías hasta llenar el tablero. Enseñanza original para principiantes en **Java**. Misma familia de puzzles OOD de entrevista, no una copia del libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide).

---

## 1. Analogía cotidiana

Piensa en un puzzle de niños 3 por 3 sobre la mesa.

* Las **cuatro esquinas** tienen cada una dos lados planos. Las sientes primero.
* Las piezas de **borde** (no esquina) tienen exactamente un lado plano.
* La pieza del **centro** no tiene planos: solo pestañas y ranuras.

Nunca fuerzas dos planos en el medio. Nunca pones dos pestañas una contra otra. La pestaña entra en la ranura. Después de colocar una pieza, su borde derecho debe encajar con el izquierdo del vecino a la derecha, y lo mismo arriba y abajo.

La rotación importa. La misma pieza física puede sentarse en cuatro orientaciones. En código rotas el array de bordes o guardas un índice de orientación y mapeas "arriba" al lado físico correcto.

---

## 2. Enunciado en claro

**Objetivo:** diseñar tipos y métodos para un jigsaw **N por N** y un solver que coloque cada pieza de modo que todos los bordes adyacentes encajen.

**Formas de borde (modelo típico de entrevista):**

| Forma | Significado |
| --- | --- |
| `FLAT` | Borde recto. En el contorno exterior del puzzle terminado. |
| `INNER` | Ranura / hueco. Acepta un `OUTER`. |
| `OUTER` | Pestaña / saliente. Entra en un `INNER`. |

Algunos textos usan `IN` / `OUT` en lugar de `INNER` / `OUTER`. Misma idea.

**Pieza:**

* Cuatro bordes en orden: arriba, derecha, abajo, izquierda (o cualquier orden fijo que mantengas).
* Id opcional para saber qué pieza física está dónde.
* Capacidad de **rotar** 90 grados en sentido horario (o antihorario). Cuatro orientaciones.

**Puzzle / tablero:**

* Cuadrícula `N x N`, cada celda vacía o con una pieza (con orientación).
* Lista de piezas libres aún no colocadas.
* Método **solve**: llenar la cuadrícula de modo que cada borde compartido encaje y las celdas exteriores usen `FLAT` en los lados realmente externos.

**Regla de empareje:**

* `INNER` encaja con `OUTER` y `OUTER` con `INNER`.
* `FLAT` solo encaja con otro `FLAT` si alguna vez comparas planos (la lógica del borde suele comprobar "este lado mira afuera, así que debe ser FLAT").
* Dos piezas que comparten un lado deben presentar formas complementarias en los bordes que se tocan.

**Aclara en la entrevista:**

* ¿El puzzle es siempre cuadrado? (Normalmente sí, `N x N`.)
* ¿Solución única? (A menudo sí en el modelo de juguete.)
* ¿Los perfiles de borde son lo bastante únicos o muchas aristas comparten el mismo tipo? (Solo por tipo es más débil; los puzzles reales tienen curvas únicas. En entrevista suele usarse el modelo de tres tipos.)
* ¿Se pueden voltear (espejo)? El estilo clásico CTCI suele permitir **solo rotar**, sin flip.

**Boceto de firmas:**

```java
enum EdgeType { INNER, OUTER, FLAT }

boolean fitsWith(EdgeType a, EdgeType b); // INNER+OUTER o OUTER+INNER

class Piece {
    void rotateClockwise();
    EdgeType edgeAt(Orientation side); // TOP, RIGHT, BOTTOM, LEFT tras rotar
}

class Puzzle {
    boolean solve();
    Piece[][] getBoard();
}
```

---

## 3. Piensa primero

### Clases que casi siempre quieres

1. **`EdgeType`** (o `Shape`): los tres valores.
2. **`Orientation`**: `TOP`, `RIGHT`, `BOTTOM`, `LEFT` (y helpers de rotación).
3. **`Piece`**: cuatro bordes, id, rotar, obtener el borde que mira a una dirección.
4. **`Puzzle`**: tablero, lista libre, colocar/quitar, solve.

Algunas soluciones añaden un objeto `Edge` con puntero a la pieza padre y un flag "matched". Útil si agrupas bordes por tipo. No hace falta para un solver pequeño.

### Dónde puede ir cada pieza (filtro geométrico)

Antes de probar cada pieza libre en cada celda:

| Ubicación | Conteo de planos / regla |
| --- | --- |
| Esquina (4 celdas) | Exactamente dos flats, en los dos lados externos de esa esquina |
| Borde no esquina | Exactamente un flat, en el lado externo |
| Interior | Cero flats |

Eso recorta fuerte el espacio de búsqueda. No pruebas una pieza de centro en una esquina.

### Estrategias de solver

**A. Agrupar y colocar (casi codicioso)**

1. Parte las piezas libres en esquinas, bordes e interior por conteo de flats.
2. Coloca las cuatro esquinas (prueba orientaciones que pongan flats fuera).
3. Llena celdas de borde, luego interior.
4. En cada celda, prueba candidatos restantes en cada rotación; acepta el primero que encaje con vecinos ya puestos; backtrack si falla.

**B. Backtracking puro celda a celda**

Recorre celdas en orden fila-mayor. En cada vacía, prueba cada pieza restante y cada rotación. Comprueba encaje con vecinos ya llenos (izquierda y arriba bastan si llenas de izquierda a derecha, de arriba abajo). Recurre. Deshaz al fallar.

Ambas valen en entrevista. Agrupar por esquina/borde/interior muestra estructura. El backtracking puro es más fácil de codificar con poco tiempo.

### Comprobar encaje con vecinos

Al colocar la pieza `p` en `(r, c)`:

* Si `c > 0` y la celda izquierda está llena: el LEFT de `p` debe encajar con el RIGHT del vecino.
* Si `r > 0` y la de arriba está llena: el TOP de `p` debe encajar con el BOTTOM del vecino.
* Si está en el borde exterior: el/los lado(s) que miran afuera deben ser `FLAT`.
* Opcional, si derecha/abajo ya están llenas (raro si llenas en orden): comprueba también.

```java
static boolean edgesMatch(EdgeType a, EdgeType b) {
    if (a == EdgeType.FLAT || b == EdgeType.FLAT) {
        return a == EdgeType.FLAT && b == EdgeType.FLAT; // raro en el centro
    }
    return (a == EdgeType.INNER && b == EdgeType.OUTER)
        || (a == EdgeType.OUTER && b == EdgeType.INNER);
}
```

Para el borde, prefiere un chequeo explícito "el lado exterior debe ser FLAT" a inventar un vecino fantasma con bordes planos.

### Modelo de rotación

Guarda bordes en un array de longitud 4: índice `0 = TOP`, `1 = RIGHT`, `2 = BOTTOM`, `3 = LEFT`.

90 grados horario:

```
new[0] = old[3]  // el LEFT viejo pasa a TOP
new[1] = old[0]  // el TOP viejo pasa a RIGHT
new[2] = old[1]
new[3] = old[2]
```

O deja los bordes originales fijos y guarda `orientation` en `0..3`, luego mapea:

```
physicalIndex = (requestedSide + orientation) % 4
```

Cualquier estilo vale. Elige uno y úsalo en todas partes.

---

## 4. Solución en Java

Modelo compacto: pieza con cuatro tipos de borde, tablero y solve recursivo de izquierda a derecha, de arriba abajo. Las piezas son objetos únicos en una lista libre.

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
    // edges[0]=TOP, [1]=RIGHT, [2]=BOTTOM, [3]=LEFT en la orientación actual
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
        // El contorno exterior debe ser FLAT por fuera
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

        // Lados interiores que miran adentro no deben ser FLAT
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
            return true; // todas las filas llenas
        }
        int nextR = (c == n - 1) ? r + 1 : r;
        int nextC = (c == n - 1) ? 0 : c + 1;

        // Snapshot del tamaño de free; quitamos/añadimos por índice
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
            free.add(i, p); // restaurar en el mismo índice
        }
        return false;
    }
}
```

Idea de humo 2 por 2 (solo cuatro piezas de esquina):

```java
// Cada pieza: dos flats en lados externos tras la rotación correcta.
// Pieza A pensada arriba-izquierda: FLAT top, OUTER right, INNER bottom, FLAT left
List<Piece> pieces = new ArrayList<>();
pieces.add(new Piece(0, EdgeType.FLAT, EdgeType.OUTER, EdgeType.INNER, EdgeType.FLAT));
pieces.add(new Piece(1, EdgeType.FLAT, EdgeType.FLAT, EdgeType.OUTER, EdgeType.INNER));
pieces.add(new Piece(2, EdgeType.OUTER, EdgeType.INNER, EdgeType.FLAT, EdgeType.FLAT));
pieces.add(new Piece(3, EdgeType.INNER, EdgeType.FLAT, EdgeType.FLAT, EdgeType.OUTER));

Puzzle puzzle = new Puzzle(2, pieces);
System.out.println(puzzle.solve()); // true si las parejas alinean
```

Recorrido de una colocación:

| Paso | Acción | Comprobación |
| --- | --- | --- |
| 1 | Probar pieza en (0,0) | TOP y LEFT deben ser FLAT; BOTTOM/RIGHT no FLAT |
| 2 | Probar pieza en (0,1) | TOP y RIGHT FLAT; LEFT complementa el RIGHT de (0,0) |
| 3 | Probar pieza en (1,0) | BOTTOM y LEFT FLAT; TOP complementa el BOTTOM de (0,0) |
| 4 | Probar pieza en (1,1) | BOTTOM y RIGHT FLAT; encaja con izquierda y arriba |
| 5 | No quedan celdas | `solve` devuelve true |

Si una celda no tiene candidato en ninguna rotación, backtrack: limpia la celda, rota o cambia la pieza anterior, sigue.

### Opcional: agrupar esquinas primero

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
// Para N=2 no hay interior ni piezas de un solo flat.
// Para N>=3: 4 esquinas, 4*(N-2) de borde, (N-2)*(N-2) interior.
```

Usa la lista correcta al llenar cada tipo de celda. Mismo `fits` y backtracking, menos candidatos.

---

## 5. Tabla de complejidad

| Pieza | Tiempo | Notas |
| --- | --- | --- |
| `rotateClockwise` | O(1) | cuatro slots de borde |
| `fits` | O(1) | pocos chequeos de vecinos |
| `solve` peor caso | O((N^2)! * 4^{N^2}) ingenuo | toda permutación y rotación; el pruning ayuda mucho |
| Candidatos agrupados | sigue exponencial | menos intentos por celda en la práctica |
| Espacio | O(N^2) | tablero + lista libre |

En entrevista importa más que nombres la búsqueda exponencial y el pruning (flats del borde, complementos de vecinos, grupos de esquina) a inventar un algoritmo polinomial de jigsaw. Las apps reales añaden firmas únicas de borde para que el empareje sea casi determinista.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan esto:

* **N = 1:** una sola pieza, los cuatro lados FLAT. Solve es "colócala si todo es flat."
* **N = 2:** solo esquinas (cada una dos flats). Sin piezas de borde puro ni interior.
* **Flat mal en el exterior:** puede encajar con un vecino y seguir siendo ilegal en el borde.
* **FLAT dentro:** nunca pongas un flat contra INNER/OUTER de otra pieza.
* **Olvidar rotación:** la pieza correcta falla en cada celda hasta probar los cuatro giros.
* **Mutar mal la lista free:** bugs de remove/add saltan piezas o entran en bucle.
* **Comparar el mismo borde absoluto tras rotar sin actualizar:** quédate con un solo modelo de rotación.

Errores comunes:

1. **Modelar solo piezas como imágenes**, sin tipos de borde. Entonces no escribes `fits`.
2. **Emparejar INNER con INNER.** Las pestañas no entran en pestañas.
3. **Tratar FLAT como complementario de todo.** Flat es para el contorno.
4. **Sin backtracking.** La primera pieza que parece legal en la celda 0 puede bloquear la 3.
5. **Permitir flips sin decirlo.** El espejo cambia el ciclo de bordes; di solo rotar salvo que pregunten.
6. **Comprobar solo el vecino izquierdo**, olvidar el de arriba (o las reglas de FLAT exterior).

Chequeos mínimos para decir en voz alta:

```java
// Tras solve, para cada par adyacente:
// complementary(left.RIGHT, right.LEFT)
// complementary(up.BOTTOM, down.TOP)
// Para cada lado exterior de celda del borde: edge == FLAT
```

---

## 7. Recap para un amigo

Jigsaw es OOD primero, búsqueda después:

1. Cada pieza tiene cuatro bordes: `INNER`, `OUTER` o `FLAT`.
2. `INNER` cierra con `OUTER`. Los lados del contorno exterior deben ser `FLAT`.
3. Rotas una pieza ciclando sus cuatro bordes (cuatro orientaciones).
4. El tablero es `N x N`. Esquinas con dos flats, borde con uno, interior con cero.
5. Solver: en cada celda vacía, prueba piezas libres y rotaciones; comprueba borde + izquierda + arriba; recurre; deshaz al fallar.
6. Agrupar esquina/borde/interior acorta la lista de intentos, pero es opcional.

Si dibujas cuatro bordes en un cuadrado, dices cómo pestaña encuentra ranura y das un paso de backtracking en un 2 por 2, dominas el 7.6. El diseño es el producto; el solver prueba que el diseño funciona.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Online Book Reader](/blog/es/ctci-7-5-online-book-reader)
* Siguiente: [Chat Server](/blog/es/ctci-7-7-chat-server)