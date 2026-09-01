---
title: "Cola mediante Pilas: Implementar una Cola Usando Dos Pilas (CTCI 3.4)"
description: "Implementa una cola FIFO utilizando dos pilas LIFO con optimizacion de transferencia perezosa en tiempo amortizado O(1) y espacio O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-4-queue-via-stacks.webp
previewImage: /assets/images/ctci-3-4-queue-via-stacks.webp
---

> **TL;DR**
> * **El Problema del Libro:** Implementa la clase `MyQueue` para construir una cola utilizando dos pilas.
> * **La Solución Óptima:** Manten dos pilas: `stackNewest` (recibe nuevos elementos) y `stackOldest` (sirve extracciones y lecturas en orden FIFO). Transfiere perezosamente de `stackNewest` a `stackOldest` solo cuando esta ultima esta vacia, logrando un tiempo amortizado $O(1)$ por operacion.
> * **Realidad en Producción:** Buzones de actores en sistemas concurrentes (Erlang/Akka) y canales de doble buffer en graficos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 3.4), se nos plantea:

*"Implementa una clase MyQueue que implemente una cola utilizando dos pilas."*

**Principio Fundamental:**
Una pila es LIFO (Last-In, First-Out), mientras que una cola es FIFO (First-In, First-Out). Al apilar elementos en una pila y desapilarlos hacia una segunda pila, el orden se invierte exactamente, convirtiendo LIFO en FIFO.

## 2. Transferencia Perezosa (Lazy Shifting)

1. **`add(value)`:** Siempre inserta en `stackNewest`.
2. **`shiftStacks()`:** Si y solo si `stackOldest` esta vacia, traslada todos los elementos de `stackNewest` a `stackOldest`.
3. **`remove()` / `peek()`:** Ejecuta `shiftStacks()` y luego extrae o lee de `stackOldest`.

Dado que cada elemento ingresa a `stackNewest` una sola vez, se transfiere una vez y se desapila una vez, el costo amortizado por elemento es estrictamente $O(1)$.

## Implementación de Producción

```java
import java.util.NoSuchElementException;
import java.util.Stack;

public class MyQueue<T> {
    private final Stack<T> stackNewest;
    private final Stack<T> stackOldest;

    public MyQueue() {
        stackNewest = new Stack<>();
        stackOldest = new Stack<>();
    }

    public int size() {
        return stackNewest.size() + stackOldest.size();
    }

    public boolean isEmpty() {
        return size() == 0;
    }

    /**
     * Encola un elemento al final de la cola.
     * Complejidad Temporal: O(1)
     */
    public void add(T value) {
        stackNewest.push(value);
    }

    private void shiftStacks() {
        if (stackOldest.isEmpty()) {
            while (!stackNewest.isEmpty()) {
                stackOldest.push(stackNewest.pop());
            }
        }
    }

    /**
     * Lee el elemento al frente de la cola.
     * Complejidad Temporal: O(1) amortizado
     */
    public T peek() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new NoSuchElementException();
        }
        return stackOldest.peek();
    }

    /**
     * Desencola el elemento al frente.
     * Complejidad Temporal: O(1) amortizado
     */
    public T remove() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new NoSuchElementException();
        }
        return stackOldest.pop();
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| add(T) | `O(1)` | Insercion directa en stackNewest. |
| remove() / peek() | `O(1) amortizado` | Peor caso $O(N)$ en la transferencia, pero cada nodo se traslada a lo sumo una vez. |
| Espacio Auxiliar | `O(N)` | $N$ elementos distribuidos entre ambas pilas. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Buzones de Mensajes y Doble Buffer

1. **Buzones de Mensajes de Actores (Erlang / Akka):** Los mensajes entrantes se agregan a un buzon de recepcion sin bloquear al hilo trabajador que procesa el lote activo.
2. **Doble Búfer en Gráficos:** Las cadenas de intercambio alternan entre el buffer de dibujo y el de renderizado.

## Casos Límite y Robustez en Producción

1. **Extraer de cola vacía:** Lanza `NoSuchElementException`.
2. **Operaciones push y pop intercaladas:** El traslado perezoso solo actua cuando `stackOldest` se vacia, preservando el orden FIFO.
