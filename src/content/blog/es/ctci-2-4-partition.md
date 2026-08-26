---
title: "CTCI 2.4 Partition: partir una lista enlazada alrededor de x"
description: "Reordena una lista enlazada simple para que todo nodo menor que x quede antes que los nodos mayores o iguales a x. Fusión de dos listas en Java y una nota breve de crecimiento head/tail."
date: "2026-02-01"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-2-4-partition.webp
previewImage: /assets/images/ctci-2-4-partition.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Reordena una lista enlazada simple para que todo nodo menor que x quede antes que los nodos mayores o iguales a x. Fusión de dos listas en Java y una nota breve de crecimiento head/tail.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

En el control del aeropuerto hay dos filas. Una para maletas por debajo de un peso límite y otra para las que llegan a ese peso o lo superan. La gente llega en orden aleatorio. No las ordenas por peso. Solo te importa que cada maleta ligera acabe a la izquierda y cada pesada a la derecha. Eso es **partition** en una lista enlazada: un corte alrededor de un valor `x`, no un sort completo.

Este es el problema **2.4** de la [serie CTCI en Java](/blog/es/ctci-series-guide), Capítulo 2 (Linked Lists). Explicación y código originales, no un copiado del libro.

---

## El problema en palabras simples

Recibes la cabeza de una lista enlazada simple de enteros y un entero `x`.

**Objetivo:** reordenar los nodos de forma que todo nodo con valor **estrictamente menor** que `x` quede antes que todo nodo con valor **mayor o igual** a `x`.

Detalles que importan en la entrevista:

- Los nodos iguales a `x` viven en el lado **derecho** (con el grupo "mayor o igual"). No hace falta un cubo del medio salvo que lo inventes.
- El **orden estable** (mantener el orden relativo original dentro de cada lado) es agradable y a menudo sale gratis con dos listas. El problema no siempre exige estabilidad.
- Prefiere **reutilizar los nodos existentes**. No crees un nodo nuevo por cada valor a menos que el entrevistador lo pida.

Ejemplo clásico:

```
Entrada:  3 → 5 → 8 → 5 → 10 → 2 → 1 ,  x = 5
Una salida válida:  3 → 1 → 2 → 10 → 5 → 5 → 8
```

A la izquierda del corte: `3, 1, 2` (todos `< 5`). A la derecha: `10, 5, 5, 8` (todos `>= 5`). Otra lista válida puede reordenar cada mitad, siempre que se cumpla la regla del corte.

---

## Cómo pensar antes de codificar

### Instinto incorrecto: ordenar la lista

Un sort completo cumple la regla del corte, pero es más trabajo del pedido. Partition es más débil que sort. Apunta a tiempo lineal y unos pocos punteros extra.

### Idea principal: dos listas y luego pegarlas

Recorre la lista una vez. Por cada nodo, sepáralo (`node.next = null` después de guardar el next real) y añádelo a una de dos cadenas:

1. Lista **before**: valores `< x`
2. Lista **after**: valores `>= x`

Guarda cabeza y cola en cada cadena para que el append sea O(1). Al terminar:

- Si **before** está vacía, devuelve la cabeza de **after**.
- Si no, haz `beforeTail.next = afterHead` y devuelve la cabeza de **before**.
- Deja `afterTail.next = null` (o desconecta al ir) para no dejar un ciclo por enlaces viejos.

Ese es todo el algoritmo. Un pase. Cuatro punteros (o dos dummies). Fácil de explicar en la pizarra.

### Variante opcional: crecer desde head y tail

Otro estilo crece una sola lista resultado por ambos extremos:

- Valores `< x` se insertan al **frente** (nueva cabeza).
- Valores `>= x` se añaden al **final**.

También particiona en un pase. El orden de la izquierda suele **invertirse** respecto al original, y eso vale si no exigen estabilidad. La fusión de dos listas es más clara cuando quieres orden estable y la historia de "cubo izquierdo, cubo derecho."

---

## Solución en Java (fusión de dos listas)

```java
/** Nodo de lista enlazada simple usado en los ejemplos del Capítulo 2. */
public class ListNode {
    public int val;
    public ListNode next;

    public ListNode(int val) {
        this.val = val;
    }
}

/**
 * Partition list around x: all nodes with val < x before nodes with val >= x.
 * Stable within each side if you always append to that side's tail.
 * Reuses existing nodes. Returns the new head.
 */
public static ListNode partition(ListNode head, int x) {
    ListNode beforeHead = null;
    ListNode beforeTail = null;
    ListNode afterHead = null;
    ListNode afterTail = null;

    ListNode current = head;
    while (current != null) {
        ListNode next = current.next;
        // Detach so old links cannot form a cycle after the merge.
        current.next = null;

        if (current.val < x) {
            if (beforeHead == null) {
                beforeHead = current;
                beforeTail = current;
            } else {
                beforeTail.next = current;
                beforeTail = current;
            }
        } else {
            if (afterHead == null) {
                afterHead = current;
                afterTail = current;
            } else {
                afterTail.next = current;
                afterTail = current;
            }
        }

        current = next;
    }

    if (beforeHead == null) {
        return afterHead;
    }

    beforeTail.next = afterHead;
    return beforeHead;
}
```

