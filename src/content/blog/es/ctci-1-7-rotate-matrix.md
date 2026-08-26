---
title: "CTCI 1.7 Rotate Matrix: girar una cuadrícula NxN 90 grados in place (Java)"
description: "Rota una matriz NxN 90 grados en sentido horario sin una segunda matriz. Intercambio de 4 celdas capa a capa en Java, con diagramas en texto y casos límite."
date: "2025-11-12"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-7-rotate-matrix.webp
previewImage: /assets/images/ctci-1-7-rotate-matrix.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Rota una matriz NxN 90 grados en sentido horario sin una segunda matriz. Intercambio de 4 celdas capa a capa en Java, con diagramas en texto y casos límite.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Imagina una foto cuadrada sobre la mesa. Quieres verla en horizontal, así que giras el papel **90 grados en sentido horario**. Cada esquina va a otra esquina. El centro se queda en el centro. No compras una segunda copia para pintar píxeles encima. Mueves la misma hoja.

Ese es el problema: rotar una matriz **N por N** 90 grados **in place**. Sin una segunda matriz completa.

Es el Capítulo 1, Problema 1.7 de la serie al estilo CTCI. Mapa de la serie en [Cracking the Coding Interview en Java](/blog/es/ctci-series-guide). Tag: **Algoritmos**.

---

## El problema en palabras simples

**Entrada:** una matriz cuadrada `matrix` de tamaño `N x N`. Cada celda guarda un valor (piensa en cada celda como un píxel).

**Salida:** el mismo objeto matriz, con valores reordenados para que la imagen quede rotada **90 grados en sentido horario**.

**Restricción clave:** hazlo **in place**. El objetivo es memoria extra O(1) (unos temporales), no una copia N x N.

Sentido horario significa:

- La fila superior se convierte en la columna derecha.
- La columna derecha se convierte en la fila inferior (en el orden que corresponde al viejo top).
- Y así alrededor del cuadrado.

En sentido antihorario es la misma idea con el ciclo al revés. En entrevistas casi siempre es horario salvo que digan lo contrario. Pregunta una vez si no estás seguro.

---

## Ejemplo pequeño que puedes dibujar a mano

Empieza con N = 4. Las letras hacen el movimiento fácil de ver:

```
Antes:                  Después 90 deg horario:
A  B  C  D              M  I  E  A
E  F  G  H              N  J  F  B
I  J  K  L              O  K  G  C
M  N  O  P              P  L  H  D
```

Revisa una esquina: `A` estaba arriba a la izquierda. Tras rotar, `A` está arriba a la derecha. `D` fue a abajo-derecha. `P` a abajo-izquierda. `M` a arriba-izquierda.

Revisa una celda interior: `F` estaba en (1,1). Tras rotar queda en (1,2), donde estaba `G`. El centro 2x2 también gira como su propio cuadrado.

---

## Cómo pensar antes de programar

### Fuerza bruta (fácil, pero no in place)

Crea una matriz nueva `out` de tamaño N x N.

Para cada celda `(r, c)`:

```
out[c][N - 1 - r] = matrix[r][c]
```

¿Por qué? La fila se vuelve columna. El índice de fila antiguo decide qué tan lejos del borde **derecho** aterrizas.

```
(r, c)  -->  (c, N - 1 - r)
```

Ejemplos en el 4x4 de arriba:

| Desde | Hasta | Letra |
| --- | --- | --- |
| (0,0) | (0,3) | A |
| (0,3) | (3,3) | D |
| (3,0) | (0,0) | M |
| (1,2) | (2,2) | G |

Es correcto y O(N²) en tiempo. Espacio O(N²). En la entrevista preguntarán: ¿puedes evitar la segunda matriz?

### Mejor idea: rotar cuatro celdas a la vez

No puedes mover una celda a su nuevo sitio sin pisar a otra. Así que guardas una en un temporal y recorres un **ciclo de cuatro**:

```
top  -->  right  -->  bottom  -->  left  -->  top
```

