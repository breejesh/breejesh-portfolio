---
title: "Successor: siguiente nodo in-order en un BST (Java)"
description: "Problema estilo CTCI 4.6 para principiantes: halla el sucesor in-order de un nodo en un árbol de búsqueda binaria cuando cada nodo tiene enlace al padre. Más a la izquierda del subárbol derecho, o sube padres hasta no ser hijo derecho."
date: "2026-02-22"
tags: [Algoritmos]
coverImage: /assets/images/ctci-4-6-successor.webp
previewImage: /assets/images/ctci-4-6-successor.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.6 para principiantes: halla el sucesor in-order de un nodo en un árbol de búsqueda binaria cuando cada nodo tiene enlace al padre. Más a la izquierda del subárbol derecho, o sube padres hasta no ser hijo derecho.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

El recorrido in-order de un BST imprime las claves en orden. Dado un nodo, el **sucesor** es la siguiente clave que ese recorrido visitaría. No reinicias desde la raíz ni barres todo el árbol. Ya tienes el nodo, y cada nodo tiene un puntero `parent`.

Este post es enseñanza original para principiantes en **Java**. Misma familia que las preguntas clásicas de sucesor en BST, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide).

---

## 1. Analogía de la fila ordenada

Imagina el BST como una fila de personas ordenadas por altura (o clave). In-order significa: subárbol izquierdo, luego yo, luego subárbol derecho. El sucesor de alguien es quien queda justo a su derecha en esa fila.

Dos formas de encontrarlo sin redibujar toda la fila:

* **Tienes rama a la derecha.** El siguiente no es tu hijo derecho. Es la persona **más a la izquierda** de esa rama derecha (la clave más pequeña que sigue siendo mayor que la tuya).
* **No tienes rama derecha.** Ya terminaste tu izquierda y a ti. Sube hacia la raíz mientras sigas siendo hijo **derecho**. El primer ancestro para el que estés a la **izquierda** es el siguiente en la fila. Si pasas la raíz, eras el último.

Los enlaces al padre son la escalera. Sin ellos buscarías desde la raíz cada vez.

---

## 2. Problema en palabras simples

**Objetivo:** dado un nodo `n` en un árbol de búsqueda binaria, devolver el sucesor in-order de `n`, o `null` si `n` es el último.

**Supuestos:**

* Los nodos tienen `left`, `right` y `parent`.
* El árbol es un BST (claves izquierdas menores, derechas mayores), o al menos solo necesitas el siguiente nodo estructural in-order.
* Puedes partir solo de `n`; no recibes la raíz por separado salvo que subas hasta ella.

**Aclara antes de codear:**

* ¿Y si `n` es null? (Devuelve null.)
* ¿Y si `n` no tiene padre ni hijo derecho? (Es la raíz y el último; devuelve null.)
* ¿Claves duplicadas? (El problema suele asumir claves únicas. Di tu regla si preguntan.)

---

## 3. Piensa primero

### Primera idea mala: volcar todo el in-order

Recorre el árbol a una lista, busca `n`, devuelve el índice siguiente. Correcto pero O(N) en tiempo y espacio. Quieren O(H) con padres, donde H es la altura.

### Caso A: existe hijo derecho

El sucesor es el mínimo del subárbol derecho:

1. Ve a `n.right`.
2. Mientras `left` no sea null, ve a la izquierda.
3. Ese nodo es la respuesta.

¿Por qué? In-order hace izquierda, nodo, derecha. Tras `n`, la primera visita en el subárbol derecho es su nodo más a la izquierda.

### Caso B: sin hijo derecho

Sube por los padres:

1. Pon `p = n.parent`, `c = n`.
2. Mientras `p` no sea null y `c == p.right` (sigues siendo hijo derecho), haz `c = p`, `p = p.parent`.
3. Devuelve `p` (puede ser null si eras el último del árbol).

¿Por qué? Terminaste un subárbol derecho. Sigue subiendo hasta entrar a un nodo desde la izquierda. Ese nodo aún no se ha "visitado" en el recorrido in-order mental.

### Esquema

```
        20
       /  \
     10    30
    /  \     \
   5   15    40
      /
    12
```

