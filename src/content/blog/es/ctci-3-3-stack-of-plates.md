---
title: "Pila de Platos: Implementar SetOfStacks con Límite de Capacidad (CTCI 3.3)"
description: "Implementa SetOfStacks compuesto por multiples sub-pilas limitadas por umbral y la operacion popAt(index) en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-3-stack-of-plates.webp
previewImage: /assets/images/ctci-3-3-stack-of-plates.webp
---

> **TL;DR**
> * **El Problema del Libro:** Imagina una pila de platos que se cae si es demasiado alta. Implementa `SetOfStacks` que crea una nueva sub-pila cuando la anterior alcanza su umbral maximo. `push()` y `pop()` deben comportarse como una pila individual. *Seguimiento:* Implementa `popAt(int index)`.
> * **La Solución Óptima:** Gestiona un `ArrayList<Stack>` de sub-pilas. Cuando la sub-pila activa se llena, crea una nueva. Para `popAt`, extrae directamente del indice indicado eliminando pilas vacias.
> * **Realidad en Producción:** Segmentacion de memoria virtual paginada y fragmentacion en buffers tipo `std::deque`.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 3.3), se nos plantea:

*"Imagina una pila de platos. Si la pila es muy alta, podria caerse. Implementa una estructura SetOfStacks compuesta por varias pilas que crea una nueva pila cuando la anterior supera su capacidad. push() y pop() deben comportarse identicamente a una pila simple."*

**Pregunta de Seguimiento:**
*"Implementa una funcion popAt(int index) que realice la operacion pop en una sub-pila especifica."*

## 2. Diseno Estructural

Mantenemos una lista dinamica de pilas individuales: `ArrayList<Stack> stacks = new ArrayList<>()`.
1. **`push(v)`:** Consulta la ultima sub-pila. Si no existe o esta llena, crea una nueva sub-pila y agrega el elemento.
2. **`pop()`:** Extrae el elemento de la ultima sub-pila. Si queda vacia, la elimina de la lista.
3. **`popAt(int index)`:** Extrae directamente de `stacks.get(index)` y elimina la sub-pila si queda vacia.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.EmptyStackException;
import java.util.Stack;

public class SetOfStacks {
    private final ArrayList<Stack<Integer>> stacks = new ArrayList<>();
    private final int capacity;

    public SetOfStacks(int capacity) {
        this.capacity = capacity;
    }

    public Stack<Integer> getLastStack() {
        if (stacks.isEmpty()) return null;
        return stacks.get(stacks.size() - 1);
    }

    /**
     * Inserta un valor en la sub-pila activa.
     * Complejidad Temporal: O(1)
     */
    public void push(int v) {
        Stack<Integer> last = getLastStack();
        if (last != null && last.size() < capacity) {
            last.push(v);
        } else {
            Stack<Integer> stack = new Stack<>();
            stack.push(v);
            stacks.add(stack);
        }
    }

    /**
     * Extrae el valor de la ultima sub-pila.
     * Complejidad Temporal: O(1)
     */
    public int pop() {
        Stack<Integer> last = getLastStack();
        if (last == null) throw new EmptyStackException();
        int v = last.pop();
        if (last.isEmpty()) {
            stacks.remove(stacks.size() - 1);
        }
        return v;
    }

    /**
     * Extrae el elemento de una sub-pila especifica.
     * Complejidad Temporal: O(1)
     */
    public int popAt(int index) {
        if (index < 0 || index >= stacks.size()) {
            throw new IndexOutOfBoundsException();
        }
        Stack<Integer> stack = stacks.get(index);
        int v = stack.pop();
        if (stack.isEmpty()) {
            stacks.remove(index);
        }
        return v;
    }

    public boolean isEmpty() {
        Stack<Integer> last = getLastStack();
        return last == null || last.isEmpty();
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| push / pop | `O(1)` | Acceso directo a la ultima sub-pila en la lista. |
| popAt(index) | `O(1)` | Acceso indexado inmediato sin desplazamiento de bloques. |
| Espacio Auxiliar | `O(N)` | Memoria proporcional al total de elementos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Estructuras Fragmentadas en Bloques

1. **Memoria Virtual Paginada:** Los sistemas operativos asignan pilas en bloques de paginas de 4KB para evitar la reserva excesiva de memoria continua.
2. **Colas Dobles por Bloques (`std::deque` en C++):** Evitan costosas copias de reasignacion al expandir la coleccion.

## Casos Límite y Robustez en Producción

1. **Extraer de SetOfStacks vacio:** Lanza `EmptyStackException`.
2. **La ultima sub-pila queda vacia:** Se elimina limpiamente de la lista evitando fugas.
