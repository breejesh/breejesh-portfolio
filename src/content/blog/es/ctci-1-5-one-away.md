---
title: "CTCI 1.5 One Away: una edición, un pase en Java"
description: "Comprueba si dos cadenas difieren en como máximo un insert, un remove o un replace. Regla de longitudes, un solo recorrido con punteros y Java claro para explicar en voz alta."
date: "2025-08-05"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-5-one-away.webp
previewImage: /assets/images/ctci-1-5-one-away.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Comprueba si dos cadenas difieren en como máximo un insert, un remove o un replace. Regla de longitudes, un solo recorrido con punteros y Java claro para explicar en voz alta.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Escribes una contraseña, te equivocas en un solo carácter y el sistema aún abre. No es magia. Alguien decidió que **una edición pequeña** es suficientemente cercana, y dos no.

Ese es el problema completo: dadas dos cadenas, decide si puedes convertir la primera en la segunda con **como máximo una** de estas operaciones:

1. **Replace** de un carácter (`pale` → `bale`)
2. **Insert** de un carácter (`ple` → `pale`)
3. **Remove** de un carácter (`pale` → `ple`)

Cero ediciones (las cadenas son iguales) también cuenta como true. Dos o más ediciones es false.

Este es el problema estilo CTCI **1.5, One Away**, Capítulo 1 (Arrays and Strings). Lo resolvemos en **un solo pase** sobre la cadena más corta, en Java sencillo.

Inicio de la serie: [CTCI en Java](/blog/en/ctci-series-guide). Anterior: [1.4 Palindrome Permutation](/blog/en/ctci-1-4-palindrome-permutation). Siguiente: [1.6 String Compression](/blog/en/ctci-1-6-string-compression).

---

## Imagen cotidiana

Piensa en dos listas de la compra casi idénticas en papel.

* Tachaste un artículo: remove.
* Añadiste un artículo extra: insert.
* Corrigiste una palabra mal escrita: replace.

Si las listas ya coinciden, necesitaste cero ediciones. Si cambiaste dos sitios, no estás "a una de distancia." No hace falta una estructura rara. Recorres ambas con un dedo en cada una y permites **una** discrepancia explicada por una sola edición.

---

## El problema en palabras simples

**Entrada:** dos cadenas, `a` y `b` (ASCII basta en ejemplos de entrevista).

**Salida:** `true` si `a` puede convertirse en `b` con 0 o 1 edición de tipo insert, remove o replace. Si no, `false`.

**Ejemplos:**

| a | b | Resultado | Por qué |
| --- | --- | --- | --- |
| `pale` | `ple` | true | quitar `a` |
| `pales` | `pale` | true | quitar `s` (o insertar en la más corta) |
| `pale` | `bale` | true | reemplazar `p` por `b` |
| `pale` | `bake` | false | dos replaces |
| `pale` | `pale` | true | cero ediciones |
| `a` | `` | true | un remove |
| `abc` | `abxcd` | false | la diferencia de longitud es 2 |

Preguntas de clarificación que conviene decir en voz alta:

* ¿Se permiten cadenas vacías? Sí, trátulas como normales.
* ¿Distingue mayúsculas? Sí, salvo que el entrevistador diga lo contrario. `'A'` y `'a'` difieren.
* ¿Cero ediciones es true? Sí. "One away" suele significar **como máximo una**.

---

## Cómo pensar antes de programar

### Paso 1: la longitud mata la mayoría de casos

Si las longitudes difieren en más de 1, necesitas al menos dos inserts (o removes). Devuelve false al momento.

```
|len(a) - len(b)| > 1  →  false
```

Es gratis, y a los entrevistadores les gusta oírlo primero.

### Paso 2: misma longitud implica solo replace

Si las longitudes son iguales, insert y remove no ayudan con una sola edición (cambian la longitud). Recorre ambas cadenas juntas. Cuenta desajustes. Si ves un segundo desajuste, false. Al final, cero o un desajuste está bien.

### Paso 3: diferencia de longitud 1 implica insert o remove

Sin pérdida de generalidad, llama `s` a la más corta y `t` a la más larga. Un insert en `s` es lo mismo que un remove en `t`.

Camina con dos índices `i` (en `s`) y `j` (en `t`):

* Si `s[i] == t[j]`, avanza ambos.
* Si difieren, esa debe ser tu **única** edición. Avanza solo `j` (te "saltas" el carácter extra de la más larga). Si ya usaste la edición, false.

Cuando el bucle termina, o coincidieron con cero ediciones, o te saltaste exactamente un carácter extra. En ambos casos devuelves true (la cola restante de la larga es como máximo un carácter, y la longitud ya lo garantiza).

### Paso 4: un método, un pase

No necesitas tres funciones separadas en código de entrevista. Un solo recorrido cubre replace e insert/remove si ramificas solo cuando los caracteres no coinciden.

---

## Java: solución de un pase

