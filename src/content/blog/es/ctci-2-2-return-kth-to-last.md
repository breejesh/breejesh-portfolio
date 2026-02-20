---
title: "CTCI 2.2 Return Kth to Last: dos punteros en una lista enlazada"
description: "Encuentra el k-ésimo nodo desde el final de una lista enlazada simple. Recorre el clásico hueco de k con dos punteros y un wrapper recursivo breve, en Java claro."
date: "2026-02-20"
tags: [Algoritmos]
coverImage: /assets/images/ctci-2-2-return-kth-to-last.webp
previewImage: /assets/images/ctci-2-2-return-kth-to-last.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Encuentra el k-ésimo nodo desde el final de una lista enlazada simple. Recorre el clásico hueco de k con dos punteros y un wrapper recursivo breve, en Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tú y un amigo caminan por un sendero en fila india. Tu amigo arranca **k pasos** por delante. Cuando llega al final del camino, tú estás sobre la k-ésima piedra contando desde el final. No necesitaste la longitud total. Solo el hueco.

Eso es **Return Kth to Last**: encontrar el nodo que está a k posiciones del final de una lista enlazada simple. Definimos **k = 1 como el último elemento**.

Este es el problema estilo CTCI **2.2**, Capítulo 2 (Linked Lists). Solución principal: dos punteros iterativos. Opcional: recursivo con un wrapper de índice pequeño. Enseñanza original en Java, no un pegado del libro.

Serie: [CTCI en Java](/blog/es/ctci-series-guide). Anterior: [2.1 Remove Dups](/blog/es/ctci-2-1-remove-dups). Siguiente: [2.3 Delete Middle Node](/blog/es/ctci-2-3-delete-middle-node).

---

## Imagen cotidiana

Un tren de vagones, de cabeza a cola. Solo avanzas. No hay marcha atrás ni un número pintado en cada vagón.

Alguien pregunta: "Dame el 2.º vagón desde el furgón de cola." Si supieras la longitud n, caminarías n - 2 pasos desde la cabeza. Aún no conoces n. Contar una vez para sacar n y luego caminar otra vez funciona. También son dos pasadas completas.

Mejor: manda un explorador **k** vagones por delante. Luego mueve al explorador y a ti a la vez, un vagón cada vez. Cuando el explorador se cae al final, tu vagón es el k-ésimo desde el final.

---

## El problema en palabras simples

**Entrada:** la cabeza de una lista enlazada simple y un entero positivo `k`.

**Salida:** el nodo que es el **k-ésimo desde el final**. Con nuestra convención, `k = 1` devuelve el último nodo, `k = 2` el penúltimo, y así.

**Ejemplos** (lista dibujada cabeza → cola):

| Lista | k | Resultado | Por qué |
| --- | --- | --- | --- |
| `1 → 2 → 3 → 4 → 5` | 1 | nodo `5` | último elemento |
| `1 → 2 → 3 → 4 → 5` | 2 | nodo `4` | segundo desde el final |
| `1 → 2 → 3 → 4 → 5` | 5 | nodo `1` | k igual a la longitud |
| `1 → 2 → 3` | 4 | null (o error) | k mayor que la longitud |
| `7` | 1 | nodo `7` | un solo nodo, el último es él mismo |

**Aclara en voz alta antes de codificar:**

* ¿`k = 1` es el último nodo? (Sí aquí. Algunos equipos usan base 0. Pregunta.)
* ¿Qué pasa si `k` es mayor que la longitud? ¿null, excepción o un centinela? Elige uno. Nosotros devolvemos `null`.
* ¿Devolver el **nodo** o solo su valor? En entrevistas suele pedirse el nodo para seguir encadenando.
* ¿Cabeza null? Lista vacía → null.

---

## Cómo pensar antes de codificar

### Fuerza bruta: longitud y luego caminar

1. Recorre la lista una vez, cuenta `n`.
2. Si `k > n`, falla.
3. Recorre otra vez `n - k` pasos desde la cabeza.

Correcto. Dos pasadas. Vale si el entrevistador acepta O(n) y dos viajes. Muchos después preguntan: ¿se puede en **una** pasada?

### Una pasada: dos punteros con un hueco de k

1. Los punteros `p1` y `p2` empiezan en `head`.
2. Avanza `p1` exactamente `k` pasos. Si te caes antes, `k` es demasiado grande.
3. Avanza `p1` y `p2` juntos hasta que `p1` sea null.
4. `p2` queda en el k-ésimo desde el final.

Por qué funciona: cuando `p1` ha recorrido el resto del sufijo, `p2` se ha mantenido exactamente `k` nodos detrás del "final". El final es uno más allá del último nodo, así que `p2` está en el k-ésimo desde el final.

Traza `1 → 2 → 3 → 4 → 5`, `k = 2`:

| Paso | p1 | p2 |
| --- | --- | --- |
| inicio | 1 | 1 |
| avanza p1 una vez | 2 | 1 |
| avanza p1 dos veces | 3 | 1 |
| mueven ambos | 4 | 2 |
| mueven ambos | 5 | 3 |
| mueven ambos | null | 4 |

`p2` es `4`. Listo.

### Idea recursiva (opcional)

Recurre hasta el final. Al volver, cuenta cuántos nodos has pasado. Cuando el contador llega a `k`, ese nodo es la respuesta. Necesitas un **contador compartido** (o un wrapper pequeño), porque un `int` solo no puede llevar a la vez "el conteo" y "el nodo respuesta" en Java sin un tipo auxiliar.

La recursión queda elegante si sabes explicar la pila. Prefiere la versión iterativa de dos punteros como respuesta principal: O(1) de espacio extra, sin riesgo de pila en listas largas.

