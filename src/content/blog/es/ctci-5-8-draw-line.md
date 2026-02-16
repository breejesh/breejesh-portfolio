---
title: "Draw Line: pintar una línea horizontal en una pantalla empaquetada en bytes (Java)"
description: "Problema estilo CTCI 5.8 para principiantes: pantalla monocroma en un array de bytes, ocho píxeles por byte. Dibuja una línea horizontal de (x1, y) a (x2, y) con máscaras de bits en bytes parciales y 0xFF en los completos."
date: "2026-02-16"
tags: [Algoritmos]
coverImage: /assets/images/ctci-5-8-draw-line.webp
previewImage: /assets/images/ctci-5-8-draw-line.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 5.8 para principiantes: pantalla monocroma en un array de bytes, ocho píxeles por byte. Dibuja una línea horizontal de (x1, y) a (x2, y) con máscaras de bits en bytes parciales y 0xFF en los completos.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Una pantalla barata y antigua no tiene color. Cada píxel está encendido o apagado. La memoria es justa, así que el hardware mete **ocho píxeles en un byte**. Te dan un `byte[]` plano y un ancho. Tu trabajo: encender cada píxel de una línea horizontal, de la columna `x1` a la `x2` en la fila `y`, sin gastar un bucle en cada bit cuando en el medio hay bytes enteros.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de dibujo en buffers de bits en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí cierra el capítulo 5, manipulación de bits.

---

## 1. Analogía cotidiana

Piensa en una fila de interruptores en una pared larga. Vienen en grupos de ocho: cada grupo es una tira de plástico, un byte. Enciendes un interruptor y ese píxel se ilumina.

Necesitas una barra horizontal de luces del interruptor `x1` al `x2` en un estante (fila `y`).

Si la barra es corta y cabe en un solo grupo, mueves solo esos interruptores de esa tira. Si es larga, el medio son grupos enteros encendidos: enciendes toda la tira de golpe (`0xFF`). Solo la primera y la última tira necesitan flips parciales. Esa es la idea completa.

---

## 2. Problema en palabras simples

**Entrada:**

* `byte[] screen`: framebuffer monocromo empaquetado. Bit `1` = píxel encendido, `0` = apagado.
* `int width`: ancho de pantalla en **píxeles**. Garantizado divisible por 8, así que una fila nunca parte un byte entre dos filas.
* `int x1`, `int x2`: columnas de inicio y fin de la línea (inclusivas).
* `int y`: índice de fila.

**Salida:** mutar `screen` para que cada píxel de `(x1, y)` a `(x2, y)` quede encendido. El resto se mantiene (usa OR, no sobrescribas a ciegas en bytes parciales).

**Diseño (MSB a la izquierda):**

* Bytes por fila: `width / 8`.
* Índice del byte del píxel `(x, y)`: `(width / 8) * y + (x / 8)`.
* Bit dentro del byte: el offset `x % 8` va al bit `(7 - (x % 8))`. El píxel más a la izquierda del byte es el bit alto.

**Forma de la firma:**

```java
void drawLine(byte[] screen, int width, int x1, int x2, int y)
```

**Ejemplo pequeño:** ancho `16` (dos bytes por fila). Dibujar de `x1 = 3` a `x2 = 12` en `y = 0`.

```
byte 0 of row 0          byte 1 of row 0
pixels 0 1 2 3 4 5 6 7   8 9 10 11 12 13 14 15
bits   7 6 5 4 3 2 1 0   7 6  5  4  3  2  1  0

before: 00000000 00000000
after:  00011111 11111000
        ^^^start mask     end mask^^^
        full run in the middle is just those bits; no full middle byte here
```

Si la línea fuera más larga y cruzara tres o más columnas de bytes, las columnas del medio se pondrían a `0xFF` con una escritura cada una.

**Aclara antes de codear:**

* ¿`x1` y `x2` son inclusivos? (Sí.)
* ¿Y si `x1 > x2`? (Intercambia, o déjalo vacío. En entrevista suele valer el swap.)
* ¿MSB o LSB a la izquierda? (Declara tu convención. Aquí MSB = píxel izquierdo.)
* ¿El dibujo borra otros píxeles? (No. En bordes usa `|=`.)
* ¿El ancho es siempre múltiplo de 8? (Sí, en el enunciado clásico.)

---

## 3. Piensa primero

### Ingenuo: un píxel cada vez

```
for x from x1 to x2:
    setBit(screen, width, x, y)
```

`setBit` encuentra el byte, arma una máscara de un bit y hace OR. Correcto. Simple. Para una línea de longitud L tocas L bits. Vale para líneas cortas. Malo cuando L es miles y casi todos esos bits viven en bytes del medio que podrías llenar de golpe.

### Mejor: bytes completos + máscaras en los bordes

