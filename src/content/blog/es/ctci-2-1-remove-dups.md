---
title: "Remove Dups: borrar duplicados de una lista enlazada desordenada (Java)"
description: "Problema estilo CTCI 2.1 para principiantes: quitar valores duplicados de una lista simplemente enlazada. Recorrido con HashSet en O(N) y puntero runner sin buffer en O(N^2)."
date: "2026-04-08"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-2-1-remove-dups.webp
previewImage: /assets/images/ctci-2-1-remove-dups.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 2.1 para principiantes: quitar valores duplicados de una lista simplemente enlazada. Recorrido con HashSet en O(N) y puntero runner sin buffer en O(N^2).
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tu agenda del teléfono tiene "Ana" tres veces, "Sam" dos, y algunos nombres limpios. Quieres cada persona una sola vez. No te importa el orden alfabético. Solo recorres la lista, recuerdas a quién ya guardaste y tiras el resto. Eso es remove dups en una lista enlazada.

Este artículo es enseñanza original para principiantes en **Java**. Misma familia de problemas que los calentamientos clásicos de listas enlazadas en entrevistas, no una copia de un libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí empieza el capítulo 2.

---

## 1. Analogía cotidiana

Imagina notas adhesivas en un hilo. Cada nota tiene un número. Solo pueden apuntar a la siguiente (lista simplemente enlazada).

* Empiezas por la primera nota.
* Si ese número es nuevo, la dejas y lo recuerdas.
* Si ese número ya salió antes, cortas la nota del hilo y cierras el hueco.

No ordenas. No cuentas cuántas veces aparece un valor. Solo conservas la **primera** aparición de cada valor y tiras las copias posteriores.

---

## 2. Enunciado en palabras claras

**Entrada:** la cabeza de una lista simplemente enlazada de enteros, sin orden (o `null`).

**Salida:** la misma estructura sin valores **duplicados**. El orden de las primeras apariciones se mantiene. Suele mutarse in place y devolver void (o la misma cabeza).

**Forma del nodo que usamos:**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

**Ejemplos:**

| Antes (head → …) | Después | Por qué |
| --- | --- | --- |
| `1 → 2 → 3 → 2 → 1` | `1 → 2 → 3` | se eliminan el segundo `2` y el segundo `1` |
| `5 → 5 → 5` | `5` | solo se queda el primero |
| `7` | `7` | un solo nodo, nada que quitar |
| `null` | `null` | lista vacía |
| `1 → 2 → 3` | `1 → 2 → 3` | ya era única |

**Aclara antes de codificar** (dilo en voz alta en la entrevista):

* ¿Simplemente o doblemente enlazada? (Aquí: simple.)
* ¿Podemos usar memoria extra? (Solución principal sí; follow-up no.)
* ¿Orden estable keep-first, o se puede reordenar a voluntad?
* ¿Y los negativos o el cero? (Como cualquier otro `int`.)
* ¿Lista nueva o editar los nodos existentes?

En este artículo: mutar in place, conservar la primera aparición, enteros, simplemente enlazada.

---

## 3. Piensa primero (bruto, hash, luego sin buffer)

### Instinto bruto

Para cada nodo, recorre el **resto** de la lista y borra cualquier nodo posterior con el mismo valor. Eso ya se parece al follow-up. Bucles anidados: O(N²) tiempo, O(1) espacio extra.

### Idea principal: recordar lo que ya guardaste

Usa un `HashSet<Integer>` con los valores que ya conservaste. Un puntero recorre la lista. Otro (o una referencia "previous") va un paso detrás para poder desconectar un nodo.

* Primera vez que ves un valor: lo añades al set y avanzas previous.
* Valor ya en el set: saltas el nodo actual con `previous.next = current.next`.

Un solo pase. Las búsquedas en el hash son O(1) de media. Tiempo total O(N), espacio extra O(N) en el peor caso (todos los valores distintos).

### Follow-up: sin buffer

El entrevistador prohíbe el set. Para cada nodo `current`, lanza un segundo puntero `runner` desde `current` por el resto de la lista. Cuando `runner.next` tiene el mismo data que `current`, desconectas `runner.next`. Si no, avanzas `runner`.

Bucle exterior por bucle interior: O(N²) tiempo, O(1) espacio extra. Correcto, más lento. Buena respuesta cuando la memoria aprieta o el set está prohibido.

---

## 4. Soluciones en Java

### (a) HashSet, un pase

```java
import java.util.HashSet;
import java.util.Set;

/**
 * Removes duplicate values from an unsorted singly linked list.
 * Keeps the first occurrence of each value. Mutates the list in place.
 */
void removeDups(Node head) {
    if (head == null) {
        return;
    }

    Set<Integer> seen = new HashSet<>();
    Node previous = null;
    Node current = head;

    while (current != null) {
        if (seen.contains(current.data)) {
            // Drop current: bridge previous over it.
            previous.next = current.next;
        } else {
            seen.add(current.data);
            previous = current;
        }
        current = current.next;
    }
}
```

