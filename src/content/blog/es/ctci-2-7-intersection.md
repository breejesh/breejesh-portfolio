---
title: "CTCI 2.7 Intersección: dónde dos listas comparten un nodo (Java)"
description: "Dadas dos listas enlazadas simples, devuelve el primer nodo compartido por referencia (no por valor). Misma cola implica fusión; alinea longitudes y camina juntos."
date: "2025-12-18"
tags: [Algoritmos]
coverImage: /assets/images/ctci-2-7-intersection.webp
previewImage: /assets/images/ctci-2-7-intersection.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Dadas dos listas enlazadas simples, devuelve el primer nodo compartido por referencia (no por valor). Misma cola implica fusión; alinea longitudes y camina juntos.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Dos caminos de pueblo. Cada uno sale de un sitio distinto. Más allá de las colinas se unen en una sola carretera y ya no se separan. Los coches de cualquiera de los dos caminos que llegan al cruce comparten cada kilómetro después. Las listas enlazadas pueden hacer lo mismo: dos cadenas de nodos, separadas al inicio, y luego un sufijo compartido de **los mismos objetos nodo**.

Este post es el problema **2.7 Intersección** de la [serie CTCI en Java](/blog/es/ctci-series-guide). Enseñanza original, no un copiado del libro. Devuelves el primer nodo compartido, o `null` si los caminos no se encuentran.

---

## Analogía cotidiana

Piensa en notas adhesivas en dos hilos. Cada nota es un **objeto nodo** en memoria. Tiene un valor y un puntero a la siguiente nota.

La intersección aquí **no** es "el mismo número aparece en ambas listas". Dos notas pueden decir `7` y ser papel distinto. Intersección significa que ambos hilos llegan en algún momento a **la misma nota exacta** (el mismo objeto en el heap). A partir de ahí, ambas listas comparten el resto de la cadena, porque los punteros `next` también son los mismos objetos.

En resumen: dos caminos, un cruce. Encuentra el primer mojón compartido.

---

## El problema en palabras simples

**Entrada:** cabezas de dos listas enlazadas simples, `list1` y `list2` (cualquiera puede ser `null`).

**Salida:** el **primer nodo compartido por referencia**, o `null` si no hay nodo compartido.

**Reglas que importan**

* Compara nodos con `==` (mismo objeto), no con `data == data`.
* Si se intersectan, comparten un sufijo completo: una vez que los punteros se unen, no se bifurcan en colas distintas.
* Las listas pueden tener longitudes distintas antes del cruce.
* No mutes las listas salvo que las restaures (esta solución no muta).

**Ejemplo (por referencia)**

```
list1:  a1 → a2 → c1 → c2 → c3
list2:  b1 → b2 → b3 → c1 → c2 → c3
```

`c1` es el mismo objeto en ambos recorridos. Respuesta: nodo `c1`. Que los valores coincidan antes no importa.

**Forma del nodo**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

---

## Cómo pensar antes de codificar

### Conjunto hash de nodos (simple, usa memoria)

1. Recorre `list1`. Mete cada **referencia de nodo** en un `HashSet<Node>` (identidad, no valor).
2. Recorre `list2`. Para cada nodo, si el conjunto ya tiene ese mismo objeto, devuélvelo.
3. Si terminas `list2` sin acierto, devuelve `null`.

Tiempo O(A + B), espacio extra O(A), donde A y B son las longitudes. Fácil de explicar. En la entrevista suelen pedir espacio extra constante a continuación.

### Preferido: misma cola + alinear longitudes (espacio O(1))

Hechos clave:

1. Si dos listas enlazadas simples se intersectan, terminan en el **mismo último nodo**. Colas distintas implican finales distintos: no hay sufijo compartido.
2. Si comparten un sufijo de longitud S, y las longitudes totales son L1 y L2, los prefijos privados miden L1 - S y L2 - S. La lista más larga tiene un prefijo privado extra de `|L1 - L2|`.

Algoritmo:

1. Recorre cada lista una vez. Cuenta la longitud y guarda el nodo **cola**.
2. Si las dos colas no son el mismo objeto, devuelve `null`.
3. Sea `diff = |len1 - len2|`. Avanza el puntero de la lista **más larga** `diff` pasos para que ambos punteros tengan el mismo número de nodos por delante.
4. Avanza ambos de uno en uno. La primera vez que `p1 == p2`, esa es la intersección.
5. Si llegas a null a la vez, algo falló en la comprobación de cola; con una cola correcta te encuentras al inicio del tramo compartido o ya has demostrado que no hay cruce.

Por qué funciona: tras alinear, ambos recorridos tienen la misma longitud restante. Cada paso sigue en nodos privados (objetos distintos) o cae en el sufijo compartido a la misma distancia. Las primeras referencias iguales son el nodo de fusión.

---

## Solución en Java

```java
/**
 * Finds the first node that appears in both lists by reference (same object).
 * Returns null if the lists do not intersect.
 */
Node findIntersection(Node list1, Node list2) {
    if (list1 == null || list2 == null) {
        return null;
    }

    TailAndSize a = getTailAndSize(list1);
    TailAndSize b = getTailAndSize(list2);

    // Different last nodes => no shared suffix.
    if (a.tail != b.tail) {
        return null;
    }

    Node shorter = a.size <= b.size ? list1 : list2;
    Node longer = a.size <= b.size ? list2 : list1;
    int diff = Math.abs(a.size - b.size);

    // Skip the extra private prefix on the longer list.
    longer = getKthNode(longer, diff);

    while (shorter != longer) {
        shorter = shorter.next;
        longer = longer.next;
    }
    return longer; // same as shorter; the merge node (or null if both empty, not our case)
}

static class TailAndSize {
    Node tail;
    int size;

    TailAndSize(Node tail, int size) {
        this.tail = tail;
        this.size = size;
    }
}

TailAndSize getTailAndSize(Node head) {
    if (head == null) {
        return new TailAndSize(null, 0);
    }
    int size = 1;
    Node current = head;
    while (current.next != null) {
        size++;
        current = current.next;
    }
    return new TailAndSize(current, size);
}

/** Returns the node k steps from head (0 = head). Assumes the list is long enough. */
Node getKthNode(Node head, int k) {
    Node current = head;
    for (int i = 0; i < k; i++) {
        current = current.next;
    }
    return current;
}
```