Traza del ejemplo con `x = 5`:

| Nodo visto | Va a | Lista before | Lista after |
| --- | --- | --- | --- |
| 3 | before | 3 | (vacía) |
| 5 | after | 3 | 5 |
| 8 | after | 3 | 5 → 8 |
| 5 | after | 3 | 5 → 8 → 5 |
| 10 | after | 3 | 5 → 8 → 5 → 10 |
| 2 | before | 3 → 2 | 5 → 8 → 5 → 10 |
| 1 | before | 3 → 2 → 1 | 5 → 8 → 5 → 10 |

Pegar: `3 → 2 → 1 → 5 → 8 → 5 → 10`. Partition válido. (El ejemplo del libro puede reordenar dentro de cada mitad; ambos valen.)

Versión con nodos dummy de la misma idea: sentinelas vacíos `before` y `after`, siempre append por la cola, luego `beforeTail.next = afterHead.next` y devuelves `beforeHead.next`. Misma complejidad, menos chequeos de null.

---

## Complejidad

| | Coste | Por qué |
| --- | --- | --- |
| Tiempo | O(n) | Un recorrido de n nodos. Cada nodo se añade una vez. |
| Espacio extra | O(1) | Un puñado de punteros. Se reutilizan los nodos, no se copian a objetos nuevos. |

Hay que mirar cada nodo para saber a qué lado va, así que el tiempo lineal es el suelo correcto.

---

## Casos límite que tocan en la entrevista

1. **Lista null o vacía.** Devuelve null. No revientes en `beforeTail`.
2. **Todos los valores `< x`.** After queda vacía. Devuelve la cabeza de before. El `next` de la cola ya es null si desconectaste.
3. **Todos los valores `>= x`.** Before vacía. Devuelve la cabeza de after.
4. **Un solo nodo.** Cualquier lado según el valor. El resultado es ese nodo con `next == null`.
5. **`x` aparece muchas veces.** Todas las copias van al lado after. No hace falta lista del medio.
6. **Duplicados mezclados con otros valores.** La estabilidad (si haces append) mantiene el orden relativo en cada lado. Dilo en voz alta si preguntan.
7. **Olvidar poner `next` a null.** Bug clásico: tras el merge, la cadena vieja sigue apuntando a algún sitio y aparece un ciclo o una cola incorrecta.
8. **Comparar con `<=` por error.** El problema suele ser **estrictamente** `<` a la izquierda. Confirma la desigualdad antes de codificar.

---

## Errores comunes

- Ordenar y decir que "particionaste." Correcto pero excesivo, y señala que no viste el requisito más débil.
- Crear nodos nuevos por cada valor y abandonar la lista vieja. Suelen querer cirugía de punteros sobre los nodos existentes.
- Enlazar `before` con `after` sin manejar before vacío (null pointer) o after vacío (bien si la cola ya apunta a null).
- Dejar `afterTail.next` apuntando al medio de la lista vieja porque nunca rompiste enlaces.

---

## Resumen para contárselo a un amigo

Partition son las filas del aeropuerto, no un sort completo. Todo lo que pesa menos que `x` va a la izquierda. Todo lo demás a la derecha.

Recorre la lista una vez. Saca cada nodo y añádelo a una cadena **before** o **after**. Pega before a after. Devuelve la cabeza izquierda, o la derecha si la izquierda nunca recibió un nodo.

Un pase, unos pocos punteros, sin drama. Si permiten orden inestable, crecer desde head y tail también vale. Prefiere las dos listas cuando quieres una historia limpia y mitades estables.

---

## Práctica

1. Codifica `partition` de memoria con cuatro punteros y luego con dummies.
2. Traza en papel `3 → 5 → 8 → 5 → 10 → 2 → 1` con `x = 5`.
3. Traza entradas todo-pequeño y todo-grande.
4. Rompe a propósito una solución correcta saltándote `current.next = null` y mira el ciclo.

Anterior en la serie: [Delete Middle Node](/blog/es/ctci-2-3-delete-middle-node). Siguiente: [Sum Lists](/blog/es/ctci-2-5-sum-lists). Mapa completo: [CTCI en Java](/blog/es/ctci-series-guide).