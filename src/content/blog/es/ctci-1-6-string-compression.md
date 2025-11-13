---
title: "CTCI 1.6 Compresión de cadenas en Java: conteos y StringBuilder"
description: "Comprime rachas de letras (aabcccccaaa a a2b1c5a3) con StringBuilder y devuelve el original cuando la compresión no acorta. Guía en Java con casos límite."
date: "2025-11-13"
tags: [Algoritmos]
coverImage: /assets/images/ctci-1-6-string-compression.webp
previewImage: /assets/images/ctci-1-6-string-compression.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Comprime rachas de letras (aabcccccaaa a a2b1c5a3) con StringBuilder y devuelve el original cuando la compresión no acorta. Guía en Java con casos límite.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Imagina la lista de equipaje cuando llevas cinco calcetines negros iguales. No escribes "calcetín, calcetín, calcetín, calcetín, calcetín". Escribes "calcetín x 5". Esa es la idea del problema: sustituir una racha del mismo carácter por el carácter más cuántas veces aparece seguidas.

Este es el problema **1.6** del estilo clásico de *Cracking the Coding Interview* (Arrays and Strings). Lo que sigue es una explicación original en Java, no un pegado del texto de un libro. Mapa de la serie: [guía CTCI](/blog/es/ctci-series-guide).

---

## El problema en palabras simples

Implementa una compresión básica de cadena usando conteos de caracteres **consecutivos** repetidos.

| Pieza | Significado |
| --- | --- |
| Entrada | Una cadena solo con letras mayúsculas y minúsculas (`a`-`z`, `A`-`Z`) |
| Regla | Recorre de izquierda a derecha. Cada racha máxima del mismo carácter se convierte en ese carácter seguido de su conteo |
| Ejemplo | `aabcccccaaa` se convierte en `a2b1c5a3` |
| Condición | Si la forma comprimida **no es más corta** que la original, devuelve la cadena original |

Los conteos van en decimal. Una racha de doce `x` se escribe `x12` (carácter más dígitos), no doce unos sueltos.

"Consecutivo" importa. `aba` son tres rachas de longitud 1: `a1b1a1`. Eso es más largo que `aba`, así que devuelves `aba`.

---

## Cómo pensar antes de codificar

**Instinto bruto:** recorrer la cadena y construir otra concatenando `"a" + "2" + "b" + ...` con `+` sobre `String`.

La forma es correcta y el coste no. En Java, cada concatenación que alarga el resultado vuelve a copiar todo el prefijo. Con muchas rachas cortas pagas tiempo casi cuadrático.

**Forma mejor:**

1. Recorre la cadena una vez con un índice `i`.
2. Mientras el siguiente carácter sea igual al actual, sube un contador.
3. Añade el carácter y el conteo a un **`StringBuilder`**.
4. Al terminar, compara longitudes. Si el builder no es más corto, devuelve el original.

`StringBuilder` usa un buffer mutable. Los `append` son amortizados O(1) por carácter escrito, así que el conjunto es lineal en el tamaño de la salida (y el recorrido es lineal en la entrada).

También puedes precalcular si la compresión acorta contando rachas y estimando la longitud. Así evitas crear el builder cuando pierdes. En entrevista, un pase al builder más la comparación final suele bastar y se explica bien.

---

## Solución en Java con StringBuilder

```java
public final class StringCompression {

    private StringCompression() {}

    /**
     * Compress consecutive runs: aabcccccaaa -> a2b1c5a3.
     * Returns the original string when compression is not strictly shorter.
     */
    public static String compress(String s) {
        if (s == null || s.isEmpty()) {
            return s;
        }

        StringBuilder compressed = new StringBuilder();
        int n = s.length();
        int i = 0;

        while (i < n) {
            char c = s.charAt(i);
            int count = 0;
            // grow the run of c starting at i
            while (i < n && s.charAt(i) == c) {
                count++;
                i++;
            }
            compressed.append(c);
            compressed.append(count);
        }

        // only keep compression when it truly shrinks the string
        if (compressed.length() >= n) {
            return s;
        }
        return compressed.toString();
    }
}
```

Recorrido de `aabcccccaaa`:

1. Racha de `a` longitud 2 → añade `a`, `2`
2. Racha de `b` longitud 1 → añade `b`, `1`
3. Racha de `c` longitud 5 → añade `c`, `5`
4. Racha de `a` longitud 3 → añade `a`, `3`
5. Resultado `a2b1c5a3` longitud 8. Original longitud 10. Devuelve comprimido.

