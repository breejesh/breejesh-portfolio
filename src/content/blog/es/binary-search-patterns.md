---
title: "Patrones de búsqueda binaria que no dejan de aparecer"
description: "Búsqueda binaria clásica, lower y upper bound, búsqueda en el espacio de la respuesta y los errores off-by-one que queman entrevistas y producción. Plantillas reutilizables."
date: "2026-06-27"
tags: [Algoritmos]
coverImage: /assets/images/binary-search-patterns.webp
previewImage: /assets/images/binary-search-patterns.webp
---

La búsqueda binaria no es un solo truco. En entrevistas y en producción se repiten pocas formas: encontrar un valor, encontrar un límite, y buscar sobre la *respuesta* en lugar del array. La mayoría de los bugs no son "olvidé el log n". Son errores off-by-one en el invariante del bucle.

Este post es el mapa corto que guardo. Plantillas en Python, el modelo mental de cada forma, y las trampas que te roban media hora en la pizarra.

---

## La única idea que necesitas

Mantienes un rango `[lo, hi]` (o semiabierto `[lo, hi)`) donde aún vive la respuesta. Cada paso tira aproximadamente la mitad de ese rango. Solo funciona si:

1. El espacio de búsqueda está **ordenado** por alguna clave (valores, o un predicado monótono).
2. Puedes decidir, en O(1) o mejor, qué mitad sigue conteniendo la respuesta.
3. El bucle **encoge** en cada iteración, y al salir `lo`/`hi` quedan en un estado conocido.

Si el predicado no es monótono, la búsqueda binaria es la herramienta equivocada. Ninguna aritmética astuta de `mid` arregla un problema no monótono.

---

## Patrón 1: búsqueda clásica (valor exacto)

Array ordenado, encontrar `target` o reportar que falta. El rango semiabierto evita parte del dolor de los postes de la cerca:

```python
def binary_search(a: list[int], target: int) -> int:
    """Return index of target, or -1 if missing. a must be sorted ascending."""
    lo, hi = 0, len(a)  # search in [lo, hi)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return -1
```

Notas:

* `mid = lo + (hi - lo) // 2` evita desbordamiento en lenguajes con enteros de ancho fijo. En Python es sobre todo estilo. Sigue siendo buen hábito si entrevistas en C++ o Java.
* Si no hay match, `lo` es el punto de inserción (primer índice donde `a[i] >= target` si las comparaciones fueron `<` / `>=`). Útil para el siguiente patrón.
* Duplicados: devuelve *algún* match, no el más a la izquierda ni el más a la derecha.

---

## Patrón 2: lower bound y upper bound

**Lower bound:** primer índice `i` con `a[i] >= target` (o `len(a)` si todos son menores).

**Upper bound:** primer índice `i` con `a[i] > target`.

Juntos dan el rango completo de iguales para duplicados, y permiten "cuántos X hay en la lista ordenada" en tiempo logarítmico.

```python
def lower_bound(a: list[int], target: int) -> int:
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo


def upper_bound(a: list[int], target: int) -> int:
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] <= target:
            lo = mid + 1
        else:
            hi = mid
    return lo


def equal_range(a: list[int], target: int) -> tuple[int, int]:
    return lower_bound(a, target), upper_bound(a, target)
```

Ejemplo: `a = [1, 2, 2, 2, 5]`, `target = 2` → lower `1`, upper `4`, count `3`.

C++ tiene `std::lower_bound` / `std::upper_bound`. En Python, `bisect.bisect_left` y `bisect.bisect_right` son la misma idea. En entrevista, escribe el bucle una vez para demostrar que controlas el invariante.

### Usos en producción

* Logs de eventos ordenados: primer timestamp `>= t0`, primer timestamp `> t1`.
* Escaleras de precios o tablas de tarifas: el tramo más pequeño que cubre una cantidad.
* Listas de IDs deduplicadas: pertenencia y longitud del rango sin escanear.

---

## Patrón 3: búsqueda en el espacio de la respuesta

No indexas un array. Adivinas un número `x` (capacidad, días, máximo de carga mínimo, velocidad) y haces un **chequeo monótono**: `feasible(x)` es falso para `x` pequeños y verdadero para `x` grandes (o al revés). La búsqueda binaria encuentra el menor verdadero (o el mayor falso).

Esqueleto para "mínimo `x` tal que `feasible(x)`":

