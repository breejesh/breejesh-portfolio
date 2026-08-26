---
title: "Insertion: insertar el entero M en N entre los bits i y j (Java)"
description: "Problema estilo CTCI 5.1 para principiantes: limpia los bits i a j en N, desplaza M por i y haz OR. Máscaras de bits, recorrido del ejemplo clásico y código Java."
date: "2025-10-17"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-1-insertion.webp
previewImage: /assets/images/ctci-5-1-insertion.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 5.1 para principiantes: limpia los bits i a j en N, desplaza M por i y haz OR. Máscaras de bits, recorrido del ejemplo clásico y código Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes un estante largo de libros (el entero `N`). Un tramo corto de huecos en el medio está reservado para un juego nuevo (`M`). Vacías esos huecos, deslizas los libros nuevos y dejas el resto igual. Eso es **inserción de bits**: escribir los bits de `M` en `N` desde el bit `i` hasta el bit `j`.

Este post es enseñanza original para principiantes en **Java**. Misma familia de calentamientos de bit manipulation en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí empieza el capítulo 5, bit manipulation.

---

## 1. Analogía cotidiana

Imagina una tarjeta de hotel con una fila de luces. Algunas ya están encendidas o apagadas (`N`). Un código de huésped (`M`) debe ocupar una ventana fija de esas posiciones, digamos de la luz `i` a la luz `j` (el bit 0 es el menos significativo, a la derecha).

No enciendes luces una a una a mano si puedes evitarlo. Haces esto:

1. **Apagas** cada luz de la ventana (limpias esos bits).
2. Alineas el código para que su bit más bajo caiga en la luz `i` (desplazas `M` a la izquierda `i` posiciones).
3. Fusionas con OR: donde el código quiere luz, se enciende; donde quiere apagado, la ventana limpia se queda en 0; fuera de la ventana no cambia nada.

Esas tres jugadas aparecen en toda respuesta sólida.

---

## 2. Problema en palabras simples

**Entrada:** dos enteros `N` y `M`, y dos índices de bit `i` y `j` (desde la derecha, base 0). En entrevista asume un `int` de 32 bits salvo que digan otra cosa.

**Salida:** `N` con los bits `i` a `j` reemplazados por los bits de `M`. El bit `0` de `M` cae en la posición `i` del resultado. Los bits altos de `M` llenan hacia `j`.

**Supuestos que debes decir:**

* La ventana `i..j` es ancha para todos los bits relevantes de `M` (en el libro: `M` cabe entre `i` y `j`).
* `i <= j`.
* Los bits fuera de `[i, j]` en `N` no cambian.
* Si el ajuste se cumple, los bits de `M` por encima de `j` no entran; aun así, algunos enmascaran `M` al ancho de la ventana por seguridad.

**Ejemplo clásico** (binario para ver claro; el bit 0 es el dígito más a la derecha):

```
N = 10000000000   (binary)
M = 10011
i = 2
j = 6

Result = 10001001100
```

Tras insertar, los bits 2-6 del resultado son `10011` (el valor de `M`), y el resto de `N` sigue igual.

**Aclara antes de codear:**

* ¿El bit 0 es el LSB (derecha)? (Sí en este problema.)
* ¿`int` con signo u unsigned? En Java todo es complemento a dos con signo, pero en bits puras miras el patrón de 32 bits.
* ¿`M` debe caber exacto o solo "al menos" el ancho? (Asume que cabe; máscara extra opcional.)
* Tipo de retorno: el mismo ancho que `N` (`int`, o `long` si quieres margen).

---

## 3. Piensa primero

### Instinto equivocado: poner bits de M uno a uno

*Podrías* recorrer `k` de 0 a `j - i`, leer el bit `k` de `M` y escribirlo en el bit `i + k` de `N`. Funciona, pero en entrevista quieren la versión con máscara: limpiar un rango, alinear, OR. Menos ramas, y demuestras que entiendes máscaras.

### Forma correcta: clear, shift, OR

1. **Limpiar** los bits `i` a `j` en `N` con una máscara de 0 en ese rango y 1 fuera.
2. **Desplazar** `M` a la izquierda `i` posiciones para que el bit 0 de `M` quede en el bit `i`.
3. **OR** del `N` limpio con el `M` desplazado.

Los tres pasos son operaciones de palabra O(1) en un entero de ancho fijo.

### Construir la máscara de limpieza

Quieres algo así:

```
// for i=2, j=6 on a short word for illustration:
// ones, then zeros from j down to i, then ones again on the low side
// ...11110000011  (zeros in bits 2..6)
```

En dos piezas:

* **Unos a la izquierda:** conservar bits desde `j + 1` hacia arriba.  
  `left = ~0 << (j + 1)`  
  En Java, `~0` es todo 1 (`-1`). Desplazar a la izquierda `j + 1` pone ceros en los bits `0..j`.

* **Unos a la derecha:** conservar bits de `0` a `i - 1`.  
  `right = (1 << i) - 1`  
  Son `i` unos bajos. Si `i == 0`, queda `0` (nada que guardar a la derecha).

* **Máscara:** `mask = left | right`  
  Ceros solo en bits `i..j`, unos en el resto.

* **N limpio:** `nCleared = N & mask`

* **Fusión:** `nCleared | (M << i)`

