---
title: "Conversion: cuántos bits hay que voltear para pasar de A a B (Java)"
description: "Problema estilo CTCI 5.6 para principiantes: cuenta los bits que debes voltear para convertir el entero A en B. XOR de ambos y luego cuenta los unos. Bucle de Brian Kernighan e Integer.bitCount."
date: "2026-02-19"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-6-conversion.webp
previewImage: /assets/images/ctci-5-6-conversion.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 5.6 para principiantes: cuenta los bits que debes voltear para convertir el entero A en B. XOR de ambos y luego cuenta los unos. Bucle de Brian Kernighan e Integer.bitCount.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes dos filas de bombillas, cada una con el mismo número de posiciones. ¿Cuántas bombillas difieren entre las dos filas? Ese número es exactamente cuántas veces debes pulsar un interruptor en la primera fila para que coincida con la segunda.

Eso es **conversion** sobre enteros: la distancia de Hamming entre A y B. Voltear un bit es cambiar 0 por 1 o 1 por 0. Cuentas las posiciones donde A y B no coinciden.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de conteo de bits en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 5, manipulación de bits.

---

## 1. Analogía cotidiana

Escribe dos cadenas binarias cortas, una debajo de la otra:

```
A:  1 1 1 0 1
B:  0 1 1 1 1
    ^       ^
```

Los signos marcan columnas que no coinciden. Dos desajustes. Voltea esos dos bits en A y obtienes B.

No hace falta reconstruir el número desde cero. Solo tocas las posiciones que discrepan. La pregunta es: ¿cuántas hay?

---

## 2. Problema en palabras simples

**Entrada:** dos enteros `a` y `b` (`int` de Java basta en entrevista; la idea vale igual para `long`).

**Salida:** el número de posiciones de bit donde `a` y `b` difieren. Esas son las volteadas necesarias para pasar de `a` a `b`.

**Ejemplos:**

| A (decimal) | B (decimal) | A binario (bits bajos) | B binario | Volteos |
| --- | --- | --- | --- | --- |
| 29 | 15 | `11101` | `01111` | 2 |
| 0 | 0 | `0` | `0` | 0 |
| 1 | 0 | `1` | `0` | 1 |
| 7 | 0 | `111` | `000` | 3 |
| -1 | 0 | todos unos (32 bits) | todos ceros | 32 |

**Aclara antes de codificar:**

* ¿`int` con signo en complemento a dos? (Sí en Java. Los negativos siguen funcionando con XOR y conteo de bits.)
* ¿Solo los bits bajos útiles, o los 32 del `int`? (Los 32 en una respuesta completa; los ceros a la izquierda coinciden y suman cero volteos.)
* ¿Lista de posiciones o solo el conteo? (Solo el conteo.)
* ¿`long` (64 bits) o solo `int`? (Pregunta. El código de abajo usa `int`.)

---

## 3. Piensa primero

### Qué hace un volteo

Voltear el bit `i` de A cambia solo ese bit. Para convertir A en B debes voltear cada bit donde difieren, y no tocar donde ya coinciden. La respuesta es exactamente el número de bits distintos. No hay un atajo más corto en este modelo de coste.

### Marca las diferencias con XOR

XOR vale 1 cuando los bits difieren, 0 cuando coinciden:

| Bit A | Bit B | A XOR B |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

Así, `a ^ b` es una máscara con 1s solo donde hace falta un volteo. El problema se reduce a: **contar los bits en 1 de `a ^ b`**.

### Contar los unos

Tres formas habituales:

1. **Bucle con shift:** mira el bit bajo, desplaza a la derecha, repite 32 veces (o hasta 0 si solo te importan bits bajos no negativos; con negativos en Java el shift aritmético conserva el signo, así que mejor 32 pasos fijos o estilo sin signo).
2. **Brian Kernighan:** `c = c & (c - 1)` apaga el bit en 1 más bajo. Repite hasta que `c` sea 0. Las iteraciones igualan el número de unos, no el ancho del tipo.
3. **Biblioteca:** `Integer.bitCount(c)` en Java. A menudo cae en la instrucción POPCNT. Bien en producción; en entrevista a veces piden el bucle a mano.

A los entrevistadores les gusta oír "XOR y luego popcount" en una frase.

---

