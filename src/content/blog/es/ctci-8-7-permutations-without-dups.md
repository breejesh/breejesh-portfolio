---
title: "Permutations without Dups: todos los órdenes de un string único (Java)"
description: "Problema estilo CTCI 8.7 para principiantes: lista cada permutación de un string con caracteres todos distintos. Backtracking con un array used, Java claro y un recorrido corto para abc."
date: "2025-10-18"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-7-permutations-without-dups.webp
previewImage: /assets/images/ctci-8-7-permutations-without-dups.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.7 para principiantes: lista cada permutación de un string con caracteres todos distintos. Backtracking con un array used, Java claro y un recorrido corto para abc.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes una palabra corta. Cada letra es distinta. ¿De cuántas formas puedes reordenar esas letras, y cómo listar cada arreglo sin repetir trabajo? Eso es **Permutations without Dups**: generar todos los órdenes de un string con caracteres distintos.

Este post es enseñanza original para principiantes en **Java**. Misma familia de "genera todas las permutaciones" en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Recursión y programación dinámica, problema **8.7**.

---

## 1. Analogía cotidiana

Imagina tres etiquetas distintas sobre la mesa: `A`, `B`, `C`. Quieres cada posible fila de personas con esas etiquetas.

* En el **primer** asiento puedes elegir cualquiera de las tres.
* En el **segundo** eliges cualquier etiqueta que siga en la mesa.
* El **último** asiento se queda con lo que queda.

Si lo dibujas como un árbol, el primer nivel tiene tres ramas, cada segundo nivel tiene dos, y las hojas son filas completas: `ABC`, `ACB`, `BAC`, `BCA`, `CAB`, `CBA`. Seis hojas, que es `3! = 6`.

El truco de código es el mismo recorrido del árbol: **elegir**, **recursar**, **deshacer** la elección para que la siguiente rama vea la mesa limpia. Ese deshacer es backtracking.

---

## 2. Problema en palabras claras

**Entrada:** un string `s` cuyos caracteres son **todos distintos** (sin letras repetidas).

**Salida:** una lista con cada permutación distinta de `s`. El orden de la lista no importa salvo que el entrevistador pida salida ordenada.

**Ejemplos:**

| Entrada | Salida (cualquier orden) |
| --- | --- |
| `"abc"` | `"abc"`, `"acb"`, `"bac"`, `"bca"`, `"cab"`, `"cba"` |
| `"ab"` | `"ab"`, `"ba"` |
| `"a"` | `"a"` |
| `""` | un string vacío (o una lista vacía; elige uno y cúmplelo) |

**Aclara antes de codificar:**

* ¿Caracteres únicos? (Sí para 8.7. El 8.8 cubre duplicados.)
* ¿Sensible a mayúsculas? (`'A'` y `'a'` son distintos si ambos aparecen.)
* ¿Devolver `List<String>` o imprimir? (Devolver lista es más fácil de probar.)
* ¿String vacío? (Una permutación vacía es un base case limpio.)
* ¿Mutar la entrada? (Mejor un char array o un builder para no tocar el string del llamador.)

---

## 3. Piensa primero

### Cuenta primero

Con `n` caracteres únicos hay `n!` permutaciones. Con `n = 10` ya pasas de tres millones. La entrevista quiere el generador, no materializar `n` enorme gratis.

### Idea bruta (nómbrala y no la codifiques)

Generar cada orden de índices con bucles anidados o con `Collections.shuffle` hasta "tener suficientes." No escala, y shuffle no prueba completitud. Sáltalo cuando ya hayas nombrado el crecimiento factorial.

### Idea recursiva limpia

Construye una respuesta parcial `prefix`. En cada paso:

1. Si la longitud de `prefix` es `n`, guarda una copia de `prefix` y vuelve.
2. Por cada carácter **aún no usado**, añádelo, recursa, luego quítalo (backtrack).

Necesitas saber qué caracteres están libres:

* Un `boolean[] used` de longitud `n` (índice en el string original), o
* Un conjunto de caracteres restantes, o
* **Swaps** in-place en un char array (pon el elegido en el índice actual, recursa en el sufijo, swap de vuelta).

Los tres valen. El array `used` se explica bien en voz alta. Los swaps usan menos estructura extra. Abajo usamos `used` por claridad y luego una variante corta con swap.

### Por qué importa "without dups"

Si el string tuviera dos letras iguales, el mismo árbol produciría strings duplicados. El problema 8.8 lo arregla saltando un carácter cuando coincide con un hermano anterior no usado. Aquí cada carácter es único, así que cada hoja es un string distinto. Sin lógica extra de skip.

### Segunda forma clásica (opcional)

Otra vista de libro: toma las permutaciones del string **sin** el primer carácter e inserta ese carácter en cada índice de cada sub-permutación. Misma cuenta, otra recursión. Backtracking con un prefijo que crece suele ser más rápido de escribir bajo presión.

---

## 4. Solución en Java

### Backtracking con array used

