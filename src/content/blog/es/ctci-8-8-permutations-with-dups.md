---
title: "Permutaciones con duplicados: cadenas únicas con mapa de frecuencias (Java)"
description: "Problema estilo CTCI 8.8 para principiantes: lista cada permutación única de un string que puede tener caracteres repetidos. Mapa de frecuencias, backtracking por conteos restantes, sin el estallido n! de swaps ingenuos."
date: "2026-01-05"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-8-permutations-with-dups.webp
previewImage: /assets/images/ctci-8-8-permutations-with-dups.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.8 para principiantes: lista cada permutación única de un string que puede tener caracteres repetidos. Mapa de frecuencias, backtracking por conteos restantes, sin el estallido n! de swaps ingenuos.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Ya sabes listar todos los órdenes de caracteres distintos: eliges la siguiente letra, recursas, la devuelves. Eso es el problema **8.7**. En cuanto el string tiene repeticiones (`"aab"`, `"mississippi"`), el árbol ingenuo imprime la misma cadena muchas veces. El problema **8.8** pide solo las permutaciones **únicas**, sin generar una lista enorme y filtrar después.

Este post es enseñanza original para principiantes en **Java**. Misma familia que las entrevistas de permutaciones de multiconjuntos, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 8, recursión y DP, problema **8.8**.

---

## 1. Analogía cotidiana

Tienes fichas de Scrabble boca arriba: dos `A` y una `B`. ¿Cuántas **palabras distintas** puedes formar reordenando todas las fichas?

Si las dos `A` tuvieran colores distintos, podrías intercambiarlas y fingir que las palabras son distintas. No lo son. El lector solo ve letras. Así que:

* Letras todas distintas: el conteo es `n!`.
* Con duplicados: el conteo es `n! / (f1! · f2! · …)` donde `fi` es cuántas veces aparece la letra `i`.

Para `"aab"` eso es `3! / 2! = 3` cadenas: `aab`, `aba`, `baa`. No seis.

El algoritmo debe crecer solo esas tres ramas. No debe crecer seis y tirar tres.

---

## 2. Enunciado en palabras simples

**Entrada:** un string `s` de longitud `n`. Los caracteres pueden repetirse. Mayúsculas y alfabeto según el entrevistador; trata el string como un multiconjunto de chars.

**Salida:** todas las cadenas **distintas** que usan cada carácter de `s` exactamente una vez (permutaciones de longitud completa del multiconjunto). El orden de la lista no importa salvo que pidan salida ordenada.

**Ejemplos:**

| Entrada | Permutaciones únicas |
| --- | --- |
| `""` | un string vacío (o lista vacía: elige convención y manténla) |
| `"a"` | `["a"]` |
| `"ab"` | `["ab", "ba"]` |
| `"aab"` | `["aab", "aba", "baa"]` |
| `"aaa"` | `["aaa"]` |

**Aclara antes de codificar:**

* Entrada vacía: ¿`[""]` o `[]`? Aquí: un resultado vacío, mismo estilo de caso base que 8.7.
* ¿Sensible a mayúsculas? Sí, salvo que digan lo contrario (`A` ≠ `a`).
* ¿Salida ordenada? No hace falta. Ordenar al final si lo piden.
* ¿Mutar la entrada del caller? No. Trabaja con un mapa y un builder.

**No** te piden permutaciones de un subconjunto (eso se acerca a power set). Solo longitud completa.

---

## 3. Piensa primero

### Por qué "generar todo y meterlo en un Set" es flojo

Puedes correr la recursión con swaps de 8.7 y meter cada string en un `HashSet`. Correcto en `n` pequeño. El coste sigue siendo proporcional a **todos** los órdenes del multiconjunto en el árbol de búsqueda, que con muchos duplicados es mucho mayor que el conteo único. Quieren que **no crees duplicados**, no que los escondas en un set.

### Idea del mapa de frecuencias

Cuenta cuántas veces queda disponible cada carácter:

```
"aab" → { a: 2, b: 1 }
```

En cada paso del string parcial:

1. Para cada carácter `c` con conteo `> 0`, elige `c` a continuación.
2. Decrementa `count[c]`, añade `c`, recursa.
3. Tras la llamada, restaura: quita `c`, incrementa `count[c]`.

Como las dos fichas `a` comparten una clave en el mapa, solo hay **una** rama que empieza con `a`, no dos. Ese es el truco.