```python
def min_feasible(lo: int, hi: int, feasible) -> int:
    """
    Assume feasible is False for values below the answer,
    True for values at and above. Search in [lo, hi].
    Returns the smallest x where feasible(x) is True.
    Precondition: feasible(hi) is True (or widen hi first).
    """
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if feasible(mid):
            hi = mid          # mid works; try smaller
        else:
            lo = mid + 1      # mid fails; need larger
    return lo
```

Formas clásicas de entrevista que mapean aquí:

| Familia de problema | `x` significa | `feasible(x)` |
| --- | --- | --- |
| Koko eating bananas | velocidad de comer | termina todos los montones en `h` horas |
| Split array largest sum | suma máxima de subarray permitida | se puede partir en `<= m` partes |
| Capacity to ship packages | capacidad del barco | todos los paquetes salen en `D` días |
| Min max distance / aggressive cows | distancia mínima | colocar `k` vacas con ese hueco |
| Tiempo para producir `n` ítems | tiempo transcurrido | las máquinas producen suficiente para entonces |

Lo difícil no es la búsqueda binaria. Es:

1. Probar **monotonicidad** (si velocidad 5 funciona, 6 también).
2. Fijar **límites** (`lo` = max de un montón en problemas tipo Koko; `hi` = suma de montones o un tope seguro).
3. Implementar `feasible` bien y en buen tiempo (a menudo O(n) por chequeo → O(n log R) total).

### Ejemplo pequeño: capacidad mínima

Pesos de paquetes `[1, 2, 3, 4, 5]`, días `D = 3`. Hallar la capacidad mínima para enviar en orden, sin reordenar.

```python
def can_ship(weights: list[int], days: int, cap: int) -> bool:
    used, load = 1, 0
    for w in weights:
        if w > cap:
            return False
        if load + w > cap:
            used += 1
            load = 0
        load += w
    return used <= days


def ship_within_days(weights: list[int], days: int) -> int:
    lo = max(weights)
    hi = sum(weights)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if can_ship(weights, days, mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

`lo` empieza en el paquete más pesado (la capacidad no puede ser menor). `hi` es "enviar todo en un día". El bucle cae en la capacidad mínima que aún termina en `days`.

---

## Patrón 4: array ordenado rotado (sigue siendo búsqueda binaria)

El array estaba ordenado y luego se rotó: `[4, 5, 6, 7, 0, 1, 2]`. Una mitad siempre está ordenada. Compara `target` con la mitad ordenada para decidir qué lado tirar.

```python
def search_rotated(a: list[int], target: int) -> int:
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[lo] <= a[mid]:  # left half sorted
            if a[lo] <= target < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:  # right half sorted
            if a[mid] < target <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
```

Los duplicados hacen ambiguo el test `a[lo] <= a[mid]` cuando `a[lo] == a[mid] == a[hi]`. Entonces puede hacer falta encoger un extremo de forma lineal en el peor caso. Dilo en voz alta en la entrevista; demuestra que conoces el límite.

---

## Trampas off-by-one que de verdad pican

Estos son los bugs que más veo, incluidos los míos.

### Cerrado vs semiabierto

| Estilo | Inicio | Bucle | Si `a[mid] < target` | Si no |
| --- | --- | --- | --- | --- |
| Semiabierto `[lo, hi)` | `hi = n` | `while lo < hi` | `lo = mid + 1` | `hi = mid` |
| Cerrado `[lo, hi]` | `hi = n - 1` | `while lo <= hi` | `lo = mid + 1` | `hi = mid - 1` |

Mezclar estilos a mitad de función es el bucle infinito clásico: `hi = mid` con `while lo <= hi` y sin progreso cuando `lo == hi`.

Elige un estilo por función y cúmplelo. Yo uso semiabierto para bounds, cerrado cuando el enunciado piensa en índices inclusivos.

### Bucle infinito con `mid = (lo + hi) // 2`

Cuando `hi = lo + 1` y pones `lo = mid` (no `mid + 1`) en la rama "ir a la derecha", `mid` se queda en `lo` para siempre. Arreglo: usa semiabierto con `lo = mid + 1`, o en búsquedas de "maximizar" usa `mid = lo + (hi - lo + 1) // 2` (sesgo hacia arriba) cuando escribes `lo = mid`.

```python
# Maximize: last True under a monotone predicate on [lo, hi]
def max_true(lo: int, hi: int, ok) -> int:
    while lo < hi:
        mid = lo + (hi - lo + 1) // 2  # bias upward
        if ok(mid):
            lo = mid
        else:
            hi = mid - 1
    return lo
```