```java
import java.util.ArrayList;
import java.util.List;

public class PermutationsWithoutDups {

    public List<String> permutations(String s) {
        List<String> result = new ArrayList<>();
        if (s == null) {
            return result;
        }
        boolean[] used = new boolean[s.length()];
        backtrack(s, new StringBuilder(), used, result);
        return result;
    }

    private void backtrack(String s, StringBuilder path,
                           boolean[] used, List<String> result) {
        if (path.length() == s.length()) {
            result.add(path.toString());
            return;
        }

        for (int i = 0; i < s.length(); i++) {
            if (used[i]) {
                continue;
            }
            used[i] = true;
            path.append(s.charAt(i));
            backtrack(s, path, used, result);
            path.deleteCharAt(path.length() - 1); // undo
            used[i] = false;                       // undo
        }
    }
}
```

Recorrido para `"abc"`:

1. Path vacío. Prueba índice 0 (`a`): path `"a"`.
2. Desde `"a"`, prueba `b` → `"ab"`, solo queda `c` → `"abc"` (guarda). Undo `c`, undo `b`.
3. Desde `"a"`, prueba `c` → `"ac"`, luego `b` → `"acb"` (guarda). Undo hasta vaciar `a`.
4. Igual empezando por `b`, luego por `c`. Seis strings guardados.

Uso mínimo:

```java
List<String> perms = new PermutationsWithoutDups().permutations("abc");
// size 6; contains "abc", "acb", "bac", "bca", "cab", "cba"
```

### Variante con swaps (misma idea)

```java
public List<String> permutationsSwap(String s) {
    List<String> result = new ArrayList<>();
    if (s == null) {
        return result;
    }
    char[] chars = s.toCharArray();
    swapBacktrack(chars, 0, result);
    return result;
}

private void swapBacktrack(char[] chars, int index, List<String> result) {
    if (index == chars.length) {
        result.add(new String(chars));
        return;
    }
    for (int i = index; i < chars.length; i++) {
        swap(chars, index, i);
        swapBacktrack(chars, index + 1, result);
        swap(chars, index, i); // restore
    }
}

private void swap(char[] chars, int i, int j) {
    char tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
}
```

En la profundidad `index`, el prefijo `chars[0..index)` está fijo. Pruebas cada carácter restante del sufijo intercambiándolo a `index`, recursas y vuelves a intercambiar. El mismo árbol factorial, sin `boolean[]`.

Cualquiera de las dos formas vale en entrevista. Elige una, termínala y menciona la otra si sobra tiempo.

---

## 5. Tabla de complejidad

| Pieza | Notas de coste |
| --- | --- |
| Número de hojas | `n!` para entrada única de longitud `n` |
| Trabajo por hoja | O(n) para copiar el string terminado al resultado |
| Tiempo total | O(n · n!) para construir cada permutación |
| Profundidad de recursión | O(n) |
| Espacio extra (sin salida) | O(n) para path + flags used (o O(1) además del char array con swaps) |
| Espacio de salida | O(n · n!) para guardar cada string |

El tiempo es **sensible a la salida**. Tocás cada permutación que devolvés. No digas O(n) para la lista completa. Con `n` enorme, pueden pedir un iterador en streaming o "solo el conteo," otro producto.

---

## 6. Casos borde y errores comunes

Los entrevistadores tocan esto:

* **Entrada null** → lista vacía (o excepción; dilo).
* **String vacío** → un string vacío en la lista es un base case natural.
* **Un solo carácter** → lista de tamaño 1.
* **Dos caracteres** → dos strings; buen chequeo manual.
* **Longitud 0 vs null** → no los trates igual sin decirlo.

Errores comunes:

1. **Olvidar el undo.** Si dejas `used[i] = true` o un char en el builder, las ramas siguientes pierden caracteres o crecen sin fin.
2. **Mutar un `StringBuilder` compartido al guardar.** Siempre `path.toString()` (un `String` nuevo) antes de `result.add`.
3. **Asumir entrada o salida ordenada.** Ninguna se exige salvo que lo pidan.
4. **Usar este código con letras duplicadas.** Emitirás permutaciones repetidas. Eso es trabajo del 8.8.
5. **Bucles anidados fijos para un n concreto.** Se rompe cuando cambian la longitud.
6. **Contar `n!` en la cabeza y luego decir O(n²).** Cuenta las hojas primero, luego el coste por hoja.

Autochequeo rápido: para `"ab"`, espera exactamente `["ab", "ba"]` (orden libre). Para `"abc"`, tamaño `6` y sin strings repetidos.

---

## 7. Recap para contárselo a un amigo

Permutations without dups, versión entrevista:

1. Los caracteres son únicos, así que cada camino completo del árbol es un string distinto.
2. Hay `n!` de ellos.
3. Construye un path. En cada paso elige un carácter **no usado**, recursa, luego **deshaz**.
4. Cuando la longitud del path llega a `n`, guarda una copia.
5. `used[]` + `StringBuilder`, o swaps in-place en un char array: el mismo árbol.
6. Tiempo O(n · n!), espacio dominado por la lista de salida.

Si puedes dibujar las seis hojas de `"abc"`, escribir el bucle elegir-recursar-deshacer sin olvidar el undo, y nombrar el tamaño factorial, dominas el problema 8.7.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Towers of Hanoi](/blog/es/ctci-8-6-towers-of-hanoi)
* Siguiente: [Permutations with Dups](/blog/es/ctci-8-8-permutations-with-dups)