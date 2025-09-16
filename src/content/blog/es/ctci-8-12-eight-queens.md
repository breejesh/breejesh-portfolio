---
title: "Ocho reinas: colocar 8 reinas sin atacarse con backtracking (Java)"
description: "Problema estilo CTCI 8.12 para principiantes: pon ocho reinas en un tablero 8x8 sin compartir fila, columna ni diagonal. Colocación por filas, chequeos de conflicto y backtracking limpio en Java."
date: "2025-09-16"
tags: [Algoritmos]
coverImage: /assets/images/ctci-8-12-eight-queens.webp
previewImage: /assets/images/ctci-8-12-eight-queens.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.12 para principiantes: pon ocho reinas en un tablero 8x8 sin compartir fila, columna ni diagonal. Colocación por filas, chequeos de conflicto y backtracking limpio en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Una reina de ajedrez come cualquier pieza en su **fila**, **columna** o en cualquiera de las dos **diagonales**. Coloca ocho reinas en un tablero 8x8 de modo que ninguna pueda capturar a otra. Ese es el clásico puzzle de las **ocho reinas**, y en entrevistas es la forma más clara de mostrar que sabes hacer **backtracking**: pruebas una colocación, profundizas y deshaces cuando llegas a un callejón sin salida.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de recursión en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide).

---

## 1. Analogía cotidiana

Imagina ocho jefes que deben sentarse en ocho escritorios de una cuadrícula de salas. Cada jefe exige:

* nadie más en mi **planta** (fila),
* nadie más en mi **pasillo** (columna),
* nadie más en ninguno de los **pasillos diagonales** que cruzan mi mesa.

Vas **fila por fila** (o columna por columna; es la misma idea). En la fila 0 pruebas cada columna. Por cada intento pasas a la fila 1 y pruebas cada columna libre y no atacante. Cuando una fila no tiene columna legal, retrocedes una fila y cambias esa elección anterior. Cuando llenas las ocho filas, tienes un plan completo. Sigues para listar **todos** los planes válidos.

Ese camino de deshacer y reintentar es backtracking. No generas primero las 8! permutaciones de columnas para filtrar después si puedes podar antes.

---

## 2. Problema en palabras simples

**Entrada:** tamaño del tablero `n` (caso clásico: `n = 8`).

**Salida:** todas las formas de colocar `n` reinas en un tablero `n x n` de modo que ninguna ataque a otra. Atacar significa misma fila, misma columna o misma diagonal.

**Qué devolver en código:**

* Una lista de soluciones. Cada una puede ser un array de índices de columna por fila, o una lista de strings del tablero (estilo LeetCode), o tableros impresos. Elige una y dilo.
* El conteo de soluciones es un buen follow-up (`92` para `n = 8`).

**Reglas que importan:**

* Las reinas atacan a cualquier distancia en fila, columna y ambas diagonales (sin bloqueadores).
* Exactamente una reina por solución en cada fila **y** cada columna si usas la optimización habitual (ver abajo). Nunca necesitas dos en la misma fila.
* Un tablero vacío no es solución para `n > 0`. Hay que colocar las `n` reinas.

**Ejemplo pequeño (`n = 4`):** hay exactamente 2 soluciones (según cómo las imprimas). Una es:

```
. Q . .
. . . Q
Q . . .
. . Q .
```

Ninguna reina comparte fila, columna o diagonal. Para `n = 8` hay **92** soluciones distintas (12 si ignoras simetrías del tablero).

**Aclara antes de codear:**

* ¿`n = 8` fijo o `n` general? Escribe general; demo con 8.
* ¿Todos los tableros o solo el conteo? Todos es lo clásico.
* ¿Representación? `int[] columns` con `columns[row] = col` basta para la lógica; el pretty-print después.
* ¿Filas y columnas 0-indexadas? Sí en código.

---

## 3. Piensa primero

### La fuerza bruta es enorme

Hay `C(64, 8)` formas de elegir 8 casillas, o `64 P 8` si el orden importa. La mayoría son ilegales. Necesitas estructura.

### Una reina por fila (y por columna)

Si dos reinas comparten fila, se atacan. Así que una solución es una **permutación** de columnas para las filas `0 .. n-1`: la fila `r` tiene exactamente una reina en la columna `columns[r]`, y todos los `columns[r]` son distintos.

Eso baja la búsqueda a como mucho `n!` permutaciones, y las diagonales siguen filtrando la mayoría.

Puedes colocar **fila por fila** o **columna por columna**. Misma idea. Este post coloca por **fila**: para la fila `r`, prueba cada columna `c`.

### Qué significa "bajo ataque"

Cuando intentas poner una reina en `(row, col)`, cada reina anterior en `(r2, c2)` con `r2 < row` no debe atacarla:

1. **Misma columna:** `col == c2`
2. **Misma diagonal:** `|col - c2| == |row - r2|`  
   (misma distancia hacia abajo y hacia el lado)

