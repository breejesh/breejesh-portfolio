---
title: "CTCI 1.8 Matriz cero: poner filas y columnas a cero in situ (Java)"
description: "Si una celda es 0, pon toda su fila y columna a 0. Primero fuerza bruta, luego O(1) de espacio extra con banderas en la primera fila y columna en Java."
date: "2025-10-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-8-zero-matrix.webp
previewImage: /assets/images/ctci-1-8-zero-matrix.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Si una celda es 0, pon toda su fila y columna a 0. Primero fuerza bruta, luego O(1) de espacio extra con banderas en la primera fila y columna en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Imagina el plano de asientos de un teatro. Si un asiento está roto, cierras toda la fila y toda la columna para que nadie se siente en ese cruce. El plano es una matriz de enteros. Un cero significa "roto". Tu trabajo es aplicar cada regla de asiento roto **in situ**, sin construir un segundo plano completo si puedes evitarlo.

Este es el problema estilo **Cracking the Coding Interview** **1.8 Zero Matrix**, del Capítulo 1 (Arrays and Strings). Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Explicación y código originales, no un pegado del libro.

---

## El problema en palabras claras

**Entrada:** una matriz `M x N` de enteros (normalmente `int[][]` en Java).

**Salida:** modifica la matriz de modo que si `matrix[i][j] == 0`, entonces cada entrada de la fila `i` y cada entrada de la columna `j` pasa a ser `0`.

**Reglas que importan:**

* Hazlo **in situ** si te lo piden (seguimiento muy habitual).
* Varios ceros pueden compartir fila o columna. Poner a cero dos veces está bien; el resultado debe ser como si todas las reglas se aplicaran.
* Los ceros que escribes al limpiar no deben crear reglas de "cero original" **nuevas**. Esa es la trampa clásica.

Ejemplo:

```
Antes:                  Después:
1  2  3  0              0  0  0  0
5  6  7  8       →      5  6  7  0
9  0 11 12              0  0  0  0
```

La fila 0 tiene un cero en la columna 3. La fila 2 tiene un cero en la columna 1. Mueren las filas 0 y 2, y las columnas 1 y 3.

---

## Cómo pensar antes de programar

### Fuerza bruta (y por qué falla)

Recorres buscando ceros y, al encontrar uno, pones al momento su fila y columna a cero.

**Bug:** conviertes no ceros en ceros a mitad del recorrido. Luego tratas esos ceros nuevos como originales y borras media matriz por accidente.

### Mejor: dos pasadas con arrays extra

1. Primera pasada: anota qué filas y qué columnas deben ponerse a cero. Usa `boolean[] zeroRow` de longitud `M` y `boolean[] zeroCol` de longitud `N`.
2. Segunda pasada: para cada celda `(r, c)`, si `zeroRow[r]` o `zeroCol[c]`, escribe `0`.

Tiempo `O(MN)`. Espacio extra `O(M + N)`. Esta es la respuesta limpia de entrevista si no exigen espacio constante.

### Preferida: O(1) de espacio extra con la primera fila y la primera columna

La propia matriz puede guardar las banderas.

* Usa la **fila 0** como banderas de columna: si la columna `c` debe anularse, pon `matrix[0][c] = 0`.
* Usa la **columna 0** como banderas de fila: si la fila `r` debe anularse, pon `matrix[r][0] = 0`.
* La celda `matrix[0][0]` pertenece a ambas. Guarda dos booleanos, `firstRowHasZero` y `firstColHasZero`, para saber si la fila 0 y la columna 0 necesitan anularse.

El orden importa:

1. Recorre solo la primera fila y la primera columna para fijar los dos booleanos.
2. Recorre el resto de la matriz (`r >= 1`, `c >= 1`). Ante un cero, marca `matrix[r][0] = 0` y `matrix[0][c] = 0`.
3. Segunda pasada sobre el interior: si `matrix[r][0] == 0` o `matrix[0][c] == 0`, pon `matrix[r][c] = 0`.
4. **Al final**, anula la primera fila si hace falta, luego la primera columna. Hazlo al final para no borrar las banderas pronto.

Ese es todo el truco: guardar la contabilidad en el borde, aplicar el interior primero, arreglar el borde al final.

---

## Solución en Java (O(1) de espacio extra)