```java
public final class OneAway {

    /**
     * Returns true if first and second are at most one edit apart
     * (insert, remove, or replace a single character).
     */
    public static boolean oneEditAway(String first, String second) {
        if (first == null || second == null) {
            return first == second;
        }

        int len1 = first.length();
        int len2 = second.length();
        if (Math.abs(len1 - len2) > 1) {
            return false;
        }

        // s = shorter (or equal), t = longer (or equal)
        String s = len1 <= len2 ? first : second;
        String t = len1 <= len2 ? second : first;

        int i = 0; // index in s
        int j = 0; // index in t
        boolean foundEdit = false;

        while (i < s.length() && j < t.length()) {
            if (s.charAt(i) == t.charAt(j)) {
                i++;
                j++;
                continue;
            }

            // Characters differ: this must be our only edit
            if (foundEdit) {
                return false;
            }
            foundEdit = true;

            if (s.length() == t.length()) {
                // Same length: treat as replace, move both
                i++;
                j++;
            } else {
                // Different length: skip the extra char in the longer string
                j++;
            }
        }

        // If longer has one leftover char and we never edited, that leftover is the insert.
        // Length check already limits leftovers to at most one.
        return true;
    }
}
```

### Traza: `pale` vs `ple` (remove / insert)

* `s = "ple"`, `t = "pale"`
* `p == p` → avanza ambos
* `l != a` → primera edición, salta `a` en `t` (solo `j++`)
* `l == l`, `e == e` → listo, true

### Traza: `pale` vs `bale` (replace)

* longitudes iguales
* `p != b` → primera edición, avanza ambos
* el resto coincide → true

### Traza: `pale` vs `bake` (dos replaces)

* `p != b` → primera edición
* `a == a`
* `l != k` → segunda edición → false

---

## Tiempo y espacio

| | |
| --- | --- |
| **Tiempo** | O(n) donde n es la longitud de la cadena más corta (un pase, trabajo constante por carácter) |
| **Espacio** | O(1) extra (unos índices y un flag; no se construye una cadena nueva) |

No necesitas un mapa de conteo de caracteres. Aquí el orden importa (`abc` vs `cba` no están a una edición), así que una tabla de frecuencias mentiría.

---

## Casos límite que tocan en entrevistas

1. **Cadenas iguales:** `oneEditAway("same", "same")` → true.
2. **Vacía y un carácter:** `("", "x")` → true; `("", "xy")` → false.
3. **Edición al inicio:** `("abc", "xabc")` → true (insert al frente).
4. **Edición al final:** `("abc", "abcd")` → true.
5. **Edición en el medio:** `("abc", "axc")` → true.
6. **Política de null:** decide y dilo. El código de arriba trata dos nulls como iguales y null mezclado como false. Algunos equipos prohíben null por completo.
7. **Unicode / surrogates:** en entrevista suelen ser caracteres BMP. `charAt` vale. Los grafemas del mundo real son otro problema de producto.

Arnés rápido de auto-comprobación:

```java
public static void main(String[] args) {
    assert oneEditAway("pale", "ple");
    assert oneEditAway("pales", "pale");
    assert oneEditAway("pale", "bale");
    assert !oneEditAway("pale", "bake");
    assert oneEditAway("pale", "pale");
    assert oneEditAway("", "a");
    assert !oneEditAway("abc", "abxcd");
    System.out.println("ok");
}
```

---

## Errores habituales

* **Olvidar el atajo de longitud.** Sin él aún puedes acertar, pero pierdes trabajo y un early exit fácil.
* **Mover el puntero incorrecto en insert.** Tras un desajuste con longitudes distintas, solo avanza la cadena más larga.
* **Permitir dos replaces.** El flag `foundEdit` es el punto central. No lo reinicies; un segundo desajuste es fallo.
* **Tratar la distancia de anagramas como distancia de edición.** One Away **no** es "el mismo multiconjunto de caracteres." El orden está fijo salvo la única edición.
* **Montar DP de Levenshtein completo.** La distancia de edición clásica es O(n·m). Para *como máximo una* edición es exceso. Se espera el recorrido lineal.

---

## Explícaselo a un amigo

Dos cadenas están a una edición si puedes arreglar la diferencia con un solo replace, insert o delete (o ya coinciden).

Primero mira las longitudes. ¿Hueco mayor que uno? Listo, false.

Luego recorre ambas. Cuando coinciden, sigue. La primera vez que no, gasta tu única edición permitida: si las longitudes son iguales, trátalo como replace y mueve ambos dedos; si difieren, salta el carácter extra del lado largo. Un segundo desacuerdo es false.

Eso es un pase, memoria extra constante, y se explica bien en pizarra.

---

## Señal de práctica

Cubre el código. Escribe `oneEditAway` solo con la regla de longitudes y las dos reglas de punteros. Luego recorre la tabla de ejemplos en voz alta. Cuando sea automático, abre [1.6 String Compression](/blog/en/ctci-1-6-string-compression).