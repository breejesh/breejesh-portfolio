---
title: "Magic Index: Encontrar i donde A[i] es igual a i (Java)"
description: "Problema estilo CTCI 8.3 para principiantes: en un array ordenado encuentra un índice i con A[i] == i. Valores distintos usan búsqueda binaria. Duplicados exigen ambos lados con rangos acotados."
date: "2026-05-01"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-3-magic-index.webp
previewImage: /assets/images/ctci-8-3-magic-index.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.3 para principiantes: en un array ordenado encuentra un índice i con A[i] == i. Valores distintos usan búsqueda binaria. Duplicados exigen ambos lados con rangos acotados.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Las habitaciones de un hotel van en fila numeradas 0, 1, 2, ... La lista de huéspedes está ordenada por el número de preferencia de habitación. Un **índice mágico** es una habitación donde el número del huésped coincide con el de la habitación: `A[i] == i`. Quieres cualquier habitación así, o la prueba de que no existe, sin recorrer cada puerta cuando puedas evitarlo.

Esta entrada es enseñanza original para principiantes en **Java**. Misma familia de problemas que las entrevistas clásicas de "punto fijo en un array ordenado", no una copia del libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). El capítulo 8 (recursión y programación dinámica) sigue aquí después del paseo por la rejilla.

---

## 1. Analogía cotidiana

Piensa en taquillas pintadas del 0 al 6. Dentro de cada una dejas un papel con un entero. Los papeles ya están en orden **ascendente** de izquierda a derecha.

| Índice (taquilla) | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Valor (papel) | -1 | 0 | 1 | 3 | 5 | 7 | 9 |

La taquilla 3 guarda el papel 3. Ese es un índice mágico. La 4 guarda 5, no 4.

Si cada papel es **único**, la línea ordenada tiene forma limpia: cuando los valores suben por encima del índice y siguen creciendo al menos tan rápido como los índices, el emparejamiento no puede esconderse más a la derecha. Por eso funciona la búsqueda binaria.

Si los papeles pueden **repetirse**, la línea puede tambalearse. El valor 2 puede estar en el índice 1 y otra vez más adelante. No siempre puedes tirar media mitad entera, pero aún puedes saltar rangos imposibles para un punto fijo.

---

## 2. Enunciado en claro

**Entrada:** un array ordenado de enteros `A` (no decreciente). El calentamiento clásico asume valores **distintos**. El follow-up permite **duplicados**.

**Salida:** algún índice `i` con `A[i] == i`, o un centinela (aquí `-1`) si no hay ninguno.

**Ejemplos (distintos):**

| Array | Índice mágico | Por qué |
| --- | --- | --- |
| `{-1, 0, 1, 3, 5, 7, 9}` | `3` | `A[3] == 3` |
| `{0, 2, 3, 4, 5}` | `0` | la primera celda coincide |
| `{1, 2, 3, 4}` | ninguno | cada valor está estrictamente por encima de su índice |
| `{-10, -5, 2, 5}` | `2` | solo el medio coincide |

**Ejemplo con duplicados:**

```
A = {-10, -5, 2, 2, 2, 3, 4, 7, 9, 12, 13}
```

El índice 7 funciona (`A[7] == 7`). Según el mid puedes encontrar otros puntos fijos si existen; devolver cualquiera basta en este problema.

**Aclara en la entrevista:**

* ¿Ordenado ascendente? (Sí.)
* ¿Distintos o no? (Pregunta. Empieza por distintos, luego dups.)
* ¿Cualquier índice mágico o el de más a la izquierda? (Cualquiera, salvo que digan lo contrario.)
* ¿Array vacío? Devuelve `-1`.
* ¿Valores negativos permitidos? Sí. Los índices no son negativos, así que un valor negativo nunca coincide con su índice.

---

## 3. Piensa primero

### Fuerza bruta

Recorre `i` de 0 a `n - 1`. Si `A[i] == i`, devuelve `i`. Tiempo O(n), espacio O(1). Vale para n pequeño. En entrevista quieren usar el orden.

### Valores distintos: búsqueda binaria sobre el hueco del punto fijo

Mira mid. Compara `A[mid]` con `mid`.

* **Igual:** listo. Devuelve `mid`.
* **`A[mid] > mid`:** para todo `j > mid`, ordenado + distintos implica `A[j] >= A[mid] + (j - mid) > mid + (j - mid) = j`. Así que `A[j] > j` para siempre a la derecha. Busca solo a la **izquierda**: `0 .. mid - 1`.
* **`A[mid] < mid`:** para todo `j < mid`, `A[j] <= A[mid] - (mid - j) < mid - (mid - j) = j`. Así que `A[j] < j` para siempre a la izquierda. Busca solo a la **derecha**: `mid + 1 .. n - 1`.

