---
title: "BST Sequences: todos los arrays que construyen el mismo árbol (Java)"
description: "Problema estilo CTCI 4.9 para principiantes: dado un BST construido por inserciones de izquierda a derecha, lista cada array que pudo generarlo. Raíz primero, luego entrelaza (weave) las secuencias de los subárboles izquierdo y derecho con un helper recursivo."
date: "2025-08-22"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-9-bst-sequences.webp
previewImage: /assets/images/ctci-4-9-bst-sequences.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.9 para principiantes: dado un BST construido por inserciones de izquierda a derecha, lista cada array que pudo generarlo. Raíz primero, luego entrelaza (weave) las secuencias de los subárboles izquierdo y derecho con un helper recursivo.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Insertas números en un árbol de búsqueda binario vacío, uno a uno, siempre bajando desde la raíz hasta el primer hueco hijo vacío. La forma final del árbol depende del **orden**. Arrays distintos pueden crecer hasta el **mismo** árbol. El problema 4.9 invierte la pregunta habitual: dado el BST terminado, imprime cada array que pudo construirlo.

Este post es enseñanza original para principiantes en **Java**. Misma familia de "reconstruir órdenes de inserción" en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Árboles y grafos, problema **4.9**.

---

## 1. Analogía de la baraja

Imagina un repartidor que deja cartas en dos montones laterales bajo una carta superior:

* La **carta de arriba** siempre se reparte primero. Esa carta es la raíz del BST. Ninguna otra puede ser raíz si el árbol ya tiene ese valor de raíz.
* Las cartas menores que la raíz solo van al **monton izquierdo** (subárbol izquierdo). Las mayores solo al **monton derecho**.
* Dentro de cada montón, las cartas siguen un orden padre-antes-que-hijo. No puedes insertar un nieto antes que su padre si el padre es el único camino a ese hueco.
* Entre izquierda y derecha, el repartidor puede **entrelazar** con libertad. Tras colocar la raíz, puedes soltar una carta izquierda, luego una derecha, luego otra izquierda, mientras cada montón conserve su orden interno.

Así que la respuesta completa es: raíz primero, luego cada **weave** legal de una secuencia izquierda con una secuencia derecha.

Árbol pequeño:

```
    2
   / \
  1   3
```

Solo dos arrays de inserción:

* `{2, 1, 3}`
* `{2, 3, 1}`

`{1, 2, 3}` es incorrecto: la raíz sería `1`, no `2`. `{2, 1, 3}` y `{2, 3, 1}` producen exactamente esta forma.

---

## 2. Enunciado en palabras simples

**Entrada:** raíz de un árbol de búsqueda binario con valores enteros **distintos**. El árbol se construyó insertando elementos de un array de izquierda a derecha en un BST vacío.

**Salida:** todos los arrays (listas de valores) que, insertados en orden, producen **exactamente este árbol**.

**Reglas:**

* Valores distintos (sin claves iguales).
* Inserción BST estándar: izquierda si es menor, derecha si es mayor, enganchar en el primer hijo null.
* Devuelves secuencias de valores, no referencias a nodos.
* Árbol vacío: una secuencia vacía es una elección limpia de enseñanza (una forma de construir nada).