### Forma de la recursión

```
prefix = ""
counts = {a:2, b:1}

  pick a → prefix "a", counts {a:1, b:1}
    pick a → "aa", {a:0, b:1}
      pick b → "aab"  (hecho)
    pick b → "ab", {a:1, b:0}
      pick a → "aba"  (hecho)
  pick b → prefix "b", counts {a:2, b:0}
    pick a → "ba", {a:1, b:0}
      pick a → "baa"  (hecho)
```

Tres hojas. Sin hojas duplicadas.

### Comparar con 8.7

| | 8.7 sin dups | 8.8 con dups |
| --- | --- | --- |
| Origen de elecciones | índices / letras no usados | caracteres con conteo restante > 0 |
| Factor de ramificación | posiciones no usadas distintas | claves de carácter aún disponibles |
| Tamaño del resultado | `n!` | `n! / ∏ fi!` |
| Estructura extra | array used, o swap | `Map` o array de conteos |

Si todos los caracteres son únicos, el enfoque por frecuencias sigue funcionando y produce `n!` resultados. Es una generalización estricta de 8.7.

### Estructura para conteos

* **Array de tamaño 26** si el problema es solo minúsculas inglesas. Rápido y simple.
* **`HashMap<Character, Integer>`** para Unicode / mayúsculas mixtas. Un poco más de código, más claro cuando el alfabeto es desconocido.

Usa un mapa en la solución principal para no asumir en silencio `a-z`.

### Elección del builder

`StringBuilder` para el prefijo actual. Append antes de recursar, `setLength` o `deleteCharAt` al volver. Evita concat de `String` en el camino caliente si te importa basura intermedia; en pizarra con `n` pequeño da igual.

---

## 4. Solución en Java

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PermutationsWithDups {

    public List<String> permutations(String s) {
        List<String> result = new ArrayList<>();
        if (s == null) {
            return result;
        }

        Map<Character, Integer> counts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            counts.put(c, counts.getOrDefault(c, 0) + 1);
        }

        backtrack(counts, new StringBuilder(), s.length(), result);
        return result;
    }

    private void backtrack(
            Map<Character, Integer> counts,
            StringBuilder path,
            int targetLen,
            List<String> result) {

        if (path.length() == targetLen) {
            result.add(path.toString());
            return;
        }

        // Itera una copia de las claves para no depender de rarezas al mutar el mapa.
        for (Character c : new ArrayList<>(counts.keySet())) {
            int remaining = counts.get(c);
            if (remaining <= 0) {
                continue;
            }

            counts.put(c, remaining - 1);
            path.append(c);

            backtrack(counts, path, targetLen, result);

            path.deleteCharAt(path.length() - 1);
            counts.put(c, remaining);
        }
    }
}
```

### Recorrido: `"aab"`

1. Construye conteos `{a=2, b=1}`. `targetLen = 3`.
2. Primera elección superior `a`: path `"a"`, conteos `{a=1, b=1}`.
3. Siguiente `a`: path `"aa"`, conteos `{a=0, b=1}`. Solo queda `b` → `"aab"`. Registra. Deshace.
4. Aún bajo path `"a"`, siguiente elección `b`: path `"ab"`, luego solo `a` → `"aba"`. Registra. Deshace.
5. De vuelta al path vacío, elección `b`: path `"b"`, luego dos `a` forzados en orden → solo `"baa"`. Registra.
6. Listo. Tres cadenas.

### Por qué iterar claves en cada nivel

Solo colocas un carácter si su conteo es positivo. Las claves con cero restante se saltan. Algunos quitan claves a cero del mapa y las reinsertan al deshacer; funciona, pero es más fácil fallar bajo presión. Dejar la clave y comprobar `remaining <= 0` es aburrido y seguro.

### Opcional: array de alfabeto fijo

Si el entrevistador te limita a minúsculas `a-z`:

```java
int[] counts = new int[26];
for (int i = 0; i < s.length(); i++) {
    counts[s.charAt(i) - 'a']++;
}

// en backtrack:
for (int i = 0; i < 26; i++) {
    if (counts[i] == 0) {
        continue;
    }
    counts[i]--;
    path.append((char) ('a' + i));
    backtrack(counts, path, targetLen, result);
    path.deleteCharAt(path.length() - 1);
    counts[i]++;
}
```

Mismo flujo de control. Constantes más rápidas, contrato de entrada más estrecho.

### Pruebas de humo

```java
PermutationsWithDups p = new PermutationsWithDups();

