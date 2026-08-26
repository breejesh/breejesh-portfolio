---
title: "CTCI 2.6 Palíndromo en lista enlazada en Java: invierte la segunda mitad"
description: "Comprueba si una lista enlazada simple es un palíndromo. Encuentra el medio con punteros lento y rápido, invierte la segunda mitad, compara y restaura si hace falta. O(n) tiempo, O(1) espacio."
date: "2026-04-01"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-2-6-palindrome.webp
previewImage: /assets/images/ctci-2-6-palindrome.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Comprueba si una lista enlazada simple es un palíndromo. Encuentra el medio con punteros lento y rápido, invierte la segunda mitad, compara y restaura si hace falta. O(n) tiempo, O(1) espacio.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un **palíndromo** se lee igual hacia adelante y hacia atrás. En un string es fácil: dos punteros en los extremos y caminas hacia el centro. Una **lista enlazada simple** solo camina hacia adelante. No hay `prev`, y el acceso aleatorio cuesta un recorrido completo. Así que la versión de entrevista de "¿es esta lista un palíndromo?" te obliga a inventar estructura que no te dan gratis.

Este es el problema **2.6** del estilo *Cracking the Coding Interview* (listas enlazadas). Enseñanza original, no un pegado de libro.

---

## Imagen cotidiana

Imagina una fila de notas adhesivas en una cinta larga: `1 → 2 → 3 → 2 → 1`. Quieres saber si al doblar la cinta por la mitad cada nota coincidiría con su espejo.

No puedes voltear toda la cinta sin perder el orden de la primera mitad. Movimiento práctico:

1. Encuentra el pliegue (el medio de la lista).
2. Voltea solo la segunda mitad para que apunte de vuelta hacia el medio.
3. Camina ambas mitades desde la cabeza y desde el nuevo inicio de la mitad volteada. Cada par de valores debe coincidir.
4. Si la lista debe quedar como antes, vuelve a voltear la segunda mitad para restaurarla.

Ese es todo el plan: **encontrar el medio, invertir la segunda mitad, comparar, restaurar si hace falta**.

---

## Problema en palabras simples

**Entrada:** cabeza de una lista enlazada simple con valores enteros (o cualquier dato comparable).

**Salida:** `true` si la secuencia de valores es un palíndromo; si no, `false`.

**Ejemplos**

| Lista | Respuesta | Por qué |
| --- | --- | --- |
| `1 → 2 → 2 → 1` | `true` | Longitud par; las dos mitades coinciden |
| `1 → 2 → 3 → 2 → 1` | `true` | Longitud impar; el centro `3` queda solo |
| `1 → 2 → 3` | `false` | Los extremos no coinciden |
| `7` | `true` | Un solo nodo |
| vacía / `null` | `true` (elección típica de enseñanza) | La secuencia vacía es palíndromo |

**Aclara en la entrevista**

* ¿Puedes mutar la lista temporalmente? (Esta solución lo hace y luego restaura.)
* Null y vacía: ¿`true` o lanzar excepción?
* Valores: ¿solo dígitos o enteros generales?

Devuelves un booleano. No te piden imprimir el reverso ni reconstruir una lista nueva como respuesta final.

---

## Cómo pensar antes de codificar

### Pila o copia (válido, no es la estrella)

Empuja cada valor a una pila, o copia a un array, y compara en un segundo pase desde la cabeza. Tiempo O(n), espacio extra O(n). Menciónalo. A menudo piden mejor espacio a continuación.

La comparación recursiva también funciona y es elegante, pero la pila de llamadas sigue siendo O(n) en una lista larga. Misma clase de espacio que la pila explícita.

### Enfoque principal: invertir la segunda mitad (O(1) espacio extra)

1. **Encuentra el medio** con dos punteros: `slow` avanza un nodo, `fast` avanza dos. Cuando `fast` no puede dar dos pasos más, `slow` queda en el último nodo de la primera mitad (longitud par) o en el centro (longitud impar).
2. **Invierte** la lista que empieza en `slow.next`. Reverse clásico de tres punteros: `prev`, `curr`, `next`.
3. **Compara** desde `head` y desde la segunda mitad invertida, nodo a nodo, hasta que termine la segunda mitad. En longitud impar, el nodo central no se compara con un par, y eso es correcto.
4. **Restaura** (opcional pero buena higiene): vuelve a invertir la segunda mitad y reengánchala en `slow.next` para que el llamador vea el orden original.

Por qué basta: un palíndromo se define por pares que coinciden alrededor del centro. Tras invertir la mitad trasera, esos pares quedan en posiciones alineadas en dos recorridos hacia adelante.

---

## Solución Java: medio, invertir, comparar, restaurar

