---
title: "Palíndromo: Comprobar si una Lista Enlazada es un Palíndromo (CTCI 2.6)"
description: "Implementa un algoritmo para verificar si una lista simplemente enlazada es un palindromo utilizando punteros rapido/lento y una pila en tiempo O(N) y espacio O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-2-6-palindrome.webp
previewImage: /assets/images/ctci-2-6-palindrome.webp
---

> **TL;DR**
> * **El Problema del Libro:** Implementa una funcion para comprobar si una lista enlazada es un palindromo.
> * **La Solución Óptima:** Utiliza la tecnica de punteros rapido y lento para ubicar el centro de la lista mientras apilas los elementos de la primera mitad en una `Stack`. Si la longitud es impar, salta el elemento central y luego compara la segunda mitad desapilando elementos en tiempo $O(N)$ y espacio $O(N)$.
> * **Realidad en Producción:** Validacion de flujos unidireccionales de red y analisis de simetrias en bioinformatica.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 2.6), se nos plantea:

*"Implementa una funcion para comprobar si una lista enlazada es un palindromo."*

**Ejemplos:**
* `0 -> 1 -> 2 -> 1 -> 0 -> true`
* `0 -> 1 -> 2 -> 2 -> 1 -> 0 -> true`
* `0 -> 1 -> 2 -> 3 -> 0 -> false`

## 2. Enfoque con Punteros Rápido/Lento y Pila

Para evitar clonar toda la lista, procesamos unicamente la primera mitad:
1. Desplegamos un puntero `slow` (avanza 1 paso) y un puntero `fast` (avanza 2 pasos).
2. Mientras `slow` avanza por la primera mitad, apilamos sus valores en una `Stack<Integer>`.
3. Cuando `fast` alcanza el final:
   * Si `fast != null` (longitud impar), avanzamos `slow` un paso para omitir el centro.
4. Continuamos avanzando `slow` por la segunda mitad, desapilando y comparando:
   * Si algun valor difiere: retornamos `false`.
5. Si la pila se vacia correctamente: retornamos `true`.

## Implementación de Producción

```java
import java.util.Stack;

public class PalindromeList {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    /**
     * Comprueba si una lista es palindromo usando punteros rapido/lento y pila.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(N) (almacena N/2 elementos)
     */
    public static boolean isPalindrome(LinkedListNode head) {
        LinkedListNode fast = head;
        LinkedListNode slow = head;

        Stack<Integer> stack = new Stack<>();

        // Apilar elementos de la primera mitad
        while (fast != null && fast.next != null) {
            stack.push(slow.data);
            slow = slow.next;
            fast = fast.next.next;
        }

        // Si la longitud es impar, saltar el elemento del centro
        if (fast != null) {
            slow = slow.next;
        }

        // Comparar la segunda mitad con la pila
        while (slow != null) {
            int top = stack.pop();

            if (top != slow.data) {
                return false;
            }
            slow = slow.next;
        }

        return true;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | El puntero `fast` divide el recorrido en $N/2$ pasos; la comparacion toma $N/2$ pasos. |
| Espacio Auxiliar | `O(N)` | La pila almacena exactamente $\lfloor N/2 \rfloor$ elementos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Validación de Flujos Unidireccionales

1. **Analisis de Streams de Red:** Los motores de paquetes verifican patrones simetricos sin requerir la carga completa del payload en arrays contiguos.
2. **Repeticiones Invertidas en Genomica:** Deteccion de simetrias en cadenas de ADN.

## Casos Límite y Robustez en Producción

1. **Lista vacia (`null`):** Retorna `true`.
2. **Un solo nodo (`1`):** `fast.next == null`, pila vacia, salta centro, retorna `true`.
3. **Palindromo par (`1 -> 2 -> 2 -> 1`):** `fast == null` al terminar el bucle, compara ambas mitades.
4. **Palindromo impar (`1 -> 2 -> 1`):** `fast != null` activa el salto del nodo central.