Hazlo en cada posición del borde de una capa, luego entra hacia adentro.

### Capas (anillos de cebolla)

Una matriz N x N son anillos anidados:

```
Capa 0: anillo exterior (filas/cols 0 y N-1)
Capa 1: siguiente anillo (filas/cols 1 y N-2)
...
```

¿Cuántas capas? `N / 2` (división entera). Con N = 4 hay 2 capas. Con N = 5 hay 2 anillos y una celda central que no se mueve.

```
N = 5, capas = 2

* * * * *     capa exterior
* + + + *     capa interior
* + o + *     o es el centro, se queda
* + + + *
* * * * *
```

---

## Una capa, paso a paso

Enfócate en la capa `layer` de una matriz N x N.

```
first = layer
last  = N - 1 - layer
```

En ese anillo recorres offsets `i` desde `0` hasta `last - first - 1` (paras antes de la esquina que el siguiente offset ya cubre; cada ciclo de 4 maneja un "hueco" del lado).

Para cada offset `i`:

```
// posiciones en el ciclo (mapa de destino horario)
top    = matrix[first][first + i]
right  = matrix[first + i][last]
bottom = matrix[last][last - i]
left   = matrix[last - i][first]
```

Rotación horaria significa que cada valor va adonde iba el del lado **anterior**:

```
temp   = top
top    <- left      // el lado izquierdo sube al top
left   <- bottom    // el bottom pasa a left
bottom <- right     // el right pasa a bottom
right  <- temp      // el viejo top va a right
```

En índices (esto se escribe en la pizarra):

```
temp = matrix[first][first + i]

matrix[first][first + i]       = matrix[last - i][first]       // top    <- left
matrix[last - i][first]        = matrix[last][last - i]        // left   <- bottom
matrix[last][last - i]         = matrix[first + i][last]       // bottom <- right
matrix[first + i][last]        = temp                          // right  <- old top
```

### Un offset en el anillo exterior (N = 4, layer 0, i = 0)

```
Antes (solo esquinas exteriores):

A  B  C  D
E  .  .  H
I  .  .  L
M  N  O  P

Ciclo: A (top) , D (right) , P (bottom) , M (left)

Después de este ciclo:

M  B  C  A
E  .  .  H
I  .  .  L
P  N  O  D
```

Luego `i = 1` rota los siguientes cuatro en los lados (`B`, `H`, `O`, `I`), y así hasta terminar el anillo exterior. Después `layer = 1` gira el 2x2 interior.

### Segundo modelo mental opcional: traspuesta y luego invertir filas

Otro enfoque correcto:

1. **Traspuesta:** intercambia `matrix[r][c]` con `matrix[c][r]` para `c > r`.
2. **Invierte cada fila.**

```
A B C D     traspuesta      A E I M     invertir filas      M I E A
E F G H     ---------->     B F J N     -------------->     N J F B
I J K L                     C G K O                         O K G C
M N O P                     D H L P                         P L H D
```

Mismo resultado. Capa a capa es la historia clásica del "anillo in place"; traspuesta + invertir suele ser más fácil de teclear con presión. Conoce ambos. Programa uno con limpieza.

---

## Solución en Java (capa a capa)

```java
/**
 * Rota una matriz N x N 90 grados en sentido horario in place.
 * Devuelve false si la matriz es null o no es cuadrada; true si ok.
 */
public final class RotateMatrix {

    private RotateMatrix() {}

    public static boolean rotate(int[][] matrix) {
        if (matrix == null || matrix.length == 0) {
            return false;
        }
        int n = matrix.length;
        for (int[] row : matrix) {
            if (row == null || row.length != n) {
                return false; // no es cuadrada
            }
        }

        // Cada capa desde fuera hacia dentro
        for (int layer = 0; layer < n / 2; layer++) {
            int first = layer;
            int last = n - 1 - layer;

            for (int i = first; i < last; i++) {
                int offset = i - first;

                // guardar top
                int top = matrix[first][first + offset];

                // left -> top
                matrix[first][first + offset] = matrix[last - offset][first];

                // bottom -> left
                matrix[last - offset][first] = matrix[last][last - offset];

                // right -> bottom
                matrix[last][last - offset] = matrix[first + offset][last];

                // top -> right
                matrix[first + offset][last] = top;
            }
        }
        return true;
    }
}
```

