---
title: "Next Number: mismo conteo de bits, el mayor y el menor vecinos (Java)"
description: "Problema estilo CTCI 5.4 para principiantes: dado un int positivo, encuentra el siguiente valor mayor y el menor que conserven el mismo número de bits 1. Cuenta ceros y unos finales, voltea un bit y reordena el resto."
date: "2026-05-31"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-4-next-number.webp
previewImage: /assets/images/ctci-5-4-next-number.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 5.4 para principiantes: dado un int positivo, encuentra el siguiente valor mayor y el menor que conserven el mismo número de bits 1. Cuenta ceros y unos finales, voltea un bit y reordena el resto.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes una bolsa de dígitos binarios con un número fijo de `1`s. Puedes reordenarlos, pero no inventas unos extra ni tiras ninguno. Entre todos los números que puedes formar así, ¿cuál queda justo por encima del valor actual y cuál justo por debajo? Eso es **Next Number**: mismo popcount, vecinos más cercanos en la recta de enteros.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de manipulación de bits en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 5, manipulación de bits.

---

## 1. Analogía cotidiana

Piensa en una fila de interruptores. Algunos están ON (`1`), otros OFF (`0`). La regla de este puzzle: cada patrón legal debe conservar **exactamente el mismo conteo de interruptores ON**.

* El patrón **siguiente mayor** es el entero más pequeño mayor que el actual que aún tenga el mismo número de ONs.
* El patrón **siguiente menor** es el entero más grande menor que el actual con el mismo conteo de ONs.

La fuerza bruta probaría `n+1`, `n+2`, ... y contaría bits cada vez. Sirve para demos chicas. En entrevista quieren una construcción directa con bits: encontrar el sitio correcto para voltear un bit y empaquetar el resto de unos según la dirección.

---

## 2. Problema en palabras simples

**Entrada:** un `int n` positivo (en entrevistas, trátarlo como patrón de 32 bits en complemento a dos; enfócate en no negativos salvo que digan lo contrario).

**Salida:**

* `getNext(n)`: el número más pequeño **mayor que** `n` con el mismo número de bits `1`, o un centinela (por ejemplo `-1`) si no existe en el ancho de palabra.
* `getPrev(n)`: el número más grande **menor que** `n` con el mismo número de bits `1`, o un centinela si no existe.

**Mismo número de bits 1** significa mismo popcount: `Integer.bitCount(result) == Integer.bitCount(n)`.

**Ejemplos:**

| n (binario) | Unos | Siguiente mayor | Siguiente menor |
| --- | --- | --- | --- |
| `11011001111100` (13948) | 9 | `11011010001111` (13967) | (existe; ver idea del recorrido abajo) |
| `10110` (22) | 3 | `11001` (25) | `10101` (21) |
| `10011100` (156) | 4 | `10100011` (163) | `10011010` (154) |
| `1` | 1 | `10` (2) | ninguno (devolver `-1`) |
| solo unos en los k bits bajos, nada libre más alto | k | puede no existir si ningún cero puede subir | a menudo aún existe si hay ceros arriba |

**Aclara antes de codear:**

* ¿Solo positivos, o 32 bits completos con bit de signo? (Empieza con positivos; menciona 31 como bit alto práctico para `int` positivo.)
* ¿Si no hay next/prev? (`-1` o excepción; elige uno y manténlo.)
* ¿Se permite `n == 0`? (Cero unos: solo cero tiene cero unos. Ni next ni prev.)
* ¿Ambas respuestas en un método, o dos helpers?

---

## 3. Piensa primero

### Bruta (bien como calentamiento)

```
next = n + 1
while bitCount(next) != bitCount(n): next++
```

Misma idea hacia abajo para prev. Correcto para n pequeños. En el peor caso puedes caminar lejos, y en una palabra fija hay que parar al desbordar. Suelen querer trabajo de bits O(1) o O(tamaño de palabra).

### Idea para el siguiente mayor

Quieres el **menor** aumento que preserve el conteo de 1s.

Eso significa:

1. Encuentra el **cero no final más a la derecha**: el `0` más bajo que tiene al menos un `1` a su derecha. Llama `p` a su índice.
2. Voltea ese `0` a `1`. El número crece y temporalmente tienes un `1` de más.
3. Limpia todos los bits por debajo de `p`.
4. Devuelve los unos que "debes" en las posiciones **más a la derecha** bajo `p`, pero solo `c1 - 1` (ya gastaste un flip en el 1 extra en `p`). Eso minimiza el valor bajo `p`.