Recorrido del diagrama de arriba:

| Paso | Detalle |
| --- | --- |
| longitud list1 | 5, cola = c3 |
| longitud list2 | 6, cola = c3 |
| ¿colas iguales? | sí (mismo objeto) |
| diff | 1; avanza list2 un paso hasta b2 |
| caminata emparejada | (a1,b2), (a2,b3), (c1,c1) para |
| resultado | nodo c1 |

Versión con conjunto hash para contrastar:

```java
import java.util.HashSet;
import java.util.Set;

Node findIntersectionWithSet(Node list1, Node list2) {
    Set<Node> seen = new HashSet<>();
    for (Node n = list1; n != null; n = n.next) {
        seen.add(n);
    }
    for (Node n = list2; n != null; n = n.next) {
        if (seen.contains(n)) {
            return n;
        }
    }
    return null;
}
```

`HashSet` usa la identidad del objeto para `Node` salvo que sobreescribas `equals`/`hashCode`. **No** los sobreescribas para usar `data` en este problema, o emparejarás valores en lugar de referencias.

---

## Complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Alinear longitudes + caminata conjunta | O(A + B) | O(1) | Dos pases de longitud, luego una caminata conjunta |
| HashSet de nodos | O(A + B) | O(A) | Simple; menciónalo como primer borrador |
| Escaneo anidado (cada nodo de A contra todo B) | O(A · B) | O(1) | Correcto pero lento; no lo des como respuesta principal |

En el peor caso debes mirar cada nodo al menos una vez para conocer colas y longitudes, así que lineal en el total de nodos es el orden correcto.

---

## Casos límite que tocan en la entrevista

1. **Sin intersección.** Colas distintas. Devuelve `null` en cuanto termines el pase de longitud/cola. No camines sin fin.
2. **Una o ambas null.** No hay nodos que compartir. Devuelve `null`.
3. **La misma lista dos veces.** `findIntersection(head, head)` debe devolver `head` (todo se comparte; el primero compartido es la cabeza). Longitudes iguales; la caminata conjunta coincide en el primer paso.
4. **Intersección solo en el último nodo.** Sufijo compartido de longitud 1. El alineado sigue valiendo; te encuentras en ese último nodo.
5. **Intersección en la cabeza de la lista corta.** Avanzas la larga en `diff` y la primera comparación ya puede ser igual.
6. **Valores iguales, objetos distintos.** `3 → 4 → 5` y otra `3 → 4 → 5` construidas por separado: las colas son objetos distintos. Respuesta `null`. Di "por referencia" en voz alta.
7. **Longitudes muy distintas.** Un `diff` grande no importa; avanza con cuidado y no te salgas del final (la igualdad de colas ya garantiza el sufijo compartido).
8. **Ciclos.** El 2.7 clásico asume listas acíclicas. Si puede haber ciclos, primero detecta el bucle ([Detección de bucles](/blog/es/ctci-2-8-loop-detection)). Di la asunción.

---

## Errores comunes

* Comparar **valores** en lugar de identidad de nodo (`n1.data == n2.data` o un `equals` mal hecho).
* Olvidar la **comprobación de cola** y solo alinear longitudes. Dos listas separadas de la misma longitud no se encuentran; la cola falla rápido y deja clara la geometría.
* Avanzar la lista **corta** por la diferencia en lugar de la larga.
* Meter en el conjunto **valores enteros** en lugar de referencias a nodos.
* Mutar una lista para engancharla a la otra como truco y olvidar que mutar entradas en silencio no gusta en entrevistas.
* Asumir que el nodo de fusión es el primer **valor** igual en una caminata simultánea sin alinear longitudes. Errores de prefijo.

---

## Resumen para contárselo a un amigo

Dos cadenas de un solo sentido. ¿Llegan alguna vez al **mismo** objeto nodo y comparten el resto del camino?

Si sus últimos nodos difieren, nunca se fusionan. Si el último nodo es el mismo objeto, comparten un sufijo. Mide ambas longitudes, salta la ventaja de la cadena larga y camina en paralelo hasta que los punteros sean la misma referencia. Ese nodo es la intersección.

Un conjunto hash de nodos también sirve si el espacio extra no molesta. En la entrevista, lidera con la historia de alinear longitudes en espacio O(1).

---

## Práctica

1. Codifica `findIntersection` de memoria: cola + tamaño, alinear, caminar.
2. Dibuja dos listas que solo comparten el último nodo y traza los punteros.
3. Dibuja dos listas con valores iguales y sin objetos compartidos; confirma que devuelves null.
4. Explica por qué un `HashSet<Integer>` de valores es la herramienta equivocada.

Anterior: [Palíndromo](/blog/es/ctci-2-6-palindrome). Siguiente: [Detección de bucles](/blog/es/ctci-2-8-loop-detection). Mapa de la serie: [CTCI en Java](/blog/es/ctci-series-guide).