## 4. Soluciones en Java

### (a) XOR + Brian Kernighan (clásico de entrevista)

```java
int bitFlipCount(int a, int b) {
    int c = a ^ b;
    int count = 0;
    while (c != 0) {
        // Apaga el bit en 1 más bajo
        c = c & (c - 1);
        count++;
    }
    return count;
}
```

Recorrido con `a = 29`, `b = 15`:

```
29 = 11101
15 = 01111
XOR  = 10010   // dos unos

c = 10010
c & (c-1) = 10000   // count 1
c & (c-1) = 00000   // count 2
return 2
```

### (b) XOR + Integer.bitCount

```java
int bitFlipCountLib(int a, int b) {
    return Integer.bitCount(a ^ b);
}
```

Misma respuesta. Más corto. Menciona ambos: el one-liner en código real, Kernighan cuando pregunten cómo podría funcionar bitCount.

### (c) Shift y máscara (recorrido explícito de 32 bits)

```java
int bitFlipCountShift(int a, int b) {
    int c = a ^ b;
    int count = 0;
    for (int i = 0; i < 32; i++) {
        count += (c & 1);
        c >>>= 1; // shift sin signo, también con ints negativos
    }
    return count;
}
```

Siempre 32 iteraciones. Claro si quieres mirar cada posición. Un poco más lento que Kernighan cuando hay pocos unos; mismo big-O.

### Demo mínima completa

```java
public class Conversion {
    static int bitFlipCount(int a, int b) {
        int c = a ^ b;
        int count = 0;
        while (c != 0) {
            c &= (c - 1);
            count++;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(bitFlipCount(29, 15)); // 2
        System.out.println(bitFlipCount(0, 0));   // 0
        System.out.println(bitFlipCount(1, 0));   // 1
        System.out.println(bitFlipCount(7, 0));   // 3
        System.out.println(bitFlipCount(-1, 0));  // 32
    }
}
```

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| XOR + Kernighan | O(k) | O(1) | k = número de unos del XOR |
| XOR + 32 shifts | O(1) para int | O(1) | 32 iteraciones fijas |
| `Integer.bitCount` | O(1) típico | O(1) | A menudo una instrucción de CPU |

Todo es constante para enteros de ancho fijo. Lo que importa es la idea (XOR y contar), no el crecimiento asintótico.

---

## 6. Casos límite

* **`a == b`** → 0 volteos. XOR es 0.
* **Uno es 0** → la respuesta es el número de unos del otro.
* **Negativos** → Java usa complemento a dos. XOR y Kernighan siguen valiendo. `-1 ^ 0` tiene 32 unos.
* **`Integer.MIN_VALUE`** → sigue bien. No divides ni haces shifts que dependan del valor si usas Kernighan o `>>>`.
* **Orden** → `flip(a, b) == flip(b, a)`. La distancia es simétrica.
* **No uses `Math.abs` ni convertir a string binario.** Es más lento, más sucio, y falla el espíritu del capítulo de bits.
* **Versión `long`** → mismo código con `long c = a ^ b` y 64 pasos si usas shift, o `Long.bitCount`.

Comprobaciones mínimas:

```java
assert bitFlipCount(29, 15) == 2;
assert bitFlipCount(0, 0) == 0;
assert bitFlipCount(-1, 0) == 32;
assert bitFlipCount(7, 1) == 2; // 111 vs 001
```

---

## 7. Resumen para un amigo

Conversion pregunta: ¿cuántos volteos de bit convierten A en B?

1. Los bits que ya coinciden no se tocan. Cada bit distinto cuesta un volteo.
2. `a ^ b` enciende justo las posiciones distintas.
3. Cuentas los 1s de ese XOR. Ese conteo es la respuesta.
4. Brian Kernighan apaga un bit en 1 por vuelta: `c = c & (c - 1)`.
5. O llamas `Integer.bitCount(a ^ b)` si permiten helpers de biblioteca.

Si puedes recorrer el ejemplo 29 vs 15 en la pizarra, escribir el XOR, marcar los dos unos y codificar Kernighan sin quedarte en blanco, dominas el 5.6.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Debugger](/blog/es/ctci-5-5-debugger)
* Siguiente: [Pairwise Swap](/blog/es/ctci-5-7-pairwise-swap)