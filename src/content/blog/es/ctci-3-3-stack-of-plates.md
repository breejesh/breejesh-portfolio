---
title: "Stack of Plates: SetOfStacks con capacidad y popAt (Java)"
description: "Problema estilo CTCI 3.3 para principiantes: cuando una pila de platos es demasiado alta, empiezas otra. Construye SetOfStacks para que push y pop sigan sintiéndose como una sola pila, y una nota breve sobre popAt(index)."
date: "2025-10-26"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-3-stack-of-plates.webp
previewImage: /assets/images/ctci-3-3-stack-of-plates.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 3.3 para principiantes: cuando una pila de platos es demasiado alta, empiezas otra. Construye SetOfStacks para que push y pop sigan sintiéndose como una sola pila, y una nota breve sobre popAt(index).
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Estás secando platos después de cenar. Una pila en la encimera va bien hasta que se tambalea. A cierta altura abres una segunda pila al lado, luego una tercera. Desde fuera sigues cogiendo el plato de arriba de la pila más nueva y dejas el plato limpio en esa misma pila nueva. Por dentro hay varias pilas cortas, no un rascacielos. Eso es **SetOfStacks**.

Este post es enseñanza original para principiantes en **Java**. Misma familia de problemas que las preguntas clásicas de capacidad de pilas en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 3, pilas y colas.

---

## 1. Analogía cotidiana

Piensa en platos de cena y una regla: **ninguna pila más alta que capacity**.

* Cada montón físico es una pila interna con un tamaño máximo (por ejemplo 5 platos).
* Cuando el montón actual está lleno, abres un montón nuevo a la derecha.
* **push** siempre deja un plato en el montón más a la derecha que aún tenga hueco (o crea uno nuevo si el de la derecha está lleno).
* **pop** siempre coge un plato del montón no vacío más a la derecha.
* Si un montón queda vacío tras un pop, lo quitas para que el "más a la derecha" siga siendo honesto.

Quien llama no gestiona números de montón. Solo llama a `push` y `pop` como si hubiera una pila lógica. Tú ocultas la contabilidad multi-pila.

El follow-up es más duro: **popAt(index)** quita el plato de arriba de un montón concreto (por índice de sub-pila), no solo del más nuevo. Eso puede dejar un hueco en la fila de montones. Decides si ruedas platos a la izquierda para rellenar o dejas sub-pilas dispersas. En la entrevista importa que nombres el trade-off.

---

## 2. Problema en palabras simples

**Construye** una estructura `SetOfStacks` con un `capacity` fijo por pila interna.

**Operaciones:**

* `push(value)`: apila en la pila lógica (sub-pila más nueva, o una nueva si hace falta).
* `pop()`: desapila de la pila lógica (cima de la sub-pila no vacía más nueva). Compórtate como una sola pila en orden LIFO.
* Follow-up opcional: `popAt(index)`: pop solo en la sub-pila `index`.

**Invariantes:**

* Ninguna pila interna guarda más de `capacity` elementos.
* Las pilas vacías al final no deben quedarse tras un `pop`.
* Un `pop` sobre una estructura totalmente vacía debe fallar con claridad (excepción o señal definida).

**Ejemplos** (capacity = 3):

| Acción | Pilas internas (izquierda = más antigua) | Notas |
| --- | --- | --- |
| push 1,2,3 | `[1,2,3]` | primera pila llena |
| push 4 | `[1,2,3] [4]` | se crea una pila nueva |
| push 5,6 | `[1,2,3] [4,5,6]` | segunda llena |
| pop | `[1,2,3] [4,5]` | devuelve 6 |
| pop, pop | `[1,2,3]` | se elimina la segunda al vaciarse |
| popAt(0) tras más pushes | depende | solo hace pop en la cima de la pila 0 |

**Aclara antes de codear:**

* ¿Capacity fija en el constructor? (Sí en este post.)
* ¿Y si capacity es 0 o negativa? (Rechazar en el constructor.)
* pop en vacío: ¿lanzar, o devolver null? (Lanzamos `EmptyStackException`.)
* popAt: ¿rollover (desplazar) o dejar huecos en pilas del medio? (Hablar de ambos; implementar la versión simple sin rellenar y mencionar el rollover.)

---

## 3. Piensa primero

### Un solo ArrayDeque no basta

Un solo `Stack` o `ArrayDeque` ya da push/pop. El punto de este problema es la **restricción de capacidad por pila física**, como platos que se caen, o páginas de tamaño fijo en una historia de memoria.

