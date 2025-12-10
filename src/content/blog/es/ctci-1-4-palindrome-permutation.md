---
title: "CTCI 1.4 Permutación palíndromo en Java: cuenta impares, no reordenamientos"
description: "Comprueba si algún reordenamiento de una cadena es un palíndromo. Conteos de frecuencia, como máximo un carácter impar, reglas opcionales de espacio y mayúsculas, y Java claro."
date: "2025-12-10"
tags: [Algoritmos]
coverImage: /assets/images/ctci-1-4-palindrome-permutation.webp
previewImage: /assets/images/ctci-1-4-palindrome-permutation.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Comprueba si algún reordenamiento de una cadena es un palíndromo. Conteos de frecuencia, como máximo un carácter impar, reglas opcionales de espacio y mayúsculas, y Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un **palíndromo** se lee igual de izquierda a derecha y de derecha a izquierda: `kayak`, `level`, `a man a plan a canal panama` si ignoras espacios. Una **permutación** es cualquier reordenamiento del mismo multiconjunto de caracteres. Este problema hace una pregunta más quieta: *¿podría alguna mezcla de esta cadena ser un palíndromo?* No necesitas construir esa mezcla. Solo necesitas saber si es posible.

Este es el problema **1.4** del estilo *Cracking the Coding Interview* (arrays y strings). El artículo es enseñanza original, no un pegado de ninguna solución de libro.

---

## Imagen cotidiana

Piensa en fichas de letras sobre una mesa. Quieres alinearlas en una palabra que se vea igual desde ambos extremos.

Los pares ocupan asientos a juego: una `a` a la izquierda necesita otra `a` a la derecha, y así. Si una letra aparece un número impar de veces, sobra una ficha. Esa sobra puede sentarse en el **medio** de la fila. Si dos letras distintas dejan sobra cada una, necesitarías dos medios. Una sola fila solo tiene un asiento central.

Así que la regla es directa:

* Todos los conteos de caracteres son pares, **o**
* Exactamente un carácter tiene conteo impar (y el resto son pares).

Eso es todo el algoritmo, una vez que acuerdas qué contar (¿solo letras? ¿mayúsculas? ¿espacios?).

---

## Problema en palabras simples

**Entrada:** una cadena `s`.

**Salida:** `true` si existe algún reordenamiento de los caracteres de `s` que forma un palíndromo; si no, `false`.

**Aclaraciones que debes pedir en una entrevista**

| Pregunta | Elección típica de enseñanza |
| --- | --- |
| ¿Espacios? | A menudo se ignoran (frases como `Tact Coa` → `tacocat`) |
| ¿Mayúsculas? | A menudo se trata como insensible a mayúsculas (`T` y `t` son la misma letra) |
| ¿Cadena vacía? | Suele ser `true` (vacío es palíndromo) |
| ¿Solo letras ASCII? | Confirma; un mapa general sirve para cualquier conjunto de caracteres |

Ejemplo clásico: `"Tact Coa"` puede reordenarse a `"taco cat"` (ignorando espacios y mayúsculas), así que la respuesta es `true`.

**No** te piden devolver la cadena palíndromo. Solo sí o no.

---

## Cómo pensar antes de programar

### Fuerza bruta (no envíes esto)

Genera cada permutación y prueba `isPalindrome`. Eso es tiempo factorial. Los entrevistadores quieren que lo menciones una vez y lo dejes atrás.

### Mejor idea: usa la regla del asiento del medio

1. Cuenta cuántas veces aparece cada carácter.
2. Cuenta cuántos caracteres tienen frecuencia **impar**.
3. Acepta si ese conteo impar es `0` o `1`.

Por qué basta:

* Palíndromo de longitud par: cada par encaja; cero impares.
* Palíndromo de longitud impar: un carácter se sienta en el centro; exactamente un impar.

Nunca construyes la cadena. Solo inspeccionas conteos.

### Variante opcional con vector de bits (si el alfabeto es pequeño)

Si solo te importan letras inglesas minúsculas, puedes alternar bits en un `int` (caben 26 bits). Un carácter con conteo par termina con bit 0; impar con bit 1. Al final, el conjunto de bits debe tener como máximo un bit activo (`x & (x - 1) == 0`). Útil en entrevistas cuando el alfabeto está fijo. La versión con mapa de abajo es más clara y general.

---

## Solución en Java: contar impares

Esta versión pasa letras a minúsculas, salta lo que no es letra, y usa un `HashMap`. Ajusta el filtro si el entrevistador quiere cada carácter, incluidos espacios.

