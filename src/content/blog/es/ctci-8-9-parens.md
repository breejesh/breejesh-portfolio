---
title: "Parens: todas las cadenas válidas de paréntesis con contadores izq/der (Java)"
description: "Problema estilo CTCI 8.9 para principiantes: generar cada cadena válida de n pares de paréntesis. Backtracking con contadores de apertura y cierre restantes, podar prefijos ilegales pronto y contar resultados Catalán."
date: "2026-02-09"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-9-parens.webp
previewImage: /assets/images/ctci-8-9-parens.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.9 para principiantes: generar cada cadena válida de n pares de paréntesis. Backtracking con contadores de apertura y cierre restantes, podar prefijos ilegales pronto y contar resultados Catalán.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Necesitas cada cadena hecha de **n** paréntesis de apertura y **n** de cierre que sea **válida**: nunca más cierres que aperturas en ningún prefijo, y conteos iguales al final. Para `n = 3` son cinco cadenas, no las 20 formas de colocar tres `(` y tres `)`. La mayoría de colocaciones al azar se rompen a mitad de camino.

Este post es enseñanza original para principiantes en **Java**. Misma familia de problemas que las clásicas preguntas de generar paréntesis en entrevista, no una copia del libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 8, recursión y DP, problema **8.9**.

---

## 1. Analogía cotidiana

Piensa en un guardarropa con **n** tickets y **n** abrigos.

* Entregar un ticket es `(`.
* Devolver un abrigo es `)`.
* Nunca puedes devolver un abrigo si nadie espera (eso sería un `)` sin un `(` sin emparejar).
* Al final se usan todos los tickets y se devuelven todos los abrigos.

Las secuencias válidas son exactamente las formas en que la fila puede funcionar sin un conteo negativo de "gente esperando". Las inválidas intentan devolver un abrigo primero, o terminan con tickets aún fuera.

No listas cada mezcla de n aperturas y n cierres y luego filtras. Solo alargas prefijos que todavía pueden terminar válidos. Esa es la idea del backtracking: dos contadores, dos opciones, podar pronto.

---

## 2. Enunciado en claro

**Entrada:** un entero no negativo `n`, el número de pares.

**Salida:** todas las cadenas de longitud `2n` que usan exactamente `n` caracteres `(` y `n` caracteres `)` y están bien emparejadas.

**Ejemplos:**

| n | Cadenas válidas |
| --- | --- |
| 0 | `[""]` (una cadena vacía; elige una convención) |
| 1 | `["()"]` |
| 2 | `["(())", "()()"]` |
| 3 | `["((()))", "(()())", "(())()", "()(())", "()()()"]` |

**Aclara antes de codificar:**

* `n = 0`: lista vacía o una cadena vacía? Aquí: un resultado vacío (caso base de la recursión).
* Orden de resultados? No obligatorio. Cualquier orden vale salvo que pidan lexicográfico.
* Solo `(` y `)`? Sí en el problema clásico. Otros tipos de corchetes son otra pregunta.
* Devuelve `List<String>` en Java. No solo imprimas; recoge para que los tests sean fáciles.

**No** te piden validar una sola cadena (eso es el problema con pila). **Generas** cada una válida.

---

## 3. Piensa primero

### Dos reglas que definen lo válido

Una cadena de paréntesis es válida si y solo si:

1. En todo prefijo, `#(` ≥ `#)`.
2. En la cadena completa, `#(` = `#) = n`.

La regla 1 corta `)(` y `())(`. La regla 2 corta aperturas sobrantes.

### Por qué el fuerza bruta de todas las secuencias es débil

Hay `C(2n, n)` cadenas con exactamente n aperturas y n cierres. Muchas fallan la regla 1. Para `n = 3`, `C(6, 3) = 20` candidatas y solo **5** válidas. Con n mayor el hueco crece. En entrevista quieren podar mientras construyes, no generar y filtrar después.

### Contadores de apertura y cierre restantes

Mantén:

* `left`: cuántos `(` aún puedes colocar (empieza en `n`).
* `right`: cuántos `)` aún puedes colocar (empieza en `n`).

En cada paso:

1. Si `left > 0`, puedes colocar `(`, luego recursión con `left - 1`.
2. Si `right > left`, puedes colocar `)` (te quedan más cierres presupuestados que aperturas restantes, o sea hay más aperturas ya en el camino que cierres). Luego recursión con `right - 1`.
3. Si `left == 0` y `right == 0`, el camino es una cadena válida completa. Guárdala.

Por qué `right > left` para un cierre? Tras colocar algunos caracteres, aperturas colocadas = `n - left`, cierres colocados = `n - right`. Necesitas cierres < aperturas antes de otro cierre, es decir `n - right < n - left`, que se simplifica a `right > left`. Misma invariante, otros contadores.

### Misma idea con contadores usados

Algunos rastrean `openUsed` y `closeUsed` desde cero:

* Coloca `(` si `openUsed < n`.
* Coloca `)` si `closeUsed < openUsed`.

Mismo árbol. Elige una historia y no la mezcles. Abajo usamos contadores **restantes**.

### Árbol para n = 2

```
path="", left=2, right=2
  '(' → "(", 1, 2
    '(' → "((", 0, 2
      ')' → "(()", 0, 1
        ')' → "(())"  done
    ')' → "()", 1, 1
      '(' → "()(", 0, 1
        ')' → "()()"  done
      ')'  forbidden (right == left; close would break balance)
  ')'  forbidden at root (need right > left; here they are equal)
```

Dos hojas: `(())` y `()()`. Ningún camino termina en una cadena inválida completa.

### Conteo: números de Catalán

El número de cadenas válidas para n pares es el **n-ésimo número de Catalán**:

```
C_n = (1 / (n + 1)) * (2n choose n)
```

| n | C_n |
| --- | --- |
| 0 | 1 |
| 1 | 1 |
| 2 | 2 |
| 3 | 5 |
| 4 | 14 |
| 5 | 42 |

Dilo en la entrevista. El tamaño de salida es Catalán, no `2^(2n)` ni `C(2n, n)`.

### Elección del builder

`StringBuilder` para el camino actual: append, recursión, borrar el último carácter. Toda respuesta completa tiene longitud `2n`.

---

## 4. Solución en Java

```java
import java.util.ArrayList;
import java.util.List;

/**
 * Generate all valid strings of n pairs of parentheses.
 * Backtracking with remaining open and close counts.
 */
public class Parens {

    public List<String> generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        if (n < 0) {
            return result;
        }
        backtrack(n, n, new StringBuilder(), result);
        return result;
    }

    /**
     * @param left  remaining '(' you may still place
     * @param right remaining ')' you may still place
     */
    private void backtrack(int left, int right, StringBuilder path, List<String> result) {
        if (left == 0 && right == 0) {
            result.add(path.toString());
            return;
        }

        if (left > 0) {
            path.append('(');
            backtrack(left - 1, right, path, result);
            path.deleteCharAt(path.length() - 1);
        }

        // Only close when more opens are already on the path than closes.
        // Equivalent: remaining closes strictly exceed remaining opens.
        if (right > left) {
            path.append(')');
            backtrack(left, right - 1, path, result);
            path.deleteCharAt(path.length() - 1);
        }
    }
}
```

### Recorrido: n = 3

Empieza `left = 3`, `right = 3`, path vacío.

1. Primero hay que abrir: `"("`, left 2, right 3.
2. Desde ahí puedes abrir o cerrar (right > left). Las ramas crecen con cada mezcla legal.
3. Hojas (en un orden depth-first):

```
((()))
(()())
(())()
()(())
()()()
```

Cinco cadenas. Coincide con `C_3 = 5`.

### Opcional: forma con contadores usados

Mismo flujo, otros parámetros:

```java
private void backtrack(int n, int openUsed, int closeUsed, StringBuilder path, List<String> result) {
    if (path.length() == 2 * n) {
        result.add(path.toString());
        return;
    }
    if (openUsed < n) {
        path.append('(');
        backtrack(n, openUsed + 1, closeUsed, path, result);
        path.deleteCharAt(path.length() - 1);
    }
    if (closeUsed < openUsed) {
        path.append(')');
        backtrack(n, openUsed, closeUsed + 1, path, result);
        path.deleteCharAt(path.length() - 1);
    }
}
```

Llama con `backtrack(n, 0, 0, new StringBuilder(), result)`. Prefiere una sola forma en la entrevista para no mezclar la desigualdad.

### Tests de humo