La misma fila no ocurre si colocas una por fila.

### Esqueleto de backtracking

```
place(row):
  if row == n:
    guarda una copia de columns
    return
  for col in 0 .. n-1:
    if isSafe(row, col):
      columns[row] = col
      place(row + 1)
      // no hace falta deshacer si la siguiente escritura pisa columns[row]
```

`isSafe` solo mira las filas `0 .. row-1`.

### Chequeos más rápidos (opcional)

Recorrer reinas anteriores es `O(n)` por intento. Puedes mantener tres arrays booleanos para chequeos O(1):

| Array | Marca | Idea de índice |
| --- | --- | --- |
| `usedCol[c]` | columna ocupada | `c` |
| `usedDiag1[d]` | una familia de diagonales | `row - col + (n - 1)` |
| `usedDiag2[d]` | la otra familia | `row + col` |

Activa las tres banderas al colocar y límpialas al retroceder. Mismas soluciones; mejores constantes. En entrevista vale cualquiera. Empieza con el scan simple; menciona los arrays si piden acelerar.

### Por qué backtracking y no DP puro

Necesitas **cada colocación completa válida**, no un solo score máximo. Los estados se ramifican y los tableros parciales ilegales mueren pronto. Es búsqueda con poda, no una tabla DP clásica.

### Boceto en pizarra para `n = 4`

1. Fila 0, prueba col 0. Coloca.
2. Fila 1: col 0 bloqueada (columna). col 1 bloqueada (diagonal). Prueba col 2.
3. Fila 2: muchas casillas bloqueadas; quizá callejón sin salida.
4. Deshaz fila 1, prueba col 3, sigue.
5. Al final llegas a los dos tableros completos. Cuenta = 2.

Decir esto en voz alta muestra que entiendes podar y reintentar, no solo "recursión de alguna forma."

---

## 4. Solución en Java

Versión didáctica: `n` general, una reina por fila, validación contra reinas anteriores, mapas de columnas y tableros en string opcionales.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * n-queens via backtracking.
 * columns[row] = column of the queen in that row.
 */
public class EightQueens {
    private final int n;
    private final List<int[]> placements = new ArrayList<>();

    public EightQueens(int n) {
        if (n < 1) {
            throw new IllegalArgumentException("n must be positive");
        }
        this.n = n;
    }

    /** All solutions as column arrays (length n). */
    public List<int[]> solvePlacements() {
        placements.clear();
        int[] columns = new int[n];
        Arrays.fill(columns, -1);
        place(0, columns);
        return new ArrayList<>(placements);
    }

    /** LeetCode-style boards: list of strings with 'Q' and '.'. */
    public List<List<String>> solveBoards() {
        List<List<String>> boards = new ArrayList<>();
        for (int[] cols : solvePlacements()) {
            boards.add(toBoard(cols));
        }
        return boards;
    }

    private void place(int row, int[] columns) {
        if (row == n) {
            placements.add(columns.clone());
            return;
        }
        for (int col = 0; col < n; col++) {
            if (isSafe(columns, row, col)) {
                columns[row] = col;
                place(row + 1, columns);
                // columns[row] will be overwritten on the next try
            }
        }
    }

    /** True if (row, col) does not attack any queen in rows 0 .. row-1. */
    private boolean isSafe(int[] columns, int row, int col) {
        for (int r = 0; r < row; r++) {
            int c = columns[r];
            if (c == col) {
                return false; // same column
            }
            // same diagonal: equal row distance and column distance
            if (Math.abs(c - col) == row - r) {
                return false;
            }
        }
        return true;
    }

    private List<String> toBoard(int[] columns) {
        List<String> board = new ArrayList<>(n);
        for (int r = 0; r < n; r++) {
            char[] line = new char[n];
            Arrays.fill(line, '.');
            line[columns[r]] = 'Q';
            board.add(new String(line));
        }
        return board;
    }