### Lista de pilas

Guarda un `ArrayList<Stack<Integer>>` (o `ArrayList<ArrayDeque<Integer>>`) llamado `stacks`.

* **push(v):**
  1. Si `stacks` está vacío, o el tamaño de la última pila es `capacity`, añade una pila vacía nueva.
  2. Haz push de `v` en la última pila.

* **pop():**
  1. Si no hay pilas, lanza vacío.
  2. Pop de la última pila.
  3. Si esa pila queda vacía, quítala de la lista.
  4. Devuelve el valor.

* **Helper `lastStack()`:** devuelve la pila más a la derecha, o null si no hay ninguna.

Ese es todo el diseño base. Sin árboles raros. Solo una lista creciente de cubos LIFO de capacidad fija.

### Modelo mental del follow-up popAt

`popAt(index)` necesita comprobaciones de rango: índice válido, pila no vacía.

Tras hacer pop en una pila del medio, opciones:

1. **Dejar huecos.** La pila `i` puede quedar por debajo de capacity mientras la `i+1` sigue con elementos. Código más simple. `push` sigue tocando solo la última pila (salvo que también reequilibres en push, cosa que la mayoría de soluciones no hace).
2. **Rollover / shift.** Al hacer pop en la pila `i`, sacas el elemento del fondo de la pila `i+1` y lo pones encima de la `i`, y en cascada. Mantiene todas las pilas llenas salvo quizá la última. Más código, layout "denso" más limpio, O(N) en el peor caso por popAt si hay muchas pilas.

Di ambas en voz alta. Implementa la versión simple salvo que pidan rollover.

---

## 4. Solución en Java (SetOfStacks)

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.EmptyStackException;
import java.util.List;

/**
 * Several fixed-capacity stacks that behave as one logical stack for push/pop.
 * Capacity is per inner stack. New stacks open when the current one is full.
 */
class SetOfStacks {
    private final int capacity;
    private final List<Deque<Integer>> stacks = new ArrayList<>();

    SetOfStacks(int capacity) {
        if (capacity < 1) {
            throw new IllegalArgumentException("capacity must be at least 1");
        }
        this.capacity = capacity;
    }

    void push(int value) {
        Deque<Integer> last = lastStack();
        if (last == null || last.size() == capacity) {
            last = new ArrayDeque<>();
            stacks.add(last);
        }
        last.push(value);
    }

    int pop() {
        Deque<Integer> last = lastStack();
        if (last == null) {
            throw new EmptyStackException();
        }
        int value = last.pop();
        if (last.isEmpty()) {
            stacks.remove(stacks.size() - 1);
        }
        return value;
    }

    /**
     * Pop only from sub-stack at index (0 = oldest).
     * Leaves later stacks as-is (no rollover). See section 5.
     */
    int popAt(int index) {
        if (index < 0 || index >= stacks.size()) {
            throw new IndexOutOfBoundsException("sub-stack index: " + index);
        }
        Deque<Integer> stack = stacks.get(index);
        if (stack.isEmpty()) {
            throw new EmptyStackException();
        }
        int value = stack.pop();
        if (stack.isEmpty()) {
            stacks.remove(index);
        }
        return value;
    }

    boolean isEmpty() {
        return stacks.isEmpty();
    }

    int numberOfStacks() {
        return stacks.size();
    }

