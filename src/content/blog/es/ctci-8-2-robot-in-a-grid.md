---
title: "Robot en una cuadrícula: camino solo derecha/abajo con celdas bloqueadas (Java)"
description: "Problema estilo CTCI 8.2 para principiantes: el robot va de arriba-izquierda a abajo-derecha solo con movimientos derecha y abajo. Algunas celdas están cerradas. DFS con memo (o DP) encuentra un camino en Java."
date: "2026-05-10"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
previewImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.2 para principiantes: el robot va de arriba-izquierda a abajo-derecha solo con movimientos derecha y abajo. Algunas celdas están cerradas. DFS con memo (o DP) encuentra un camino en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Estás en la esquina noroeste de una cuadrícula de manzanas. Solo puedes caminar **al este** o **al sur**. Algunas intersecciones están cerradas por obras. ¿Puedes llegar a la esquina sureste y, si sí, por qué secuencia de esquinas?

Eso es **robot en una cuadrícula**: un laberinto con dos movimientos legales, celdas bloqueadas opcionales, y **un** camino (no todos) como respuesta. La recursión dibuja el árbol de búsqueda. La memoización (o DP) evita resolver otra vez la misma celda muerta.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de camino en grilla en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). El capítulo 8 (recursión y programación dinámica) sigue después de [Triple Step](/blog/es/ctci-8-1-triple-step).

---

## 1. Analogía cotidiana

Imagina un mapa pequeño dibujado como filas y columnas de intersecciones:

* Empiezas en la intersección superior izquierda `(0, 0)`.
* La meta es la inferior derecha `(r - 1, c - 1)`.
* Desde una intersección abierta solo puedes ir **derecha** una cuadra o **abajo** una cuadra. Sin izquierda, sin arriba, sin diagonal.
* Algunas intersecciones están valladas. No puedes pisarlas.
* Necesitas **cualquier** recorrido legal del inicio a la meta, listado como secuencia de intersecciones. No todos los recorridos ni el más corto (con solo derecha y abajo, todo camino tiene la misma longitud: exactamente `(r - 1) + (c - 1)` movimientos).

Prueba una grilla 3x3 con el centro bloqueado:

```
S . .
. X .
. . E
```

Un camino: derecha, derecha, abajo, abajo (borde superior y luego derecho). Otro: abajo, abajo, derecha, derecha (borde izquierdo y luego inferior). Ambos evitan el centro.

Si la fila superior y la columna izquierda quedan bloqueadas después del inicio, puedes quedarte atrapado aunque la meta esté libre. La alcanzabilidad no es "¿el final está libre?"; es "¿hay una cadena de celdas libres unidas por derecha/abajo desde el inicio?"

---

## 2. Problema en palabras simples

**Entrada:** una grilla de `r` filas y `c` columnas. Cada celda está libre o fuera de límites. En el código: `true` permite pisar, `false` bloquea. Inicio `(0, 0)`. Meta `(r - 1, c - 1)`.

**Salida:** una lista de puntos del inicio a la meta que forman un camino válido, o `null` / vacío si no hay camino.

**Movimientos:** desde `(row, col)` solo a `(row, col + 1)` (derecha) o `(row + 1, col)` (abajo), y solo si el destino está dentro de límites y libre.

**Forma del punto:**

```java
class Point {
    final int row;
    final int col;

    Point(int row, int col) {
        this.row = row;
        this.col = col;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        Point p = (Point) o;
        return row == p.row && col == p.col;
    }

    @Override
    public int hashCode() {
        return 31 * row + col;
    }

    @Override
    public String toString() {
        return "(" + row + "," + col + ")";
    }
}
```

**Ejemplos pequeños:**

| Idea de grilla | ¿Camino? | Notas |
| --- | --- | --- |
| 1x1 libre | sí: `(0,0)` | inicio igual a meta |
| 1x1 bloqueada | no | no puedes pisar el inicio |
| 2x2 toda libre | sí | p. ej. derecha luego abajo, o abajo luego derecha |
| 2x2 solo `(0,1)` bloqueada | sí | debes ir abajo y luego derecha |
| 2x2 con `(0,1)` y `(1,0)` bloqueadas | no | las dos salidas del inicio cerradas |
| inicio o fin bloqueado | no | el camino incluye ambos extremos |

**Aclara antes de codificar:**

* Indexación: filas primero, luego columnas. Di `maze[row][col]`, no "x/y" sin definirlas.
* ¿El inicio está garantizado libre? Compruébalo igual.
* ¿Un camino o todos? **Un camino** en este problema.
* ¿Cómo se marcan las celdas bloqueadas? Grilla booleana, enteros `0/1`, o un set de puntos: elige uno.
* ¿Grilla vacía o null? Devuelve null.