### Array vacío y un solo elemento

Siempre prueba `[]`, `[x]` con acierto y fallo, y dos elementos. Esos tamaños rompen primero las actualizaciones flojas de `mid`.

### Overflow de enteros en los bounds

Los problemas de espacio de respuesta pueden empujar `hi` a `10**18`. En C++/Java, `lo + hi` desborda; prefiere `lo + (hi - lo) / 2`. En Python estás bien, pero los entrevistadores siguen notando la forma segura.

### Dirección del predicado

Para "capacidad mínima", cuando `feasible(mid)` es verdadero pones `hi = mid` (conservas mid). Cuando es falso, `lo = mid + 1`. Invertir eso una vez y devuelves una capacidad que no funciona, o entras en bucle infinito. Escribe la frase en español encima del bucle antes de codear.

### Búsqueda binaria en flotantes

Rara en entrevistas, común en problemas geométricos de "radio mínimo". Usa un número fijo de iteraciones (60-100) o un epsilon sobre `hi - lo`. No compares floats con `==`. Prefiere búsqueda entera en unidades escaladas cuando puedas.

---

## Lista de decisión

Antes de escribir `mid = ...`:

1. **¿Cuál es el espacio de búsqueda?** Índices en un array, o respuestas candidatas en una recta numérica?
2. **¿Qué es monótono?** Valores ordenados, o `feasible(x)` que cambia una sola vez de falso a verdadero?
3. **¿Qué devuelves?** Cualquier match, el más a la izquierda, el más a la derecha, punto de inserción, mínimo verdadero, máximo verdadero?
4. **¿Semiabierto o cerrado?** Solo un estilo.
5. **¿Bounds?** ¿Puede `lo` empezar en 0 / max(elemento)? ¿`hi` es exclusivo `n`, inclusivo `n-1`, o una capacidad máxima probada?
6. **Vacío y bordes** anotados antes del camino feliz.

Si no puedes responder (2), para. Un scan lineal u otro algoritmo puede ser correcto; la búsqueda binaria no.

---

## Notas de producción (no solo LeetCode)

La búsqueda binaria aparece fuera de las entrevistas:

* **Config / feature rollout:** encontrar el primer build id que regresó una métrica (búsqueda sobre deploys ordenados con un chequeo tolerante a flakiness).
* **Umbrales de autoscaling:** buscar por binaria una concurrencia o tamaño de batch hasta que falle el SLO de latencia.
* **Base de datos / storage:** la búsqueda en hoja de un B-tree es la misma idea; tu app casi nunca la reimplementa, pero el invariante es idéntico.
* **Ajuste de juego / sim:** min time step, max load, spawn rate que aún cabe en un presupuesto.

En producción la llamada a `feasible` suele ser un experimento o un load test, así que el número de iteraciones importa más que micro-optimizar `mid`. Aun así, registra cada `(lo, hi, mid, result)` para que una métrica no monótona no devuelva basura en silencio.

---

## Chuleta

| Objetivo | Plantilla |
| --- | --- |
| Cualquier igual | clásica; return mid en match |
| Primer `>= x` | lower_bound; `if a[mid] < x: lo = mid+1 else hi = mid` |
| Primer `> x` | upper_bound; `if a[mid] <= x: lo = mid+1 else hi = mid` |
| Contar iguales | `upper - lower` |
| Min `x` con ok(x) | si ok: `hi = mid` si no `lo = mid+1` |
| Max `x` con ok(x) | sesgo mid arriba; si ok: `lo = mid` si no `hi = mid-1` |
| Array rotado | identifica mitad ordenada; descarta la otra |

Memoriza los **invariantes**, no doce nombres de problemas. Cuando lower/upper bound y la búsqueda en el espacio de la respuesta son memoria muscular, la mayoría de tags "binary search" en LeetCode son el mismo bucle con un `feasible` distinto.

---

## Cierre

La búsqueda binaria falla cuando el rango no encoge, el predicado no es monótono, o mezclas actualizaciones cerradas y semiabiertas. Clava esas tres y el resto es ponerle nombre.

Si solo practicas un ejercicio esta semana: implementa lower_bound y min-feasible desde cero dos veces, sin mirar, y córrelos en arrays vacíos, de un elemento y con todos los duplicados. Eso cubre la mayor parte de lo que piden entrevistas y producción.
