---
title: "Random Node: elección uniforme en un BST (Java)"
description: "Problema estilo CTCI 4.11 para principiantes: construye un BST con insert, find, delete y getRandomNode para que cada nodo sea igual de probable. Guarda el tamaño del subárbol en cada nodo y camina un índice aleatorio."
date: "2026-03-17"
tags: [Algoritmos]
coverImage: /assets/images/ctci-4-11-random-node.webp
previewImage: /assets/images/ctci-4-11-random-node.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.11 para principiantes: construye un BST con insert, find, delete y getRandomNode para que cada nodo sea igual de probable. Guarda el tamaño del subárbol en cada nodo y camina un índice aleatorio.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Organizas un sorteo donde cada persona en un árbol familiar debe tener la misma probabilidad de ganar. No puedes volcar a todos en una lista cada vez que alguien pide un ganador. Funciona, pero es lento y caro. Si cada persona ya sabe cuánta gente hay bajo ella, tiras un dado y bajas por el árbol hasta el asiento elegido. Eso es **Random Node**.

Este post es enseñanza original para principiantes en **Java**. Misma familia de diseño de árboles en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 4, árboles y grafos.

---

## 1. Analogía cotidiana

Imagina un organigrama que también es un **árbol de búsqueda binaria** (claves izquierdas menores o iguales, derechas mayores). Cada ficha de empleado muestra:

* su número (la clave)
* cuántas personas hay en todo su subárbol, incluyéndose (`size`)

Necesitas `getRandomNode()` de modo que si hay 10 personas, cada una tenga probabilidad 1/10.

Piensa los tamaños de subárbol como conteo de asientos:

1. En la persona actual, mira cuántos asientos hay en el equipo **izquierdo**.
2. Elige un número de asiento al azar entre `0` y `size - 1`.
3. Si el asiento cae en el rango izquierdo, baja a la izquierda.
4. Si es exactamente el conteo izquierdo, eres esa persona.
5. Si no, baja a la derecha restando los asientos izquierdos y el asiento actual.

Un solo número aleatorio (o uno por nivel, misma idea) elige entre asientos. Los `size` mantienen los asientos honestos tras inserts y deletes.

---

## 2. Problema en palabras simples

**Construye** una clase de árbol de búsqueda binaria desde cero con:

| Método | Significado |
| --- | --- |
| `insert(value)` | insertar en el BST |
| `find(value)` | devolver el nodo con esa clave, o null |
| `delete(value)` | quitar un nodo con esa clave (si existe) |
| `getRandomNode()` | devolver un nodo elegido **de forma uniforme** al azar entre todos |

**Reglas:**

* Cada nodo que esté ahora en el árbol debe ser igual de probable.
* Tú controlas el tipo de nodo, así que puedes guardar campos extra (ese es el truco).
* Árbol vacío: `getRandomNode` devuelve `null`.

**Aclara antes de codificar:**

* ¿Duplicados permitidos? (Sí en este texto: `<=` va a la izquierda.)
* ¿Delete debe reequilibrar? (No. Basta el delete BST estándar. Mantén `size` correcto.)
* ¿Uniforme sobre nodos, no sobre valores? (Sí. Dos nodos con el mismo valor son dos asientos.)

---

## 3. Piensa primero

### Por qué importa el enunciado

El entrevistador no solo dijo "devuelve un nodo aleatorio de un árbol binario". Dijo que implementas la clase **desde cero**. Pista: cambia la estructura. Añade campos. Actualízalos en insert y delete.

### Opción A: copiar todos los nodos a un array (lento)

Recorre el árbol, llena una lista, elige `list.get(random.nextInt(list.size()))`.

* Correcto y uniforme.
* Tiempo O(N) en cada llamada, espacio O(N).
* Vale como primera respuesta. Casi siempre piden algo mejor.

### Opción B: array permanente de nodos

Misma idea, mantenida en cada insert/delete. Borrar en medio de un array cuesta O(N). No convence.

### Opción C: guardar `size` en cada nodo (solución principal)

Cada nodo rastrea:

```
size = 1 + size(left) + size(right)
```

En **insert**, sube `size` en cada ancestro del camino (o recalcula al volver).

En **delete**, reduce `size` igual tras el cambio estructural.

En **getRandomNode**:

1. Si root es null, devuelve null.
2. Sea `i = random.nextInt(root.size())` (rango `0 .. N-1`).
3. Camina con `getIthNode(i)`:

| Condición | Acción |
| --- | --- |
| `i < leftSize` | ir a la izquierda con el mismo `i` |
| `i == leftSize` | devolver este nodo |
| `i > leftSize` | ir a la derecha con `i - leftSize - 1` |

¿Por qué `- leftSize - 1` a la derecha? Saltas todo el subárbol izquierdo **y** el nodo actual, así el derecho ve índices renumerados desde 0.

Es lo mismo que "elige el i-ésimo nodo en in-order", sin construir la lista.

### Opción D: volver a tirar al azar en cada nivel

En cada nodo, elige un índice fresco en `0 .. size-1` y ramifica. También es uniforme. Más llamadas a random. El paseo con un solo índice es más limpio y basta en entrevista.

### Qué no hacer

* Elegir izquierda/derecha/yo con probabilidad fija 1/3 (árboles torcidos rompen la uniformidad).
* Usar solo el size de la raíz e ignorar los de la izquierda (no puedes caminar con justicia).
* Olvidar actualizar `size` en insert o delete (las elecciones se sesgan).

---

## 4. Solución en Java

```java
import java.util.Random;

class TreeNode {
    int data;
    TreeNode left;
    TreeNode right;
    int size; // nodes in this subtree, including this

    TreeNode(int d) {
        data = d;
        size = 1;
    }

    /** Insert value into this BST subtree. Call on root from Tree. */
    void insertInOrder(int d) {
        if (d <= data) {
            if (left == null) {
                left = new TreeNode(d);
            } else {
                left.insertInOrder(d);
            }
        } else {
            if (right == null) {
                right = new TreeNode(d);
            } else {
                right.insertInOrder(d);
            }
        }
        size++; // this subtree grew by one
    }

    TreeNode find(int d) {
        if (d == data) {
            return this;
        } else if (d < data) {
            return left != null ? left.find(d) : null;
        } else {
            return right != null ? right.find(d) : null;
        }
    }

    /**
     * Return the node at in-order index i (0-based) in this subtree.
     * leftSize seats are on the left, then this node, then the right.
     */
    TreeNode getIthNode(int i) {
        int leftSize = left == null ? 0 : left.size;
        if (i < leftSize) {
            return left.getIthNode(i);
        } else if (i == leftSize) {
            return this;
        } else {
            // skip left subtree and this node
            return right.getIthNode(i - leftSize - 1);
        }
    }

    void refreshSize() {
        int ls = left == null ? 0 : left.size;
        int rs = right == null ? 0 : right.size;
        size = 1 + ls + rs;
    }
}

class Tree {
    private TreeNode root;
    private final Random random = new Random();

    int size() {
        return root == null ? 0 : root.size;
    }

    void insert(int value) {
        if (root == null) {
            root = new TreeNode(value);
        } else {
            root.insertInOrder(value);
        }
    }

    TreeNode find(int value) {
        return root == null ? null : root.find(value);
    }

    TreeNode getRandomNode() {
        if (root == null) {
            return null;
        }
        int i = random.nextInt(size()); // 0 .. N-1
        return root.getIthNode(i);
    }

    /** Delete one occurrence of value. Returns true if something was removed. */
    boolean delete(int value) {
        if (root == null) {
            return false;
        }
        int before = size();
        root = deleteNode(root, value);
        return size() < before;
    }

    private TreeNode deleteNode(TreeNode node, int value) {
        if (node == null) {
            return null;
        }
        if (value < node.data) {
            node.left = deleteNode(node.left, value);
        } else if (value > node.data) {
            node.right = deleteNode(node.right, value);
        } else {
            // found: standard BST delete
            if (node.left == null) {
                return node.right;
            }
            if (node.right == null) {
                return node.left;
            }
            // two children: copy in-order successor, then remove it from the right
            TreeNode succ = minNode(node.right);
            node.data = succ.data;
            node.right = deleteNode(node.right, succ.data);
        }
        node.refreshSize();
        return node;
    }

    private TreeNode minNode(TreeNode node) {
        while (node.left != null) {
            node = node.left;
        }
        return node;
    }
}
```

**Recorrido** (insert 20, 10, 30, 5, 15):

```
        20 (size 5)
       /  \
   10 (3)  30 (1)
   /  \
5(1) 15(1)
```

