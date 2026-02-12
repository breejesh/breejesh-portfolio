---
title: "Loop Detection: encontrar el inicio del ciclo en una lista enlazada (Java)"
description: "Problema estilo CTCI 2.8 para principiantes: dada una lista enlazada circular, devuelve el nodo donde empieza el bucle. Tortuga y liebre de Floyd, luego el truco de resetear al head, en Java claro."
date: "2026-02-12"
tags: [Algoritmos]
coverImage: /assets/images/ctci-2-8-loop-detection.webp
previewImage: /assets/images/ctci-2-8-loop-detection.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 2.8 para principiantes: dada una lista enlazada circular, devuelve el nodo donde empieza el bucle. Tortuga y liebre de Floyd, luego el truco de resetear al head, en Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Corres por un camino que empieza recto y luego se une a un circuito circular del parque. No notas la unión hasta que ves el mismo árbol otra vez. Un amigo sale contigo y corre al doble de velocidad. Os encontraréis en algún punto de ese círculo. Lo interesante: cuando os encontráis, si tu amigo vuelve al inicio del camino y los dos camináis al mismo ritmo, volvéis a coincidir justo en la entrada del bucle. Eso es **detección de bucle** en una lista enlazada.

Este post es enseñanza original para principiantes en **Java**. Misma familia de problemas que las preguntas clásicas de ciclos en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí cierra el capítulo 2.

---

## 1. Analogía cotidiana

Piensa en una pista de running con un acceso:

* El camino de acceso es el prefijo sin bucle de la lista (desde `head` hasta el primer nodo que también está en el ciclo).
* La pista ovalada es el ciclo. Algún nodo apunta hacia atrás a un nodo anterior en lugar de terminar en `null`.
* Una **tortuga** avanza un paso cada vez. Una **liebre** avanza dos.

Si no hay óvalo, la liebre llega al final del camino (`null`) y listo: no hay bucle.

Si hay óvalo, la liebre acaba alcanzando a la tortuga en la pista. Chocan en algún nodo *dentro* del ciclo, no necesariamente el inicio. La fase dos encuentra el inicio: un corredor vuelve al principio del camino, el otro se queda en el punto de encuentro, ambos caminan de uno en uno. Su siguiente colisión es el **comienzo del bucle**.

---

## 2. Problema en palabras simples

**Entrada:** el head de una lista enlazada simple. La lista puede ser lineal o contener un ciclo (el `next` de algún nodo apunta a un nodo anterior).

**Salida:** el nodo al **comienzo del bucle**, o `null` si no hay bucle.

"Comienzo del bucle" es el primer nodo al que puedes volver siguiendo `next` para siempre. Es el nodo único que, en el dibujo del ciclo, tiene dos aristas de entrada: una desde el prefijo sin bucle (o desde sí mismo si todo el ciclo arranca en el head), y otra desde el nodo anterior del ciclo.

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

**Ejemplos (las letras son identidad de nodo, no solo valores):**

| Forma de la lista | El bucle empieza en | Por qué |
| --- | --- | --- |
| `A → B → C → D → E → C` (E apunta a C) | `C` | primer nodo del ciclo |
| `A → B → C → null` | ninguno (`null`) | lista lineal |
| `A → A` (auto-bucle) | `A` | ciclo de un solo nodo |
| `A → B → C → A` | `A` | el ciclo incluye el head |
| `null` | `null` | lista vacía |

**Aclara antes de codificar:**

* ¿Lista simple? (Sí.)
* ¿Espacio extra O(1)? (Floyd lo logra. Un HashSet de nodos visitados es más simple pero usa O(N).)
* Devuelve el objeto nodo, no solo su valor.
* ¿Se permite auto-bucle? (Sí.)

---

## 3. Pensar primero (HashSet, luego Floyd)

### Instinto bruto: recordar cada nodo visitado

Recorre desde el head. Mete cada referencia `Node` en un `HashSet`. Si `next` ya está en el set, ese nodo es el inicio del bucle. Si llegas a `null`, no hay bucle.

Tiempo O(N), espacio O(N). Válido en producción. En entrevista suelen querer la versión de espacio constante.

### Floyd: tortuga y liebre (detectar, luego localizar)

**Fase 1, detectar un punto de encuentro.**

* `slow = head`, `fast = head`
* Bucle: `slow = slow.next` (1 paso), `fast = fast.next.next` (2 pasos)
* Si `fast` o `fast.next` es `null`, no hay ciclo → devuelve `null`
* Cuando `slow == fast`, se encontraron dentro del ciclo

**Fase 2, encontrar el inicio del bucle.**

* Deja `slow` (o `fast`) en el nodo de encuentro
* Pon el otro puntero otra vez en `head`
* Avanza **ambos** un paso cada vez hasta que sean iguales
* Ese nodo es el comienzo del bucle

### Por qué funciona el reset (intuición breve)

Sea:

* `μ` = número de nodos antes de que empiece el bucle (longitud del acceso)
* `λ` = longitud del ciclo (el óvalo)
* Al encontrarse, `slow` ha caminado una distancia `μ + a` (`a` pasos pasada la entrada, con `0 ≤ a < λ`)

Como `fast` va al doble, la distancia extra que recorrió es un número entero de vueltas. Eso fuerza una identidad modular limpia: la distancia restante desde el punto de encuentro, alrededor del ciclo, hasta la entrada, equivale a `μ` módulo `λ`.