```java
public class LinkedListPalindrome {

    public static class ListNode {
        int val;
        ListNode next;

        ListNode(int val) {
            this.val = val;
        }
    }

    /**
     * Returns true if the list values form a palindrome.
     * Temporarily reverses the second half, then restores it.
     */
    public static boolean isPalindrome(ListNode head) {
        if (head == null || head.next == null) {
            return true;
        }

        // 1. Middle: slow ends at end of first half (even) or at center (odd)
        ListNode slow = head;
        ListNode fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        // 2. Reverse second half
        ListNode secondHalf = reverse(slow.next);

        // 3. Compare first half with reversed second half
        ListNode p1 = head;
        ListNode p2 = secondHalf;
        boolean ok = true;
        while (p2 != null) {
            if (p1.val != p2.val) {
                ok = false;
                break;
            }
            p1 = p1.next;
            p2 = p2.next;
        }

        // 4. Restore list
        slow.next = reverse(secondHalf);
        return ok;
    }

    private static ListNode reverse(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome(list(1, 2, 2, 1)));       // true
        System.out.println(isPalindrome(list(1, 2, 3, 2, 1)));    // true
        System.out.println(isPalindrome(list(1, 2, 3)));          // false
        System.out.println(isPalindrome(list(7)));                // true
        System.out.println(isPalindrome(null));                   // true
    }

    private static ListNode list(int... vals) {
        ListNode dummy = new ListNode(0);
        ListNode t = dummy;
        for (int v : vals) {
            t.next = new ListNode(v);
            t = t.next;
        }
        return dummy.next;
    }
}
```

### Recorrido: `1 → 2 → 3 → 2 → 1`

| Paso | Qué pasa |
| --- | --- |
| Medio | `slow` cae en `3` (centro). `fast` no puede dar dos pasos más. |
| Invertir | La segunda mitad `2 → 1` pasa a `1 → 2`. Forma: primera mitad sigue `1 → 2 → 3`, luego la cola invertida. |
| Comparar | `1` vs `1`, `2` vs `2`. Termina la segunda mitad. Coincide. |
| Restaurar | Invierte `1 → 2` de nuevo a `2 → 1` y lo cuelga tras `3`. Lista original otra vez. |

### Recorrido: `1 → 2 → 2 → 1` (par)

| Paso | Qué pasa |
| --- | --- |
| Medio | La condición del bucle para con `slow` en el primer `2` (fin de la primera mitad). |
| Invertir | La segunda mitad `2 → 1` pasa a `1 → 2`. |
| Comparar | `1` vs `1`, `2` vs `2`. Coincide. |
| Restaurar | Vuelve a colocar la segunda mitad. |

Longitud impar salta el centro al comparar. Longitud par compara dos mitades del mismo tamaño. El mismo camino de código cubre ambos.

---

## Tiempo y espacio

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Invertir segunda mitad | O(n) | O(1) | Respuesta principal; muta y restaura |
| Pila de valores | O(n) | O(n) | Simple; buen primer borrador |
| Copia a array + dos punteros | O(n) | O(n) | Misma idea que la pila |
| Recursión (pila implícita) | O(n) | O(n) marcos de llamada | Código limpio, no espacio constante |

Encontrar el medio es un pase. Invertir es proporcional a la mitad. Comparar es otro medio pase. Restaurar es otra inversión. En total lineal, solo punteros extra constantes.

---

## Casos límite que tocan en entrevista

* **Longitud impar:** el nodo central no tiene par. No lo compares con nada. La lógica del medio lo deja en la primera mitad y empieza el reverse en `slow.next`.
* **Longitud par:** dos mitades iguales. Mismo bucle; sin centro suelto.
* **Un solo nodo:** retorno temprano `true`.
* **Dos nodos:** `1 → 1` es true; `1 → 2` es false. El medio deja `slow` en el primero; inviertes y comparas un par.
* **Cabeza null:** trátalo como `true` (o defínelo y cúmplelo).
* **No mutar de forma permanente:** restaura tras comparar. Si prohíben cualquier mutación, usa pila/copia y dilo.
* **Estructura compartida / lectores concurrentes:** mutar aunque sea un instante no es seguro. Dilo en voz alta si la lista se comparte.

La mitad de los bugs aquí son un off-by-one en el medio (empezar el reverse un nodo antes o después) y olvidar restaurar cuando el enunciado exige la lista original.

---

## Errores comunes

1. **Pensar con dos punteros de string** sin forma de ir hacia atrás en una lista simple.
2. **Medio mal:** invertir desde el centro en longitud par y comparar longitudes desalineadas.
3. **Olvidar restaurar** tras un reverse destructivo.
4. **Comparar más allá de la segunda mitad** o tratar el centro como si tuviera gemelo.
5. **Afirmar O(1) de espacio** usando recursión sin reconocer la pila de llamadas.

---

## Explícaselo a un amigo

Te dan una cadena de valores en un solo sentido. ¿Se lee igual hacia adelante y hacia atrás?

Dobla por el medio. Voltea solo la mitad de atrás para que apunte al otro lado. Camina desde el frente y desde la mitad volteada: cada par debe coincidir. Vuelve a voltear la mitad de atrás si necesitas la cadena restaurada.

En Java: lento/rápido para el medio, invierte la segunda mitad, compara, invierte de nuevo para limpiar. Eso es O(n) tiempo y O(1) espacio extra. Una pila también vale si la memoria extra está bien.

Anterior en la serie: [Sum Lists](/blog/es/ctci-2-5-sum-lists). Siguiente: [Intersection](/blog/es/ctci-2-7-intersection). Mapa de la serie: [CTCI en Java](/blog/es/ctci-series-guide).