---
title: "CTCI 1.2 Check Permutation: mismas letras, distinto orden (Java)"
description: "Decide si dos cadenas son permutaciones entre sí. Analogía con fichas Scrabble, ordenar vs array de conteo vs HashMap en Java, complejidad y casos límite para principiantes."
date: "2026-01-24"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-2-check-permutation.webp
previewImage: /assets/images/ctci-1-2-check-permutation.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Decide si dos cadenas son permutaciones entre sí. Analogía con fichas Scrabble, ordenar vs array de conteo vs HashMap en Java, complejidad y casos límite para principiantes.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Dos palabras pueden verse distintas y aun así estar hechas de exactamente las mismas letras. A los entrevistadores les gusta esa idea porque te obliga a hablar de **frecuencia**, no solo de igualdad.

Este es el **problema 1.2** de la [serie CTCI en Java](/blog/es/ctci-series-guide): dadas dos cadenas, decide si una es **permutación** de la otra. Vamos de cero: analogía, problema en palabras simples, cómo pensar, y luego tres versiones limpias en Java.

---

## Analogía cotidiana: dos montones de fichas Scrabble

Tú y un amigo tiran cada uno un montón de fichas con letras.

- Tu montón: `T`, `A`, `R`
- Montón del amigo: `R`, `A`, `T`

Si ordenas cada montón alfabéticamente, ambos se vuelven `A`, `R`, `T`. Mismo multiconjunto de letras. Eso es una permutación.

Si el amigo tiene `R`, `A`, `T`, `S`, los montones no son iguales. Una ficha de más significa que no es permutación.

**Permutación** aquí significa: mismos caracteres con los mismos conteos, posiblemente en otro orden. No "palabras relacionadas". No "anagrama solo en español". Solo bolsas de caracteres que coinciden.

---

## El problema en palabras simples

**Entrada:** dos cadenas, `a` y `b`.

**Salida:** `true` si `a` es un reordenamiento de `b`, si no `false`.

**Ejemplos**

| `a` | `b` | Resultado | Por qué |
| --- | --- | --- | --- |
| `"abc"` | `"bca"` | true | las mismas tres letras |
| `"abc"` | `"ab"` | false | longitudes distintas |
| `"aabc"` | `"abac"` | true | dos `a`, una `b`, una `c` |
| `"Dog"` | `"god"` | false si importa mayúsculas | `D` no es `d` |
| `"ab c"` | `"abc"` | false si el espacio cuenta | el espacio es un carácter |

### Preguntas que debes hacer en la entrevista

1. **¿Sensible a mayúsculas?** Suele ser sí, salvo que digan lo contrario. `"God"` y `"dog"` son distintas.
2. **¿Cuentan espacios y puntuación?** Suele ser sí. Trata cada `char` igual.
3. **¿Charset?** ¿Solo ASCII, o Unicode completo? Eso elige **array de conteos** vs **HashMap**.
4. **¿Null o vacías?** Vacía y vacía puede ser true (cero caracteres). Null es decisión de producto; en entrevistas, declara tu regla.

En este post asumimos:

* Sensible a mayúsculas.
* El espacio cuenta.
* Preferimos una solución ASCII clara y luego mostramos la versión general con `HashMap`.

---

## Cómo pensar antes de programar

### Fuerza bruta demasiado lenta

Generar cada permutación de `a` y ver si aparece `b`. Para longitud `n` son del orden de `n!` cadenas. Vale para longitud 4. Muere en longitud 20. No vayas por ahí.

### Idea 1: ordenar ambas cadenas

Si dos cadenas son permutaciones, ordenar sus caracteres produce la misma secuencia.

1. Si las longitudes difieren, devuelve false al momento.
2. Convierte cada cadena a `char[]`.
3. Ordena ambos arrays.
4. Compara igualdad de arrays (o construye strings y usa `equals`).

Fácil de explicar y difícil de romper. El coste es el sort: tiempo **O(n log n)**.

### Idea 2: contar caracteres (la mejora de entrevista)

Ordenar reordena. Contar compara **cuántas** veces aparece cada letra.

1. Si las longitudes difieren, false.
2. Recorre `a` e incrementa el conteo de cada carácter.
3. Recorre `b` y decrementa.
4. Si algún conteo queda negativo, o queda algo distinto de cero, no son permutaciones.