* Aleatorio `i = 0` → izquierda de 20 tiene size 3, `0 < 3` → a 10 → izquierda de 10 size 1, `0 < 1` → a 5 → left size 0, `0 == 0` → devuelve **5**.
* Aleatorio `i = 2` → en 20, leftSize 3, `2 < 3` → en 10, leftSize 1, `2 > 1` → derecha con `2 - 1 - 1 = 0` → en 15 → devuelve **15**.
* Aleatorio `i = 3` → en 20, `3 == 3` → devuelve **20**.
* Aleatorio `i = 4` → derecha con `4 - 3 - 1 = 0` → devuelve **30**.

Cada uno de los cinco nodos corresponde a exactamente un índice. Uniforme.

¿Por qué no elegir izquierda con probabilidad `leftSize / size`, yo con `1 / size`, derecha con `rightSize / size`? Se puede. Es la versión multi-tiro. Un solo índice es la misma matemática con un sorteo arriba.

---

## 5. Tabla de complejidad

| Operación | Tiempo (equilibrado) | Tiempo (peor, sesgado) | Notas |
| --- | --- | --- | --- |
| `insert` | O(log N) | O(N) | camino en altura + size++ |
| `find` | O(log N) | O(N) | búsqueda BST normal |
| `delete` | O(log N) | O(N) | delete BST + refrescar size |
| `getRandomNode` | O(log N) | O(N) | un random int + camino |
| Copiar a array cada vez | O(N) | O(N) | siempre recorrido completo |

El espacio es O(N) por el árbol. El campo `size` es O(1) por nodo. Sin buffer extra O(N) para el sorteo.

El tiempo se describe bien como **O(D)** donde D es la profundidad. Árboles equilibrados dan O(log N). Insertar ya ordenado sin reequilibrar sigue siendo correcto, solo más lento.

---

## 6. Casos límite y errores habituales

Los entrevistadores empujan aquí:

* **Árbol vacío** → `getRandomNode` devuelve `null`. No llames `nextInt(0)`.
* **Un solo nodo** → solo índice 0, siempre ese nodo.
* **Todos los inserts a un lado** → sigue uniforme si los sizes son correctos; solo caminos más profundos.
* **Duplicados** → cada nodo es su asiento. Size cuenta nodos, no claves distintas.
* **Borrar raíz / hoja / con dos hijos** → cambia la forma; los sizes deben cuadrar.

Errores habituales:

1. **Probabilidades 1/3 / 1/3 / 1/3** para izquierda, yo, derecha. Árboles desbalanceados sesgan.
2. **Olvidar `size++` en el camino del insert.** El size de la raíz miente.
3. **No arreglar sizes tras delete.** Mismo sesgo, peor con el tiempo.
4. **Usar `i - leftSize` sin el `-1` extra al ir a la derecha.** Off-by-one: el nodo actual también gastó un índice.
5. **Asumir valores únicos al contar.** La uniformidad es sobre **nodos**.
6. **Construir la lista entera "por si acaso"** cuando ya tienes sizes. Tiras el O(D).

Uso mínimo:

```java
Tree tree = new Tree();
tree.insert(20);
tree.insert(10);
tree.insert(30);
TreeNode r = tree.getRandomNode(); // one of 20, 10, 30 with equal chance
tree.delete(10);
TreeNode f = tree.find(30);
```

---

## 7. Resúmeselo a un amigo

Random Node es un problema de diseño de árbol, no solo un one-liner de azar:

1. Controlas la clase BST, así que guarda **`size`** en cada nodo: cuántos nodos hay en ese subárbol.
2. Mantén sizes honestos en **insert** y **delete**.
3. `getRandomNode` elige un índice `i` de `0` a `N - 1` y camina: izquierda si `i` está en el conteo izquierdo, actual si igual, derecha con `i` ajustado.
4. Ese paseo es "encuentra el i-ésimo en in-order" sin array.
5. El tiempo sigue la altura. El espacio es un int por nodo.

Si dibujas un árbol pequeño con sizes, mapeas índices 0..N-1 a nodos y explicas por qué a la derecha va `i - leftSize - 1`, dominas el 4.11.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Check Subtree](/blog/es/ctci-4-10-check-subtree)
* Siguiente: [Paths with Sum](/blog/es/ctci-4-12-paths-with-sum)