    private Deque<Integer> lastStack() {
        if (stacks.isEmpty()) {
            return null;
        }
        return stacks.get(stacks.size() - 1);
    }
}
```

Recorrido con capacity 3:

1. `push(1..3)` → una pila llena `[1,2,3]` (cima es 3).
2. `push(4)` → aparece la segunda: `[1,2,3] [4]`.
3. `pop()` → 4; la segunda se vacía y se elimina → `[1,2,3]`.
4. `pop()` → 3 → `[1,2]`.
5. Tras más pushes con tres pilas, `popAt(0)` solo quita la cima de la pila más antigua. Las posteriores se quedan (sin shift).

¿Por qué `ArrayDeque` y no `java.util.Stack`? `Stack` es una subclase vieja y sincronizada de `Vector`. `ArrayDeque` es la opción LIFO moderna habitual en entrevistas Java. El comportamiento es el mismo para nosotros.

---

## 5. Nota sobre popAt (follow-up)

`popAt(index)` es el giro que muestra si solo memorizaste "lista de pilas" o pensaste en la estructura.

**Versión simple (arriba):** pop en `stacks.get(index)`, quita la sub-pila si queda vacía. Las pilas del medio pueden quedar por debajo de capacity mientras las más nuevas están llenas. Vale si el problema solo pide un pop legal en esa sub-pila.

**Versión con rollover (esbozo, código no obligatorio):**

* Pop en la pila `index`.
* Mientras haya pila siguiente, coge su elemento del **fondo** (hace falta una estructura que exponga el fondo, o reconstruir) y hazle push a la pila actual para restaurar capacity.
* Repite en cadena hasta la última pila.

El rollover mantiene tensa la metáfora de los platos: al quitar un plato de un montón antiguo, los platos "caen a la izquierda" desde montones más nuevos para que ningún montón del medio se quede a medias. El coste crece con el número de pilas y elementos desplazados. Menciónalo; implementa solo si lo piden.

También aclara el significado del índice: ¿0 es la pila más antigua o la más nueva? Elige uno y no cambies. En el código de arriba, **0 es la más antigua**.

---

## 6. Tabla de complejidad

| Operación | Tiempo | Espacio extra (más allá de los elementos) | Notas |
| --- | --- | --- | --- |
| `push` | O(1) amortizado | O(1) | a veces se asigna una pila nueva |
| `pop` | O(1) | O(1) | puede quitar una pila vacía al final |
| `popAt` (sin rollover) | O(1) o O(S) | O(1) | O(S) si quitar una pila vacía del medio desplaza la lista |
| `popAt` (con rollover) | O(N) peor caso | O(1) | puede tocar cada pila posterior |
| `isEmpty` | O(1) | O(1) | vacío sii no quedan sub-pilas |

N es el total de elementos en todas las pilas. S es el número de sub-pilas. El espacio de la estructura es O(N) para guardar los valores, igual que una pila grande, más un pequeño número de cabeceras de pila.

---

## 7. Casos límite y errores habituales

Los entrevistadores tocan estos:

* **capacity = 1** → cada push abre una pila nueva (o llena una de tamaño 1 y el siguiente push abre otra). pop sigue pelando la más nueva. Funciona si no haces casos especiales.
* **capacity inválida** → lanza en el constructor, no esperes al push.
* **pop en vacío** → lanza. No devuelvas 0 o -1 salvo que el problema permita un centinela.
* **pop hasta vaciar, luego push otra vez** → la lista de pilas crece desde cero sin drama.
* **popAt fuera de rango** → excepción de bounds.
* **popAt que vacía una pila del medio** → quita esa entrada (los índices posteriores cambian) o deja una tumba. Quitar es más limpio; documenta que los índices posteriores se mueven.
* **Solo una pila, no llena** → push se queda en esa pila. No crees una segunda pila antes de tiempo.

Errores habituales:

1. **Olvidar quitar pilas vacías al final tras pop.** Entonces `lastStack()` apunta a un montón vacío y el siguiente pop falla o necesita más null checks.
2. **Hacer push en la última pila ya llena.** Siempre comprueba `size() == capacity` antes del push.
3. **Tratar popAt como pop.** Son APIs distintas. Quien llama a popAt eligió una sub-pila concreta.
4. **Usar capacity como capacidad total de todas las pilas.** Capacity es por sub-pila.
5. **Implementar rollover por accidente con un solo ArrayList de valores y aritmética modular.** Puede valer para otro diseño, pero entonces las "sub-pilas" son virtuales. Prefiere una lista explícita de deques para que la metáfora de platos se vea en la pizarra.

---

## 8. Recap para contárselo a un amigo

Stack of plates pide: varias pilas cortas bajo un límite de capacidad, pero que push y pop se sientan como una sola pila.

1. Mantén una lista ordenada de pilas internas. Solo la última recibe pushes normales.
2. Si la última está llena, añade una pila vacía nueva y luego push.
3. Pop de la última. Si se vacía, bórrala de la lista.
4. El orden LIFO de la pila lógica se conserva: el plato más nuevo sale primero, aunque cruces fronteras de montón.
5. popAt(index) hace pop solo en ese montón. O dejas huecos o ruedas platos a la izquierda. Di cuál elegiste.

Si puedes dibujar tres pilas de altura 3, hacer push de un décimo plato, pop dos veces, y explicar por qué desaparece el montón vacío de la derecha, dominas el problema 3.3.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Stack Min](/blog/es/ctci-3-2-stack-min)
* Siguiente: [Queue via Stacks](/blog/es/ctci-3-4-queue-via-stacks)