assert p.permutations("").equals(List.of(""));
assert p.permutations("a").equals(List.of("a"));

List<String> ab = p.permutations("ab");
assert ab.size() == 2 && ab.contains("ab") && ab.contains("ba");

List<String> aab = p.permutations("aab");
assert aab.size() == 3;
assert aab.contains("aab") && aab.contains("aba") && aab.contains("baa");

assert p.permutations("aaa").equals(List.of("aaa"));
```

---

## 5. Tabla de complejidad

Sea `n` la longitud del string. Sea `k` el número de caracteres distintos. Sea `U` el número de permutaciones únicas, `U = n! / ∏ fi!`.

| Pieza | Coste | Notas |
| --- | --- | --- |
| Construir conteos | O(n) tiempo, O(k) espacio | Un pase |
| Tamaño del árbol de búsqueda | ~Θ(U · n) nodos | Cada resultado único es un camino de longitud n; nodos internos comparten prefijos |
| Trabajo por nodo | O(k) al escanear claves (mapa) o O(1) amortizado sobre 26 con array | Domina la constante |
| Tamaño de salida | O(U · n) | Hay que escribir cada string |
| Pila extra | O(n) profundidad de recursión | Longitud del path |
| Tiempo total | estilo O(U · n · k) | Mejor que O(n! · n) con muchos duplicados |
| Espacio total | O(n + k + U · n) | Pila + mapa + salida |

Dilo en voz alta: sigues pagando por cada string único que devuelves. **No** pagas los órdenes duplicados cancelados que visitaría un enfoque swap+Set.

Peor caso: todos los caracteres distintos, `U = n!`, mismo orden que 8.7. Mejor caso: todos iguales, `U = 1`, y el árbol es un solo camino.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **Todos idénticos** (`"aaaa"`) → exactamente un resultado. El mapa tiene una clave; en cada paso solo una elección.
* **Todos distintos** (`"abcd"`) → `24` resultados. El código de frecuencias debe seguir funcionando.
* **String vacío** → una permutación vacía (si ese es tu caso base).
* **Null** → lista vacía; no hagas NPE en `s.length()`.
* **Un solo carácter** → lista con ese string de un char.
* **Muchos de una letra, pocos de otra** (`"aaab"`) → `4` resultados únicos (`aaab`, `aaba`, `abaa`, `baaa`). Fórmula: `4! / 3! = 4`.

Errores comunes:

1. **Generar todas las permutaciones por swap y meterlas en un Set.** Funciona en demos, desperdicia ramas. Di la fórmula de conteo y poda en el origen.
2. **Saltar solo "igual al anterior" tras ordenar, pero olvidar ordenar o saltar bien.** El patrón sort-and-skip puede servir también para permutaciones si marcas índices usados con cuidado. El mapa de frecuencias es más claro para multiconjuntos.
3. **Olvidar restaurar conteos** al volver. La rama hermana ve stock incorrecto.
4. **Mutar el key set del mapa al iterar** sin copia. Copia claves o usa un array.
5. **Devolver strings de longitud parcial.** Para solo cuando `path.length() == n`.
6. **Tratar `"Ab"` con case-fold sin que lo pidan.** Quédate en chars exactos salvo que redefinan igualdad.

---

## 7. Resumen para un amigo

Permutaciones con dups, versión entrevista:

1. Cuenta cuántos de cada carácter te quedan.
2. Construye la respuesta un carácter a la vez.
3. En cada paso, prueba todo carácter con conteo restante positivo. Nunca pruebes "qué copia física de `a`" por separado.
4. Decrementa, recursa, restaura.
5. Cuando la longitud del path llega a `n`, registra el string.
6. El tamaño del resultado es `n! / ∏ fi!`, no `n!`.
7. Mismo esqueleto que 8.7; el mapa sustituye el set de índices usados y los duplicados se colapsan solos.

Si puedes dibujar el árbol de tres hojas para `"aab"` y explicar por qué dos fichas `a` idénticas comparten una rama, dominas el problema 8.8. Después, generar paréntesis balanceados usa un backtrack parecido de "elige el siguiente símbolo legal".

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Permutaciones sin duplicados](/blog/es/ctci-8-7-permutations-without-dups)
* Siguiente: [Parens](/blog/es/ctci-8-9-parens)