Así, si un puntero vuelve al head y ambos caminan `μ` pasos a velocidad 1, llegan juntos a la entrada. En el código no hace falta conocer `μ` ni `λ`. Basta la igualdad de los dos punteros.

No necesitas una demostración formal en la pizarra. Sí necesitas la historia: chocar en el óvalo, luego carrera desde head y punto de encuentro a la misma velocidad, colisión en la puerta.

---

## 4. Solución en Java

```java
/**
 * Returns the node at the start of the cycle, or null if the list is acyclic.
 * Floyd cycle detection: meet with tortoise/hare, then reset one pointer to head.
 */
Node findLoopStart(Node head) {
    if (head == null) {
        return null;
    }

    Node slow = head;
    Node fast = head;

    // Phase 1: do they ever meet?
    boolean met = false;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            met = true;
            break;
        }
    }

    if (!met) {
        return null; // no loop
    }

    // Phase 2: one pointer back to head; both step once until equal.
    slow = head;
    while (slow != fast) {
        slow = slow.next;
        fast = fast.next;
    }
    return slow; // beginning of the loop
}
```

Recorrido para `A → B → C → D → E → C`:

| Fase | Evento |
| --- | --- |
| Inicio | `slow` y `fast` en `A` |
| Pasos | la liebre se adelanta; ambos entran al final en `C-D-E` |
| Encuentro | colisionan en algún nodo de `{C, D, E}` (depende de las longitudes) |
| Reset | pon `slow` en `A`, deja `fast` en el nodo de encuentro |
| Mismo ritmo | ambos avanzan un nodo cada vez |
| Fin | quedan juntos en `C` |

Para un auto-bucle `A → A`: la fase 1 se encuentra en `A` tras el primer par de movimientos. La fase 2 pone `slow = head`, que también es `A`, así que `slow == fast` al instante. Devuelve `A`.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| HashSet de nodos visitados | O(N) | O(N) | Simple; el primer nodo re-visto es el inicio |
| Floyd (tortuga / liebre) | O(N) | O(1) | Dos fases; respuesta habitual en entrevista por espacio |
| Marcar nodos (campo mutado) | O(N) | O(1) | Necesita un campo escribible; malo si la lista se comparte |

N es el número de nodos distintos hasta reentrar al ciclo (o la longitud completa si es lineal). Floyd no reserva un set, así que gana cuando la memoria aprieta o prohíben buffers.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **Sin bucle** → la fase 1 llega a `null` con `fast` o `fast.next`. Devuelve `null`. No entres en la fase 2.
* **Un solo nodo, sin auto-bucle** (`A → null`) → `fast.next` es null en la primera comprobación. Sin bucle.
* **Un solo nodo con auto-bucle** (`A → A`) → el inicio es `A`. La fase 2 es igualdad inmediata tras el reset.
* **El ciclo incluye el head** (`A → B → C → A`) → el inicio es `A`.
* **Lista vacía** → devuelve `null` al inicio.
* **Ciclo de dos nodos** (`A → B → A`) → sigue funcionando; no hagas un caso especial.
* **Prefijo largo y bucle minúsculo**, o al revés → el mismo algoritmo. El tiempo sigue lineal en N.

Errores comunes:

1. **Comparar valores `data` en lugar de identidad de nodo.** Dos nodos pueden llevar el mismo `int` sin ser el mismo objeto. Usa `==` en referencias.
2. **Mover ambos punteros sin mirar `fast.next`.** Siempre guarda `fast != null && fast.next != null` antes de `fast.next.next`.
3. **Olvidar la fase 2.** El encuentro prueba que hay ciclo. **No** prueba que el nodo de encuentro sea el inicio.
4. **Avanzar a distinta velocidad en la fase 2.** Ambos deben moverse un paso. La matemática solo cierra a ritmo igual tras el reset.
5. **Devolver el punto de encuentro de la fase 1 como respuesta.** Incorrecto casi siempre, salvo suerte con las longitudes.

Entrada mínima segura con null:

```java
Node findLoopStartSafe(Node head) {
    return findLoopStart(head);
}
```

---

## 7. Resumen para contárselo a un amigo

Loop detection pregunta: si una lista enlazada simple tiene un ciclo, ¿en qué nodo empieza?

1. La tortuga da un paso, la liebre dos. Si la liebre se cae al final, no hay ciclo.
2. Si se encuentran, existe un ciclo en algún sitio a partir del head (o en el head).
3. Pon un puntero otra vez en el head. Camina ambos de uno en uno. Donde se encuentran es el inicio del bucle.
4. Por qué: la longitud del prefijo sin bucle y el desfase alrededor del ciclo se alinean cuando ambos van a la misma velocidad tras el reset. Obtienes la puerta del óvalo sin contar μ ni λ a mano.
5. Lista vacía y listas lineales devuelven null. Un auto-bucle de un nodo devuelve ese nodo.

Si puedes decirlo en treinta segundos, dibujar las dos fases y no confundir "punto de encuentro" con "inicio del bucle", dominas el problema 2.8.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Intersection](/blog/es/ctci-2-7-intersection)
* Siguiente: [Three in One](/blog/es/ctci-3-1-three-in-one)