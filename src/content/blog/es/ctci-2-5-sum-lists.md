---
title: "Sumar Listas: Suma de Números Representados por Listas Enlazadas (CTCI 2.5)"
description: "Suma dos numeros almacenados en orden inverso y directo en listas simplemente enlazadas, gestionando el acarreo recursivamente en tiempo O(N) y espacio O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-2-5-sum-lists.webp
previewImage: /assets/images/ctci-2-5-sum-lists.webp
---

> **TL;DR**
> * **El Problema del Libro:** Tienes dos numeros representados por listas enlazadas donde cada nodo contiene un solo digito almacenado en orden inverso. Escribe una funcion que sume ambos numeros. *Pregunta de seguimiento:* Resuelve el problema cuando los digitos estan almacenados en orden directo.
> * **La Solución Óptima:** (1) Orden inverso: Sumador recursivo/iterativo con propagacion de acarreo (`carry`) en tiempo $O(\max(N, M))$; (2) Orden directo: Relleno con ceros a la izquierda, recursion hasta la cola y propagacion ascendente del acarreo.
> * **Realidad en Producción:** Aritmetica de precision arbitraria (BigInteger), contabilidad financiera de alta precision y criptografia asimetrica.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 2.5), se nos plantea:

*"Tienes dos numeros representados por una lista enlazada, donde cada nodo contiene un solo digito. Los digitos estan almacenados en orden inverso, de modo que el digito de las unidades esta en la cabeza. Escribe una funcion que sume ambos numeros y devuelva el resultado como una lista enlazada."*

**Ejemplo (Orden Inverso):**
* Entrada: `(7 -> 1 -> 6)` + `(5 -> 9 -> 2)`. Es decir, $617 + 295$.
* Salida: `2 -> 1 -> 9`. Es decir, $912$.

**Pregunta de Seguimiento (Orden Directo):**
* Entrada: `(6 -> 1 -> 7)` + `(2 -> 9 -> 5)`. Es decir, $617 + 295$.
* Salida: `9 -> 1 -> 2`. Es decir, $912$.

## 2. Suma en Orden Inverso (Sumador Completo Recursivo)

Dado que los digitos comienzan con las unidades en la cabeza:
1. Sumamos los digitos correspondientes mas el acarreo: `valor = (l1.data + l2.data + carry) % 10`.
2. Calculamos el nuevo acarreo: `carry = (l1.data + l2.data + carry) / 10`.
3. Llamamos recursivamente a `addLists(l1.next, l2.next, carry)`.
4. Caso base: Si ambos nodos son `null` y `carry == 0`, finalizamos.

## 3. Seguimiento en Orden Directo (Relleno y Recursión Post-Orden)

En orden directo (MSB en la cabeza), no podemos sumar desde la cabeza si las listas tienen longitudes distintas:
1. Calculamos las longitudes de ambas listas.
2. Rellenamos la lista mas corta con ceros a la izquierda.
3. Recorremos recursivamente hasta el final para sumar primero las unidades.
4. Al retornar en la pila, creamos el nodo suma y propagamos el acarreo hacia arriba mediante una estructura auxiliar `PartialSum`.
5. Si queda acarreo final, insertamos un nodo al frente.

## Implementación de Producción

```java
public class SumLists {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    // Parte 1: Suma en Orden Inverso
    public static LinkedListNode addListsReverse(LinkedListNode l1, LinkedListNode l2, int carry) {
        if (l1 == null && l2 == null && carry == 0) {
            return null;
        }

        int value = carry;
        if (l1 != null) value += l1.data;
        if (l2 != null) value += l2.data;

        LinkedListNode result = new LinkedListNode(value % 10);

        if (l1 != null || l2 != null) {
            LinkedListNode more = addListsReverse(
                l1 == null ? null : l1.next,
                l2 == null ? null : l2.next,
                value >= 10 ? 1 : 0
            );
            result.next = more;
        }

        return result;
    }

    // Parte 2: Seguimiento en Orden Directo
    private static class PartialSum {
        public LinkedListNode sum = null;
        public int carry = 0;
    }

    public static LinkedListNode addListsForward(LinkedListNode l1, LinkedListNode l2) {
        int len1 = length(l1);
        int len2 = length(l2);

        if (len1 < len2) l1 = padList(l1, len2 - len1);
        else l2 = padList(l2, len1 - len2);

        PartialSum sum = addListsHelper(l1, l2);

        if (sum.carry == 0) return sum.sum;
        else {
            LinkedListNode result = insertBefore(sum.sum, sum.carry);
            return result;
        }
    }

    private static PartialSum addListsHelper(LinkedListNode l1, LinkedListNode l2) {
        if (l1 == null && l2 == null) return new PartialSum();

        PartialSum sum = addListsHelper(l1.next, l2.next);
        int val = sum.carry + l1.data + l2.data;

        LinkedListNode full_result = insertBefore(sum.sum, val % 10);
        sum.sum = full_result;
        sum.carry = val / 10;
        return sum;
    }

    private static int length(LinkedListNode n) {
        int count = 0;
        while (n != null) { count++; n = n.next; }
        return count;
    }

    private static LinkedListNode padList(LinkedListNode l, int padding) {
        LinkedListNode head = l;
        for (int i = 0; i < padding; i++) head = insertBefore(head, 0);
        return head;
    }

    private static LinkedListNode insertBefore(LinkedListNode list, int data) {
        LinkedListNode node = new LinkedListNode(data);
        if (list != null) node.next = list;
        return node;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(max(N, M))` | Recorre las listas de longitudes $N$ y $M$ de manera lineal. |
| Espacio Auxiliar | `O(max(N, M))` | La lista resultante contiene $\max(N, M) + 1$ nodos mas la pila de recursion. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: BigInteger y Calculo Criptografico

1. **Librerias de Precision Arbitraria (GMP, Java BigInteger):** Las operaciones aritmeticas sobre claves RSA de 2048 bits se realizan encadenando bloques de bits con propagacion de acarreo.
2. **Sistemas Contables de Alta Precision:** Previenen los errores de redondeo de punto flotante IEEE 754.

## Casos Límite y Robustez en Producción

1. **Listas de diferente longitud (`9->9` + `1`):** El acarreo expande correctamente la lista (`0->0->1`).
2. **Acarreo final en el digito mas significativo:** Agrega un nuevo nodo en cabeza.