Cómo hallar `p` sin escanear al azar:

* `c0` = conteo de `0`s finales (desde el bit 0 hacia arriba).
* `c1` = conteo de `1`s después de esos ceros (una racha de unos).
* Entonces `p = c0 + c1`. El bit `p` es el cero justo a la izquierda de esa racha de unos.

### Idea para el siguiente menor

Espejo:

1. Cuenta los `1`s finales (`c1`), luego los ceros encima (`c0`).
2. La posición `p = c0 + c1` es el **uno no final más a la derecha**.
3. Baja ese `1` a `0` (achica el número) y limpia los bits de abajo.
4. Coloca `c1 + 1` unos con el empaquetado estándar: bloque de `(c1 + 1)` unos desplazado por `(c0 - 1)`.

Si no hay cero por encima de los unos bajos (patrón tipo `000...00111`), no puedes bajar con el mismo conteo.

### Atajos aritméticos (mismos conteos)

Cuando tienes `c0` y `c1`:

* Siguiente mayor: `n + (1 << c0) + (1 << (c1 - 1)) - 1`
* Siguiente menor: `n - (1 << c1) - (1 << (c0 - 1)) + 1`

Mismos resultados que voltear y reempacar. Buena segunda implementación después de explicar el dibujo de bits.

---

## 4. Solución en Java

### getNext: siguiente mayor con el mismo conteo de bits

```java
/**
 * Smallest number greater than n with the same number of 1 bits.
 * Returns -1 if none exists within a 32-bit positive pattern.
 */
int getNext(int n) {
    if (n <= 0) {
        return -1;
    }

    int c = n;
    int c0 = 0; // trailing zeros
    int c1 = 0; // ones right after those zeros

    // count trailing zeros
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }
    // count ones after that
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }

    // no larger number with same 1-count in 32-bit space
    // (e.g. 111...11000...0 with no non-trailing zero to flip)
    if (c0 + c1 == 31 || c0 + c1 == 0) {
        return -1;
    }

    int p = c0 + c1; // position of rightmost non-trailing zero

    // Flip the zero at p to one.
    n |= (1 << p);

    // Clear all bits to the right of p.
    n &= ~((1 << p) - 1);

    // Insert (c1 - 1) ones on the right.
    n |= (1 << (c1 - 1)) - 1;

    return n;
}
```

**Gemelo aritmético:**

```java
int getNextArithmetic(int n) {
    if (n <= 0) {
        return -1;
    }
    int c = n;
    int c0 = 0;
    int c1 = 0;
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }
    if (c0 + c1 == 31 || c0 + c1 == 0 || c1 == 0) {
        return -1;
    }
    return n + (1 << c0) + (1 << (c1 - 1)) - 1;
}
```

### getPrev: siguiente menor con el mismo conteo de bits

```java
/**
 * Largest number less than n with the same number of 1 bits.
 * Returns -1 if none exists.
 */
int getPrev(int n) {
    if (n <= 0) {
        return -1;
    }

    int c = n;
    int c0 = 0; // zeros after the trailing ones
    int c1 = 0; // trailing ones

    // count trailing ones
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }
    if (c == 0) {
        // pattern like 00...00111: no smaller with same ones
        return -1;
    }

    // count zeros after those ones
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }

    int p = c0 + c1; // rightmost non-trailing one

    // Clear bits from p down through 0.
    n &= (-1 << (p + 1)); // same as ~0 << (p + 1)

    // Sequence of (c1 + 1) ones.
    int mask = (1 << (c1 + 1)) - 1;

    // Place that block as far right as allowed: leave (c0 - 1) zeros at the bottom.
    n |= mask << (c0 - 1);

    return n;
}
```

**Gemelo aritmético:**

```java
int getPrevArithmetic(int n) {
    if (n <= 0) {
        return -1;
    }
    int c = n;
    int c0 = 0;
    int c1 = 0;
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }
    if (c == 0) {
        return -1;
    }
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }
    if (c0 == 0) {
        return -1;
    }
    return n - (1 << c1) - (1 << (c0 - 1)) + 1;
}
```

