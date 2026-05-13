---
title: "CTCI 1.9 Rotación de cadenas: una sola llamada a isSubstring"
description: "Comprueba si s2 es una rotación de s1 con una sola llamada a isSubstring: concatena s1 consigo misma y pregunta si s2 vive dentro. Recorrido en Java para principiantes."
date: "2026-05-13"
tags: [Algoritmos]
coverImage: /assets/images/ctci-1-9-string-rotation.webp
previewImage: /assets/images/ctci-1-9-string-rotation.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Comprueba si s2 es una rotación de s1 con una sola llamada a isSubstring: concatena s1 consigo misma y pregunta si s2 vive dentro. Recorrido en Java para principiantes.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un collar circular de cuentas con letras. Lo abres entre dos cuentas, giras el aro para que otra cuenta quede al frente y lo cierras otra vez. Las cuentas son las mismas, en el mismo orden cíclico. Solo cambió el punto de inicio. Eso es una **rotación de cadena**.

Este post es el problema **1.9** de la [serie CTCI en Java](/blog/es/ctci-series-guide): dadas dos cadenas, decide si una es rotación de la otra, y solo puedes llamar a `isSubstring` **una** vez.

---

## El problema en palabras simples

Recibes dos cadenas, `s1` y `s2`.

- Una **rotación** de `s1` significa: eliges un índice `i`, tomas el sufijo `s1[i..]` y pegas después el prefijo `s1[0..i)`. Ejemplo: `waterbottle` rotada después de `wat` queda `erbottlewat`.
- Te dan un helper `isSubstring(big, small)` que devuelve true cuando `small` aparece en algún sitio dentro de `big`.
- Escribe `isRotation(s1, s2)` que solo devuelve true cuando `s2` es alguna rotación de `s1`.
- **Restricción que importa en la entrevista:** llama a `isSubstring` como máximo **una** vez.

Asume caracteres sensibles a mayúsculas. `"Abc"` no es rotación de `"bca"`.

---

## Cómo pensar antes de codificar

### Fuerza bruta (no la presentes como la respuesta final)

Para cada corte `i` de `0` a `n-1`, construye `s1.substring(i) + s1.substring(0, i)` y compáralo con `s2`. Son O(n) candidatos, cada comparación O(n), o sea O(n²) y muchas cadenas temporales. Además no usa la regla de una sola llamada.

### La idea que desbloquea el límite de una llamada

Si `s2` es rotación de `s1`, entonces `s1` se parte como `x + y` y `s2` es `y + x` para algunas cadenas `x` e `y` (pueden ser vacías).

Concatena `s1` consigo misma:

```
s1 + s1 = x + y + x + y
```

El trozo del medio es `y + x`, exactamente `s2`. Así que **toda rotación de `s1` es subcadena de `s1 + s1`**.

En la otra dirección hace falta un guardia más: las longitudes deben coincidir. Si no, una cadena más corta podría aparecer dentro del texto duplicado sin ser una rotación de igual longitud.

La comprobación completa es:

1. Misma longitud (y normalmente no nulas).
2. `isSubstring(s1 + s1, s2)` una sola vez.

Cadena vacía: ambas vacías tienen la misma longitud, `"" + ""` es `""`, e `isSubstring("", "")` debería ser true. Una vacía y otra no fallan por longitud.

---

## Solución en Java

```java
/**
 * Devuelve true si s2 es rotación de s1, con como máximo una llamada a isSubstring.
 * Ejemplo: "waterbottle" y "erbottlewat" -> true.
 */
public static boolean isRotation(String s1, String s2) {
    if (s1 == null || s2 == null) {
        return false;
    }
    // Las rotaciones conservan la longitud. Distinta longitud: imposible.
    if (s1.length() != s2.length()) {
        return false;
    }
    // Opcional: dos cadenas vacías son rotaciones iguales.
    // s1 + s1 sigue vacía; isSubstring debe devolver true para vacío en vacío.
    String doubled = s1 + s1;
    return isSubstring(doubled, s2);
}

/**
 * True si small aparece dentro de big. En la entrevista esto es "dado".
 * En Java real puedes implementarlo con indexOf.
 */
public static boolean isSubstring(String big, String small) {
    if (big == null || small == null) {
        return false;
    }
    return big.indexOf(small) != -1;
}
```