**Forma del nodo:**

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}
```

**Aclara antes de codificar:**

* ¿Solo valores distintos? (Sí en este problema.)
* ¿Mutar el árbol? (No hace falta. Solo leer estructura.)
* ¿Imprimir o devolver una colección? (Devolver `List` de listas es más fácil de probar.)
* ¿Y si el árbol es null? (Una lista vacía está bien.)

---

## 3. Piensa primero

### ¿Qué debe cumplirse en cada array válido?

1. **La raíz va primero.** Si otro valor fuera el primero, ese valor sería la raíz.
2. **El orden relativo dentro del subárbol izquierdo lo fija el propio subárbol.** Todas las secuencias izquierdas deben ser órdenes de inserción válidos para ese subárbol.
3. **Lo mismo para el subárbol derecho.**
4. **Izquierda y derecha pueden entrelazarse** de cualquier forma que preserve esos dos órdenes relativos. Esa mezcla es un **weave** (un barajado que conserva el orden dentro de cada mazo).

A veces se adivina "todos los nodos izquierdos antes que todos los derechos." Eso es solo un weave. Tras la raíz `50`, puedes insertar `20` y luego `60`, o `60` y luego `20`. Ambos caen del lado correcto de `50`.

### Forma recursiva

Para el nodo `n`:

1. Calcula recursivamente cada secuencia de `n.left` → `leftSeqs`.
2. Calcula recursivamente cada secuencia de `n.right` → `rightSeqs`.
3. Para cada par `(L, R)`, teje `L` y `R` de todas las formas, y **antepone** `n.val` a cada weave.
4. Caso base: un nodo `null` aporta una sola lista vacía para que el weave siga funcionando si falta un hijo.

### Qué significa "weave"

Tejer dos listas manteniendo el orden interno de cada una.

Ejemplo:

* first = `{1, 2}`
* second = `{3, 4}`

Weaves:

| Resultado |
| --- |
| `{1, 2, 3, 4}` |
| `{1, 3, 2, 4}` |
| `{1, 3, 4, 2}` |
| `{3, 1, 2, 4}` |
| `{3, 1, 4, 2}` |
| `{3, 4, 1, 2}` |

Comprobación de conteo: si las longitudes son `a` y `b`, el número de weaves es `C(a+b, a)` (elige huecos para la primera lista; el resto van a la segunda).

Idea recursiva del weave:

* Si alguna lista está vacía, añade el resto de ambas al prefijo actual y guarda ese resultado.
* Si no, dos ramas: tomar la cabeza de `first` al prefijo, o la de `second`. Recurre. Deshaz la mutación para que las llamadas hermanas vean las listas originales.

Usar `LinkedList` hace barato quitar y restaurar la cabeza. Clona el prefijo al guardar una secuencia terminada para que mutaciones posteriores no reescriban respuestas pasadas.

### Dos trabajos recursivos, sepáralos

`allSequences` construye los conjuntos de secuencias de subárboles y antepone la raíz.

`weaveLists` solo fusiona dos listas.

No mezcles esas responsabilidades en una sola función. Confía en weave cuando lo llamas desde `allSequences`. Confía en la restauración de listas al implementar weave.

---

## 4. Solución en Java

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class BstSequences {

    public List<LinkedList<Integer>> allSequences(TreeNode node) {
        List<LinkedList<Integer>> result = new ArrayList<>();

        if (node == null) {
            result.add(new LinkedList<>());
            return result;
        }

        LinkedList<Integer> prefix = new LinkedList<>();
        prefix.add(node.val);

        List<LinkedList<Integer>> leftSeq = allSequences(node.left);
        List<LinkedList<Integer>> rightSeq = allSequences(node.right);

        for (LinkedList<Integer> left : leftSeq) {
            for (LinkedList<Integer> right : rightSeq) {
                List<LinkedList<Integer>> weaved = new ArrayList<>();
                weaveLists(left, right, weaved, prefix);
                result.addAll(weaved);
            }
        }
        return result;
    }

    /**
     * Weave first and second in all ways that keep relative order inside each list.
     * Mutates first/second/prefix during recursion, then restores them.
     */
    void weaveLists(
            LinkedList<Integer> first,
            LinkedList<Integer> second,
            List<LinkedList<Integer>> results,
            LinkedList<Integer> prefix) {

        if (first.isEmpty() || second.isEmpty()) {
            LinkedList<Integer> complete = new LinkedList<>(prefix);
            complete.addAll(first);
            complete.addAll(second);
            results.add(complete);
            return;
        }

        // take head of first
        int headFirst = first.removeFirst();
        prefix.addLast(headFirst);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        first.addFirst(headFirst);

        // take head of second
        int headSecond = second.removeFirst();
        prefix.addLast(headSecond);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        second.addFirst(headSecond);
    }
}
```

Recorrido del árbol de ejemplo `2 / 1  3`:

1. El hijo izquierdo `1` es hoja: secuencias `{{1}}`.
2. El hijo derecho `3` es hoja: secuencias `{{3}}`.
3. Weave de `{1}` con `{3}`: `{1,3}` y `{3,1}`.
4. Anteponer raíz `2`: `{2,1,3}` y `{2,3,1}`.

