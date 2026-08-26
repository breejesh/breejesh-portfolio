---
title: "Circular Array: rotación O(1) con un índice head (Java)"
description: "Problema estilo CTCI 7.9 para principiantes: un CircularArray genérico que rota en O(1) moviendo un puntero head, mapea índices lógicos con módulo y soporta for-each con Iterable."
date: "2026-02-03"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-9-circular-array.webp
previewImage: /assets/images/ctci-7-9-circular-array.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.9 para principiantes: un CircularArray genérico que rota en O(1) moviendo un puntero head, mapea índices lógicos con módulo y soporta for-each con Iterable.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Quieres un array que puedas **girar** sin pagar una copia completa. Rota a izquierda o derecha y luego recorre los elementos desde el nuevo frente con un `for (T x : array)` normal. Desplazar cada celda en cada rotate es el camino lento. La respuesta de entrevista deja los elementos donde están, mueve un índice **head** y mapea cada índice lógico a través de ese head con módulo.

Este post es enseñanza original para principiantes en **Java**. Misma familia de diseño de buffer circular en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). El capítulo 7 (diseño orientado a objetos) sigue aquí con una estructura pequeña y precisa.

---

## 1. Analogía cotidiana

Piensa en un **lazy Susan** (bandeja giratoria) en la mesa. Los platos se quedan fijos en la bandeja. Cuando alguien la gira, nadie levanta y reordena cada plato. La bandeja gira; lo que te queda de frente cambia.

Tu array es la bandeja. Los platos son los elementos. Un entero, `head`, recuerda qué ranura física es el **inicio lógico** actual. `get(0)` siempre significa "lo que mira al invitado ahora", no "índice físico 0".

Cuando rotas por `k`, solo actualizas `head`. La iteración empieza en ese head y da la vuelta al círculo hasta visitar cada ranura una vez.

---

## 2. Problema en palabras simples

**Objetivo:** implementar un **CircularArray** que se comporte como un array de tamaño fijo con rotación eficiente e iteración for-each estándar.

**Requisitos:**

* Guardar un número fijo de elementos (capacidad al construir).
* `get(i)` / `set(i, value)` con índices **lógicos** `0 .. size-1` tras la rotación actual.
* `rotate(shiftRight)`: cambiar el inicio lógico sin copiar todo el array.
* Preferir un tipo **genérico** `T` (parámetro de tipo en Java).
* Soportar `for (T item : circularArray)` vía `Iterable<T>`.

**Aclara antes de codificar:**

* ¿Capacidad fija o crece? Fija basta para este problema.
* ¿Qué significa `rotate(1)`? El índice lógico 0 pasa a ser lo que era el índice lógico 1 (head avanza).
* ¿`rotate` negativo? Útil; normaliza con módulo para izquierda y derecha.
* ¿Tamaño vacío? Rechaza capacidad no positiva en el constructor.
* ¿`remove()` del iterador? Sin soporte está bien si no te lo piden.

**Mini dibujo (`size = 4`, valores A B C D):**

| head | Orden lógico get(0)..get(3) | Array físico |
| --- | --- | --- |
| 0 | A B C D | `[A, B, C, D]` |
| 1 | B C D A | `[A, B, C, D]` (igual) |
| 2 | C D A B | sigue igual |
| 3 | D A B C | sigue igual |

Las celdas físicas no se mueven. Solo se mueve el mapeo.

---

## 3. Piensa primero

### Mala idea: desplazar cada elemento

```
rotate(1): copiar items[1] a un buffer, o bucle:
  for i in 0..n-2: items[i] = items[i+1]
  items[n-1] = first
```

Eso es **O(n)** por rotate. Vale para un uso puntual, duele si rotas a menudo o `n` es grande. Se espera que lo digas en voz alta y lo descartes como diseño principal.

### Buena idea: head + mapa de índices

Guarda:

* `items`: array crudo de longitud `n`
* `head`: índice físico del inicio lógico actual

**Convertir índice lógico a físico:**

```
physical = (head + logical) mod n
```

El `%` de Java es resto, no módulo matemático: con negativos puede quedar negativo. Normaliza antes de indexar:

```
offset = logical % n
if offset < 0: offset += n
physical = (head + offset) % n
```

**Rotar por `k`:** pon `head` en el índice físico de lo que era el lógico `k`. Eso es `head = convert(k)` si `convert` ya incluye el head actual. Una asignación. **O(1)**.

### Iteración

Un for-each necesita `Iterable<T>`:

1. La clase declara `implements Iterable<T>`.
2. `iterator()` devuelve un `Iterator<T>`.
3. El iterador lleva un offset `current` desde el head **rotado** (`0, 1, 2, ...`), no solo un puntero físico crudo.
4. `hasNext`: quedan offsets.
5. `next`: sube el offset, devuelve `items[convert(current)]`.

La primera secuencia en un for-each es `hasNext()` y luego `next()`. Empieza `current` en `-1` para que el primer `next()` caiga en el offset `0` (frente lógico).

### Genéricos y arrays en Java

No puedes escribir `new T[size]`. Patrón habitual:

```java
items = (T[]) new Object[size];
```

Suprime el warning unchecked una vez en el constructor, o usa `List<T>`. Array + cast es la respuesta típica de estilo CTCI; menciona el warning para que se note la decisión.

---

## 4. Solución en Java

```java
import java.util.Iterator;
import java.util.NoSuchElementException;

/**
 * Fixed-capacity circular array.
 * rotate moves a head index; elements stay put.
 * Logical get/set and for-each all go through convert().
 */
public class CircularArray<T> implements Iterable<T> {
    private final T[] items;
    private int head = 0;

    @SuppressWarnings("unchecked")
    public CircularArray(int size) {
        if (size <= 0) {
            throw new IllegalArgumentException("size must be positive");
        }
        items = (T[]) new Object[size];
    }

    /** Map a logical index (and also raw shift amounts) into a physical slot. */
    private int convert(int index) {
        int n = items.length;
        int offset = index % n;
        if (offset < 0) {
            offset += n;
        }
        return (head + offset) % n;
    }

    /** New logical front is the old logical index shiftRight. O(1). */
    public void rotate(int shiftRight) {
        head = convert(shiftRight);
    }

    public T get(int i) {
        if (i < 0 || i >= items.length) {
            throw new IndexOutOfBoundsException("index " + i);
        }
        return items[convert(i)];
    }

    public void set(int i, T item) {
        if (i < 0 || i >= items.length) {
            throw new IndexOutOfBoundsException("index " + i);
        }
        items[convert(i)] = item;
    }

    public int size() {
        return items.length;
    }

    @Override
    public Iterator<T> iterator() {
        return new CircularArrayIterator();
    }

    /**
     * Walks logical offsets 0 .. n-1 from the current head.
     * Non-static inner class so convert() and items stay accessible.
     */
    private class CircularArrayIterator implements Iterator<T> {
        private int current = -1; // before first element

        @Override
        public boolean hasNext() {
            return current < items.length - 1;
        }

        @Override
        public T next() {
            if (!hasNext()) {
                throw new NoSuchElementException();
            }
            current++;
            return items[convert(current)];
        }

        @Override
        public void remove() {
            throw new UnsupportedOperationException("remove not supported");
        }
    }
}
```

Recorrido: llenar, rotar, leer, iterar.

```java
CircularArray<String> ring = new CircularArray<>(4);
ring.set(0, "A");
ring.set(1, "B");
ring.set(2, "C");
ring.set(3, "D");
// logical: A B C D, head = 0

ring.rotate(1);
// head = 1; get(0)=B, get(1)=C, get(2)=D, get(3)=A

ring.rotate(2);
// from head=1, convert(2) -> head becomes 3
// logical: D A B C

for (String s : ring) {
    System.out.print(s + " "); // D A B C
}
```

| Paso | Llamada | head | Vista lógica |
| --- | --- | --- | --- |
| inicio | sets A B C D | 0 | A B C D |
| 1 | `rotate(1)` | 1 | B C D A |
| 2 | `rotate(2)` | 3 | D A B C |
| 3 | for-each | 3 | D, luego A, B, C |