---

## 3. Piensa primero

### La recursión encaja con los movimientos

Desde la celda `(r, c)`, hay camino si la celda está libre y:

* estás en la meta, o
* hay camino desde el vecino derecho, o
* hay camino desde el vecino de abajo.

También puedes buscar **hacia atrás** desde la meta: una celda es alcanzable si está libre y se llega a ella desde la de arriba o la de la izquierda (trabajando desde la meta hacia el origen). Misma complejidad asintótica. Hacia adelante desde el origen se siente natural al armar el camino.

### La fuerza bruta es exponencial

En cada paso puedes probar dos ramas. Un camino tiene unos `r + c` pasos, así que el árbol ingenuo es del orden `O(2^(r+c))` en el peor caso. Peor: muchas rutas visitan la **misma celda**. Si es un callejón sin salida, redescubres el fracaso una y otra vez.

### Memoiza fallos (y aciertos)

La optimización clave: por cada celda, pregunta una vez "¿hay camino desde aquí hasta la meta?" Guarda los **no** en un set de puntos fallidos (o un memo booleano 2D). Si ya probaste que una celda no llega, no la expandas otra vez.

Con esa caché, cada celda se explora un número constante de veces. El tiempo baja a **O(r * c)**. El espacio es O(r * c) para el memo más O(r + c) para el camino y la profundidad de recursión.

También puedes rellenar una tabla DP `canReach[row][col]` de abajo hacia arriba desde la meta y luego caminar desde el inicio eligiendo derecha o abajo cuando la siguiente celda aún puede llegar. Mismo O(r * c).

### Armar el camino

Dos estilos limpios:

1. **Al bajar:** cuando la llamada recursiva desde aquí tiene éxito, inserta este punto delante del sufijo (o al final y revierte).
2. **Desde la meta hacia el origen:** empieza en la meta, prueba izquierda y arriba; al tener un subcamino al origen, agrega el punto actual.

Cualquiera vale. Abajo usamos búsqueda **hacia adelante** desde el origen con un set de celdas fallidas.

### Boceto en la pizarra

1. Dibuja un 3x3, bloquea el centro.
2. DFS desde `(0,0)`: prueba derecha, recursión; prueba abajo, recursión.
3. Marca una celda como fallida solo cuando fallan ambas direcciones.
4. Al tocar `(2,2)`, el éxito sube y cada marco agrega su punto a la lista.

---

## 4. Solución en Java

DFS con memo desde el inicio. Celdas libres = `true`.

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Find one path from top-left to bottom-right.
 * Moves: right or down only. maze[r][c] == true means free.
 */
public class RobotInAGrid {

    public List<Point> getPath(boolean[][] maze) {
        if (maze == null || maze.length == 0 || maze[0].length == 0) {
            return null;
        }
        List<Point> path = new ArrayList<>();
        Set<Point> failed = new HashSet<>();
        if (findPath(maze, 0, 0, path, failed)) {
            return path;
        }
        return null;
    }

    /**
     * Returns true if there is a path from (row, col) to the goal.
     * On success, path contains points from (row, col) through the goal in order.
     */
    private boolean findPath(
            boolean[][] maze,
            int row,
            int col,
            List<Point> path,
            Set<Point> failed) {

        int rows = maze.length;
        int cols = maze[0].length;

        if (row < 0 || col < 0 || row >= rows || col >= cols || !maze[row][col]) {
            return false;
        }

        Point here = new Point(row, col);
        if (failed.contains(here)) {
            return false;
        }

        boolean atGoal = (row == rows - 1) && (col == cols - 1);

        if (atGoal
                || findPath(maze, row, col + 1, path, failed)
                || findPath(maze, row + 1, col, path, failed)) {
            // Recursion filled the suffix (right or down branch).
            // Add this cell at the front so the full list is start -> goal.
            path.add(0, here);
            return true;
        }

        failed.add(here);
        return false;
    }
}
```

`path.add(0, here)` mantiene el orden inicio → meta. Si prefieres solo append O(1), empuja al deshacer y revierte al final, o recoge desde la meta hacia atrás y revierte una vez.

### Variante: DP bottom-up y reconstrucción

```java
public List<Point> getPathDp(boolean[][] maze) {
    if (maze == null || maze.length == 0 || maze[0].length == 0) {
        return null;
    }
    int rows = maze.length;
    int cols = maze[0].length;
    if (!maze[0][0] || !maze[rows - 1][cols - 1]) {
        return null;
    }

    // canReach[r][c]: can we reach the goal from (r, c)?
    boolean[][] canReach = new boolean[rows][cols];
    canReach[rows - 1][cols - 1] = true;

    for (int r = rows - 1; r >= 0; r--) {
        for (int c = cols - 1; c >= 0; c--) {
            if (!maze[r][c]) {
                canReach[r][c] = false;
                continue;
            }
            if (r == rows - 1 && c == cols - 1) {
                continue;
            }
            boolean right = (c + 1 < cols) && canReach[r][c + 1];
            boolean down = (r + 1 < rows) && canReach[r + 1][c];
            canReach[r][c] = right || down;
        }
    }

    if (!canReach[0][0]) {
        return null;
    }

    List<Point> path = new ArrayList<>();
    int r = 0;
    int c = 0;
    path.add(new Point(0, 0));
    while (r != rows - 1 || c != cols - 1) {
        if (c + 1 < cols && canReach[r][c + 1]) {
            c++;
        } else if (r + 1 < rows && canReach[r + 1][c]) {
            r++;
        } else {
            return null; // should not happen if table is correct
        }
        path.add(new Point(r, c));
    }
    return path;
}
```

Mismo big-O. Útil si quieres una historia iterativa sin pila de recursión.

### Comprobaciones mínimas

```java
boolean[][] open2 = {
    {true, true},
    {true, true}
};
// path length 3, e.g. (0,0)-(0,1)-(1,1) or (0,0)-(1,0)-(1,1)