```java
import java.util.HashMap;
import java.util.Map;

public class PalindromePermutation {

    /**
     * Returns true if some permutation of the letters in s is a palindrome.
     * Spaces and punctuation are ignored. Case is ignored.
     */
    public static boolean isPalindromePermutation(String s) {
        if (s == null) {
            return false;
        }

        Map<Character, Integer> counts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (!Character.isLetter(c)) {
                continue;
            }
            c = Character.toLowerCase(c);
            counts.put(c, counts.getOrDefault(c, 0) + 1);
        }

        int oddCount = 0;
        for (int freq : counts.values()) {
            if (freq % 2 != 0) {
                oddCount++;
                if (oddCount > 1) {
                    return false;
                }
            }
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isPalindromePermutation("Tact Coa")); // true  (taco cat)
        System.out.println(isPalindromePermutation("hello"));    // false
        System.out.println(isPalindromePermutation("aab"));      // true  (aba)
        System.out.println(isPalindromePermutation(""));         // true
        System.out.println(isPalindromePermutation("Aa"));       // true  (aa / Aa)
    }
}
```

### Recorrido: `"Tact Coa"`

Letras tras ignorar y pasar a minúsculas: `t a c t c o a`

| Letra | Conteo |
| --- | --- |
| a | 2 |
| c | 2 |
| o | 1 |
| t | 2 |

Frecuencias impares: solo `o`. Un asiento del medio vale. Devuelve `true`.

### Recorrido: `"hello"`

`h:1 e:1 l:2 o:1` → tres impares. Imposible. Devuelve `false`.

### Alfabeto fijo con máscara de bits

Misma idea, sin `HashMap`, solo para `a`-`z` tras normalizar:

```java
public static boolean isPalindromePermutationBits(String s) {
    if (s == null) {
        return false;
    }
    int bitVector = 0;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (!Character.isLetter(c)) {
            continue;
        }
        int idx = Character.toLowerCase(c) - 'a';
        if (idx < 0 || idx >= 26) {
            continue; // non a-z after lowercasing
        }
        bitVector ^= (1 << idx); // flip: even -> odd, odd -> even
    }
    // zero or one bit set
    return bitVector == 0 || (bitVector & (bitVector - 1)) == 0;
}
```

`x & (x - 1)` apaga el bit activo más bajo. Si el resultado es cero, `x` tenía cero o un bit activo.

---

## Tiempo y espacio

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Conteo con mapa | O(n) | O(k) chars distintos | Respuesta por defecto clara |
| Conteo con `int[26]` | O(n) | O(1) | Cuando el alfabeto son letras latinas fijas |
| Vector de bits | O(n) | O(1) | Mismo alfabeto fijo; ingenioso pero fácil de romper |
| Todas las permutaciones | O(n · n!) | O(n) recursión | Menciona, luego descarta |

Un pase para contar y un pase corto sobre claves (o un contador impar en marcha) basta. Puedes llevar `oddCount` al actualizar el mapa si prefieres un solo bucle estructural.

---

## Casos límite que pinchan los entrevistadores

* **Null:** define el comportamiento (`false` o lanzar). Dilo en voz alta.
* **Vacío / solo espacios:** tras filtrar, cero impares → `true`.
* **Un solo carácter:** un impar → `true`.
* **Todos los conteos pares:** `true` (palíndromo de longitud par).
* **Dos impares:** `false`.
* **Unicode / acentos:** `Character.isLetter` y `toLowerCase` son sutiles con locales. En entrevistas, asume ASCII salvo que pidan Unicode completo.
* **Hay que incluir espacios en el palíndromo:** entonces **no** saltes espacios; un espacio es otro carácter que necesita rol par o un solo impar.
* **Sensible a mayúsculas:** quita `toLowerCase` si el problema lo dice.

Siempre reescribe las reglas antes de programar. La mitad de los bugs en este problema son supuestos desalineados, no la matemática.

---

## Errores comunes

1. **Construir un palíndromo** en lugar de comprobar si es posible. Pérdida de tiempo.
2. **Olvidar** que cero impares es válido (longitud par).
3. **Contar espacios** cuando el ejemplo claramente los ignora (o al revés).
4. **Desajuste de mayúsculas:** contar `T` y `t` por separado cuando el problema los trata como uno.
5. **Trucos de bits sin alfabeto fijo.** Un mapa es más seguro hasta que el alfabeto esté acotado.

---

## Ideas relacionadas

* Comprobar si una **cadena en sí** es palíndromo son dos punteros. Es otro problema (CTCI también tiene palíndromo en lista enlazada más adelante).
* **Anagrama / permutación de otra cadena** (estilo problema 1.2) compara dos mapas de frecuencia completos. Aquí solo te importa la paridad de un mapa.
* **El palíndromo más largo que puedes armar** a partir de un multiconjunto es un primo cercano: usa todos los conteos pares, más como máximo una sobra impar para el medio.

---

## Explícaselo a un amigo

Te dan fichas de letras. ¿Puedes alinearlas para que la palabra se mire a sí misma?

Los asientos a juego necesitan pares. Solo una letra puede tener ficha sobrante para el centro. Cuenta cada letra. Si más de una letra tiene conteo impar, di que no. Si no, di que sí.

En Java: recorre la cadena, cuenta letras (normalmente en minúsculas, espacios saltados), y comprueba que como máximo una frecuencia sea impar. Eso es tiempo O(n) y nunca generas permutaciones.

Siguiente en la serie: [One Away](/blog/en/ctci-1-5-one-away). Mapa de la serie: [CTCI in Java](/blog/en/ctci-series-guide).