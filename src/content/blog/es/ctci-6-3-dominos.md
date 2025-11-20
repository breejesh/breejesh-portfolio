---
title: "Dominos: Por qué un tablero mutilado no se puede embaldosar (Java)"
description: "Problema estilo CTCI 6.3 para principiantes: tablero 8x8 con dos esquinas opuestas quitadas, 31 dominós. El invariante de coloración prueba que es imposible. Cuentas, boceto y visualización opcional en Java."
date: "2025-11-20"
tags: [Algoritmos]
coverImage: /assets/images/ctci-6-3-dominos.webp
previewImage: /assets/images/ctci-6-3-dominos.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 6.3 para principiantes: tablero 8x8 con dos esquinas opuestas quitadas, 31 dominós. El invariante de coloración prueba que es imposible. Cuentas, boceto y visualización opcional en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un tablero de ajedrez 8x8 tiene 64 casillas. Quita dos esquinas opuestas y quedan 62. Un dominó cubre dos casillas adyacentes. Así que 31 dominós cubrirían exactamente 62 casillas **si** existiera un embaldosado. La pregunta de entrevista es simple: **¿existe?**

La respuesta sorprendente es **no**. No porque falles al buscar un diseño listo, sino porque un **argumento de coloración** demuestra que todo diseño está condenado. No hace falta probar todos los embaldosados.

Este post es enseñanza original para principiantes en **Java**. Misma familia de problemas que los clásicos de matemáticas y lógica en entrevistas, no una copia de un libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 6, puzzles de matemáticas y lógica, problema 6.3.

---

## 1. Analogía cotidiana

Imagina un suelo de cocina a cuadros, baldosas negras y blancas alternadas. Tú y un amigo tenéis pegamento de un solo color cada uno. Cada alfombra en forma de dominó debe sentarse sobre **una baldosa negra y una blanca**, porque un dominó son dos casillas juntas, y en una coloración estándar las casillas vecinas siempre tienen color distinto.

Ahora alguien arranca **dos baldosas negras** de esquinas opuestas y te da 31 alfombras. Sigues teniendo más blancas que negras. Cada alfombra quita una de cada color. Se te acaban primero las negras, con dos blancas sueltas y sin alfombra legal que cubra dos blancas. Esa es toda la prueba, contada como obra de suelo.

---

## 2. Enunciado en palabras simples

**Montaje:**

* Un tablero **8x8** (64 casillas).
* **Quita dos esquinas opuestas.** En un tablero estándar esas esquinas comparten color (ambas "negras" o ambas "blancas", según cómo nombres el negro).
* Tienes **31 dominós**. Cada uno cubre **exactamente dos casillas adyacentes** (comparten un lado, no solo una esquina).

**Pregunta:** ¿Pueden los 31 dominós cubrir cada casilla restante sin solaparse y sin huecos?

**Salida del razonamiento (lo que quieren en la entrevista):** un **sí o no** claro, más una **prueba**, no una búsqueda a medias.

**Números que importan:**

| Cantidad | Valor |
| --- | --- |
| Casillas del tablero completo | 64 |
| Casillas tras quitar dos | 62 |
| Dominós para cobertura total | 31 |
| Casillas negras en coloración estándar | 32 |
| Casillas blancas en coloración estándar | 32 |
| Esquinas opuestas quitadas | 2 del **mismo** color |
| Conteo restante por color | 30 de un color, 32 del otro |

**Aclara antes de "resolver":**

* ¿Adyacente significa que comparten lado? (Sí.)
* ¿Se pueden rotar los dominós? (Horizontal o vertical, ambos valen.)
* ¿Solo esquinas opuestas, o cualquier par? (Enunciado clásico: opuestas. Esquinas adyacentes tienen color distinto; esa variante es otra pregunta.)
* ¿El tablero siempre está pintado a cuadros? (Puedes elegir esa coloración. Es una herramienta de prueba, no una pintura obligatoria del tablero físico.)

---

## 3. Piensa primero

### Impulso ingenuo: buscar un embaldosado

Podrías hacer backtracking: colocar un dominó, recursar, deshacer. En 62 celdas la búsqueda es grande si no cuidas simetrías. Aquí no quieren un solver general de exact cover. Quieren el invariante.

### Mejor: invariante de paridad / coloración

Colorea el tablero como el ajedrez:

```
(r + c) even  -> black   (or white; pick one convention and stick to it)
(r + c) odd   -> white
```

Cualquier par de casillas que comparten un lado difieren en 1 en exactamente una coordenada. Así una tiene `r+c` par y la otra impar. **Cada dominó cubre una negra y una blanca.**

Un embaldosado perfecto de 31 dominós cubriría **31 negras y 31 blancas**.

¿De qué color son las esquinas opuestas?

Esquinas de un tablero 8x8 (filas y columnas 0-indexadas `0..7`):