Cuidado en Java: si `j == 31`, entonces `j + 1 == 32`. Un shift de 32 en `int` se reduce módulo 32 (`<< 32` no hace nada en `int`). Si la ventana toca el tope de 32 bits, usa `long` para la aritmética del shift, o trata `j == 31` con `left = 0`. En entrevista suelen elegir `j` por debajo de 31, pero di la trampa.

---

## 4. Solución en Java

```java
/**
 * Insert M into N between bits i and j (inclusive).
 * Bit 0 is the least significant bit.
 * Assumes M fits in the window [i, j].
 */
int insertion(int N, int M, int i, int j) {
    // 1) Mask with 0s from bit i through bit j, 1s elsewhere.
    int allOnes = ~0;                 // 0xFFFFFFFF as a pattern
    int left = allOnes << (j + 1);    // 1s, then 0s from bit j downward
    int right = (1 << i) - 1;         // 1s in bits 0..i-1
    int mask = left | right;          // 0s only in [i, j]

    // 2) Clear the window in N.
    int nCleared = N & mask;

    // 3) Align M and merge.
    int mShifted = M << i;
    return nCleared | mShifted;
}
```

### Más seguro si j puede ser 31

```java
int insertionSafe(int N, int M, int i, int j) {
    int right = (1 << i) - 1;
    int left;
    if (j >= 31) {
        left = 0; // no bits above 31 on a 32-bit int
    } else {
        left = (~0) << (j + 1);
    }
    int mask = left | right;
    return (N & mask) | (M << i);
}
```

### Opcional: recortar M al ancho de la ventana

Si no confías del todo en "M cabe":

```java
int width = j - i + 1;
int mMasked = M & ((width >= 32) ? ~0 : (1 << width) - 1);
return (N & mask) | (mMasked << i);
```

Sigue siendo O(1). Buen follow-up si preguntan por basura en los bits altos de `M`.

---

## 5. Recorrido del ejemplo clásico

```
N = 10000000000   (binary)   // think of this as bits; leading 1 is bit 10
M = 10011
i = 2, j = 6
```

**Paso A: máscara de limpieza**

* `left = ~0 << 7` → 7 bits bajos en 0, bits altos en 1  
* `right = (1 << 2) - 1` → `11` en binario  
* `mask = left | right` → ceros en bits 2-6, unos en el resto  

**Paso B: limpiar N**

* `nCleared = N & mask`  
* Los bits 2-6 de `N` pasan a 0. En el dibujo clásico ese tramo ya era 0, así que `N` se ve igual, pero el paso importa cuando había 1s.

**Paso C: desplazar y OR**

* `M << 2` = `10011` dos puestos a la izquierda → bits 2-6 guardan `10011`  
* OR con `N` limpio → `10001001100`

Comprobación en código:

```java
int N = 0b10000000000;
int M = 0b10011;
int result = insertion(N, M, 2, 6);
// result binary: 10001001100
// Integer.toBinaryString(result) -> "10001001100"
```

Otra prueba rápida: si `N` tenía basura en la ventana, el clear la borra antes para que el OR no deje un 1 pegajoso donde `M` quería 0.

```java
// N has 1s in bits 2-6; after insert they must match M, not the old 1s
int dirty = 0b10001111100;
int cleaned = insertion(dirty, 0b10011, 2, 6);
// still 10001001100 in the low part of interest
```

---

## 6. Complejidad, bordes, tips de entrevista

| Tema | Respuesta |
| --- | --- |
| Tiempo | O(1) con ints de ancho fijo |
| Espacio extra | O(1) |
| Orden de bits | 0 = LSB (derecha) |
| `i == 0` | `right = 0`; la ventana empieza en el bit menos significativo |
| `i == j` | ventana de un bit; `M` debería ser 0 o 1 para un ajuste limpio |
| `j == 31` | cuidado con `<< (j + 1)` en `int` de Java |
| Negativos | mismas ops de bits; no pienses en decimal hasta imprimir |

**Bugs frecuentes:**

* Off-by-one en `j + 1` al armar `left`.
* Desplazar `M` por `j` en vez de por `i`.
* Usar AND para fusionar en vez de OR tras limpiar (AND apagaría los 1s de `M` contra ceros de `N`).
* Olvidar limpiar primero: el OR solo nunca convierte un 1 de `N` en 0 donde `M` pone 0.

**Cómo contarlo:**

1. Reformula: "Reemplaza bits i a j de N con M; el LSB de M en i."
2. Dibuja una cadena corta de bits y marca la ventana.
3. Di clear, shift, OR.
4. Escribe la máscara con mitades izquierda y derecha.
5. Menciona el quirk de shift en Java con `j == 31` si te quedan 10 segundos.

---

## 7. Explícaselo a un amigo

Insertion (problema 5.1) pide: meter el entero `M` en el entero `N` de modo que `M` ocupe los bits `i` a `j`.

1. Máscara con 0 en bits `i..j` y 1 en el resto: `left | right` con `left = ~0 << (j + 1)` y `right = (1 << i) - 1`.
2. Limpiar: `N & mask`.
3. Alinear: `M << i`.
4. Fusionar: `N` limpio OR `M` desplazado.
5. Cuidado con shifts de Java si `j` es 31. Opcional: enmascarar `M` al ancho de la ventana.

Si dibujas el ejemplo clásico `10000000000` / `10011` / `i=2,j=6` y explicas por qué hay que limpiar antes del OR, dominas el arranque del capítulo 5.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Paths with Sum](/blog/es/ctci-4-12-paths-with-sum)
* Siguiente: [Binary to String](/blog/es/ctci-5-2-binary-to-string)