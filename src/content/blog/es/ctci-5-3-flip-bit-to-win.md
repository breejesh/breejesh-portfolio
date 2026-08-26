---
title: "Flip Bit to Win: la racha más larga de unos tras un flip (Java)"
description: "Problema estilo CTCI 5.3 para principiantes: voltea un bit 0 en un entero para maximizar los 1 consecutivos. Rastrea rachas de unos separadas por ceros, une a través de un solo cero, Java claro."
date: "2026-01-16"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
previewImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 5.3 para principiantes: voltea un bit 0 en un entero para maximizar los 1 consecutivos. Rastrea rachas de unos separadas por ceros, une a través de un solo cero, Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Miras una fila de interruptores. La mayoría están ENCENDIDOS. Algunos están APAGADOS. Puedes voltear **exactamente uno** de APAGADO a ENCENDIDO. Quieres el tramo más largo de luces ENCENDIDAS consecutivas que puedas crear. Eso es **Flip Bit to Win**: un cambio gratis de cero a uno, y luego mides la racha más larga de unos.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de rachas de bits en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 5, manipulación de bits, problema 5.3.

---

## 1. Analogía cotidiana

Imagina una franja de aparcamiento con plazas en línea. Una plaza llena es un `1`. Una vacía es un `0`. Tienes **un** relleno gratis: eliges una plaza vacía y la pintas llena.

Si dos bloques llenos están a ambos lados de una sola plaza vacía, rellenarla los une en un bloque largo. Si hay dos vacías seguidas, rellenar solo una no une los bloques exteriores. Aun así alargas una racha local, pero el hueco de dos vacías sigue roto.

El trabajo no es "contar todos los unos". Es "encontrar el mejor sitio donde gastar tu único relleno".

---

## 2. Enunciado en palabras simples

**Entrada:** un entero de 32 bits `n` (piensa en bits; en entrevista suele ser una palabra de ancho fijo, a menudo 32).

**Salida:** la longitud de la secuencia más larga de bits `1` que puedes crear volteando **como máximo un** bit `0` a `1`. (Si el número ya es todo unos, la respuesta es el ancho completo de la palabra.)

**Ejemplos** (binario con el bit menos significativo a la derecha):

| Idea de entrada | Binario (bits bajos) | Mejor flip | Longitud |
| --- | --- | --- | --- |
| clásico 1775 | `11011101111` | el cero entre `111` y `1111` | 8 |
| `0b11011` | `11011` | el cero del medio | 5 |
| `0b110011` | `110011` | cualquiera de los ceros aislados | 3 (no une ambos pares) |
| `0` | todo ceros | cualquier bit | 1 |
| `-1` (todos unos en complemento a dos) | 32 unos | no hace falta | 32 |
| `0b111` | `111` | un cero por encima de la racha | 4 |

**Aclara antes de codificar:**

* ¿Ancho de palabra? (Aquí `int` de 32 bits. Usa `Integer.SIZE`.)
* ¿Debemos voltear sí o sí, o vale "ya es óptimo"? (Si ya son todos unos, devuelve 32.)
* Enteros con signo: recorre con desplazamiento **sin signo** `>>>` para que el bit de signo no se quede pegado.
* Devuelve la longitud, no el entero volteado (salvo que pidan ambas cosas).

---

## 3. Piensa primero

### Idea bruta (dila y no la codifiques)

Por cada posición que sea 0, voltéala, busca la racha más larga de unos, deshaz. Eso es O(b²) con ancho b (32 o 64). Vale para un b pequeño; mal hábito.

### Mejor idea: rachas de unos separadas por ceros

Recorre los bits una vez. Mantén:

* `currentLength`: cuántos unos seguidos terminan en el bit que acabas de ver.
* `previousLength`: cuántos unos había **justo antes del cero más reciente** que aún puedes usar de puente.
* `maxLength`: mejor respuesta hasta ahora.

Si el bit actual es `1`, crece `currentLength`.

Si el bit actual es `0`:

* La racha de unos que acaba de terminar puede ser el lado izquierdo de una fusión futura.
* Mira un bit adelante. Si el **siguiente** también es `0`, hay dos ceros seguidos: no puedes usar este cero como puente hacia una racha posterior que aún tiene otro cero en medio. Pon `previousLength = 0`.
* Si el siguiente es `1`, pon `previousLength = currentLength`.
* Reinicia `currentLength = 0`.

Tras cada bit, la mejor fusión que usa el cero más reciente como flip es:

```
previousLength + 1 + currentLength
```

El `+ 1` es el cero volteado. Actualiza `maxLength` con ese valor.

Si el número es todo unos (`~n == 0` en el ancho completo), devuelve el tamaño de palabra al momento.

### Por qué mirar un bit adelante funciona

Solo necesitas saber si el cero que acabas de tocar es un separador **simple** o el inicio de un hueco doble. `(n & 2) == 0` significa "el siguiente bit también es cero" mientras el cero actual sigue en el bit bajo. En código lo compruebas antes de desplazar, con el valor actual de `n`.

### Modelo mental alternativo: lista de secuencias

Construye una lista de longitudes de rachas alternando ceros y unos, por ejemplo:

```
11011101111  →  unos:2, cero:1, unos:3, cero:1, unos:4
```

Por cada racha de ceros de longitud 1, candidato = unos izquierdos + 1 + unos derechos. Si la racha de ceros es mayor que 1, el mejor flip local solo alarga una racha vecina en 1. Quédate con el máximo global. Misma respuesta, más memoria. El barrido prev/curr en O(1) de espacio es el default de entrevista.

---

## 4. Solución en Java

