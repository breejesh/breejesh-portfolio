---
title: "Sort Stack: ordenar una pila con una pila temporal (Java)"
description: "Problema estilo CTCI 3.5 para principiantes: ordena una pila para que los valores más pequeños queden arriba. Solo una pila extra. Pensamiento tipo insertion sort en Java claro."
date: "2025-11-28"
tags: [Algoritmos]
coverImage: /assets/images/ctci-3-5-sort-stack.webp
previewImage: /assets/images/ctci-3-5-sort-stack.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 3.5 para principiantes: ordena una pila para que los valores más pequeños queden arriba. Solo una pila extra. Pensamiento tipo insertion sort en Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes un montón desordenado de platos. Solo puedes levantar el plato de arriba, y te dejan una mesa auxiliar vacía. Quieres el plato más ligero arriba al terminar (el valor más pequeño en la cima). No puedes alinearlos en el suelo. No hay un tercer montón. Esa restricción es todo el enigma de **sort stack**.

Este post es enseñanza original para principiantes en **Java**. Misma familia de problemas que las preguntas clásicas de ordenar con pilas en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 3, pilas y colas.

---

## 1. Analogía cotidiana

Piensa en dos montones de cartas numeradas:

* **Pila origen `s`**: el montón desordenado que debes dejar ordenado (al final vuelves a rellenar `s` con la respuesta).
* **Pila temporal `r`**: tu única mesa auxiliar. Guarda cartas en un orden ordenado que va creciendo.
* Solo puedes hacer push, pop y peek en la cima. Sin arrays, sin listas, sin mapas.

El truco se siente como **insertion sort**. Sacas una carta de `s`. Aparcas en `s` las cartas más grandes de `r` hasta que quepa. La dejas en `r`. Repites. Cuando `s` está vacía, vuelcas `r` otra vez sobre `s` para que el orden quede como quieres.

---

## 2. Problema en palabras simples

**Entrada:** una pila de enteros (o valores comparables). La cima es lo que devuelve `pop`.

**Salida:** la misma pila, ordenada de modo que los valores **más pequeños** quedan **arriba**. Los grandes se hunden hacia el fondo.

**Reglas:**

* Puedes usar **una** pila temporal adicional.
* No puedes usar arrays, listas enlazadas, árboles u otras colecciones como buffer.
* Puedes usar constantes y unas pocas variables locales (el valor que tienes en la mano).

**Ejemplos** (el valor más a la derecha es la cima):

| Antes (fondo → cima) | Después (fondo → cima) | Cima final |
| --- | --- | --- |
| `3, 1, 4, 2` | `4, 3, 2, 1` | 1 |
| `5` | `5` | 5 |
| vacía | vacía | n/a |
| `2, 2, 1` | `2, 2, 1` | 1 |
| `1, 2, 3` (cima 3) | `3, 2, 1` | 1 |

Si fondo→cima es `1, 2, 3`, la cima es 3 (el mayor). Tras ordenar, fondo→cima es `3, 2, 1` y la cima es 1 (el menor).

**Aclara antes de codificar:**

* ¿Más pequeño arriba, o más grande arriba? (Aquí: **más pequeño arriba**.)
* ¿Se permiten duplicados? (Sí. No se pide estabilidad entre iguales.)
* ¿Recursión? La recursión es una pila implícita. Suele pedirse la versión iterativa con una pila temporal explícita.
* ¿Mutar la pila dada o devolver otra? Mutar rellenando `s` al final.

---

## 3. Piensa primero (insertion sort con pila temporal)

### Lo que no puedes hacer

Vaciar todo en un array, llamar a `Arrays.sort` y volver a apilar. Rompe la regla de "sin otras estructuras".

### Idea de inserción

Mantén la pila temporal `r` ordenada con el **mayor arriba** (y el menor en el fondo de `r`). Luego:

1. Saca `tmp` de `s`.
2. Mientras `r` no esté vacía y `r.peek() > tmp`, saca de `r` y empuja esos valores otra vez a `s`. Son demasiado grandes para quedar bajo `tmp` en `r`.
3. Empuja `tmp` a `r`. Ahora `r` sigue con el mayor arriba entre su contenido actual.
4. Repite hasta que `s` esté vacía.
5. Saca todo de `r` hacia `s`. Cada pop pone el siguiente más grande en `s`, así que al terminar el **más pequeño queda arriba de `s`**.

¿Por qué aparcar valores grandes otra vez en `s`? Porque solo tienes una pila temporal. La pila origen es el único aparcamiento legal. Esos valores se reinsertarán después, igual que insertion sort vuelve a mirar elementos.

### Recorrido: fondo → cima `3, 1, 4, 2` (cima es 2)

| Paso | `tmp` | Acción | `s` (fondo → cima) | `r` (fondo → cima) |
| --- | --- | --- | --- | --- |
| inicio | | | `3, 1, 4, 2` | vacía |
| 1 | 2 | `r` vacía, push 2 | `3, 1, 4` | `2` |
| 2 | 4 | `2 > 4`? no, push 4 | `3, 1` | `2, 4` |
| 3 | 1 | `4 > 1`, aparca 4 en `s`; `2 > 1`, aparca 2 en `s`; push 1 | `3, 4, 2` | `1` |
| 4 | 2 | `1 > 2`? no, push 2 | `3, 4` | `1, 2` |
| 5 | 4 | `2 > 4`? no, push 4 | `3` | `1, 2, 4` |
| 6 | 3 | `4 > 3`, aparca 4 en `s`; `2 > 3`? no, push 3 | `4` | `1, 2, 3` |
| 7 | 4 | `3 > 4`? no, push 4 | vacía | `1, 2, 3, 4` |
| copia | | vuelca `r` → `s` | `4, 3, 2, 1` | vacía |

