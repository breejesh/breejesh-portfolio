---
title: "Sum Lists: sumar números guardados como listas enlazadas (Java)"
description: "Problema estilo CTCI 2.5: dos números viven como listas enlazadas, un dígito por nodo, el dígito menos significativo en la cabeza. Recorre ambas con acarreo y construye la lista suma. Nota breve del follow-up en orden directo."
date: "2025-12-22"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-2-5-sum-lists.webp
previewImage: /assets/images/ctci-2-5-sum-lists.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 2.5: dos números viven como listas enlazadas, un dígito por nodo, el dígito menos significativo en la cabeza. Recorre ambas con acarreo y construye la lista suma. Nota breve del follow-up en orden directo.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Sumas dos números grandes en papel como te enseñaron en el colegio: los alineas a la **derecha**, empiezas por las unidades, escribes un dígito y pasas un acarreo a la izquierda. Los dígitos viven en columnas. El acarreo es un poco de memoria entre columnas.

Ahora mete cada dígito en un nodo de una lista enlazada simple, y pon el **dígito de las unidades en la cabeza**. Recorrer la lista es exactamente recorrer columnas de derecha a izquierda en el papel. Eso es **Sum Lists**.

Este post es enseñanza original para principiantes en **Java**. Misma familia de problemas que la suma clásica con listas en entrevistas, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide).

---

## Analogía cotidiana

Dos tickets, cada número escrito dígito a dígito en notas adhesivas:

* `7 → 1 → 6` significa **617** (7 unidades, 1 decena, 6 centenas).
* `5 → 9 → 2` significa **295**.

Súmalos como en el papel:

| Columna | Dígitos | Suma + acarreo in | Escribes | Acarreo out |
| --- | --- | --- | --- | --- |
| unidades | 7 + 5 | 12 | 2 | 1 |
| decenas | 1 + 9 | 11 | 1 | 1 |
| centenas | 6 + 2 | 9 | 9 | 0 |

Resultado en papel: **912**. Como lista inversa: `2 → 1 → 9`.

La lista ya guarda los dígitos en el orden de la suma. No inviertes primero. Solo recorres y acarreas.

---

## El problema en palabras simples

**Entrada:** cabezas de dos listas enlazadas simples. Cada nodo guarda un dígito `0-9`. Los dígitos van en **orden inverso**: la cabeza es el lugar de las unidades.

**Salida:** cabeza de una lista nueva con la suma, también en orden inverso (unidades en la cabeza).

**Forma del nodo que usamos:**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

**Ejemplos:**

| Lista A | Lista B | Números | Lista suma | Por qué |
| --- | --- | --- | --- | --- |
| `7 → 1 → 6` | `5 → 9 → 2` | 617 + 295 | `2 → 1 → 9` | 912 |
| `9 → 9` | `1` | 99 + 1 | `0 → 0 → 1` | 100; el acarreo final se vuelve un nodo |
| `1 → 2` | `3 → 4 → 5` | 21 + 543 | `4 → 6 → 5` | longitudes distintas; 564 |
| `0` | `0` | 0 + 0 | `0` | sigue habiendo un dígito |
| `null` | `5 → 1` | vacío como 0 | `5 → 1` | un lado vacío |

**Aclara antes de codificar** (dilo en voz alta):

* El orden inverso (unidades en la cabeza) es el problema principal. El orden directo es follow-up.
* ¿Solo dígitos o ints completos? Dígitos `0-9` por nodo.
* ¿Puede estar vacía o ser null alguna lista?
* ¿Nodos nuevos o mutar una entrada? Prefiere **nodos nuevos** para no destruir las entradas.
* ¿Ceros a la izquierda en el número conceptual? Suele ser entrada limpia; igual maneja el acarreo sobrante.

---

## Cómo pensar antes de codificar

### Qué no hacer primero

No conviertas cada lista a `int` o `long`, sumes y reconstruyas. Eso falla con números más largos que 64 bits, y esa es buena parte del punto de las listas de dígitos. Los entrevistadores lo notan.

### Orden inverso: igual que la suma en papel

Mantén tres cosas:

1. Puntero a la lista A.
2. Puntero a la lista B.
3. Un entero `carry` (0 o 1 en base 10; en general 0 o 1 si los dígitos son 0-9).

Cada paso:

```
sum = carry
if A not null: sum += A.data; A = A.next
if B not null: sum += B.data; B = B.next
digit = sum % 10
carry = sum / 10
append a new node with digit
```

Sigue mientras **alguna lista tenga nodos o el acarreo no sea cero**. Esa última cláusula es cómo `99 + 1` crece un tercer dígito.

Usa una **cabeza dummy** para que el primer dígito real sea siempre `dummy.next`. Sin caso especial para el primer append.

### Versión recursiva (misma idea)

Base: ambas null y carry 0 → devuelve null. Si no, calcula la suma de las cabezas actuales (o 0 si null) más carry, crea un nodo con `sum % 10`, y pon `next` a la llamada recursiva sobre las colas con el nuevo carry. Misma complejidad, profundidad de pila O(longitud máxima).

Iterativo con cabeza dummy suele quedar más limpio en Java. Cualquiera vale si el acarreo está bien.

### Idea del follow-up: orden directo (unidades en la cola)

Ahora las cabezas son los dígitos más significativos. La suma en papel quiere primero el menos significativo, así que el orden te pelea.

Plan corto (no hace falta código de producción completo aquí):

1. Calcula longitudes de ambas listas.
2. **Rellena** la más corta con ceros a la izquierda (nodos nuevos, o relleno conceptual en la recursión) para igualar longitudes.
3. Recurre hasta el final, suma al volver, devolviendo la lista parcial y el acarreo (objeto wrapper o clase pequeña de resultado).
4. Si queda acarreo final, antepone un nuevo dígito en la cabeza.

