---
title: "Particionar Lista: Dividir una Lista Enlazada Alrededor de un Valor X (CTCI 2.4)"
description: "Particiona una lista enlazada alrededor de un valor x de modo que todos los nodos menores que x aparezcan antes que los mayores o iguales en tiempo O(N) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-2-4-partition.webp
previewImage: /assets/images/ctci-2-4-partition.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe codigo para particionar una lista enlazada alrededor de un valor $x$, de tal manera que todos los nodos menores que $x$ aparezcan antes que los nodos mayores o iguales que $x$.
> * **La Solución Óptima:** Manten dos punteros `head` y `tail`. Al recorrer la lista, inserta los elementos $< x$ en la cabeza (`head`) y los elementos $\ge x$ en la cola (`tail`), logrando una particion en tiempo $O(N)$ y espacio auxiliar $O(1)$.
> * **Realidad en Producción:** Particionamiento en Quicksort para listas enlazadas y clasificacion de paquetes de red por niveles de prioridad QoS.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 2.4), se nos plantea:

*"Escribe codigo para particionar una lista enlazada alrededor de un valor x, de tal forma que todos los nodos menores que x aparezcan antes que todos los nodos mayores o iguales que x. Si x esta contenido en la lista, los valores de x solo necesitan estar despues de los elementos menores que x."*

**Ejemplo:**
* Entrada: `3 -> 5 -> 8 -> 5 -> 10 -> 2 -> 1` [particion = `5`]
* Salida: `1 -> 2 -> 3 -> 5 -> 8 -> 5 -> 10` (o `3 -> 1 -> 2 -> 10 -> 5 -> 5 -> 8`)

## 2. Enfoques Algorítmicos

Podemos abordar el problema de dos formas:

### Enfoque de Crecimiento por Cabeza y Cola (Compacto y Eficiente)
Si no es estrictamente necesario mantener el orden relativo original (particion inestable), expandimos la lista por ambos extremos:
1. Inicializamos `head = node` y `tail = node`.
2. Para cada nodo sucesor:
   * Si `current.data < x`, lo insertamos antes de `head` (`current.next = head; head = current;`).
   * Si `current.data >= x`, lo insertamos despues de `tail` (`tail.next = current; tail = current;`).
3. Al terminar, establecemos `tail.next = null`.

## Implementación de Producción

```java
public class PartitionList {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    /**
     * Particiona una lista enlazada alrededor del valor x.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(1) espacio auxiliar
     */
    public static LinkedListNode partition(LinkedListNode node, int x) {
        if (node == null) return null;

        LinkedListNode head = node;
        LinkedListNode tail = node;

        LinkedListNode current = node;
        while (current != null) {
            LinkedListNode next = current.next;
            if (current.data < x) {
                // Insertar nodo en la cabeza
                current.next = head;
                head = current;
            } else {
                // Insertar nodo en la cola
                tail.next = current;
                tail = current;
            }
            current = next;
        }
        tail.next = null;

        return head;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Un solo recorrido lineal sobre los $N$ nodos. |
| Espacio Auxiliar | `O(1)` | Modificacion in-place de referencias de punteros. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Quicksort y Colas de Prioridad QoS

1. **Quicksort sobre Listas Enlazadas:** La etapa de particionado in-place divide los nodos sin requerir asignaciones de arrays adicionales.
2. **Priorizacion de Paquetes en Redes (QoS):** Division de paquetes en colas de trafico urgente vs masivo segun encabezados de prioridad.

## Casos Límite y Robustez en Producción

1. **Lista vacia o de un solo elemento:** Resuelto de inmediato en $O(1)$.
2. **Todos los elementos menores o mayores que $x$:** El ajuste final `tail.next = null` previene la creacion accidental de ciclos circulares.
3. **El valor $x$ no existe en la lista:** Funciona de forma valida al evaluar unicamente la condicion binaria `< x`.