```java
public final class ZeroMatrix {

    private ZeroMatrix() {}

    /**
     * If any cell is 0, set its entire row and column to 0.
     * Mutates matrix in place. O(1) extra space via first row/col flags.
     */
    public static void setZeros(int[][] matrix) {
        if (matrix == null || matrix.length == 0 || matrix[0].length == 0) {
            return;
        }

        int rows = matrix.length;
        int cols = matrix[0].length;

        boolean firstRowHasZero = false;
        boolean firstColHasZero = false;

        // Does row 0 already contain a zero?
        for (int c = 0; c < cols; c++) {
            if (matrix[0][c] == 0) {
                firstRowHasZero = true;
                break;
            }
        }

        // Does column 0 already contain a zero?
        for (int r = 0; r < rows; r++) {
            if (matrix[r][0] == 0) {
                firstColHasZero = true;
                break;
            }
        }

        // Use first row / first col as flags for the rest of the matrix.
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (matrix[r][c] == 0) {
                    matrix[r][0] = 0;
                    matrix[0][c] = 0;
                }
            }
        }

        // Zero interior cells based on flags.
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (matrix[r][0] == 0 || matrix[0][c] == 0) {
                    matrix[r][c] = 0;
                }
            }
        }

        // Zero first row last (it held column flags).
        if (firstRowHasZero) {
            for (int c = 0; c < cols; c++) {
                matrix[0][c] = 0;
            }
        }

        // Zero first column last (it held row flags).
        if (firstColHasZero) {
            for (int r = 0; r < rows; r++) {
                matrix[r][0] = 0;
            }
        }
    }
}
```

Variante opcional más clara con espacio `O(M + N)` (misma idea, arrays de banderas separados):

```java
public static void setZerosWithFlagArrays(int[][] matrix) {
    if (matrix == null || matrix.length == 0 || matrix[0].length == 0) {
        return;
    }
    int rows = matrix.length;
    int cols = matrix[0].length;
    boolean[] zeroRow = new boolean[rows];
    boolean[] zeroCol = new boolean[cols];

    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (matrix[r][c] == 0) {
                zeroRow[r] = true;
                zeroCol[c] = true;
            }
        }
    }

    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (zeroRow[r] || zeroCol[c]) {
                matrix[r][c] = 0;
            }
        }
    }
}
```

En una entrevista, empieza con arrays de banderas para que la idea sea obvia, y luego comprime las banderas en la primera fila y la primera columna cuando pidan espacio constante.

---

## Complejidad

| Enfoque | Tiempo | Espacio extra |
| --- | --- | --- |
| Poner a cero al instante al escanear | `O(MN)` en el peor caso, pero incorrecto | `O(1)` |
| Arrays de banderas | `O(MN)` | `O(M + N)` |
| Banderas en primera fila / primera col | `O(MN)` | `O(1)` |

Debes mirar cada celda al menos una vez, así que el tiempo `O(MN)` es lo esperado. La pelea es por el espacio y por no envenenar el recorrido con ceros que acabas de escribir.

---

## Casos límite que tocan en entrevista

* **Matriz nula o vacía.** Vuelve sin petar.
* **1 x 1.** `[0]` se queda `[0]`. `[5]` se queda `[5]`.
* **Una sola fila o una sola columna.** Las banderas de primera fila / primera col siguen funcionando; los bucles del interior no hacen nada.
* **Cero solo en `matrix[0][0]`.** Ambos booleanos pasan a true. Se limpian toda la primera fila y toda la primera columna. El interior puede quedarse si no hay más ceros.
* **Todas las celdas ya en cero.** El resultado es todo ceros. Bien.
* **Sin ceros.** La matriz no cambia. El recorrido sigue costando `O(MN)`.
* **Rectangular, no cuadrada.** El código usa `rows` y `cols` por separado. Nunca asumas `N == N` en el sentido de cuadrado.
* **Números negativos y positivos.** Solo el `0` dispara la regla. No trates ideas de "falsy" de otros lenguajes.

---

## Errores habituales

1. **Poner a cero durante la pasada de descubrimiento.** Crea ceros originales falsos.
2. **Limpiar la primera fila o la primera columna antes de usarlas como banderas.** Pierdes el mapa.
3. **Olvidar los dos booleanos** y sobrecargar `matrix[0][0]` para "muere la fila 0" y "muere la col 0" sin cuidado.
4. **Asumir una matriz cuadrada** y usar una sola longitud para ambas dimensiones.
5. **Devolver una matriz nueva** cuando el enunciado pedía in situ (gasta espacio y puede fallar tests que miran identidad).

---

## Explícaselo a un amigo

Tienes una rejilla. Cualquier cero significa "mata toda esta fila y toda esta columna". Si matas mientras sigues buscando, inventas ceros nuevos y matas de más. Así que primero **recuerda** qué filas y columnas deben morir. Puedes recordarlo en dos arrays booleanos, o puedes anotar esos recordatorios en la primera fila y la primera columna de la propia rejilla, con dos booleanos pequeños para la primera fila y la primera columna. Luego rellenas el centro a partir de esos recordatorios. Solo al final limpias la primera fila y la primera columna si estaban marcadas.

El tiempo es proporcional al número de celdas. La memoria extra puede ser constante si reutilizas el borde de la matriz como bloc de notas.

---

## Serie

* Guía de la serie: [Cracking the Coding Interview en Java](/blog/es/ctci-series-guide)
* Anterior: [1.7 Rotate Matrix](/blog/es/ctci-1-7-rotate-matrix)
* Siguiente: [1.9 String Rotation](/blog/es/ctci-1-9-string-rotation)

Practica la versión con arrays de banderas hasta poderla escribir en frío, y luego la versión con banderas en el borde una vez sin mirar. Esa segunda versión es la que demuestra que puedes gestionar el estado con cuidado bajo presión.