Esquema mayor: raíz `50`, subárbol izquierdo en `20`, derecho en `60`. Recurre hasta que cada subárbol devuelva su propio conjunto de secuencias. Teje cada secuencia izquierda con cada derecha y pon `50` delante de cada weave. Esa es la respuesta completa del árbol.

Uso mínimo:

```java
TreeNode root = new TreeNode(2);
root.left = new TreeNode(1);
root.right = new TreeNode(3);

List<LinkedList<Integer>> seqs = new BstSequences().allSequences(root);
// [[2, 1, 3], [2, 3, 1]]
```

---

## 5. Tabla de complejidad

| Pieza | Notas de coste |
| --- | --- |
| Número de secuencias | Puede crecer de forma **combinatoria**. El peor caso es una cadena delgada en un lado más un weave libre grande con el otro. |
| Weave de longitudes a, b | `C(a+b, a)` resultados; cada resultado cuesta O(a+b) al clonar/añadir. |
| `allSequences` | Producto del conteo izquierdo y derecho en cada nodo, por el coste del weave. |
| Espacio extra | Domina el tamaño de la salida. La profundidad de recursión es O(H) en el recorrido del árbol más O(a+b) en el weave. |

En entrevista importa menos una fórmula cerrada y más nombrar la explosión: la salida puede ser enorme, así que generar todas las secuencias solo vale para árboles pequeños.

El tiempo es **sensible a la salida**. Tocará cada secuencia que devuelves. No digas O(N) salvo que N sea minúsculo y el árbol sea una cadena pura (a menudo una sola secuencia).

---

## 6. Casos límite y errores habituales

Los entrevistadores tocan estos:

* **Raíz null** → una secuencia vacía (o lista de resultados vacía si lo prefieres; dilo).
* **Un solo nodo** → solo `{val}`.
* **Solo izquierda o solo derecha** → sin entrelazado real; los weaves colapsan a "el lado no vacío tras la raíz."
* **Árbol pequeño equilibrado** → weave clásico de dos vías tras la raíz (ejemplo `2/1/3`).
* **Izquierda profunda, derecha profunda** → muchos weaves; cuida pila y clonación.

Errores habituales:

1. **Forzar todo lo izquierdo antes que lo derecho.** Pierdes la mitad (o más) de los órdenes válidos.
2. **Olvidar que la raíz va primero.** Cualquier secuencia que empiece con un no-raíz es inválida para este árbol.
3. **Romper el orden relativo dentro de un subárbol.** Si la izquierda necesita `20` antes que `10`, un weave no puede poner `10` delante de `20`.
4. **No restaurar listas tras la recursión.** Compartir el mismo `LinkedList` sin deshacer corrompe ramas hermanas.
5. **Mutar el prefijo compartido al guardar resultados.** Clona antes de `results.add`.
6. **Enumerar permutaciones de todos los nodos y probar cada inserción.** Vale para N minúsculo, falla el espíritu del problema y es mucho más lento que un weave estructurado.

Autocomprobación rápida en la entrevista: elige un array devuelto, insértalo en un BST fresco y confirma que la forma coincide. Revisa un weave que entrelace izquierda y derecha pronto.

---

## 7. Resumen para explicárselo a un amigo

BST Sequences responde "¿qué órdenes de inserción reconstruyen exactamente este BST?":

1. La raíz es siempre la primera inserción.
2. Lista recursivamente cada orden válido del subárbol izquierdo y del derecho.
3. **Teje (weave)** cada lista izquierda con cada derecha, conservando el orden dentro de cada lista.
4. Antepone la raíz a cada weave.
5. Implementa weave tomando repetidamente la siguiente cabeza de izquierda o de derecha, con deshacer tras cada rama recursiva.

Si puedes dibujar el ejemplo de tres nodos, escribir ambas respuestas y explicar por qué `{1,2,3}` es ilegal con raíz `2`, dominas el problema 4.9.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [First Common Ancestor](/blog/es/ctci-4-8-first-common-ancestor)
* Siguiente: [Check Subtree](/blog/es/ctci-4-10-check-subtree)