Encuentra las columnas de byte de `x1` y `x2` en la fila `y`.

1. **Byte parcial de inicio**: máscara desde el offset de inicio hasta el final de ese byte.
2. **Bytes del medio completos**: cada byte estricto entre inicio y fin pasa a `0xFF` (o `|= 0xFF`).
3. **Byte parcial de fin**: máscara desde el inicio de ese byte hasta el offset final.
4. **Caso mismo byte**: si `x1` y `x2` comparten un byte, AND de máscara de inicio y de fin, una sola aplicación. No corras la lógica de bytes completos o romperás el rango.

Offsets:

```
startOffset = x1 % 8
endOffset   = x2 % 8
startByte   = x1 / 8
endByte     = x2 / 8
```

Máscara de inicio (encender desde `startOffset` hasta el final del byte):

```
startMask = 0xFF >>> startOffset
// startOffset 0 -> 11111111
// startOffset 3 -> 00011111
```

Máscara de fin (encender desde el inicio del empaquetado hasta `endOffset`):

```
endMask = 0xFF << (7 - endOffset)   // luego quedarte con 8 bits bajos
// endOffset 0 -> 10000000
// endOffset 3 -> 11110000
// endOffset 7 -> 11111111
```

Primer y último índice de byte completo:

* Si la línea empieza a mitad de byte, el primer byte *completo* es `startByte + 1`.
* Si termina a mitad de byte (no en el último bit), el último byte *completo* es `endByte - 1`.
* Si `firstFull > lastFull`, no hay bytes del medio. Cubre líneas cortas y el caso mismo-byte.

La altura es `screen.length / (width / 8)`. Casi no la necesitas si `y` está en rango.

---

## 4. Solución en Java

### Helpers (opcionales pero claros)

```java
/** Bytes in one scanline. width is in pixels and divisible by 8. */
static int bytesPerRow(int width) {
    return width / 8;
}

static int byteIndex(int width, int x, int y) {
    return bytesPerRow(width) * y + (x / 8);
}
```

### Principal: máscaras + bytes completos

```java
void drawLine(byte[] screen, int width, int x1, int x2, int y) {
    if (screen == null || width <= 0 || (width % 8) != 0) {
        return;
    }
    if (x1 > x2) {
        int t = x1;
        x1 = x2;
        x2 = t;
    }
    // optional: clamp or reject out-of-range x/y in a real graphics API

    int bytesPerRow = width / 8;
    int rowBase = bytesPerRow * y;

    int startOffset = x1 % 8;
    int endOffset = x2 % 8;
    int startByte = x1 / 8;
    int endByte = x2 / 8;

    // masks use int then cast; Java bytes are signed
    int startMask = 0xFF >>> startOffset;
    int endMask = 0xFF << (7 - endOffset);
    endMask &= 0xFF;

    if (startByte == endByte) {
        // both ends inside one byte
        int mask = startMask & endMask;
        screen[rowBase + startByte] |= (byte) mask;
        return;
    }

    // left partial (if any bits remain from startOffset to end of byte)
    screen[rowBase + startByte] |= (byte) startMask;

    // full middle bytes
    for (int b = startByte + 1; b <= endByte - 1; b++) {
        screen[rowBase + b] = (byte) 0xFF;
        // or |= (byte) 0xFF if you prefer pure OR everywhere
    }

    // right partial
    screen[rowBase + endByte] |= (byte) endMask;
}
```

Recorrido, ancho `32` (4 bytes/fila), línea `x1 = 5`, `x2 = 26`, `y = 0`:

| Pieza | Col. byte | Máscara / valor | Significado |
| --- | --- | --- | --- |
| start | 0 | `0xFF >>> 5` = `0x07` | píxeles 5,6,7 |
| full | 1 | `0xFF` | píxeles 8-15 |
| full | 2 | `0xFF` | píxeles 16-23 |
| end | 3 | `0xFF << (7-2)` = `0xE0` | píxeles 24,25,26 (`endOffset = 2`) |

`startByte = 0`, `endByte = 3`. El bucle del medio corre `b = 1` y `b = 2`. No se usa el camino mismo-byte.

### Comprobación mismo byte

`x1 = 10`, `x2 = 13`, ancho `32`: ambos en columna de byte `1`, offsets `2` y `5`.

```
startMask = 0xFF >>> 2 = 00111111
endMask   = 0xFF << (7-5) = 11111100   (low 8)
combined  = 00111100
```

Se encienden los píxeles 10,11,12,13. Los vecinos 8,9,14,15 siguen apagados si lo estaban.

### Referencia ingenua (para tests)

