---
title: "Queue via Stacks: cola FIFO con dos pilas LIFO (Java)"
description: "Problema estilo CTCI 3.4 para principiantes: implementa MyQueue con stackNewest y stackOldest. Push a una, shift solo cuando dequeue o peek necesitan datos. Amortizado O(1) en Java claro."
date: "2025-10-24"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-4-queue-via-stacks.webp
previewImage: /assets/images/ctci-3-4-queue-via-stacks.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 3.4 para principiantes: implementa MyQueue con stackNewest y stackOldest. Push a una, shift solo cuando dequeue o peek necesitan datos. Amortizado O(1) en Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Llevas un café minúsculo con dos bandejas. Las tazas nuevas caen en la **bandeja de entrada**. Siempre dejas la taza encima de ese montón. Cuando un cliente pide, sirves desde la **bandeja de salida**, que también solo te deja coger de arriba. Cuando la de salida está vacía, pasas cada taza de la entrada a la salida, una a una. La primera taza que entró queda arriba en la de salida, lista. Eso es una **cola hecha con dos pilas**.

Este post es enseñanza original para principiantes en **Java**. Misma familia que las preguntas clásicas de "cola con stacks" en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 3, problema 3.4.

---

## 1. Analogía cotidiana

Dos bandejas; cada una se comporta como pila (último en entrar, primero en salir *en esa bandeja*):

* **Bandeja de entrada (`stackNewest`)** guarda las llegadas nuevas. Encolar siempre es hacer push aquí. La taza más nueva queda arriba.
* **Bandeja de salida (`stackOldest`)** guarda tazas listas para servir en orden FIFO. Desencolar y peek siempre operan aquí, una vez que un shift la ha llenado.
* **Shift:** solo cuando la de salida está vacía y hay que servir. Sacas todo de la entrada y lo metes en la salida. El orden se invierte de forma que la primera taza en entrar es la primera en salir.

No haces shift si la de salida aún tiene tazas. Ese movimiento perezoso es lo que mantiene barato el coste medio.

---

## 2. Problema en palabras simples

**Objetivo:** implementar una cola con enqueue (add), dequeue (remove) y peek, usando solo dos pilas como almacén. No envuelvas una `Queue` real de biblioteca.

**Contrato de cola:** primero en entrar, primero en salir. Si añades `1`, luego `2`, luego `3`, el primer remove devuelve `1`.

**Contrato de pila que puedes usar:** push, pop, peek, isEmpty (o size). El `Stack` de Java o un `Deque` usado solo como pila vale.

**Operaciones en `MyQueue`:**

| Método | Significado |
| --- | --- |
| `add(x)` / `enqueue(x)` | poner `x` al final de la cola |
| `remove()` / `dequeue()` | sacar el frente y devolverlo |
| `peek()` | mirar el frente sin sacarlo |
| `isEmpty()` / `size()` | vacío o recuento (opcional, útil) |

**Ejemplos:**

| Secuencia | Resultado |
| --- | --- |
| add(1), add(2), add(3), remove() | devuelve `1`; quedan `2, 3` |
| luego peek() | devuelve `2` |
| luego remove(), remove() | devuelve `2`, luego `3` |
| remove() en vacío | indefinido / excepción (elige política y dilo) |

**Aclara antes de codificar:**

* ¿Qué pasa si dequeue en vacío? ¿Lanzar, o un centinela? En entrevista suele valer cualquiera si lo dices.
* ¿Solo enteros, o genérico? Empieza con `int`; genéricos son un envoltorio pequeño después.
* ¿Deben las dos pilas estar siempre "perfectas", o vale el shift perezoso? El perezoso es la buena respuesta estándar.

---

## 3. Piensa primero (una pila no basta, dos sí)

### Por qué una sola pila no alcanza

Una pila es LIFO. Una cola es FIFO. Si solo haces push al encolar y pop al desencolar, sale primero lo más nuevo. Orden incorrecto.

