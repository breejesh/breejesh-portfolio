---
title: "Power Set: todos los subconjuntos con recursión y máscaras de bits (Java)"
description: "Problema estilo CTCI 8.4 para principiantes: devolver cada subconjunto de un conjunto, incluido el vacío y el completo. Construcción recursiva, enumeración opcional con máscaras de bits y código Java."
date: "2025-12-13"
tags: [Algoritmos]
coverImage: /assets/images/ctci-8-4-power-set.webp
previewImage: /assets/images/ctci-8-4-power-set.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.4 para principiantes: devolver cada subconjunto de un conjunto, incluido el vacío y el completo. Construcción recursiva, enumeración opcional con máscaras de bits y código Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes una bolsa de pegatinas distintas: `{A, B, C}`. ¿Cuántas bolsas diferentes puedes formar si cada pegatina entra o no? Cuenta la bolsa vacía. Cuenta la bolsa llena. Cuentan los pares. Esa lista de bolsas es el **power set** (conjunto potencia): todos los subconjuntos del conjunto original.

Este post es enseñanza original para principiantes en **Java**. Misma familia de calentamientos de recursión en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 8, recursión y programación dinámica, problema 8.4.

---

## 1. Analogía cotidiana

Imagina un local de sándwiches con tres toppings: lechuga, tomate, queso. Cada topping es un sí o un no. Pedidos en el mostrador:

* sin toppings
* solo lechuga
* solo tomate
* solo queso
* lechuga + tomate
* lechuga + queso
* tomate + queso
* los tres

Eso son `2 × 2 × 2 = 8` pedidos. Misma cuenta que el power set de un conjunto de 3 elementos: **2^n** subconjuntos para **n** elementos.

Puedes crecer el menú de forma recursiva. Con cero toppings solo tienes el pedido vacío. Añades queso: cada pedido viejo se queda, y también una copia de cada uno con queso. Añades tomate igual. Añades lechuga igual. Esa es la construcción recursiva. Las máscaras de bits hacen el mismo trabajo con un bucle de `0` a `2^n - 1`, donde cada bit dice "incluye este topping".

---

## 2. Enunciado en claro

**Entrada:** un conjunto de elementos distintos. En código suele ser un `List` o un array de valores únicos (por ejemplo caracteres o enteros).

**Salida:** una colección de todos los subconjuntos. El orden de los subconjuntos casi nunca importa. El orden dentro de un subconjunto puede seguir el de la entrada para demos estables.

**Debe incluir:**

* el subconjunto vacío `{}`
* el conjunto completo
* cada subconjunto propio intermedio

**Ejemplo:**

```
Input:  {1, 2, 3}

Power set (8 subsets):
  {}
  {1}
  {2}
  {3}
  {1, 2}
  {1, 3}
  {2, 3}
  {1, 2, 3}
```

**Aclara en la entrevista:**

* ¿Elementos únicos? (Sí para el power set clásico. Duplicados son otro problema.)
* Tipo de retorno: `List<List<T>>` es habitual en Java.
* ¿Mutar listas del llamador? Mejor copias defensivas de cada subconjunto al guardarlo.
* ¿n pequeño? El tamaño de salida es **2^n**. Con n = 20 ya hay cerca de un millón de subconjuntos. Dilo en voz alta.

---

## 3. Piensa primero

### Cuenta primero

| n | Número de subconjuntos |
| --- | --- |
| 0 | 1 (solo `{}`) |
| 1 | 2 |
| 2 | 4 |
| 3 | 8 |
| n | 2^n |

No puedes bajar de O(2^n · poly(n)) si debes listar cada subconjunto. El espacio de la respuesta es del mismo orden.

### Idea recursiva (construir desde n-1)

Sea `P(S)` el power set de `S`.

1. Si `S` está vacío, `P(S) = { {} }`.
2. Si no, elige un elemento `e` y deja `rest = S sin e`.
3. Calcula `P(rest)`.
4. Para cada subconjunto `sub` en `P(rest)`, guarda `sub` tal cual y también `sub ∪ {e}`.

Cada subconjunto contiene `e` o no. Esas dos familias cubren el power set sin solaparse.

```
P({1,2}) with e=2, rest={1}:
  P(rest) = { {}, {1} }
  without 2:  {}, {1}
  with 2:     {2}, {1,2}
  result:     {}, {1}, {2}, {1,2}
```

### Recursión por índice (include / exclude)

Misma matemática, otra forma de código: recorre índices `0 .. n-1` con un camino actual.

* En el índice `i`, rama **exclude** del elemento `i`, luego rama **include** (push, recurse, pop).
* Cuando `i == n`, copia el camino actual a la respuesta.