Si el alfabeto es pequeño y fijo (ASCII clásico con 128 o 256 huecos), basta un `int[]`. Si pueden ser unidades Unicode, usa `HashMap<Character, Integer>`.

Contar suele ser tiempo **O(n)** y espacio extra **O(1)** para alfabeto fijo (el tamaño del array no crece con `n`).

### ¿Cuál dices primero?

En una entrevista real: empieza con ordenar, y luego di "podemos hacerlo mejor con conteos de frecuencia si el alfabeto es limitado." Así demuestras que entregas lo simple y aún sabes optimizar.

---

## Solución Java 1: ordenar ambas

```java
import java.util.Arrays;

public class CheckPermutation {

    /** True si a es permutación de b (sensible a mayúsculas, cada char cuenta). */
    public static boolean permutationBySort(String a, String b) {
        if (a == null || b == null) {
            return a == b; // ambas null -> true; una null -> false
        }
        if (a.length() != b.length()) {
            return false;
        }

        char[] ca = a.toCharArray();
        char[] cb = b.toCharArray();
        Arrays.sort(ca);
        Arrays.sort(cb);
        return Arrays.equals(ca, cb);
    }
}
```

Notas para principiantes:

* `toCharArray()` copia los caracteres para que el sort no intente mutar el `String` inmutable.
* La comprobación de longitud es un early exit gratis. Longitud distinta nunca es permutación.
* `Arrays.equals` compara cada índice después de ordenar.

---

## Solución Java 2: array de conteo (amigable con ASCII)

Asume caracteres en 0..127 (ASCII estándar). Si el problema dice "ASCII extendido", usa tamaño 256.

```java
public class CheckPermutation {

    private static final int ASCII = 128;

    public static boolean permutationByCountArray(String a, String b) {
        if (a == null || b == null) {
            return a == b;
        }
        if (a.length() != b.length()) {
            return false;
        }

        int[] counts = new int[ASCII];

        for (int i = 0; i < a.length(); i++) {
            char c = a.charAt(i);
            // Guardia opcional si debes rechazar no-ASCII:
            // if (c >= ASCII) throw new IllegalArgumentException("non-ASCII");
            counts[c]++;
        }

        for (int i = 0; i < b.length(); i++) {
            char c = b.charAt(i);
            counts[c]--;
            if (counts[c] < 0) {
                // b tiene más de este char que a
                return false;
            }
        }

        // Longitudes iguales y nunca bajamos de cero: todo quedó en cero.
        return true;
    }
}
```

Por qué funciona el `return` temprano con `counts[c] < 0`:

* La longitud total es igual.
* Cada vez que `b` usa un carácter, restamos uno del stock que construyó `a`.
* Si el stock se vuelve negativo, `b` necesitaba más de ese carácter del que tenía `a`.
* Si eso nunca pasa y las longitudes coinciden, las bolsas son iguales. No hace falta un tercer bucle buscando positivos.

Si prefieres el estilo de tres pases del libro: incrementa con `a`, decrementa con `b`, luego recorre el array buscando cualquier no cero. Mismo big-O; un poco más de código.

---

## Solución Java 3: HashMap (conjunto de caracteres general)

Cuando no puedes asumir ASCII, cuenta con un mapa.

```java
import java.util.HashMap;
import java.util.Map;

public class CheckPermutation {

    public static boolean permutationByHashMap(String a, String b) {
        if (a == null || b == null) {
            return a == b;
        }
        if (a.length() != b.length()) {
            return false;
        }

        Map<Character, Integer> counts = new HashMap<>();

        for (int i = 0; i < a.length(); i++) {
            char c = a.charAt(i);
            counts.put(c, counts.getOrDefault(c, 0) + 1);
        }

        for (int i = 0; i < b.length(); i++) {
            char c = b.charAt(i);
            Integer left = counts.get(c);
            if (left == null || left == 0) {
                return false;
            }
            if (left == 1) {
                counts.remove(c); // opcional: mapa más limpio
            } else {
                counts.put(c, left - 1);
            }
        }

        return counts.isEmpty();
    }
}
```

Compromiso:

* Funciona para cualquier valor `char` que Java almacena (unidades de código UTF-16).
* Más sobrecarga de objetos y coste de hash frente a un `int[]` compacto.
* En problemas de entrevista con strings ASCII, el array suele ser la respuesta más afilada después de mencionar el sort.