boolean[][] blockedCenter = {
    {true, true, true},
    {true, false, true},
    {true, true, true}
};
// still possible via top-right or bottom-left corridor

boolean[][] wall = {
    {true, false},
    {false, true}
};
// null path: both exits from start blocked
```

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| DFS ingenuo, sin memo | O(2^(r+c)) peor | O(r + c) pila + camino | Revisita celdas muertas |
| DFS con memo (set fallido) | O(r * c) | O(r * c) memo + O(r + c) camino/pila | Cada celda una vez |
| DP bottom-up + recorrido | O(r * c) | O(r * c) tabla | Sin recursión; reconstruye un camino |
| Longitud del camino (si existe) | - | O(r + c) puntos | Siempre `(r - 1) + (c - 1) + 1` celdas |

En la entrevista importa nombrar la trampa exponencial y luego mostrar el set de memo (o la tabla DP) que lo deja lineal en el número de celdas.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan esto:

* **Inicio o meta bloqueados:** fallo inmediato.
* **1x1 libre:** el camino es la única celda.
* **Una sola fila o columna:** un solo corredor; cualquier bloqueo lo corta.
* **Null o grilla de tamaño cero:** devuelve null; no indexar `maze[0]`.
* **Filas de distinta longitud:** asume rectangular; si no, valida `maze[i].length`.
* **Usar x/y sin definir qué es la fila:** prefiere `row` y `col`.

Errores comunes:

1. **Olvidar la memoización.** El código se ve bien y se cuelga en grillas grandes con muchos bloqueos cerca del final.
2. **Memoizar solo "visitado" por ciclos.** Con solo derecha/abajo no hay ciclos, pero las celdas **fallidas** siguen necesitando caché porque muchos padres comparten un hijo.
3. **Marcar fallida demasiado pronto** (antes de probar ambas direcciones).
4. **Off-by-one en la meta** (`rows` vs `rows - 1`).
5. **Mutar la grilla como visitado** sin restaurar y fallar una segunda llamada.
6. **Devolver celdas en orden inverso** (meta → inicio) sin revertir.
7. **Tratar bloqueado como libre** al mezclar convenciones `true`/`false`.

---

## 7. Recap para un amigo

Robot en grilla, versión entrevista:

1. Inicio arriba-izquierda, meta abajo-derecha. Movimientos: solo **derecha** o **abajo**. Algunas celdas prohibidas.
2. Recursión: desde una celda libre, prueba derecha, prueba abajo; éxito si llegas a la meta.
3. Sin caché, la misma celda muerta se explora por muchos padres: tiempo exponencial.
4. **Memo:** recuerda celdas que no llegan a la meta. Cada celda una vez → O(r * c).
5. Arma un camino registrando puntos en retornos exitosos (o tabla DP + recorrido codicioso).
6. Comprueba inicio/meta libres, límites y entrada vacía.

Si puedes dibujar un laberinto pequeño, marcar una celda fallida para que un segundo padre la salte, y escribir el método recursivo con memo sin bugs de índice, dominas el 8.2. Siguiente en el capítulo: [Magic Index](/blog/es/ctci-8-3-magic-index).

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Triple Step](/blog/es/ctci-8-1-triple-step)
* Siguiente: [Magic Index](/blog/es/ctci-8-3-magic-index)