### Misma lógica con traspuesta + invertir filas

```java
public static void rotateViaTranspose(int[][] matrix) {
    int n = matrix.length;

    // Traspuesta
    for (int r = 0; r < n; r++) {
        for (int c = r + 1; c < n; c++) {
            int tmp = matrix[r][c];
            matrix[r][c] = matrix[c][r];
            matrix[c][r] = tmp;
        }
    }

    // Invertir cada fila
    for (int r = 0; r < n; r++) {
        for (int c = 0; c < n / 2; c++) {
            int tmp = matrix[r][c];
            matrix[r][c] = matrix[r][n - 1 - c];
            matrix[r][n - 1 - c] = tmp;
        }
    }
}
```

Ambos son in place. Elige uno y prepárate para explicar el otro en una frase.

---

## Complejidad

| Enfoque | Tiempo | Espacio extra |
| --- | --- | --- |
| Copiar a matriz nueva | O(N²) | O(N²) |
| Ciclos de 4 capa a capa | O(N²) | O(1) |
| Traspuesta + invertir filas | O(N²) | O(1) |

Hay que tocar cada celda una vez (o un número constante de veces), así que O(N²) es óptimo para matrices densas.

---

## Casos límite que tocan en la entrevista

| Caso | Qué debe pasar |
| --- | --- |
| `N = 0` o null | No-op o rechazar; no crashear |
| `N = 1` | Una sola celda; ya está "rotada" |
| `N = 2` | Una capa, un offset por lado (las cuatro esquinas) |
| `N` impar | La celda central no se mueve; siguen siendo `N/2` capas |
| No cuadrada | Define el comportamiento; imágenes reales pueden ser MxN, pero este problema es NxN |
| Valores objetos / structs grandes | Misma aritmética de índices; solo cambia el tipo del temp |

Aclara también la **dirección**: horario vs antihorario. Para antihorario, invierte el orden de las asignaciones del ciclo de 4 (o traspuesta y luego invertir **columnas**).

---

## Autocomprobación rápida (N = 3)

```
1 2 3      rotar CW      7 4 1
4 5 6      -------->     8 5 2
7 8 9                    9 6 3
```

Solo capa 0 (`N/2 = 1`). Offsets en el anillo exterior:

1. Ciclo `1, 3, 9, 7` → coloca `7` arriba-izq, `1` arriba-der, `3` abajo-der, `9` abajo-izq.
2. Ciclo `2, 6, 8, 4` → termina los lados.
3. El centro `5` se queda.

Si tu código imprime eso, los índices están bien.

---

## Explícaselo a un amigo

Tienes una cuadrícula cuadrada de píxeles. Quieres girarla 90 grados en sentido horario sin reservar una segunda cuadrícula completa.

Trátala como una cebolla. En cada anillo, camina por un lado. En cada posición, cuatro celdas se intercambian: top, right, bottom, left. Guarda una en un temporal para no perderla, escribe las otras tres y pon el temporal en el último hueco. Termina el anillo, entra un nivel, repite hasta el medio.

El tiempo es proporcional al número de celdas. La memoria extra es básicamente una celda temporal. Ese es todo el truco.

---

## Práctica siguiente

* Escribe ambas versiones de memoria (ciclo por capas, luego traspuesta + invertir).
* Cambia el problema a **antihorario** y ajusta solo el ciclo.
* Extra: rotar una imagen **M x N** (hace falta un buffer nuevo u otra representación; in place puro para no cuadradas es otro puzzle).

Inicio de la serie: [guía CTCI en Java](/blog/es/ctci-series-guide). Siguiente problema de arrays en el plan: [Zero Matrix](/blog/es/ctci-1-8-zero-matrix).