Es búsqueda binaria normal con una comparación propia (`valor - índice` cruza cero). Profundidad de recursión O(log n).

### Duplicados: ambos lados, pero acotados

El salto "distintos" falla cuando los valores pueden quedarse planos. Ejemplo:

```
index: 0  1  2  3  4  5
value: 1  1  1  3  5  6
```

En mid 2, `A[2] == 1 < 2`. Con la regla de distintos solo irías a la derecha; otras formas rompen el descarte de un solo lado. Regla segura con dups:

1. Comprueba mid. Si coincide, devuélvelo.
2. Busca a la izquierda en un rango **estrecho**: de `start` a `Math.min(mid - 1, A[mid])`.
3. Si la izquierda falla, busca a la derecha desde `Math.max(mid + 1, A[mid])` hasta `end`.

¿Por qué el min/max?

* Un índice mágico `k` a la izquierda debe cumplir `k <= mid - 1` y `A[k] == k`. El orden fuerza `A[k] <= A[mid]`, así que `k <= A[mid]`. El tope izquierdo es `min(mid - 1, A[mid])`.
* A la derecha, `k >= mid + 1` y `k == A[k] >= A[mid]`, así que el piso es `max(mid + 1, A[mid])`.

En el peor caso sigue siendo O(n) si muchos duplicados abren ambas ramas a menudo. En promedio va mucho mejor que el barrido puro cuando el array es mayormente estricto. Sigues usando el orden en lugar de ignorarlo.

### Recursión frente a iteración

El caso distinto se mapea limpio a un bucle (igual que binary search). El de duplicados es más cómodo recursivo: prueba izquierda, luego derecha. La pila es O(log n) en particiones equilibradas, hasta O(n) en casos feos. En entrevista suele valer la forma recursiva.

---

## 4. Solución en Java

### Enteros distintos

```java
/**
 * Magic index for a sorted array of distinct ints.
 * Returns some i with A[i] == i, or -1 if none.
 */
public static int magicIndexDistinct(int[] a) {
    if (a == null || a.length == 0) {
        return -1;
    }
    return magicIndexDistinct(a, 0, a.length - 1);
}

private static int magicIndexDistinct(int[] a, int lo, int hi) {
    if (lo > hi) {
        return -1;
    }
    int mid = lo + (hi - lo) / 2;
    int val = a[mid];
    if (val == mid) {
        return mid;
    }
    if (val > mid) {
        // fixed point, if any, is strictly left
        return magicIndexDistinct(a, lo, mid - 1);
    }
    // val < mid: search right
    return magicIndexDistinct(a, mid + 1, hi);
}
```

Gemelo iterativo (misma lógica):

```java
public static int magicIndexDistinctIter(int[] a) {
    if (a == null || a.length == 0) {
        return -1;
    }
    int lo = 0;
    int hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int val = a[mid];
        if (val == mid) {
            return mid;
        }
        if (val > mid) {
            hi = mid - 1;
        } else {
            lo = mid + 1;
        }
    }
    return -1;
}
```

### Con duplicados (rangos acotados)

```java
/**
 * Magic index when the sorted array may contain duplicates.
 * Still returns any match, or -1.
 */
public static int magicIndex(int[] a) {
    if (a == null || a.length == 0) {
        return -1;
    }
    return magicIndex(a, 0, a.length - 1);
}

private static int magicIndex(int[] a, int lo, int hi) {
    if (lo > hi) {
        return -1;
    }
    int mid = lo + (hi - lo) / 2;
    int val = a[mid];
    if (val == mid) {
        return mid;
    }

    // Left: only indices that can still equal their value
    int leftHi = Math.min(mid - 1, val);
    int left = magicIndex(a, lo, leftHi);
    if (left >= 0) {
        return left;
    }

    // Right: skip indices that cannot match
    int rightLo = Math.max(mid + 1, val);
    return magicIndex(a, rightLo, hi);
}
```

Prefiere el método **distinct** cuando el entrevistador garantiza unicidad (historia más clara, O(log n) de verdad). Pasa al general cuando mencionan duplicados o "no decreciente".

---

## 5. Recorrido paso a paso

### Distintos: `{-1, 0, 1, 3, 5, 7, 9}`

| lo | hi | mid | A[mid] | Acción |
| --- | --- | --- | --- | --- |
| 0 | 6 | 3 | 3 | igual, devuelve 3 |

Un golpe. Mid afortunado, pero las mismas reglas lo encuentran desde otros inicios.

### Fallo con distintos: `{1, 2, 3, 4}`

| lo | hi | mid | A[mid] | Acción |
| --- | --- | --- | --- | --- |
| 0 | 3 | 1 | 2 | 2 > 1, ve izquierda |
| 0 | 0 | 0 | 1 | 1 > 0, ve izquierda |
| 0 | -1 | | | vacío, devuelve -1 |