Recorre el ejemplo clásico:

| Paso | Valor |
| --- | --- |
| `s1` | `waterbottle` |
| `s2` | `erbottlewat` |
| longitudes | ambas 11, OK |
| `s1 + s1` | `waterbottlewaterbottle` |
| `isSubstring` | encuentra `erbottlewat` después de `wat` |

Una llamada. Listo.

---

## Complejidad

| | Coste | Por qué |
| --- | --- | --- |
| Tiempo | O(n) típico | Construir `s1+s1` es O(n). `indexOf` es O(n) de media / O(n·m) en el peor caso ingenuo. En entrevista: trabajo lineal en la longitud con una búsqueda de subcadena decente. |
| Espacio extra | O(n) | La cadena duplicada tiene longitud 2n. |

En el peor caso tienes que leer ambas cadenas, así que el orden lineal es el adecuado.

---

## Casos límite que tocan en la entrevista

1. **Entradas nulas.** Devuelve false (o lanza si tu contrato lo dice). Di la elección en voz alta.
2. **Longitudes distintas.** False rápido. No hace falta llamar a `isSubstring` (cero llamadas sigue cumpliendo "como máximo una").
3. **Cadenas idénticas.** Rotación por cero. `s1+s1` contiene `s1`. True.
4. **Cadenas vacías.** Ambas vacías: true. Una vacía: false por longitud.
5. **Un solo carácter.** `"a"` y `"a"` true; `"a"` y `"b"` false.
6. **Letras repetidas.** `"aaaa"` y `"aaaa"` true. `"aaba"` y `"abaa"` true (rotación). Usa el test de la cadena duplicada; no inventes casos especiales.
7. **Mayúsculas y espacios.** `"Ab"` no es rotación de `"bA"` salvo que el problema ignore mayúsculas. Por defecto, coincidencia exacta.
8. **Llamar a isSubstring más de una vez.** Es el núcleo de la pregunta. Construir todas las rotaciones a mano falla el espíritu aunque sea correcto.

---

## Errores habituales

- Olvidar la **comprobación de longitud** y solo probar `isSubstring(s1+s1, s2)`. Una cadena más corta que aparece en la fuente duplicada puede colarse.
- Llamar a `isSubstring` en un bucle sobre puntos de corte. Eso quema el presupuesto.
- Usar `contains` sobre `s2+s2` en lugar de `s1+s1` sin cuidar los papeles. La cadena duplicada debe ser la **original** (o cualquiera si las longitudes coinciden y son rotaciones mutuas). Quédate con una historia: duplica `s1`, busca `s2`.
- Ordenar ambas cadenas. Eso comprueba **anagrama**, no rotación. `"abcd"` y `"acbd"` son anagramas, no rotaciones.

---

## Resumen para contárselo a un amigo

Una rotación es el mismo collar circular de caracteres, abierto en otro cierre.

Si `s2` es de verdad rotación de `s1`, entonces `s2` es algún `y + x` mientras `s1` es `x + y`. Escribe `s1` dos veces seguidas y ese `y + x` queda en el medio. Así que comprueba **misma longitud** y pregunta una sola vez: ¿es `s2` subcadena de `s1 + s1`?

Ese es todo el truco. Una observación buena gana a un nido de bucles.

---

## Práctica

1. Codifica `isRotation` de memoria, sin mirar.
2. Traza en papel `isRotation("waterbottle", "erbottlewat")`.
3. Traza un caso falso: `isRotation("waterbottle", "bottlewaterx")` (longitud) e `isRotation("abc", "acb")` (anagrama, no rotación).
4. Explica por qué ordenar ambos lados es la herramienta equivocada.

Con esto cierra el Capítulo 1 (Arrays and Strings). Siguiente: listas enlazadas con [Remove Dups](/blog/es/ctci-2-1-remove-dups). Mapa de la serie: [CTCI en Java](/blog/es/ctci-series-guide).