Podrías reconstruir toda la pila en cada dequeue (pasar todo a un temporal, coger el fondo, devolver el resto). Funciona, pero cada dequeue es O(N). Sirve como primera idea; luego piden mejor coste amortizado.

### Dos pilas: newest y oldest

Mantén:

* `stackNewest`: recibe cada elemento nuevo al encolar
* `stackOldest`: guarda elementos de forma que su cima es el frente de la cola

**Enqueue:** siempre `stackNewest.push(x)`. O(1).

**Dequeue / peek:** necesitas el más antiguo. Está en la cima de `stackOldest` *si* ya has hecho shift. Si `stackOldest` está vacía, vierte todo de `stackNewest` en `stackOldest`:

```
while stackNewest is not empty:
    stackOldest.push(stackNewest.pop())
```

Luego peek o pop de `stackOldest`.

**Por qué el orden es correcto:** encolar `1, 2, 3` deja newest con cima=`3`, luego `2`, y `1` abajo. Tras el shift, oldest tiene cima=`1`, luego `2`, luego `3`. FIFO perfecto.

**Regla perezosa:** solo haz shift cuando `stackOldest` está vacía. Si aún tienes `1` en oldest y encolas `4`, deja `4` en newest. El siguiente remove sigue sacando `1` de oldest. Cuando oldest se vacíe, un remove posterior moverá `4` (y lo que haya).

### Intuición del coste amortizado

Cada elemento se hace push en newest una vez, pop de newest como mucho una vez, push en oldest como mucho una vez, y pop de oldest como mucho una vez. Cada elemento paga trabajo constante en toda su vida en la cola. Eso es **O(1) amortizado** por operación, aunque un solo shift pueda costar O(N) cuando se mueven N ítems de golpe.

---

## 4. Solución en Java

```java
import java.util.EmptyStackException;
import java.util.Stack;

/**
 * Queue implemented with two stacks.
 * stackNewest: inbound (enqueue). stackOldest: outbound (dequeue/peek).
 * Shift only when outbound is empty and we need the front.
 */
class MyQueue {
    private final Stack<Integer> stackNewest = new Stack<>();
    private final Stack<Integer> stackOldest = new Stack<>();

    public int size() {
        return stackNewest.size() + stackOldest.size();
    }

    public boolean isEmpty() {
        return size() == 0;
    }

    /** Enqueue: always push onto the newest stack. */
    public void add(int value) {
        stackNewest.push(value);
    }

    /**
     * Move everything from newest to oldest only if oldest is empty.
     * After this, stackOldest.top is the queue front (if any elements exist).
     */
    private void shiftStacks() {
        if (stackOldest.isEmpty()) {
            while (!stackNewest.isEmpty()) {
                stackOldest.push(stackNewest.pop());
            }
        }
    }

    /** Front without remove. Shifts if needed. */
    public int peek() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new EmptyStackException(); // queue empty
        }
        return stackOldest.peek();
    }

    /** Dequeue front. Shifts if needed. */
    public int remove() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new EmptyStackException(); // queue empty
        }
        return stackOldest.pop();
    }
}
```

Recorrido: `add(1)`, `add(2)`, `add(3)`, luego `remove()`.

| Paso | stackNewest (cima→…) | stackOldest (cima→…) | Notas |
| --- | --- | --- | --- |
| add(1) | 1 | (vacía) | push en newest |
| add(2) | 2, 1 | (vacía) | |
| add(3) | 3, 2, 1 | (vacía) | |
| remove → shift | (vacía) | 1, 2, 3 | verter newest en oldest |
| remove → pop | (vacía) | 2, 3 | devuelve `1` |

Luego `add(4)`, `remove()`:

| Paso | stackNewest | stackOldest | Notas |
| --- | --- | --- | --- |
| add(4) | 4 | 2, 3 | **no** hagas shift aún |
| remove | 4 | 3 | pop oldest → `2` (sin shift; oldest no vacía) |
| remove | 4 | (vacía) | pop → `3` |
| remove → shift | (vacía) | 4 | ahora shift, luego pop → `4` |

