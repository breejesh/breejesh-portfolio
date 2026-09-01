---
title: "Intersección: Determinar si dos Listas Enlazadas se Intersecan (CTCI 2.7)"
description: "Determina si dos listas simplemente enlazadas se intersecan por referencia y retorna el nodo de interseccion en tiempo O(N + M) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-2-7-intersection.webp
previewImage: /assets/images/ctci-2-7-intersection.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dadas dos listas simplemente enlazadas, determina si se intersecan. Retorna el nodo de interseccion (definido por referencia, no por valor).
> * **La Solución Óptima:** Recorre ambas listas para calcular sus longitudes y referencias de cola. Si las colas difieren (`tail1 != tail2`), no hay interseccion. Si coinciden, avanza el puntero de la lista mas larga en $|long_1 - long_2|$ posiciones y luego avanza ambos en paralelo hasta encontrar `p1 == p2` en tiempo $O(N + M)$ y espacio $O(1)$.
> * **Realidad en Producción:** Deteccion de punteros compartidos en recolectores de basura y busqueda de ancestros comunes en grafos DAG de Git.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 2.7), se nos plantea:

*"Dadas dos listas simplemente enlazadas, determina si se intersecan. Retorna el nodo de interseccion. La interseccion se define por referencia de memoria, no por valor de datos."*

**Perspectiva Fundamental:**
En una lista simplemente enlazada, cada nodo tiene un unico puntero `next`. Una vez que dos listas se unen en un nodo compartido, **todos los nodos subsiguientes son comunes**, formando una estructura en forma de "Y" con la misma cola.

## 2. Enfoque Óptimo: Alineación de Longitudes y Verificación de Colas

1. Recorrer la Lista 1: obtener longitud $len_1$ y nodo final $tail_1$.
2. Recorrer la Lista 2: obtener longitud $len_2$ y nodo final $tail_2$.
3. Comparar colas: si `tail1 != tail2`, retornar `null` inmediatamente (no hay interseccion).
4. Posicionar dos punteros en las cabezas de ambas listas.
5. Avanzar el puntero de la lista mas larga $|len_1 - len_2|$ nodos hacia adelante.
6. Avanzar ambos punteros al mismo ritmo hasta que colisionen (`p1 == p2`).
7. Retornar `p1` (el nodo de interseccion).

## Implementación de Producción

```java
public class IntersectionList {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    private static class Result {
        public LinkedListNode tail;
        public int size;
        public Result(LinkedListNode tail, int size) {
            this.tail = tail;
            this.size = size;
        }
    }

    /**
     * Encuentra el nodo de interseccion entre dos listas enlazadas.
     * Complejidad Temporal: O(A + B) donde A y B son las longitudes.
     * Complejidad Espacial: O(1) espacio auxiliar.
     */
    public static LinkedListNode findIntersection(LinkedListNode list1, LinkedListNode list2) {
        if (list1 == null || list2 == null) return null;

        Result result1 = getTailAndSize(list1);
        Result result2 = getTailAndSize(list2);

        // Si las colas son distintas, no hay interseccion
        if (result1.tail != result2.tail) {
            return null;
        }

        LinkedListNode shorter = result1.size < result2.size ? list1 : list2;
        LinkedListNode longer = result1.size < result2.size ? list2 : list1;

        // Alinear puntero de la lista mas larga
        longer = getKthNode(longer, Math.abs(result1.size - result2.size));

        // Avanzar hasta colisionar
        while (shorter != longer) {
            shorter = shorter.next;
            longer = longer.next;
        }

        return longer;
    }

    private static Result getTailAndSize(LinkedListNode list) {
        if (list == null) return null;

        int size = 1;
        LinkedListNode current = list;
        while (current.next != null) {
            size++;
            current = current.next;
        }
        return new Result(current, size);
    }

    private static LinkedListNode getKthNode(LinkedListNode head, int k) {
        LinkedListNode current = head;
        while (k > 0 && current != null) {
            current = current.next;
            k--;
        }
        return current;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N + M)` | Medir longitudes toma $N + M$; la busqueda toma como maximo $\max(N, M)$. |
| Espacio Auxiliar | `O(1)` | Utiliza punteros de referencia sin asignacion en el heap. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Recolectores de Basura y Git

1. **Recolectores de Basura (JVM / V8):** Rastrean grafos de objetos para identificar referencias compartidas y prevenir fugas de memoria.
2. **Grafos Dirigidos Acíclicos en Git:** Git resuelve bases de fusion (`merge-base`) analizando ramificaciones que convergen en commits compartidos.

## Casos Límite y Robustez en Producción

1. **Sin intersección:** Detectado en $O(N + M)$ al comparar las colas finales.
2. **Listas idénticas:** La diferencia es 0 y retorna la cabeza de inmediato.
3. **Intersección en la cabeza:** Ambos punteros colisionan en el paso 0.
