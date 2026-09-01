---
title: "Eliminar Nodo Intermedio: Eliminar un Nodo de una Lista Enlazada con Acceso Solo a Dicho Nodo (CTCI 2.3)"
description: "Implementa un algoritmo para eliminar un nodo intermedio en una lista simplemente enlazada teniendo acceso unicamente a ese nodo en tiempo O(1) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-2-3-delete-middle-node.webp
previewImage: /assets/images/ctci-2-3-delete-middle-node.webp
---

> **TL;DR**
> * **El Problema del Libro:** Implementa un algoritmo para eliminar un nodo intermedio (cualquier nodo excepto el primero y el ultimo) de una lista simplemente enlazada, teniendo acceso unicamente a dicho nodo.
> * **La Solución Óptima:** Copia el valor y el puntero del nodo siguiente en el nodo actual (`n.data = n.next.data; n.next = n.next.next;`), omitiendo y eliminando efectivamente el nodo sucesor en tiempo $O(1)$ y espacio $O(1)$.
> * **Realidad en Producción:** Colas enlazadas libres de bloqueos (lock-free), cancelacion de temporizadores en bucles de eventos y reciclaje de nodos en estructuras intrusivas.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 2.3), se nos plantea:

*"Implementa un algoritmo para eliminar un nodo intermedio (cualquier nodo excepto el primero y el ultimo, no necesariamente el punto medio exacto) de una lista simplemente enlazada, teniendo acceso unicamente a dicho nodo."*

**Ejemplo:**
* Entrada: el nodo `c` de la lista `a -> b -> c -> d -> e -> f`
* Resultado: no retorna valor, pero la lista resultante queda como `a -> b -> d -> e -> f`

## 2. El Desafío Central e Ineficiencias

En una eliminacion tradicional de lista enlazada simple, se debe recorrer desde la cabeza (`head`) para localizar el predecesor `prev` y enlazar `prev.next = current.next` en $O(N)$ tiempo.

Sin embargo, al contar **unicamente con el nodo objetivo `n`**, no tenemos referencia al puntero anterior ni a la cabeza de la lista. Como los enlaces son unidireccionales, no podemos retroceder.

## 3. Mecánica Óptima de Copia de Valor

En lugar de desenlazar fisicamente el nodo objetivo `n` de su predecesor, copiamos el estado del nodo sucesor en `n`:
1. Copiar datos: `n.data = n.next.data`.
2. Omitir el sucesor: `n.next = n.next.next`.

Esta operacion sobreescribe el nodo objetivo con la identidad de su vecino y desenlaza a este ultimo en $O(1)$ tiempo.

## Implementación de Producción

```java
public class DeleteMiddleNode {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    /**
     * Elimina un nodo intermedio teniendo unicamente acceso a el.
     * Complejidad Temporal: O(1)
     * Complejidad Espacial: O(1)
     */
    public static boolean deleteNode(LinkedListNode n) {
        if (n == null || n.next == null) {
            return false; // No es posible eliminar nodo nulo o el nodo final
        }

        LinkedListNode next = n.next;
        n.data = next.data;
        n.next = next.next;
        return true;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(1)` | Asignaciones directas de campos sin recorridos. |
| Espacio Auxiliar | `O(1)` | Modifica los punteros de los nodos in-place. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Listas Intrusivas y Bucles de Eventos

1. **Listas Intrusivas del Kernel de Linux (`struct list_head`):** Permiten operaciones $O(1)$ directas. En estructuras simplemente enlazadas con restricciones de memoria, la copia del sucesor permite eliminaciones instantaneas.
2. **Temporizadores en Bucles de Eventos (Event Loops):** Cancelacion de callbacks de eventos sin necesidad de escanear la lista de temporizadores.

## Casos Límite y Robustez en Producción

1. **Nodo objetivo nulo:** Controlado mediante `if (n == null) return false;`.
2. **Nodo objetivo es el ultimo nodo (`n.next == null`):** Este problema **no** se puede resolver si el nodo es la cola de la lista, ya que no se puede mutar la referencia del predecesor a nulo. Debe seńalarse al entrevistador.