### Pruebas mínimas

```java
public static void main(String[] args) {
    System.out.println(permutationBySort("abc", "bca"));       // true
    System.out.println(permutationBySort("abc", "ab"));        // false
    System.out.println(permutationByCountArray("aabc", "abac")); // true
    System.out.println(permutationByHashMap("Dog", "god"));    // false
    System.out.println(permutationByHashMap("", ""));          // true
}
```

---

## Complejidad

Sea `n` la longitud común cuando coinciden (si difieren, paramos en O(1)).

| Enfoque | Tiempo | Espacio extra | Mejor cuando |
| --- | --- | --- | --- |
| Ordenar ambas | O(n log n) | O(n) por los char arrays (o O(1) si ignoras las copias) | Quieres el código correcto más simple |
| Array de conteo (tamaño k) | O(n) | O(k) fijo, p. ej. 128 o 256 | El alfabeto es pequeño y conocido |
| HashMap | O(n) promedio | O(min(n, alfabeto)) | Caracteres dispersos o alfabeto grande |

Frase de entrevista: **longitud distinta es un no instantáneo. Mismo multiconjunto de caracteres es un sí. Ordenar demuestra el multiconjunto. Contar lo demuestra más rápido con alfabeto fijo.**

---

## Casos límite que pinchan los entrevistadores

1. **Longitudes distintas** (`"ab"`, `"abc"`) → false sin escanear el contenido si compruebas longitud primero.
2. **Cadenas vacías** (`""`, `""`) → true. (`""`, `"a"`) → false.
3. **Una vacía y otra no** → false.
4. **Duplicados** (`"aab"`, `"aba"`) → true; (`"aab"`, `"abb"`) → false. Importa la frecuencia, no solo "usa a y b".
5. **Mayúsculas** (`"Abc"`, `"abc"`) → false con reglas case-sensitive.
6. **Espacios** (`"a b"`, `"ab "`) → true (mismos caracteres, otro orden); (`"a b"`, `"ab"`) → false.
7. **Null** → acuerda la política antes de codificar.
8. **Cadenas muy largas** → prefiere conteo O(n) sobre sort si los límites son enormes y el alfabeto es fijo.
9. **Unicode / emoji** → en Java `char` es una unidad UTF-16. Manejar code points completos es otro tema; menciónalo si al entrevistador le importan los emoji.

---

## Errores comunes

* Comparar strings con `==` en Java (igualdad de referencia). Usa comparación de contenido tras ordenar, o no construyas strings y compara arrays / conteos.
* Olvidar la comprobación de longitud y escribir un conteo largo que "casi" funciona.
* Usar un set booleano de "visto" en lugar de conteos. Los sets destruyen la frecuencia. `"aab"` y `"abb"` se verían idénticos como `{a, b}`.
* Asumir case-insensitive sin preguntar.
* Off-by-one en el tamaño del array: 128 vs 256 vs `Character.MAX_VALUE + 1` (no reserves 65k a menos que lo quieras de verdad).

---

## Explícaselo a un amigo

Comprobar permutación pregunta: **¿estas dos cadenas son la misma bolsa de letras?**

Imagina fichas de Scrabble. Si los dos tenéis las mismas fichas, solo en otro orden, coincidís. Si alguno tiene una ficha de más o de menos, no.

Algoritmo mental rápido:

1. ¿Longitud distinta? No.
2. O bien ordenas ambos montones y comparas, o cuentas cuántas de cada letra tiene cada montón.
3. Conteos iguales significa sí.

En Java, ordenar es el primer borrador claro. Un array de conteo de tamaño fijo es la mejora O(n) habitual para ASCII. Un `HashMap` es la versión general cuando el alfabeto no es pequeño.

Eso es CTCI 1.2. Lo siguiente en el capítulo 1 suele ser **URLify** (espacios a `%20` in-place). La idea anterior del capítulo es **Is Unique** (todos los caracteres distintos).

---

## Serie

* Guía de la serie: [Cracking the Coding Interview in Java](/blog/es/ctci-series-guide)
* Tag: solo **Algoritmos** en esta serie

Consejo de práctica: implementa el sort sin mirar, y al día siguiente reescribe con conteos de memoria.