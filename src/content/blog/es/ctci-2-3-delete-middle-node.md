---
title: "Delete Middle Node: borrar un nodo sin acceso al head (Java)"
description: "Problema estilo CTCI 2.3: borrar un nodo del medio de una lista enlazada simple cuando solo tienes puntero a ese nodo. Copia el valor del siguiente, saltalo, y entiende por que el ultimo nodo no se puede."
date: "2026-05-14"
tags: [Algoritmos]
coverImage: /assets/images/ctci-2-3-delete-middle-node.webp
previewImage: /assets/images/ctci-2-3-delete-middle-node.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 2.3: borrar un nodo del medio de una lista enlazada simple cuando solo tienes puntero a ese nodo. Copia el valor del siguiente, saltalo, y entiende por que el ultimo nodo no se puede.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Estás en una conga. Alguien te toca el hombro y dice: sácate de la fila. No puedes alcanzar a la persona de atrás, así que no le pides que te salte. El truco raro que funciona es este: te conviertes en la persona de delante. Copias su disfraz y su etiqueta, la sacas a ella de la fila y cierras el hueco. El resto de la cadena sigue viéndose completa. Eso es delete middle node en una lista enlazada simple.

Este artículo es enseñanza original para principiantes en **Java**. Misma familia de problemas que los trucos clásicos de listas en entrevistas, no una copia de un libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide).

---

## 1. Analogía cotidiana

Una lista enlazada simple es una conga de un solo sentido. Cada persona solo conoce a la siguiente. **No** te dan la cabeza de la fila. Solo te dan un puntero a alguien en el medio, y la tarea es sacarlo.

El unlink normal necesita el nodo anterior:

```
prev.next = node.next
```

Aquí no tienes `prev`. Así que haces trampa:

1. Robas la identidad del siguiente (copias `next.data` en el nodo actual).
2. Saltas al siguiente (`current.next = next.next`).

El "hueco" del medio sigue existiendo como objeto, pero ahora guarda el valor siguiente y apunta a donde apuntaba el siguiente. Desde fuera, ese valor desapareció de la secuencia.

---

## 2. Enunciado en palabras claras

**Entrada:** una referencia `Node` a un nodo que **no** es el primero ni el último de una lista enlazada simple. **No** recibes el head.

**Salida:** mutar la lista para que el valor que estaba en `node` ya no aparezca en la secuencia. Debe verse como si ese nodo del medio se hubiera borrado.

**Forma del nodo:**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

**Ejemplo:**

| Antes | Borrar este | Después | Por qué |
| --- | --- | --- | --- |
| `a → b → c → d → e` | nodo con `c` | `a → b → d → e` | `c` se convierte en `d`, luego se salta el `d` original |
| `1 → 2 → 3 → 4` | nodo con `2` | `1 → 3 → 4` | copias `3` en el hueco de `2` y saltas el viejo `3` |
| `1 → 2 → 3 → 4` | nodo con `3` | `1 → 2 → 4` | la misma idea un paso más adelante |

**Aclara antes de codear** (dilo en voz alta):

* ¿El nodo está garantizado como no último? (Enunciado clásico: sí, o "cualquier nodo menos el último".)
* ¿Está garantizado como no head? (Suele ser sí; borrar head pide otro contrato.)
* ¿Podemos sobrescribir `data`? (Sí. Ese es el truco.)
* ¿Simple o doble enlace? (Aquí: simple.)
* ¿Lista de un solo nodo? (Fuera de alcance; no hay "siguiente" del que copiar.)

Para este artículo: nodo del medio con `next` no nulo, enteros, mutar in place, devolver éxito o void.

---

## 3. Piensa primero

### Lo que no puedes hacer

* Caminar desde head para encontrar `prev`. No tienes head.
* Hacer `node = node.next`. Solo reasigna una variable local. El `next` del anterior sigue apuntando al objeto viejo.
* Liberar el nodo sin rewire. La cadena lo sigue incluyendo.

### El único truco práctico

Si existe `node.next`:

```
node.data = node.next.data
node.next = node.next.next
```

Borras **físicamente** el nodo siguiente después de copiar su payload al actual. En la práctica, el valor que vivía en `node` desaparece. Los valores posteriores se desplazan un hueco lógico a la izquierda.

### Por qué falla el último nodo

Si `node.next == null`, no hay identidad que robar ni nodo que saltar. No puedes quitar el último valor sin el puntero anterior (o un diseño con sentinel). En la entrevista, dilo claro: este algoritmo no borra un verdadero último nodo.