---

## Solución en Java

### Tipo Node

```java
/** Singly linked list node. Original teaching model for this series. */
public class Node {
    public int data;
    public Node next;

    public Node(int data) {
        this.data = data;
    }
}
```

### Respuesta principal: dos punteros iterativos

```java
/**
 * Returns the kth node from the end of the list.
 * k = 1 means the last node. Returns null if the list is too short
 * or inputs are invalid.
 */
public static Node kthToLast(Node head, int k) {
    if (head == null || k < 1) {
        return null;
    }

    Node p1 = head;
    Node p2 = head;

    // Open a gap of k between p1 and p2.
    for (int i = 0; i < k; i++) {
        if (p1 == null) {
            // k is larger than the number of nodes.
            return null;
        }
        p1 = p1.next;
    }

    // When p1 walks off the end, p2 is k nodes from the end.
    while (p1 != null) {
        p1 = p1.next;
        p2 = p2.next;
    }
    return p2;
}
```

Construye una lista pequeña y llámalo:

```java
// 1 → 2 → 3 → 4 → 5
Node head = new Node(1);
head.next = new Node(2);
head.next.next = new Node(3);
head.next.next.next = new Node(4);
head.next.next.next.next = new Node(5);

Node ans = kthToLast(head, 2); // data == 4
```

### Opcional: recursivo con wrapper de índice

```java
/** Mutable counter so recursion can share one index on the way back. */
static class Index {
    int value = 0;
}

/**
 * Recursive kth-to-last. Same k convention: k = 1 is the last node.
 * Uses O(n) stack space. Prefer kthToLast for production-sized lists.
 */
public static Node kthToLastRecursive(Node head, int k) {
    if (k < 1) {
        return null;
    }
    return kthToLastRecursive(head, k, new Index());
}

private static Node kthToLastRecursive(Node head, int k, Index idx) {
    if (head == null) {
        return null;
    }
    Node candidate = kthToLastRecursive(head.next, k, idx);
    idx.value += 1;
    if (idx.value == k) {
        return head;
    }
    return candidate;
}
```

Al deshacer la pila, el último nodo recibe conteo 1, el anterior 2, y así. Cuando el conteo es `k`, devuelve ese nodo. Los nodos más cerca de la cabeza siguen devolviendo el candidato que ya encontraron (o null si `k` era demasiado grande).

---

## Complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Longitud y luego caminar | O(n) | O(1) | Dos pasadas |
| Hueco de dos punteros | O(n) | O(1) | Una pasada, respuesta principal |
| Índice recursivo | O(n) | O(n) pila | Bien mencionarlo, no el default a enviar |

En el peor caso debes mirar cada nodo (o al menos lo bastante para colocar ambos punteros), así que el tiempo lineal es el orden correcto.

---

## Casos borde que tocan los entrevistadores

1. **Cabeza null.** Lista vacía. Devuelve null.
2. **k menor que 1.** Inválido. Devuelve null (o lanza). Di el contrato.
3. **k mayor que la longitud.** Antes de k avances, `p1` es null. Devuelve null.
4. **k igual a la longitud.** Tras k avances, `p1` es null. El paseo conjunto no corre. `p2` se queda en head. Correcto: head es el k-ésimo desde el final.
5. **k = 1.** Último nodo. Hueco de uno: `p1` empieza un paso adelante, ambos caminan hasta que `p1` es null, `p2` cae en el último nodo real.
6. **Un solo nodo, k = 1.** Funciona. Un solo nodo, k = 2: falla.
7. **No mutes la lista.** Este problema es de solo lectura. No toques los `next`.
8. **Off-by-one en el hueco.** El bug clásico es avanzar `k - 1` o `k + 1` por accidente. Traza k = 1 y k = n en papel antes de hablar.

---

## Errores comunes

* Contar desde el **frente** como "k-ésimo nodo" en vez del k-ésimo desde el **final**.
* Usar un modelo base 0 (`k = 0` es el último) sin decirlo. La sala se confunde.
* Avanzar el corredor `k - 1` veces cuando tu definición es k = 1 último. Quédate con "avanza k veces, luego caminan juntos hasta que el corredor sea null."
* Olvidar el chequeo de null al abrir el hueco y luego NPE si `k` es enorme.
* Devolver `p2.data` cuando pidieron el **nodo**.

---

## Resumen para contárselo a un amigo

Quieres el k-ésimo vagón desde el final y solo caminas hacia delante.

Manda un explorador **k** vagones por delante. Caminen a la par. Cuando el explorador se cae del tren, tú estás en el k-ésimo vagón desde el final. No hace falta una variable de longitud.

Versión recursiva: ve al final, cuenta al volver, agarra el nodo cuando el conteo llega a k. Misma idea, pila en vez de un segundo puntero.

Entrega la versión de dos punteros. Menciona la recursión si piden otro ángulo.

---

## Práctica

1. Codifica `kthToLast` de memoria. Traza k = 1, k = 2 y k = n sobre `1 → 2 → 3 → 4 → 5`.
2. Implementa la versión longitud-y-caminar y demuestra que ambas devuelven el mismo nodo.
3. Escribe el wrapper recursivo y explica por qué hace falta un `Index` compartido (o un `int[]`) en Java.
4. Rompe tu propio código con k = 0, lista vacía y k mayor que la longitud.

Anterior: [2.1 Remove Dups](/blog/es/ctci-2-1-remove-dups). Siguiente: [2.3 Delete Middle Node](/blog/es/ctci-2-3-delete-middle-node). Mapa de la serie: [CTCI en Java](/blog/es/ctci-series-guide).