Puedes invertir ambas entradas, llamar a la solución en orden inverso, e invertir el resultado. Funciona y se explica fácil. A veces quieren pad-and-recurse para sumar sin mutar el orden.

El foco de este artículo sigue siendo el orden inverso.

---

## Solución Java (orden inverso, iterativa)

```java
/**
 * Adds two numbers stored as reverse-order digit lists.
 * Example: 7→1→6 + 5→9→2 represents 617 + 295 → 2→1→9 (912).
 */
Node sumLists(Node l1, Node l2) {
    Node dummy = new Node(0);
    Node tail = dummy;
    int carry = 0;

    while (l1 != null || l2 != null || carry != 0) {
        int sum = carry;
        if (l1 != null) {
            sum += l1.data;
            l1 = l1.next;
        }
        if (l2 != null) {
            sum += l2.data;
            l2 = l2.next;
        }

        tail.next = new Node(sum % 10);
        tail = tail.next;
        carry = sum / 10;
    }

    return dummy.next;
}
```

Recorrido de `7 → 1 → 6` y `5 → 9 → 2`:

| Paso | dígito l1 | dígito l2 | carry in | sum | escribe | carry out | resultado hasta ahora |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 7 | 5 | 0 | 12 | 2 | 1 | `2` |
| 2 | 1 | 9 | 1 | 11 | 1 | 1 | `2 → 1` |
| 3 | 6 | 2 | 1 | 9 | 9 | 0 | `2 → 1 → 9` |
| 4 | - | - | 0 | stop | | | listo |

Esbozo recursivo (mismo contrato de orden inverso):

```java
Node sumListsRecursive(Node l1, Node l2, int carry) {
    if (l1 == null && l2 == null && carry == 0) {
        return null;
    }

    int sum = carry;
    if (l1 != null) {
        sum += l1.data;
    }
    if (l2 != null) {
        sum += l2.data;
    }

    Node result = new Node(sum % 10);
    Node next1 = (l1 == null) ? null : l1.next;
    Node next2 = (l2 == null) ? null : l2.next;
    result.next = sumListsRecursive(next1, next2, sum / 10);
    return result;
}

// Public entry: sumListsRecursive(a, b, 0)
```

---

## Orden directo en un pase corto

Si los dígitos van de más a menos significativo (`6 → 1 → 7` para 617):

* Opción A: invierte ambas, `sumLists`, invierte la respuesta.
* Opción B: rellena la más corta, recurre a las colas, suma al deshacer la pila, envuelve acarreo + nodo en una clase helper, antepone el acarreo sobrante.

La opción A reutiliza el código de arriba. La B es el follow-up clásico "sin invertir". Con nombrar una de las dos en la entrevista basta antes de escribir bien el orden inverso.

---

## Complejidad

| | Coste | Por qué |
| --- | --- | --- |
| Tiempo | O(max(m, n)) | Un pase por ambas listas; como mucho un nodo extra por el acarreo final |
| Espacio extra (iterativo) | O(max(m, n)) para la salida | El tamaño de salida es la longitud de la suma; los punteros auxiliares son O(1) |
| Espacio extra (recursivo) | O(max(m, n)) pila + salida | La profundidad sigue la lista más larga |

No puedes batir lo lineal en la longitud de entrada: cada dígito puede afectar la suma.

---

## Casos límite que tocan en la entrevista

1. **Longitudes distintas.** `1 → 2` y `3 → 4 → 5`. Sigue el bucle mientras algún puntero no sea null. El lado que falta aporta 0.
2. **Acarreo final.** `9 → 9` + `1` → `0 → 0 → 1`. La condición del bucle debe incluir `carry != 0`.
3. **Una lista null o vacía.** La suma es una copia de la otra (más la cadena de acarreo si aplica). No petes con null.
4. **Ambas de un solo nodo.** `5` + `7` → `2 → 1` cuando hay acarreo.
5. **Cero.** `0` + `0` → `0`. Devolver `null` por cero suele ser incorrecto salvo que el problema diga que vacío es cero.
6. **Todo nueves.** Cadenas largas de acarreo; sigue siendo un nodo nuevo por dígito y como mucho uno extra.
7. **Mutar entradas por accidente.** Construir con `new Node(...)` deja intactas las listas del caller.
8. **Trampa del orden directo.** Si a mitad de problema cambian el orden de dígitos, restablece el orden en voz alta antes de codificar.

Errores frecuentes:

* Parar cuando **ambas** listas terminan pero el acarreo sigue en 1.
* Usar `sum % 10` como acarreo y `sum / 10` como dígito (al revés).
* Convertir a `int` y desbordar.
* Olvidar la cabeza dummy y especializar el primer nodo hasta que el código se ensucia.

---

## Resumen para contárselo a un amigo

Sum Lists es la suma en papel donde cada dígito es un nodo de lista enlazada y el **lugar de las unidades está en la cabeza**.

1. Recorre ambas listas juntas con un acarreo.
2. En cada paso: suma los dos dígitos (o cero si una lista acabó) más el acarreo, escribe `sum % 10`, pon el acarreo a `sum / 10`.
3. Sigue hasta que ambas listas terminen **y** el acarreo sea cero.
4. La cabeza dummy hace el append indoloro.
5. El orden directo es la misma aritmética después de invertir, o después de rellenar y recurrir desde el extremo alto.

Si puedes sumar `7→1→6` y `5→9→2` en la pizarra sin bloquearte en el último acarreo, dominas el problema 2.5.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Partition](/blog/es/ctci-2-4-partition)
* Siguiente: [Palindrome](/blog/es/ctci-2-6-palindrome)