Algunos entrevistadores aceptan "marcar dummy / lanzar / devolver false". Elige un contrato claro y cúmplelo.

---

## 4. Solución en Java

```java
/**
 * Deletes a middle node from a singly linked list given only that node.
 * Copies the next node's data into this node, then skips the next node.
 * Does not work for the last node (no next to copy from).
 *
 * @return true if deleted, false if node is null or is the last node
 */
boolean deleteMiddleNode(Node node) {
    if (node == null || node.next == null) {
        // Cannot delete last node (or a null reference) this way.
        return false;
    }

    Node next = node.next;
    node.data = next.data;
    node.next = next.next;
    return true;
}
```

Recorrido para `a → b → c → d → e`, borrar el nodo con `c`:

| Paso | `node.data` | `node.next` apunta a | Lista vista desde head |
| --- | --- | --- | --- |
| Inicio | `c` | `d` | `a → b → c → d → e` |
| Copiar data | `d` | `d` (mismo objeto) | `a → b → d → d → e` (dos nodos con `d` un instante) |
| Saltar next | `d` | `e` | `a → b → d → e` |

El viejo nodo `d` queda desconectado y listo para GC. Quien aún tuviera un puntero al objeto que era `c` ahora ve `d` en ese objeto. Es el tradeoff habitual: la identidad del objeto no es lo mismo que la identidad del valor en la secuencia.

Driver mínimo para probar mentalmente:

```java
Node build(int... vals) {
    Node dummy = new Node(0);
    Node t = dummy;
    for (int v : vals) {
        t.next = new Node(v);
        t = t.next;
    }
    return dummy.next;
}

// head: 1 → 2 → 3 → 4 → 5
// delete the node with value 3 (must look it up only for the demo)
Node head = build(1, 2, 3, 4, 5);
Node target = head.next.next; // the 3
deleteMiddleNode(target);
// list is now 1 → 2 → 4 → 5
```

En la llamada real del problema, el entrevistador te entrega `target` directamente. Nunca buscas desde head.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Copiar next + saltar | O(1) | O(1) | Solo punteros en tiempo constante |
| Caminar desde head hasta prev | O(N) | O(1) | Necesita head; no lo permite el enunciado |
| Copiar toda la lista sin ese valor | O(N) | O(N) | Exceso, y aún necesitas head |

Es uno de los pocos problemas de listas que es O(1) de verdad cuando se cumplen las restricciones.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan esto:

* **Último nodo** → devolver false, lanzar, o documentar "no soportado". No hagas NPE en `node.next.data`.
* **Nodo null** → protege primero.
* **Lista de dos nodos, borrar el primero de los dos** → funciona: el primero se vuelve el segundo y se salta el segundo. La lista queda en un solo nodo. Si "el primero de dos" cuenta como medio depende del enunciado; el algoritmo igual corre.
* **Head con longitud > 2** → el algoritmo "funciona" en lo técnico (sobrescribes data del head y saltas el segundo). Muchos enunciados igual dicen "no el primero ni el último". Sigue la restricción dicha.
* **Valores duplicados** → bien. Quitas una ocurrencia en esa posición, no "todos los iguales".
* **Referencias externas al nodo del valor borrado** → ahora apuntan al objeto que guarda el valor siguiente. Menciónalo si la lista se comparte.

Errores comunes:

1. **Solo hacer `node = node.next`.** Reasignar en local no desconecta nada.
2. **Olvidar copiar data.** Si solo saltas next, mantienes el valor del medio y pierdes el siguiente. Eso es lo contrario de borrar el medio.
3. **Asumir que puedes liberar el último nodo.** No puedes con solo ese puntero en una lista simple.
4. **Devolver void e ignorar el fallo.** Mejor un boolean o una excepción clara para el caso del último nodo.
5. **Creer que el objeto del nodo desaparece.** El objeto en `node` se queda; cambia su payload. El "borrado" es lógico para la secuencia, no siempre físico para ese objeto Java.

---

## 7. Resumen para contárselo a un amigo

Delete middle node pide: quita un valor de una lista enlazada simple cuando solo tienes ese nodo, no el head.

1. No puedes rewire el puntero anterior. No lo tienes.
2. Copia el data del siguiente nodo en el actual.
3. Apunta el actual más allá del siguiente.
4. El último nodo no tiene next, así que el truco falla. Dilo al principio.

Si escribes el cuerpo de tres líneas y explicas el límite del último nodo en treinta segundos, dominas el 2.3.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Return Kth to Last](/blog/es/ctci-2-2-return-kth-to-last)
* Siguiente: [Partition](/blog/es/ctci-2-4-partition)