---

## 5. Tabla de complejidad

| Operación | Tiempo peor caso | Tiempo amortizado | Espacio extra |
| --- | --- | --- | --- |
| `add` | O(1) | O(1) | O(1) por llamada |
| `remove` / `peek` (sin shift) | O(1) | O(1) | O(1) |
| `remove` / `peek` (shift de k ítems) | O(k) | O(1) amortizado | O(1) más allá de las pilas |
| Cola con N elementos | - | - | O(N) total en ambas pilas |

N es el número de elementos en la cola. Un solo dequeue puede ser lineal si dispara un shift grande, pero cada elemento se mueve como mucho una vez en el shift, así que en una secuencia de M operaciones el trabajo total es O(M). Esa es la historia amortizada que quieren en entrevista.

---

## 6. Casos límite y errores frecuentes

Los entrevistadores tocan esto:

* **Cola vacía** → `remove` / `peek` con ambas pilas vacías. Lanza o devuelve un centinela claro. No hagas `pop` a ciegas en una pila vacía.
* **Un solo elemento** → add y remove funcionan: el shift mueve uno, el pop lo devuelve.
* **Muchos enqueues y luego muchos dequeues** → un shift grande y luego pops baratos. El orden debe seguir FIFO.
* **Operaciones intercaladas** → encolar tras un dequeue parcial no debe romper el frente. El shift perezoso lo resuelve si solo mueves cuando oldest está vacía.
* **Peek y luego remove** → ambos deben ver el mismo frente; peek no debe dejar las pilas inconsistentes (shift sí; pop en peek no).
* **size / isEmpty** → suma ambas pilas. No mires solo una.

Errores comunes:

1. **Hacer shift en cada enqueue o en cada dequeue aunque oldest tenga datos.** Gasta trabajo y es fácil de romper. Condiciona el shift con `if (stackOldest.isEmpty())`.
2. **Verter newest sobre oldest cuando oldest no está vacía.** Mezcla el orden. Oldest aún tiene ítems más viejos; echar nuevos encima rompe el FIFO.
3. **Usar una sola pila y copiar al revés en cada dequeue sin hablar del coste.** Funciona pero es O(N) cada vez, sin historia amortizada si inviertes en ambos sentidos en cada llamada.
4. **Olvidar que peek necesita el mismo shift que remove.** Peek también necesita el frente en la cima de oldest.
5. **Devolver desde newest por error.** La cima de newest es la *última* llegada, no la primera.

Ayudas mínimas ante vacío (misma política):

```java
public int removeOrThrow() {
    return remove();
}

public boolean tryPeek(int[] out) {
    if (isEmpty()) {
        return false;
    }
    out[0] = peek();
    return true;
}
```

---

## 7. Resumen para contárselo a un amigo

Queue via stacks pregunta: ¿puedes obtener FIFO solo con montones LIFO?

1. Dos pilas: llegadas nuevas (`stackNewest`) y servicio (`stackOldest`).
2. Enqueue siempre hace push en newest. Eso es O(1).
3. Cuando necesitas el frente y oldest está vacía, viertes newest en oldest. Las cimas se invierten y la llegada más temprana queda arriba en oldest.
4. Dequeue y peek operan solo en oldest (tras un posible shift).
5. Nunca viertas sobre un oldest no vacío. Esa regla protege el orden.
6. Cada elemento se mueve un número constante de veces, así que las operaciones son O(1) amortizado aunque un shift parezca caro.

Si puedes dibujar las dos bandejas, decir cuándo das la vuelta y explicar el coste amortizado sin humo, dominas el problema 3.4.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Stack of Plates](/blog/es/ctci-3-3-stack-of-plates)
* Siguiente: [Sort Stack](/blog/es/ctci-3-5-sort-stack)