```java
/**
 * Longest run of 1-bits after flipping at most one 0-bit to 1.
 * Assumes a 32-bit word (Integer.SIZE).
 */
int flipBitToWin(int n) {
    // Already all ones: no flip needed.
    if (~n == 0) {
        return Integer.SIZE;
    }

    int currentLength = 0;
    int previousLength = 0;
    int maxLength = 1; // flipping one zero in a sea of zeros still yields length 1

    while (n != 0) {
        if ((n & 1) == 1) {
            currentLength++;
        } else {
            // Current bit is 0. If the next bit is also 0, no useful left run to keep.
            previousLength = ((n & 2) == 0) ? 0 : currentLength;
            currentLength = 0;
        }
        maxLength = Math.max(previousLength + 1 + currentLength, maxLength);
        n >>>= 1; // logical shift; do not sign-extend
    }

    return maxLength;
}
```

### Recorrido: 1775 (`11011101111`)

Bits de bajo a alto como los ve el bucle: `1 1 1 1 0 1 1 1 0 1 1`.

| Bit | Acción | prev | curr | max |
| --- | --- | --- | --- | --- |
| 1 | ones++ | 0 | 1 | 2 |
| 1 | ones++ | 0 | 2 | 3 |
| 1 | ones++ | 0 | 3 | 4 |
| 1 | ones++ | 0 | 4 | 5 |
| 0 | siguiente es 1 → prev=4, curr=0 | 4 | 0 | 5 |
| 1 | ones++ | 4 | 1 | 6 |
| 1 | ones++ | 4 | 2 | 7 |
| 1 | ones++ | 4 | 3 | 8 |
| 0 | siguiente es 1 → prev=3, curr=0 | 3 | 0 | 8 |
| 1 | ones++ | 3 | 1 | 8 |
| 1 | ones++ | 3 | 2 | 8 |

Respuesta **8**: voltea el cero entre el bloque de tres unos y el de cuatro unos.

### Recorrido: `0b110011` (no une ambos pares)

Unos, unos, cero, cero, unos, unos. Al procesar el primer cero, el siguiente también es cero, así que `previousLength` pasa a 0. Los unos posteriores nunca se unen al primer par. Mejor longitud: 3.

### Pruebas mínimas

```java
public static void main(String[] args) {
    System.out.println(flipBitToWin(1775));      // 8
    System.out.println(flipBitToWin(0b11011));   // 5
    System.out.println(flipBitToWin(0b110011));  // 3
    System.out.println(flipBitToWin(0));         // 1
    System.out.println(flipBitToWin(-1));        // 32
    System.out.println(flipBitToWin(0b111));     // 4
}
```

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Voltear cada cero y reescanear | O(b²) | O(1) | b = ancho de palabra (32/64); simple pero flojo |
| Un pase prev/curr | O(b) | O(1) | respuesta preferida en entrevista |
| Lista de longitudes de rachas | O(b) | O(b) | imagen clara; más asignación |

Con un `int` de 32 bits, O(b) es tiempo constante en la práctica. Aun así di O(b) en voz alta.

---

## 6. Casos borde y errores comunes

Los entrevistadores tocan estos:

* **Todos unos (`-1`)** → devuelve `Integer.SIZE` (32). Caso especial al inicio.
* **Todos ceros (`0`)** → devuelve 1 (voltea cualquier bit).
* **Un solo uno** → devuelve 2 si existe un cero al lado; la fórmula `previousLength + 1 + currentLength` lo cubre.
* **Dos ceros seguidos** → no dejes un `previousLength` viejo. La rama `(n & 2) == 0` lo limpia.
* **Unos en el extremo alto** → cuando `n` llega a 0 el bucle para; los ceros altos no hacen falta más allá de lo que ya puntuó la fórmula al consumir unos.
* **`>>` aritmético en lugar de `>>>`** → en negativos el bit de signo se repite para siempre. Usa desplazamiento lógico en barridos de bits.

Errores comunes:

1. **Olvidar el atajo de todos unos.** Sin él a veces el código igual funciona, pero la intención queda más clara con `if (~n == 0)`.
2. **Empezar con `maxLength = 0`.** Entonces la entrada todo ceros devuelve 0. Siempre puedes crear un uno.
3. **Poner `previousLength = currentLength` en cada cero sin mirar el siguiente bit.** Los huecos dobles se fusionarían mal.
4. **Devolver el número volteado en lugar de la longitud.** Reescribe el enunciado.
5. **Armar un string de 32 chars y escanear con `charAt`.** Funciona, piensa más lento, fácil fallar en off-by-one. Prefiere aritmética sobre `n`.

---

## 7. Explícaselo a un amigo

Flip Bit to Win pregunta: voltea como máximo un cero a uno, ¿cuánto mide la racha más larga de unos?

1. Si la palabra ya es todo unos, la respuesta es el ancho (32).
2. Recorre bits con desplazamiento lógico. Lleva la racha actual de unos y la racha antes del último cero útil.
3. En un cero, si el siguiente también es cero, tira la racha izquierda guardada. Si no, guarda la racha que acabas de terminar como lado izquierdo.
4. Tras cada bit, el candidato es racha izquierda + 1 (el flip) + racha derecha hasta ahora.
5. Un pase, memoria extra constante, fácil de dibujar con el 1775 que da 8.

Si marcas el mejor cero a voltear en `11011101111` y explicas por qué `110011` solo llega a 3, dominas el 5.3.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Binary to String](/blog/es/ctci-5-2-binary-to-string)
* Siguiente: [Next Number](/blog/es/ctci-5-4-next-number)