```
(0,0)  r+c = 0  even
(0,7)  r+c = 7  odd
(7,0)  r+c = 7  odd
(7,7)  r+c = 14 even
```

Pares opuestos:

* `(0,0)` y `(7,7)`: ambos **pares** (mismo color).
* `(0,7)` y `(7,0)`: ambos **impares** (mismo color).

Quita dos esquinas opuestas y quitas **dos casillas de un color**. Quedan **30 de ese color y 32 del otro**.

31 dominós necesitarían 31+31. Tienes 30+32. **Imposible.**

### Qué es y qué no es la prueba

* Es un argumento de **condición necesaria**: si existiera un embaldosado, el conteo negro igualaría al blanco. No iguala. Así que no hay embaldosado.
* **No** dice "todo tablero con igual número de negras y blancas se puede embaldosar." La igualdad es necesaria, no siempre suficiente. Aquí la desigualdad basta para matar el problema.

### Contraste: quitar dos casillas de distinto color

Si quitas una negra y una blanca (por ejemplo dos esquinas adyacentes), los conteos quedan 31 y 31. El argumento de coloración ya no prohíbe un embaldosado. De hecho muchos de esos tableros **sí** se pueden embaldosar. Por eso "opuestas" es una palabra con peso.

---

## 4. Solución en Java (ayudas de razonamiento + boceto opcional)

No hace falta código de producción para la prueba. Aun así, un helper pequeño en Java que colorea el tablero, quita esquinas opuestas e imprime conteos hace tangible el invariante en un IDE de entrevista.

```java
public final class DominosBoard {
    private static final int N = 8;

    /** Color: 0 = black (even r+c), 1 = white (odd r+c). */
    public static int color(int r, int c) {
        return (r + c) & 1;
    }

    /**
     * Count remaining black (0) and white (1) after removing two opposite corners.
     * pair 0: (0,0) and (N-1,N-1); pair 1: (0,N-1) and (N-1,0).
     */
    public static int[] remainingColorCounts(int oppositePair) {
        boolean[][] removed = new boolean[N][N];
        if (oppositePair == 0) {
            removed[0][0] = true;
            removed[N - 1][N - 1] = true;
        } else {
            removed[0][N - 1] = true;
            removed[N - 1][0] = true;
        }

        int black = 0;
        int white = 0;
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                if (removed[r][c]) {
                    continue;
                }
                if (color(r, c) == 0) {
                    black++;
                } else {
                    white++;
                }
            }
        }
        return new int[] {black, white};
    }

    /** True only if remaining black == remaining white (necessary for any domino tiling). */
    public static boolean colorCountsAllowTiling(int oppositePair) {
        int[] counts = remainingColorCounts(oppositePair);
        return counts[0] == counts[1];
    }

    /** ASCII board: B/W for colors, . for removed. */
    public static String sketch(int oppositePair) {
        boolean[][] removed = new boolean[N][N];
        if (oppositePair == 0) {
            removed[0][0] = true;
            removed[N - 1][N - 1] = true;
        } else {
            removed[0][N - 1] = true;
            removed[N - 1][0] = true;
        }

        StringBuilder sb = new StringBuilder();
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                if (removed[r][c]) {
                    sb.append('.');
                } else {
                    sb.append(color(r, c) == 0 ? 'B' : 'W');
                }
                if (c + 1 < N) {
                    sb.append(' ');
                }
            }
            if (r + 1 < N) {
                sb.append('\n');
            }
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        for (int pair = 0; pair <= 1; pair++) {
            int[] counts = remainingColorCounts(pair);
            System.out.println("pair=" + pair
                    + " black=" + counts[0]
                    + " white=" + counts[1]
                    + " allowTiling=" + colorCountsAllowTiling(pair));
            System.out.println(sketch(pair));
            System.out.println();
        }
        // pair=0 black=30 white=32 allowTiling=false
        // pair=1 black=32 white=30 allowTiling=false
    }
}
```

### Opcional: backtracking ingenuo (muestra que la búsqueda falla; no es obligatorio)

Si quieres contrastar "búsqueda" frente a "prueba", un solver pequeño en un tablero **más chico** basta para demos. El 8x8 mutilado se atasca si no podas fuerte. El punto de la entrevista es que **no** deberías necesitar esa búsqueda.

```java
// Illustration only: try to tile a board represented as free cells.
// Returns true if some complete domino cover exists.
static boolean canTile(boolean[][] free) {
    int r = -1, c = -1;
    outer:
    for (int i = 0; i < free.length; i++) {
        for (int j = 0; j < free[i].length; j++) {
            if (free[i][j]) {
                r = i;
                c = j;
                break outer;
            }
        }
    }
    if (r < 0) {
        return true; // no free cells left: success
    }

    // place horizontal
    if (c + 1 < free[r].length && free[r][c + 1]) {
        free[r][c] = false;
        free[r][c + 1] = false;
        if (canTile(free)) {
            return true;
        }
        free[r][c] = true;
        free[r][c + 1] = true;
    }
    // place vertical
    if (r + 1 < free.length && free[r + 1][c]) {
        free[r][c] = false;
        free[r + 1][c] = false;
        if (canTile(free)) {
            return true;
        }
        free[r][c] = true;
        free[r + 1][c] = true;
    }
    return false;
}
```