`append(count)` funciona porque `StringBuilder` tiene sobrecarga `append(int)`. No hace falta `String.valueOf(count)` salvo que quieras más claridad.

---

## Opcional: parar pronto si la compresión no puede ganar

Cada racha se convierte en al menos dos caracteres (letra + al menos un dígito). Si todas las rachas miden 1, la longitud comprimida es `2 * n`. Un early exit frecuente:

```java
// rough check: if there are too many short runs, skip building
private static int countCompressedLength(String s) {
    int length = 0;
    int i = 0;
    int n = s.length();
    while (i < n) {
        char c = s.charAt(i);
        int count = 0;
        while (i < n && s.charAt(i) == c) {
            count++;
            i++;
        }
        length += 1 + String.valueOf(count).length();
    }
    return length;
}
```

Llámalo primero. Si `countCompressedLength(s) >= s.length()`, devuelve `s` sin un segundo pase al builder. Dos pases lineales siguen ganando a la concatenación cuadrática. En entrevista, di el trade-off en voz alta: un pase extra frente a no asignar un builder grande que vas a tirar.

En la pizarra, la versión de un solo pase con builder suele ser suficiente.

---

## Complejidad

| Métrica | Cota | Por qué |
| --- | --- | --- |
| Tiempo | O(n) | Un recorrido de la entrada; cada índice avanza como mucho una vez |
| Espacio extra | O(n) | El builder guarda hasta O(n) caracteres en el peor caso |
| Con chequeo previo de longitud | O(n) tiempo, O(1) extra si devuelves el original sin construir | Segundo pase solo cuando la compresión ayuda |

`n` es la longitud de la entrada. Los dígitos de cada conteo son cortos (`log10(count) + 1` por racha), así que no cambian el big-O en entradas de entrevista.

---

## Casos límite que tocan en entrevista

| Entrada | Esperado | Por qué |
| --- | --- | --- |
| `""` | `""` | Vacío se queda vacío (define con el entrevistador la política de null) |
| `"a"` | `"a"` | `a1` es más largo |
| `"aa"` | `"aa"` | La forma `a2` tiene la misma longitud, se queda el original |
| `"aaa"` | `"a3"` | Claramente más corto |
| `"aabbcc"` | `"aabbcc"` | Comprimido `a2b2c2` longitud 6, no más corto |
| `"AAAAA"` | `"A5"` | Se conserva mayúsculas; `A` y `a` son distintos |
| `"aAaA"` | `"aAaA"` | Mayúsculas y minúsculas alternadas: cuatro rachas de 1 |

Sé explícito con la comparación: **estrictamente más corta**. Misma longitud implica devolver el original. Eso encaja con el enunciado habitual.

También confirma: los conteos son solo de rachas **consecutivas**, no de la frecuencia total del carácter en toda la cadena. `aba` no es `a2b1`.

---

## Errores frecuentes

1. **Usar `String` `+` en un bucle.** Respuesta correcta, complejidad mala. Preguntarán el runtime.
2. **Olvidar la última racha.** Si solo flusheas cuando el *siguiente* carácter cambia, hace falta un flush al final del bucle (o estructurar el bucle como arriba para que el while interno consuma la racha final).
3. **Conteos totales en vez de longitudes de racha.** Un mapa de frecuencias resuelve otro problema.
4. **Devolver comprimido cuando las longitudes son iguales.** El problema quiere el original si no hay acortamiento.
5. **Mezclar `A` y `a`.** Son rachas distintas.

---

## Explícaselo a un amigo

Recorres la cadena y agrupas vecinos que se ven iguales. Cada grupo se convierte en "letra + cuántas". Pegas las piezas con un `StringBuilder` para no reconstruir toda la cadena en cada append. Al final mides: si la nueva escritura no es más corta, la tiras y te quedas con la lista original.

Es compresión al estilo run-length para letras, con una comprobación honesta: la compresión tiene que ayudar de verdad.

---

## Práctica siguiente

Sigue en el Capítulo 1:

- Calentamiento: en papel, cuenta en voz alta las rachas de `aaabbc`.
- Siguiente del plan: [Rotate Matrix](/blog/es/ctci-1-7-rotate-matrix) (1.7).
- Inicio de serie: [guía CTCI en Java](/blog/es/ctci-series-guide).

Mañana reescribe `compress` de memoria sin mirar. Si puedes decir en una frase por qué importa `StringBuilder`, ya dominas el problema.