Recorrido de `1 → 2 → 3 → 2 → 1`:

| current.data | seen antes | acción | forma de la lista tras el paso |
| --- | --- | --- | --- |
| 1 | {} | add 1, keep | `1 → 2 → 3 → 2 → 1` |
| 2 | {1} | add 2, keep | igual |
| 3 | {1,2} | add 3, keep | igual |
| 2 | {1,2,3} | ya visto, unlink | `1 → 2 → 3 → 1` |
| 1 | {1,2,3} | ya visto, unlink | `1 → 2 → 3` |

### (b) Puntero runner, sin buffer extra

```java
/**
 * Same goal as removeDups, but no HashSet and no extra O(N) memory.
 * For each node, scan the rest of the list and remove matching values.
 */
void removeDupsNoBuffer(Node head) {
    Node current = head;

    while (current != null) {
        Node runner = current;
        while (runner.next != null) {
            if (runner.next.data == current.data) {
                // Skip the duplicate node.
                runner.next = runner.next.next;
            } else {
                runner = runner.next;
            }
        }
        current = current.next;
    }
}
```

Por qué `runner` empieza en `current` y no en `head`: solo necesitas limpiar copias **posteriores** de `current.data`. Los nodos anteriores ya se limpiaron frente a sus propios valores. Partir de `current` acorta el barrido interior y no toca otra vez el prefijo.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Recorrido HashSet | O(N) media | O(N) | N = nodos; el espacio guarda valores distintos |
| Runner (sin buffer) | O(N²) | O(1) | Barridos anidados de la lista |
| Copiar a array, uniques, reconstruir | O(N) | O(N) | Funciona, pero rara vez es lo que piden de "habilidad de lista enlazada" |

Prefiere **HashSet** en producción y en la mayoría de entrevistas salvo que prohíban memoria extra. Usa **runner** cuando digan "espacio constante" o "sin buffer".

---

## 6. Casos límite y errores frecuentes

Los entrevistadores tocan esto:

* **Lista vacía (head `null`)** → return al momento. No toques nada.
* **Un solo nodo** → déjalo.
* **Todos los valores iguales** → solo queda la cabeza.
* **Duplicados al final** → previous debe poder desconectar el último nodo (o nodos).
* **Sin duplicados** → el set crece hasta N; la estructura no cambia.
* **Negativos y cero** → el hash y `==` funcionan igual que con enteros positivos.
* **Lista muy larga** → HashSet sigue lineal; el runner se vuelve lento de verdad. Di ese tradeoff en voz alta.

Errores frecuentes:

1. **Olvidar `previous` al desconectar.** Si solo avanzas `current` y nunca reescribes `previous.next`, el duplicado sigue en la lista.
2. **Avanzar `previous` también cuando borras.** Tras un delete, `previous` sigue en el último nodo conservado. Solo mueve `previous` cuando conservas `current`.
3. **Perder la cabeza.** En este problema el primer nodo siempre se queda (no puede ser un duplicado "posterior" de sí mismo). Si una variante borrara con otras reglas, haría falta un dummy head o devolver la cabeza.
4. **Empezar el runner en `head` cada vez sin cuidado.** Se puede, pero repites trabajo y complica bordes. Desde `current` es más limpio.
5. **Usar `==` con payloads de objetos más adelante.** Aquí `data` es `int`, así que `==` está bien. Con `Integer` o tipos propios, piensa en equals y hashCode.

Entrada mínima segura con null:

```java
void removeDupsSafe(Node head) {
    // null head is a no-op inside removeDups
    removeDups(head);
}
```

---

## 7. Recap para contárselo a un amigo

Remove dups pregunta: deja cada valor una vez en una lista simplemente enlazada; gana la primera aparición.

1. Camino HashSet: un pase, recuerda lo que guardaste, desconecta repeticiones. O(N) tiempo, O(N) espacio.
2. Sin buffer: por cada nodo, barre el resto con un runner y corta nodos iguales. O(N²) tiempo, O(1) espacio.
3. Siempre reescribe `next` al borrar. No avances el puntero "conservado" más allá de un nodo borrado.
4. Listas vacías y de un nodo son victorias fáciles. Listas todo-igual se reducen a un nodo.

Si puedes decir eso en treinta segundos y escribir ambas versiones sin quedarte en blanco, dominas el problema 2.1.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Rotación de strings](/blog/es/ctci-1-9-string-rotation)
* Siguiente: [Return Kth to Last](/blog/es/ctci-2-2-return-kth-to-last)