```java
void drawLineNaive(byte[] screen, int width, int x1, int x2, int y) {
    if (x1 > x2) {
        int t = x1;
        x1 = x2;
        x2 = t;
    }
    for (int x = x1; x <= x2; x++) {
        int index = (width / 8) * y + (x / 8);
        int bit = 7 - (x % 8);
        screen[index] |= (byte) (1 << bit);
    }
}
```

Compara ambos en rangos aleatorios. Si discrepan, la versión con máscaras está mal.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Bucle setBit por píxel | O(L) | O(1) | L = x2 - x1 + 1 |
| Bytes completos + 2 máscaras | O(B) | O(1) | B ≈ columnas de byte que toca la línea, ~L/8 |
| Construir una fila nueva | O(width) | O(width/8) | Exceso para una sola línea |

B es unas ocho veces menor que L en líneas largas. Por eso en entrevista quieren el relleno en bloque. En líneas cortas ambas valen; la de máscaras muestra que entiendes el empaquetado.

---

## 6. Casos límite y errores frecuentes

Los entrevistadores tocan esto:

* **`x1 == x2`**: un píxel. Camino mismo-byte con máscara de un bit.
* **`x1` y `x2` en el mismo byte, varios píxeles**: hay que hacer AND de máscaras. Olvidarlo es el bug clásico.
* **Línea de bytes enteros exactos** (`x1 % 8 == 0` y `x2 % 8 == 7`): máscaras de inicio y fin son `0xFF`. La estructura mismo-byte vs multi sigue siendo correcta.
* **Sin bytes del medio**: solo dos parciales adyacentes. El bucle no ejecuta el cuerpo.
* **`x1 > x2`**: swap primero o define vacío. No dibujes nada en silencio sin decirlo.
* **`y` fuera de rango / `x` pasado el ancho**: el código real debería validar. En el boceto de entrevista se menciona.
* **`byte` con signo en Java**: `(byte) 0xFF` es `-1`. Vale para patrones de bits. Calcula máscaras en `int` y haz cast al final.
* **`>>` sobre enteros de máscara ya negativos**: construye desde `0xFF` positivo.
* **Sobrescribir parciales con `=` en vez de `|=`**: borra píxeles del byte que no están en la línea.
* **Asumir LSB a la izquierda**: declara MSB-izquierda (o invierte máscaras).

Errores frecuentes:

1. **Sin rama mismo-byte.** Máscara de inicio, luego la de fin, y a veces un `0xFF` que no debería existir.
2. **Off-by-one en el rango de bytes completos.** Incluir `startByte` o `endByte` en el bucle `0xFF` estropea los parciales.
3. **Fórmula mala de máscara de fin.** Prefiere `0xFF << (7 - endOffset)` con máscara de 8 bits.
4. **Olvidar el stride `width / 8`.** El índice es `rowBase + byteCol`, no un `x` plano.
5. **Tratar width como bytes.** En el enunciado clásico son píxeles.
6. **Limpiar toda la pantalla.** Dibujar enciende bits de la línea, no reescribe solo esa línea en el buffer.

Test mínimo:

```java
byte[] screen = new byte[4]; // width 16, height 2
drawLine(screen, 16, 3, 12, 0);
// row 0: expect roughly 00011111 11111000
System.out.printf("%8s %8s%n",
    String.format("%8s", Integer.toBinaryString(screen[0] & 0xFF)).replace(' ', '0'),
    String.format("%8s", Integer.toBinaryString(screen[1] & 0xFF)).replace(' ', '0'));

byte[] a = new byte[8];
byte[] b = new byte[8];
drawLine(a, 32, 5, 26, 0);
drawLineNaive(b, 32, 5, 26, 0);
// assert Arrays.equals(a, b)
```

---

## 7. Resumen para un amigo

Draw Line empaqueta una pantalla monocroma en bytes, ocho píxeles cada uno. Pintas un segmento horizontal.

1. Mapea `(x, y)` a un índice de byte con stride `width / 8` y bit desde `x % 8` (MSB a la izquierda).
2. Ingenuo: recorre cada píxel y haz OR de una máscara de un bit. Correcto, O(longitud).
3. Mejor: máscara del primer byte parcial, `0xFF` en cada byte del medio, máscara del último parcial.
4. Si inicio y fin comparten un byte, AND de las dos máscaras y una sola aplicación.
5. Usa `|=` en los bordes para no borrar vecinos. Cuidado con bytes con signo en Java y con el off-by-one del rango completo.

Si puedes dibujar una fila de 16 píxeles en papel, marcar `x1` y `x2`, escribir las dos máscaras en binario y explicar por qué el mismo byte es especial, dominas el 5.8. El capítulo 5 cierra con un trozo de gráficos que en realidad es una actualización de rangos sobre un bitset.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Pairwise Swap](/blog/es/ctci-5-7-pairwise-swap)
* Siguiente: [The Heavy Pill](/blog/es/ctci-6-1-the-heavy-pill)