Cada valor está por encima de su índice; la búsqueda vacía bien.

### Duplicados: `{-10, -5, 2, 2, 2, 3, 4, 7, 9, 12, 13}`

Supón que mid cae en el índice 5 (`A[5] == 3`).

* No es igual.
* Tope izquierdo = `min(4, 3) = 3`. Busca `0..3`.
* En ese rango puede que no toques el 7; izquierda devuelve -1.
* Piso derecho = `max(6, 3) = 6`. Busca `6..10`.
* El mid de ahí puede ser 8 (`A[8] == 9 > 8`) o 7 (`A[7] == 7`). Cuando mid es 7, devuelve 7.

Los bordes acotados saltan el propio índice 5 (ya comprobado) y pueden saltar celdas muertas cuando `val` y `mid` discrepan mucho.

### Comprobaciones rápidas en código

```java
int[] distinct = {-1, 0, 1, 3, 5, 7, 9};
assert magicIndexDistinct(distinct) == 3;

int[] none = {1, 2, 3, 4};
assert magicIndexDistinct(none) == -1;

int[] dups = {-10, -5, 2, 2, 2, 3, 4, 7, 9, 12, 13};
int m = magicIndex(dups);
assert m >= 0 && dups[m] == m;

assert magicIndex(new int[]{}) == -1;
assert magicIndex(null) == -1;
assert magicIndex(new int[]{0}) == 0;
assert magicIndex(new int[]{1}) == -1;
```

---

## 6. Complejidad, bordes y tips de entrevista

| Tema | Distintos | Con duplicados |
| --- | --- | --- |
| Tiempo | O(log n) | O(log n) mejor, O(n) peor |
| Espacio extra | O(log n) recursión u O(1) iterativo | O(log n) a O(n) de pila |
| Orden requerido | sí | sí (no decreciente) |
| Negativos | bien; solo índices no negativos pueden coincidir | igual |

**Bordes:**

* Vacío / null → `-1`.
* Un elemento `{0}` → `0`; `{5}` → `-1`.
* Mágico en los extremos: índice 0 o `n - 1`.
* Todo negativo: no hay índice mágico (los valores no alcanzan un índice no negativo).
* Array plano del mismo valor `v`: solo el índice `v` puede servir, y solo si `0 <= v < n` y `A[v] == v`.

**Bugs frecuentes:**

1. Usar la regla de un solo lado (distintos) después de que permitan duplicados.
2. Olvidar comprobar `A[mid] == mid` antes de ramificar.
3. Off-by-one en `lo`/`hi` (`mid - 1` / `mid + 1`).
4. En dups buscar todo `0..mid-1` y `mid+1..n-1` sin el skip `min`/`max` (sigue siendo correcto, solo más lento; menciona la optimización).
5. Devolver solo boolean cuando pedían el índice.
6. Overflow en `(lo + hi) / 2` en enteros de ancho fijo; prefiere `lo + (hi - lo) / 2`.

**Cómo contarlo:**

1. Reformula: "Encontrar i con A[i] == i en un array ordenado."
2. Bruto O(n), luego "ordenado + distintos implica binary search de un solo lado."
3. Demuestra el descarte de lado con el argumento distintos + ordenado en una frase cada uno.
4. Codifica limpio la versión distinct.
5. Follow-up: "Con dups, busca ambos lados pero recorta con min(mid-1, A[mid]) y max(mid+1, A[mid])."

---

## 7. Recap para contárselo a un amigo

Magic Index pide un punto fijo en un array ordenado: el índice iguala al valor.

1. La fuerza bruta es un bucle recto. Úsala solo si n es pequeño o el array no está ordenado.
2. **Distintos + ordenado:** compara mid con `A[mid]`. Demasiado alto: solo puede vivir a la izquierda. Demasiado bajo: solo a la derecha. Es binary search sobre el hueco.
3. **Duplicados:** comprueba mid, luego recursa a la izquierda hasta `min(mid - 1, A[mid])`, luego a la derecha desde `max(mid + 1, A[mid])`. El orden sigue matando bandas de índices imposibles.
4. Devuelve cualquier índice que coincida, o `-1`. Los negativos nunca coinciden con un índice válido.
5. La ruta distinct es O(log n). La de dups puede degradar a O(n); dilo en voz alta.

Si puedes recorrer `{-1,0,1,3,5,7,9}` hasta el índice 3 y explicar por qué los dups necesitan ambos lados con bordes recortados, dominas el problema 8.3. Lo siguiente es construir cada subconjunto de un conjunto.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Robot in a Grid](/blog/es/ctci-8-2-robot-in-a-grid)
* Siguiente: [Power Set](/blog/es/ctci-8-4-power-set)