Para el 8x8 mutilado, `colorCountsAllowTiling` ya devuelve false, así que puedes saltarte `canTile`.

---

## 5. Recorrido de los casos clásicos

### Caso A: esquinas opuestas `(0,0)` y `(7,7)`

Ambas tienen `r+c` par (negras en nuestra convención).

```
Full board:  32 B, 32 W
Remove 2 B:  30 B, 32 W
Dominos need equal counts per color → impossible
```

### Caso B: esquinas opuestas `(0,7)` y `(7,0)`

Ambas impares (blancas).

```
Remove 2 W:  32 B, 30 W
Still unequal → impossible
```

### Caso C: minitablero mental 2x2, quitar esquinas opuestas

```
B W
W B
```

Quita ambas B: quedan dos W en diagonal. No queda ningún par que comparta lado. Dos casillas del mismo color que solo se tocan en esquina no admiten un dominó. Mismo invariante, dibujo más chico.

### Caso D: quitar una negra y una blanca

Conteos: 31 B, 31 W. La coloración ya no prohíbe un embaldosado. Muchas configuraciones funcionan. Diló en voz alta para que vean que conoces el límite del argumento.

### Prueba rápida

```java
public static void main(String[] args) {
    int[] a = DominosBoard.remainingColorCounts(0);
    int[] b = DominosBoard.remainingColorCounts(1);
    assert a[0] + a[1] == 62;
    assert b[0] + b[1] == 62;
    assert a[0] != a[1];
    assert b[0] != b[1];
    assert !DominosBoard.colorCountsAllowTiling(0);
    assert !DominosBoard.colorCountsAllowTiling(1);
    System.out.println("counts invariant ok");
}
```

---

## 6. Complejidad, bordes, tips de entrevista

| Tema | Respuesta |
| --- | --- |
| Decisión en esta instancia | Imposible (no hay embaldosado) |
| Herramienta de prueba | Coloración tipo ajedrez; cada dominó toma una negra + una blanca |
| Tras quitar esquinas opuestas | 30 de un color, 32 del otro |
| Tiempo con la prueba | Razonamiento O(1); O(n²) si recorres un tablero n×n para contar |
| Espacio extra para un boceto | O(n²) con tablero explícito, o O(1) si solo razonas |
| Alternativa por búsqueda | Backtracking exponencial; innecesario cuando el invariante falla |

**Errores comunes:**

1. **Intentar inventar un diseño especial** en vez de buscar un invariante.
2. **Olvidar que las esquinas opuestas son del mismo color.** Dibuja las cuatro y marca colores primero.
3. **Decir "62 es par, así que funciona."** El tamaño par es necesario para dominós, no suficiente.
4. **Afirmar que igual negro/blanco siempre embaldosa.** Necesario, no suficiente. Aquí solo necesitas la necesidad.
5. **Mezclar opuestas con adyacentes.** Las adyacentes difieren de color; la trampa clásica usa opuestas.
6. **Pasarte de código.** Una prueba correcta de dos minutos gana a un solver roto de media hora.

**Cómo contarlo (versión de 30 segundos):**

1. Colorea el tablero negro/blanco.
2. Cada dominó cubre uno de cada.
3. Las esquinas opuestas son del mismo color, así que al quitarlas quedan 30 y 32.
4. Por tanto 31 dominós no pueden cubrir el tablero.

**Dónde aparece la idea después:**

* Argumentos de invariante en puzzles (balance, paridad, aritmética modular).
* Intuición de matching: los dominós son aristas en un grafo bipartito negro vs blanco; partes desiguales implican que no hay matching perfecto.
* Otras preguntas de tableros "mutilados" y embaldosados en entrevistas.

---

## 7. Resumen para contárselo a un amigo

Dominos (problema 6.3) es un problema de **lógica**, no una molienda de código.

1. Tablero 8x8, dos esquinas opuestas fuera: 62 casillas, así que 31 dominós cabrían solo por el conteo.
2. Colorea el tablero. Las casillas adyacentes siempre tienen color distinto.
3. Cada dominó cubre una negra y una blanca.
4. Las esquinas opuestas son del **mismo** color, así que quitas dos de un color.
5. Quedan 30 y 32. Un embaldosado completo necesitaría 31 y 31. Imposible.

Si puedes marcar las cuatro esquinas, decir el hecho del mismo color y cerrar con el conteo 30/32, dominas el problema 6.3. No hace falta colocar un solo dominó en la hoja.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Basketball](/blog/es/ctci-6-2-basketball)
* Siguiente: [Ants on a Triangle](/blog/es/ctci-6-4-ants-on-a-triangle)