Reutiliza `convert` en todas partes: `get`, `set`, `rotate` y el iterador. Un solo sitio posee los casos raros del módulo.

---

## 5. Tabla de complejidad

| Operación | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| `rotate(k)` | O(1) | O(1) | solo actualiza `head` |
| `get` / `set` | O(1) | O(1) | un convert + acceso al array |
| for-each completo | O(n) | O(1) iterador | visita cada ranura una vez |
| rotate ingenuo (desplazar) | O(n) | O(1) o O(n) | evita como diseño principal |
| Construcción | O(n) | O(n) por `items` | array fijo |

Quieren la historia de rotate O(1) y un mapa de índices correcto. Iterable es la segunda mitad de la nota.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **`rotate(0)`:** no-op; head igual.
* **`rotate(n)` o múltiplo de `n`:** vueltas completas; orden lógico igual. `% n` lo cubre.
* **rotate negativo:** `rotate(-1)` debe mover el head un paso lógico atrás. Se rompe si usas `%` crudo sin arreglar negativos.
* **`get` fuera de rango:** lanza si el lógico `i < 0` o `i >= n`. No envuelvas en silencio índices del usuario salvo que documentes una API de wrap.
* **Elementos null:** permitidos en tipos referencia; no trates el caso especial si no te lo piden.
* **Iterador tras rotate:** un for-each nuevo usa el head **actual**. Un snapshot viejo es una elección de diseño; esta versión simple lee el `head` vivo vía `convert` (bien para código monohilo de entrevista).
* **Creación de array genérico:** cast desde `Object[]`, o usa `ArrayList`.
* **`size = 1`:** cada rotate cae en el mismo elemento; aun así no debe fallar.

Errores comunes:

1. **Desplazar el array en `rotate`.** Funciona, falla el requisito de eficiencia.
2. **Olvidar el módulo negativo.** `-1 % 4` es `-1` en Java, no `3`.
3. **Iterador que recorre índices físicos desde 0** sin aplicar `head`. El for-each ignora la rotación.
4. **Empezar `current` en 0 e incrementar mal** de modo que se salte o duplique el primero o el último. Traza `hasNext` / `next` una vez en papel.
5. **Usar `head + i` sin `% n`.** Fuera de rango tras rotar.
6. **Comprobar bounds solo con el índice físico.** Los bounds lógicos son `0 .. n-1`; convert es para almacenamiento, no para validar el índice lógico del llamador.

Boceto mínimo de prueba:

```java
void demo() {
    CircularArray<Integer> a = new CircularArray<>(3);
    a.set(0, 10);
    a.set(1, 20);
    a.set(2, 30);
    a.rotate(1);
    assert a.get(0) == 20;
    assert a.get(1) == 30;
    assert a.get(2) == 10;
    a.rotate(-1); // back to original logical order
    assert a.get(0) == 10;

    int sum = 0;
    for (int v : a) {
        sum += v;
    }
    assert sum == 60;
}
```

---

## 7. Recap para contárselo a un amigo

Circular Array pregunta: ¿puedes rotar barato y aun así recorrer en orden lógico?

1. Deja los items fijos en un array. Guarda `head` como índice físico de la posición lógica 0.
2. Mapea con `physical = (head + logical) mod n`, y corrige el resto negativo de Java.
3. `rotate(k)` solo reasigna `head` con ese mismo mapa. **O(1)**, no O(n).
4. `get` / `set` siempre convierten primero para que el llamador solo piense en índices lógicos.
5. Implementa `Iterable` con un iterador que entrega offsets `0 .. n-1` desde el head rotado para que `for (T x : array)` funcione.
6. Usa genéricos (`CircularArray<T>`). Haz cast de `Object[]` a `T[]` o usa una lista.

Si puedes dibujar cuatro cajas, mover una flecha head y escribir `convert` sin off-by-one, dominas el 7.9. La rotación es actualizar un puntero; la iteración es caminar desde ese puntero alrededor del anillo.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Othello](/blog/es/ctci-7-8-othello)
* Siguiente: [Minesweeper](/blog/es/ctci-7-10-minesweeper)