```java
Parens p = new Parens();

assert p.generateParenthesis(0).equals(List.of(""));
assert p.generateParenthesis(1).equals(List.of("()"));

List<String> two = p.generateParenthesis(2);
assert two.size() == 2;
assert two.contains("(())") && two.contains("()()");

List<String> three = p.generateParenthesis(3);
assert three.size() == 5;
assert three.contains("((()))");
assert three.contains("(()())");
assert three.contains("(())()");
assert three.contains("()(())");
assert three.contains("()()()");

assert p.generateParenthesis(4).size() == 14;
```

---

## 5. Tabla de complejidad

Sea `C_n` el n-ésimo número de Catalán (número de resultados).

| Pieza | Coste | Notas |
| --- | --- | --- |
| Conteo de resultados | `C_n` | ~ `4^n / (n^(3/2) √π)` asintóticamente |
| Longitud de cada resultado | `2n` | fija |
| Trabajo para construir todos | estilo O(C_n · n) | cada cadena válida es un camino de longitud 2n; los nodos internos comparten prefijos |
| Profundidad de recursión | O(n) | como mucho 2n frames, path ≤ 2n |
| Espacio extra | O(n) pila + path | más allá de la lista de salida |
| Espacio de salida | O(C_n · n) | hay que guardar cada cadena |

No puedes listar todas las respuestas más rápido que proporcional al tamaño de salida. La ganancia es que nunca visitas un prefijo que ya rompió el balance. Generar todas las `C(2n, n)` y filtrar también paga las cadenas inválidas completas.

---

## 6. Casos borde y errores comunes

Los entrevistadores empujan aquí:

* **n = 0** → una cadena vacía (si ese es tu caso base).
* **n = 1** → solo `"()"`.
* **n negativo** → lista vacía; no recurses para siempre.
* **n grande** → `C_10 = 16796`, `C_15` ya es grande. Menciona el crecimiento Catalán si preguntan por escala.
* **Solo recolectar longitud 2n** → si olvidas el caso base y que ambos contadores lleguen a cero, pierdes resultados o te cuelgas.

Errores comunes:

1. **Permitir `)` siempre que `right > 0`.** Eso admite prefijos `)(`. Necesitas `right > left` (restantes) o `closeUsed < openUsed` (usados).
2. **Olvidar deshacer** el append (`deleteCharAt`). Las ramas hermanas comparten un builder sucio.
3. **Generar todos los patrones `C(2n, n)`**, luego validar con pila. Correcto pero historia más lenta; lidera con podar al construir.
4. **Usar un Set para deduplicar.** La generación válida no debería crear duplicados si cada paso coloca un tipo de carácter fijo bajo contadores claros.
5. **Off-by-one en n pares vs n caracteres.** La longitud total es **2n**, no n.
6. **Solo imprimir**, sin valor de retorno. Prefiere una lista para complejidad y tests claros.

Problemas relacionados que se confunden:

* **Validar una cadena:** pila o contador, O(n). No es este problema.
* **Subcadena válida más larga:** DP o pila. Distinto.
* **Generar con varios tipos de corchetes** bajo reglas de anidación: backtracking similar, más símbolos.

---

## 7. Recap para contárselo a un amigo

Generar paréntesis, versión de entrevista:

1. Necesitas cada cadena con n `(` y n `)` que nunca baje el balance a negativo y termine en cero.
2. Construye de izquierda a derecha. Rastrea cuántas aperturas y cierres aún puedes colocar (o cuántas ya usaste).
3. Coloca `(` mientras queden aperturas.
4. Coloca `)` solo cuando un cierre no superaría las aperturas ya escritas.
5. Cuando ambos contadores restantes son cero, guarda la cadena.
6. El número de respuestas es el n-ésimo Catalán: 1, 1, 2, 5, 14, ...
7. Mismo esqueleto de backtracking que las permutaciones: elegir, recursar, deshacer. El filtro de legalidad es la regla de balance.

Si puedes dibujar el árbol de n = 2 con dos hojas y explicar por qué un `)` inicial está prohibido, dominas el 8.9. Siguiente: paint fill inunda una región con otro recorrido recursivo.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Permutations with Dups](/blog/es/ctci-8-8-permutations-with-dups)
* Siguiente: [Paint Fill](/blog/es/ctci-8-10-paint-fill)