    public static void main(String[] args) {
        EightQueens eq = new EightQueens(8);
        List<int[]> all = eq.solvePlacements();
        System.out.println("solutions for n=8: " + all.size()); // 92

        EightQueens four = new EightQueens(4);
        List<List<String>> boards = four.solveBoards();
        System.out.println("solutions for n=4: " + boards.size()); // 2
        for (List<String> b : boards) {
            for (String row : b) {
                System.out.println(row);
            }
            System.out.println();
        }
    }
}
```

El recorrido de la primera solución de `n = 4` depende del orden de columnas, pero aparecerán ambos tableros válidos.

| Paso | Acción | Notas |
| --- | --- | --- |
| inicio | `place(0)` | prueba cols 0..3 en fila 0 |
| coloca | set `columns[0]`, llama `place(1)` | fila más profunda |
| rechaza | `isSafe` false | misma columna o diagonal |
| acepta completo | `row == n` | clona `columns` a resultados |
| sigue | siguiente `col` en la fila actual | otras ramas |
| fin | se agotan los bucles | `n=4` → 2, `n=8` → 92 |

Variante con banderas O(1) (solo boceto):

```java
// usedCol[c], diag1[row - col + n - 1], diag2[row + col]
private void placeFast(int row, int[] columns,
                       boolean[] usedCol, boolean[] d1, boolean[] d2) {
    if (row == n) {
        placements.add(columns.clone());
        return;
    }
    for (int col = 0; col < n; col++) {
        int i1 = row - col + n - 1;
        int i2 = row + col;
        if (usedCol[col] || d1[i1] || d2[i2]) {
            continue;
        }
        usedCol[col] = d1[i1] = d2[i2] = true;
        columns[row] = col;
        placeFast(row + 1, columns, usedCol, d1, d2);
        usedCol[col] = d1[i1] = d2[i2] = false; // backtrack
    }
}
```

El mismo árbol de decisiones. Las banderas hacen "¿está libre esta casilla?" en tiempo constante.

---

## 5. Tabla de complejidad

| Pieza | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Árbol de búsqueda completo | cota superior O(n!) | O(n) recursión + O(n) columns | la poda corta la mayoría de ramas |
| Versión scan de `isSafe` | O(n) por candidato | O(1) más allá de columns | fácil de codear y explicar |
| Versión con arrays de flags | O(1) por candidato | O(n) para tres boolean[] | misma búsqueda exterior |
| Tamaño de salida | Θ(S · n) al copiar | Θ(S · n) | S = número de soluciones (92 para n=8) |
| `n = 8` en la práctica | pequeño | pequeño | termina al instante en un portátil |

Al entrevistador le importa que fuerces una reina por fila, cheques columnas y diagonales, y clones el tablero al registrar una solución (no guardes el array mutable vivo).

---

## 6. Casos borde y errores comunes

Los entrevistadores tocan estos:

* **`n = 1`:** una solución, una sola reina. No hagas caso especial salvo que lo pidan.
* **`n = 2` y `n = 3`:** cero soluciones. Lista vacía es correcta.
* **`n = 4`:** exactamente 2. Buen test de humo.
* **`n = 8`:** 92 soluciones. Si sale otro número, el chequeo de diagonal probablemente está mal.
* **Guardar el array vivo `columns`** en la lista de resultados sin `clone()`. Todas las entradas acaban como la última permutación.
* **Olvidar el valor absoluto en la diagonal** o mirar solo una dirección diagonal.
* **Permitir dos reinas en una columna** porque solo checaste diagonales.
* **Off-by-one en índices de flags** para `row - col + n - 1` (debe quedar no negativo).
* **Mutar el tablero mientras iteras resultados** después de la búsqueda.

Errores comunes:

1. **Colocar libremente en las 64 casillas** sin una por fila. El código se infla y confunde.
2. **Chequear solo celdas adyacentes.** Las reinas atacan a cualquier distancia.
3. **Usar la misma referencia de lista/array** para cada solución.
4. **No deshacer en los arrays de flags.** Una columna marcada used nunca se libera.
5. **Contar simetrías como respuesta principal** cuando pedían todos los tableros distintos (92, no 12).
6. **Devolver solo tableros bonitos** y nunca probar el conteo para `n = 8`.

Idea mínima de smoke:

```java
assert new EightQueens(1).solvePlacements().size() == 1;
assert new EightQueens(2).solvePlacements().size() == 0;
assert new EightQueens(3).solvePlacements().size() == 0;
assert new EightQueens(4).solvePlacements().size() == 2;
assert new EightQueens(8).solvePlacements().size() == 92;
```

---

## 7. Resumen para contárselo a un amigo

Ocho reinas pide: pon ocho reinas en un tablero de ajedrez sin que se ataquen.

1. Pon **una reina por fila**. La elección por fila es qué **columna**.
2. Las columnas deben ser todas distintas. Las diagonales no deben alinearse (`|Δcol| == |Δrow|`).
3. **Backtrack:** prueba una columna, recurre a la siguiente fila, deshaz y prueba la siguiente cuando te atasques o tras registrar un tablero completo.
4. Guarda una **copia** de cada colocación completa. Para `n = 8` deberías hallar **92** formas.
5. Aceleración opcional: arrays booleanos para columnas usadas y ambas familias de diagonales, así cada intento valida en O(1).

Si puedes dibujar `n = 4`, mostrar una colocación parcial fallida y explicar por qué clonar el array de la solución importa, dominas el 8.12. La recursión aquí no es "memoización mágica." Es búsqueda disciplinada con deshacer.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Coins](/blog/es/ctci-8-11-coins)
* Siguiente: [Stack of Boxes](/blog/es/ctci-8-13-stack-of-boxes)