Usa `>>>` (desplazamiento sin signo) al recorrer `c` para que un `1` alto (bit de signo) no deje el bucle colgado con `>>` aritmético. Con entradas positivas de entrevista, cualquiera vale; `>>>` es mejor hábito.

---

## 5. Recorridos

### Siguiente mayor: 13948

```
n  = 11011001111100
       trailing zeros: 00  → c0 = 2
       then ones: 11111    → c1 = 5
       p = 7  (0-based from the right)

Flip bit 7:     11011011111100
Clear below 7:  11011010000000
Add c1-1 = 4 ones on the right:
                11011010001111  = 13967
```

Comprueba: ambos tienen nueve `1`s, y nada entre 13948 y 13967 tiene nueve `1`s.

### Siguiente menor: 156 (`10011100`)

```
n  = 10011100
       trailing ones: none → c1 = 0
       then zeros: 00      → c0 = 2
       next bit is 1, so p = 2

Clear from bit 2 down:  10011000
mask = (c1 + 1) ones = 1
shift by (c0 - 1) = 1:  10011010  = 154
```

Cuatro unos cada uno. 155 tiene cinco, así que 154 es el vecino.

### Caso chico: 22 (`10110`)

| Dirección | Conteos | Resultado binario | Decimal |
| --- | --- | --- | --- |
| next | c0=1, c1=2, p=3 | `11001` | 25 |
| prev | c1=0, c0=1, p=1 | `10101` | 21 |

---

## 6. Complejidad, bordes, tips de entrevista

| Tema | Respuesta |
| --- | --- |
| Tiempo | O(b) para contar rachas, b = tamaño de palabra (32). Flip y máscaras son O(1). |
| Espacio extra | O(1) |
| Alternativa bruta | O(gap) incrementos; el gap puede ser grande |
| Sin next | Patrones sin cero no final que voltear (guarda con `c0 + c1`) |
| Sin prev | Todos los unos solo abajo (`c == 0` tras contar unos finales) |
| `n = 0` | Solo cero tiene cero unos; `-1` en ambos |
| Bit de signo | Prefiere `>>>` al escanear; quédate en rango positivo en entrevistas |

**Bugs comunes:**

1. Usar `>>` aritmético sobre un intermedio negativo al practicar casos más anchos.
2. Off-by-one: insertar `c1` unos en vez de `c1 - 1` tras voltear hacia arriba.
3. Olvidar limpiar debajo de `p` antes de insertar unos (bits viejos corrompen el conteo).
4. Decir que no hay solución sin mirar la estructura de rachas finales.
5. Confundir "siguiente mayor por valor" con "siguiente al rotar bits". Este problema es **orden de enteros**, no rotación.

**Cómo contarlo:**

1. Reformula: mismo popcount, mayor más cercano y menor más cercano.
2. Dibuja una cadena de bits. Marca ceros finales, luego unos, luego la posición del flip.
3. Flip, limpia a la derecha, reempaca unos.
4. Espejo para prev.
5. Opcional: muestra que la forma aritmética coincide en tu ejemplo.

---

## 7. Explícaselo a un amigo

Next Number (problema 5.4) pide: desde un int positivo, el siguiente mayor y el siguiente menor con el mismo número de bits `1`.

1. **Siguiente mayor:** cuenta ceros finales (`c0`) y luego unos (`c1`). Voltea el cero en `p = c0 + c1`. Limpia bajo `p`. Pon `c1 - 1` unos a la derecha.
2. **Siguiente menor:** cuenta unos finales (`c1`) y luego ceros (`c0`). Baja el uno en `p = c0 + c1` limpiando de `p` a 0. Coloca `c1 + 1` unos desplazados por `c0 - 1`.
3. **Aritmética:** `n + (1<<c0) + (1<<(c1-1)) - 1` y `n - (1<<c1) - (1<<(c0-1)) + 1` cuando ya tienes los conteos.
4. Centinela cuando el patrón no tiene hueco (sin cero no final para next, sin uno no final para prev).
5. Prefiere desplazamientos sin signo al recorrer bits.

Si puedes pasar 13948 a 13967 a mano y explicar por qué los unos se asientan a la derecha tras el flip, dominas el 5.4.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Flip Bit to Win](/blog/es/ctci-5-3-flip-bit-to-win)
* Siguiente: [Debugger](/blog/es/ctci-5-5-debugger)