| Nodo | Sucesor | Por qué |
| --- | --- | --- |
| 10 | 12 | hay hijo derecho 15; lo más a la izquierda de esa rama es 12 |
| 15 | 20 | sin derecha; 15 es derecho de 10, sube; 10 es izquierdo de 20 → 20 |
| 40 | null | sin derecha; sube como derecho de 30, luego de 20; la raíz no tiene padre |
| 5 | 10 | sin derecha; 5 es izquierdo de 10 → padre 10 |

---

## 4. Solución en Java

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode parent;

    TreeNode(int val) {
        this.val = val;
    }
}

class Solution {
    /** Sucesor in-order de n, o null si n es el último / null. */
    TreeNode inOrderSuccessor(TreeNode n) {
        if (n == null) {
            return null;
        }

        // Caso A: hay subárbol derecho → más a la izquierda de la derecha
        if (n.right != null) {
            return leftMostChild(n.right);
        }

        // Caso B: subir hasta no ser hijo derecho
        TreeNode current = n;
        TreeNode p = n.parent;
        while (p != null && p.right == current) {
            current = p;
            p = p.parent;
        }
        return p;
    }

    private TreeNode leftMostChild(TreeNode n) {
        if (n == null) {
            return null;
        }
        while (n.left != null) {
            n = n.left;
        }
        return n;
    }
}
```

Notas del helper:

* `leftMostChild` es la misma idea que "mínimo en un subárbol BST".
* El bucle de subida para cuando `p == null` (sin sucesor) o cuando `current` es `p.left` (encontraste el ancestro siguiente).
* No necesitas la raíz como argumento aparte si los padres están completos.

Opcional: si el entrevistador prohíbe padres, buscas desde la raíz con un candidato (último nodo mayor que `n` al caminar). Es otro planteamiento; este post se queda con enlaces al padre.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra |
| --- | --- | --- |
| Sucesor con padres (esta solución) | O(H) | O(1) |
| Lista in-order completa e índice | O(N) | O(N) |
| Desde la raíz sin padres (candidato) | O(H) | O(1) |

H es la altura. Árbol equilibrado ≈ log N. Sesgado puede ser N. El espacio del paseo con padres es constante.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan esto:

* **Entrada null** → devuelve null.
* **Nodo más a la derecha** → sube a la raíz y luego null. El último in-order no tiene sucesor.
* **Raíz solo con subárbol izquierdo** → si pides el sucesor de la raíz y no tiene derecha, null (la raíz es la última si no hay derecha).
* **Hoja que es hija izquierda** → el sucesor es su padre (casi sin vueltas del bucle).
* **Espina derecha profunda** → la subida puede tocar muchos padres; sigue siendo O(H), no es un bug.

Errores comunes:

1. **Devolver el hijo derecho tal cual** en vez del más a la izquierda del subárbol derecho. Te saltas la cadena izquierda bajo ese hijo.
2. **Subir solo un padre** siempre. Hay que iterar mientras sigas siendo hijo derecho.
3. **Olvidar que parent es null** en la raíz y hacer NPE en `p.right`.
4. **Confundir sucesor con predecesor.** El predecesor es simétrico: sin izquierda → subir mientras seas hijo izquierdo; o el más a la derecha del subárbol izquierdo.
5. **Asumir árbol equilibrado** al citar el tiempo. Di O(H) y el peor caso O(N).
6. **Mutar el árbol** para enhebrar padres al vuelo. No hace falta si ya existen.

Boceto mínimo de uso:

```java
// Construye un árbol pequeño con parents en ambos sentidos, luego:
TreeNode fifteen = /* nodo 15 */;
TreeNode next = new Solution().inOrderSuccessor(fifteen); // 20 en el esquema de arriba
```

---

## 7. Resumen para contárselo a un amigo

Successor es "quién va después en orden / in-order" para un nodo del BST:

1. Si el nodo tiene hijo derecho, ve una vez a la derecha y luego a la izquierda hasta no poder. Ese nodo es el siguiente.
2. Si no, sube padres mientras sigas siendo el hijo derecho. El primer padre al que llegaste desde la izquierda es el siguiente.
3. Si se acaban los padres, no hay siguiente.
4. Los punteros parent dan O(altura) y O(1) de espacio extra. Sin volcar el árbol.

Si dibujas los dos casos en la pizarra y recorres 15 → 20 y 40 → null en un árbol de ejemplo, dominas el 4.6.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Validate BST](/blog/es/ctci-4-5-validate-bst)
* Siguiente: [Build Order](/blog/es/ctci-4-7-build-order)