Cima de `s` es 1. Listo.

---

## 4. Solución en Java

Usa `java.util.Stack` para enseñar, o cualquier LIFO con `push`, `pop`, `peek`, `isEmpty`.

```java
import java.util.Stack;

/**
 * Sorts stack so smallest values end on top.
 * Uses one temporary stack. Insertion-sort style moves.
 */
void sortStack(Stack<Integer> s) {
    Stack<Integer> r = new Stack<Integer>();

    while (!s.isEmpty()) {
        int tmp = s.pop();

        // Park larger values back onto s so tmp can sit on r.
        while (!r.isEmpty() && r.peek() > tmp) {
            s.push(r.pop());
        }
        r.push(tmp);
    }

    // r has largest on top. Reverse onto s so smallest ends on top.
    while (!r.isEmpty()) {
        s.push(r.pop());
    }
}
```

Si el problema pide el **mayor arriba**, invierte la comparación a `r.peek() < tmp` y replantea la copia final, o ordena con el menor arriba y luego invierte con las mismas dos pilas. Confirma el orden pedido en voz alta antes de codificar.

Boceto mínimo de prueba:

```java
Stack<Integer> s = new Stack<Integer>();
s.push(3);
s.push(1);
s.push(4);
s.push(2); // top is 2
sortStack(s);
// pop order: 1, 2, 3, 4
```

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Pila temporal (estilo insertion) | O(N²) peor caso | O(N) para la pila temporal | Cada uno de los N valores puede ir y volver muchas veces |
| Ya casi ordenado (suerte) | cerca de O(N) | O(N) | Pocos aparcamientos si el orden ayuda |
| Vaciar a array + sort (prohibido aquí) | O(N log N) | O(N) | Rompe la regla de una sola pila extra |

N es el número de elementos. El peor caso parece una entrada "al revés" con mucho aparcamiento. El espacio extra es la segunda pila de hasta N elementos, más O(1) locales. Con solo LIFO y sin trucos de profundidad recursiva, no bajas de O(N) de espacio auxiliar si debes reordenar todo.

---

## 6. Casos límite y errores comunes

Los entrevistadores pinchan aquí:

* **Pila vacía** → ambos bucles no hacen nada. Bien.
* **Un solo elemento** → pop a `r`, push de vuelta a `s`. Correcto.
* **Todos iguales** → `r.peek() > tmp` nunca es cierto con `>` estricto. Los duplicados se quedan. Bien.
* **Ya el menor arriba** → aun así puede reordenar vía `r`. Primero corrección; la salida temprana es opcional.
* **Cimas estrictamente decrecientes** → muchos aparcamientos. Sigue siendo O(N²) y correcto.
* **Negativos y ceros** → la comparación funciona igual con `Integer`.

Errores comunes:

1. **Comparación al revés.** `r.peek() < tmp` construye el orden opuesto en `r`. Acabarás con el mayor arriba en `s` tras la copia, o con un desastre si mezclas condiciones.
2. **Olvidar el volcado final.** Dejar la respuesta en `r` falla si el llamador sigue mirando `s`.
3. **Usar otro tipo de buffer.** Un `ArrayList` como aparcamiento viola el enunciado aunque el código "funcione".
4. **Comparar tras un pop sin peek.** Haz peek (o guarda el valor) antes de decidir mover de `r` a `s`.
5. **Bucle infinito.** Si empujas `tmp` otra vez a `s` por error dentro del bucle exterior sin progreso, giras para siempre. Mantén `tmp` en una variable local hasta que aterrice en `r`.

Entrada segura si la API admite pila nula:

```java
void sortStackSafe(Stack<Integer> s) {
    if (s == null) {
        return;
    }
    sortStack(s);
}
```

---

## 7. Resumen para contárselo a un amigo

Sort stack pide: reordena una pila para que los valores más pequeños queden arriba, usando solo una pila extra.

1. Usa una pila temporal `r`. Hazla crecer con el **mayor arriba en `r`**.
2. Saca un valor `tmp` de la pila de entrada.
3. Mientras la cima de `r` sea mayor que `tmp`, aparca esos valores grandes otra vez en la pila de entrada.
4. Empuja `tmp` a `r`. Repite hasta vaciar la entrada.
5. Vuelca `r` sobre la pila de entrada. El reverse deja el **menor arriba**.

Es insertion sort disfrazado de pila. Tiempo O(N²), espacio extra O(N) por la pila auxiliar. Vacío, un elemento y duplicados salen de los mismos bucles.

Si puedes decirlo en treinta segundos, dibujar el movimiento aparcar-e-insertar, y no "hacer trampa" con un array, dominas el problema 3.5.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Queue via Stacks](/blog/es/ctci-3-4-queue-via-stacks)
* Siguiente: [Animal Shelter](/blog/es/ctci-3-6-animal-shelter)