Es backtracking clásico. A muchos entrevistadores les gusta porque el árbol de llamadas se dibuja fácil.

### Idea de máscara de bits

Hay exactamente `2^n` enteros de `0` a `2^n - 1`. Para la máscara `m`, el bit `j` decide si el elemento `j` está en el subconjunto:

```
n = 3, elements [a, b, c]
mask 0 = 000 -> {}
mask 1 = 001 -> {a}
mask 2 = 010 -> {b}
mask 3 = 011 -> {a,b}
mask 4 = 100 -> {c}
...
mask 7 = 111 -> {a,b,c}
```

Sin pila de recursión. Buen segundo enfoque tras el recursivo.

### Qué no hacer

* Bucles anidados solo para n fijo (profundidad hardcodeada).
* Meter una sola lista compartida en la respuesta sin copiar (todos los subconjuntos guardados acaban iguales).
* Olvidar el conjunto vacío (o el completo).
* Usar un set-of-sets sin historia clara de tipos/hash cuando un list-of-lists basta en la entrevista.

---

## 4. Solución en Java

### 4.1 Construcción recursiva desde power sets más pequeños

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Power set by growing from P(rest).
 * Each new element doubles the number of subsets.
 */
public class PowerSetRecursive {

    public static List<List<Integer>> powerSet(List<Integer> set) {
        List<List<Integer>> result = new ArrayList<>();
        if (set == null) {
            return result;
        }
        // start with the empty subset
        result.add(new ArrayList<>());

        for (int element : set) {
            // snapshot size: only clone subsets built so far
            int sizeBefore = result.size();
            for (int i = 0; i < sizeBefore; i++) {
                List<Integer> withElement = new ArrayList<>(result.get(i));
                withElement.add(element);
                result.add(withElement);
            }
        }
        return result;
    }

    public static void main(String[] args) {
        List<Integer> set = Arrays.asList(1, 2, 3);
        List<List<Integer>> all = powerSet(set);
        System.out.println(all.size()); // 8
        for (List<Integer> subset : all) {
            System.out.println(subset);
        }
    }
}
```

Recorrido para `{1, 2, 3}`:

| Paso | Elemento añadido | Subconjuntos tras el paso |
| --- | --- | --- |
| inicio | - | `{}` |
| 1 | 1 | `{}`, `{1}` |
| 2 | 2 | `{}`, `{1}`, `{2}`, `{1,2}` |
| 3 | 3 | ocho subconjuntos: los cuatro previos más cada uno con 3 |

### 4.2 Backtracking include / exclude

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class PowerSetBacktrack {

    public static List<List<Integer>> powerSet(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        if (nums == null) {
            return result;
        }
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }

    private static void backtrack(
            int[] nums,
            int index,
            List<Integer> path,
            List<List<Integer>> result) {
        if (index == nums.length) {
            // must copy: path is reused on the way back
            result.add(new ArrayList<>(path));
            return;
        }

        // exclude nums[index]
        backtrack(nums, index + 1, path, result);

        // include nums[index]
        path.add(nums[index]);
        backtrack(nums, index + 1, path, result);
        path.remove(path.size() - 1); // pop
    }

    public static void main(String[] args) {
        List<List<Integer>> all = powerSet(new int[] {1, 2, 3});
        System.out.println(all.size()); // 8
        for (List<Integer> subset : all) {
            System.out.println(subset);
        }
    }
}
```

Árbol de llamadas para dos elementos `[a, b]`:

```
                    []
           /                  \
     exclude a              include a
          []                    [a]
       /      \              /       \
 exclude b  include b  exclude b  include b
    []        [b]         [a]       [a,b]
```

Cuatro hojas, cuatro subconjuntos. El mismo patrón escala a n.

### 4.3 Enumeración opcional con máscara de bits

```java
import java.util.ArrayList;
import java.util.List;

public class PowerSetBitMask {

    public static List<List<Integer>> powerSet(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        if (nums == null) {
            return result;
        }
        int n = nums.length;
        // 1 << n is 2^n. For n >= 31 use care with int overflow.
        int total = 1 << n;

        for (int mask = 0; mask < total; mask++) {
            List<Integer> subset = new ArrayList<>();
            for (int j = 0; j < n; j++) {
                if ((mask & (1 << j)) != 0) {
                    subset.add(nums[j]);
                }
            }
            result.add(subset);
        }
        return result;
    }

    public static void main(String[] args) {
        List<List<Integer>> all = powerSet(new int[] {1, 2, 3});
        System.out.println(all.size()); // 8
        for (List<Integer> subset : all) {
            System.out.println(subset);
        }
    }
}
```

Demo de máscaras para `[1, 2, 3]`:

| mask | binary | subset |
| --- | --- | --- |
| 0 | 000 | `{}` |
| 1 | 001 | `{1}` |
| 2 | 010 | `{2}` |
| 3 | 011 | `{1, 2}` |
| 4 | 100 | `{3}` |
| 5 | 101 | `{1, 3}` |
| 6 | 110 | `{2, 3}` |
| 7 | 111 | `{1, 2, 3}` |

¿Con cuál empezar en entrevista? Empieza con **include/exclude** o **crecer desde P(rest)**. Menciona las máscaras de bits como alternativa iterativa limpia. Las tres producen los mismos 2^n subconjuntos.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra (además de la salida) | Notas |
| --- | --- | --- | --- |
| Crecer desde P(rest) | O(n · 2^n) | O(1) más allá del crecimiento del resultado | cada uno de 2^n subconjuntos copia hasta n elementos a lo largo del tiempo |
| Backtracking | O(n · 2^n) | O(n) recursión + path | 2^n hojas; copiar el path cuesta O(n) |
| Máscara de bits | O(n · 2^n) | O(1) más allá del resultado | bucles simples; cuidado con `1 << n` si n es grande |
| Tamaño de salida | - | O(n · 2^n) | no se reduce si listas todo |

Los entrevistadores quieren oír **2^n subconjuntos** antes de codificar. Si preguntan "¿se puede mejor?", no para la enumeración completa; solo generación perezosa o parada temprana con más restricciones.

---

## 6. Casos límite y errores frecuentes

Los entrevistadores tocan esto:

* **Entrada vacía:** devolver una lista con un subconjunto vacío, no una lista vacía de subconjuntos.
* **Entrada null:** resultado vacío o tratar como conjunto vacío. Elige uno y dilo.
* **Un solo elemento:** solo `{}` y `{x}`.
* **n grande:** 2^20 es ~1e6; 2^30 no cabe a la ligera. Habla de memoria y overflow de `1 << n` en máscaras cuando n ≥ 31 (`1L << n` o tope de n).
* **Duplicados en la entrada:** el power set clásico asume únicos. Duplicados piden ordenar + saltar (subset II), otro problema.
* **Path mutable compartido:** olvidar `new ArrayList<>(path)` hace que todos los subconjuntos guardados sean idénticos.
* **Mutar `size` al iterar la lista que crece** sin snapshot: bucle infinito o duplicado mal. Haz snapshot de `sizeBefore` primero.
* **Requisitos de orden:** si piden subconjuntos ordenados o lexicográficos, ordena cada uno o genera en orden de índices fijo y ordena la lista exterior al final.

Errores frecuentes:

1. **Falta el subconjunto vacío.** Caso base mal.
2. **Sin copia al guardar.** Todas las respuestas alias de una lista.
3. **Bucles anidados hardcodeados** solo para n = 3.
4. **`1 << n` con n = 31** desborda int (bit de signo). Habla de límites.
5. **Tratar el power set como permutaciones.** El orden dentro de un subconjunto no crea subconjuntos nuevos; `{1,2}` y `{2,1}` son el mismo conjunto.

Idea mínima de smoke:

```java
List<List<Integer>> p0 = PowerSetRecursive.powerSet(List.of());
assert p0.size() == 1 && p0.get(0).isEmpty();

List<List<Integer>> p1 = PowerSetRecursive.powerSet(List.of(7));
assert p1.size() == 2;

List<List<Integer>> p3 = PowerSetBitMask.powerSet(new int[] {1, 2, 3});
assert p3.size() == 8;
```

---

## 7. Recap para contárselo a un amigo

Power set en lenguaje de entrevista:

1. Un conjunto de n elementos distintos tiene **2^n** subconjuntos: cada elemento entra o no.
2. Siempre incluye `{}` y el conjunto completo.
3. **Crecimiento recursivo:** empieza con `{ {} }`. Por cada elemento nuevo, clona cada subconjunto actual y añade el elemento al clon.
4. **Backtrack:** en cada índice, rama exclude y luego include; copia el path en las hojas.
5. **Máscara de bits:** para máscara `0 .. 2^n - 1`, incluye el elemento `j` cuando el bit `j` está a 1.
6. Tiempo y espacio de salida son **Θ(n · 2^n)** en la formulación habitual de listar todo.
7. Copia los subconjuntos al guardarlos. No alias de una lista de path compartida.

Si dibujas el árbol include/exclude para `{1,2}`, duplicas subconjuntos al añadir un tercero, y escribes recursión o un bucle de máscaras sin bugs de listas compartidas, dominas el problema 8.4.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Magic Index](/blog/es/ctci-8-3-magic-index)
* Siguiente: [Recursive Multiply](/blog/es/ctci-8-5-recursive-multiply)