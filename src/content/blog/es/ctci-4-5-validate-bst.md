---
title: "Validate BST: rangos min/max en un árbol binario (Java)"
description: "Problema estilo CTCI 4.5 para principiantes: comprobar si un árbol binario es un árbol de búsqueda binaria. El enfoque principal usa límites min/max recursivos; el recorrido in-order ordenado es la comprobación opcional."
date: "2026-03-07"
tags: [Algoritmos]
coverImage: /assets/images/ctci-4-5-validate-bst.webp
previewImage: /assets/images/ctci-4-5-validate-bst.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.5 para principiantes: comprobar si un árbol binario es un árbol de búsqueda binaria. El enfoque principal usa límites min/max recursivos; el recorrido in-order ordenado es la comprobación opcional.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un árbol de búsqueda binaria no es solo "hijo izquierdo más pequeño, hijo derecho más grande." Eso solo mira a los hijos inmediatos. Un BST de verdad dice: **todo** valor en el subárbol izquierdo es menor que el nodo, y **todo** valor en el subárbol derecho es mayor. Si un nieto lejano se sale, el árbol no es BST, aunque cada par padre-hijo local se vea bien.

Este post es enseñanza original para principiantes en **Java**. Misma familia que las preguntas clásicas de "validar BST" en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 4, árboles y grafos.

---

## 1. Analogía cotidiana

Piensa en un organigrama de empresa donde cada manager tiene una regla de sueldo para toda su rama:

* Todo el mundo bajo el adjunto izquierdo debe ganar **menos** que el manager.
* Todo el mundo bajo el adjunto derecho debe ganar **más** que el manager.
* La regla se apila. Alguien tres niveles abajo sigue dentro de la franja de cada jefe por encima.

Al bajar por el árbol llevas un **rango legal de sueldo**: "debe ser mayor que `min`, menor que `max`." En la raíz el rango está abierto. En un hijo izquierdo, el valor del padre pasa a ser el nuevo max. En un hijo derecho, el valor del padre pasa a ser el nuevo min. Si alguien cae fuera de su franja, el organigrama no es un BST válido.

Ese es todo el algoritmo principal: recursión con min y max más estrechos.

---

## 2. Problema en palabras simples

**Entrada:** la raíz de un árbol binario de enteros (`TreeNode` con `left`, `right` y un valor `int`).

**Salida:** `true` si el árbol es un árbol de búsqueda binaria, si no `false`.

**Definición de BST que usamos:**

* Para cada nodo `n`, todos los nodos del subárbol de `n.left` tienen valores **estrictamente menores** que `n.data`.
* Todos los nodos del subárbol de `n.right` tienen valores **estrictamente mayores** que `n.data`.
* Ambos subárboles son BSTs a su vez.
* Árbol vacío y un solo nodo son BSTs.

**Ejemplos:**

| Árbol (raíz primero, informal) | ¿BST válido? | Por qué |
| --- | --- | --- |
| `20` con left `10`, right `30` | sí | los rangos se cumplen |
| `20` con left `10`, y `10` con right `25` | no | `25` está a la izquierda de `20` pero `25 > 20` |
| `20` con left `10`, right `30`, y `30` con left `25` | sí | `25` está entre `20` y `30` |
| vacío | sí | ningún nodo viola nada |
| solo `7` | sí | un valor, sin comparaciones |

**Aclara antes de programar:**

* ¿Se permiten valores iguales? (Este post usa `<` y `>` **estrictos**. Si el entrevistador admite duplicados, elige un lado, suele ser left `<=` o right `>=`, y cúmplelo.)
* ¿Pueden aparecer `Integer.MIN_VALUE` / `MAX_VALUE`? (Usa cotas `Integer` nulas, o min/max en `long`, para no chocar con valores reales del nodo.)
* ¿El árbol es finito y acíclico? (Sí en este problema.)

---

## 3. Piensa primero

### Incorrecto: solo mirar hijos

```java
// BAD: se pierde violaciones profundas
boolean naive(TreeNode n) {
    if (n == null) return true;
    if (n.left != null && n.left.data >= n.data) return false;
    if (n.right != null && n.right.data <= n.data) return false;
    return naive(n.left) && naive(n.right);
}
```

En el contraejemplo clásico (`20` → left `10` → right `25`), cada par padre-hijo parece ordenado, pero `25` está en el subárbol izquierdo de `20`. El chequeo ingenuo devuelve true. A los entrevistadores les encanta esta trampa.

### Regular: max de la izquierda vs min de la derecha en cada nodo

Puedes calcular el máximo del subárbol izquierdo y el mínimo del derecho, y compararlos con el nodo. Funciona si lo haces bien en cada nodo, pero a menudo pagas O(N) por nodo sin memoización y acabas en O(N²). El pase de rangos de abajo hace un solo recorrido y se queda en O(N).

### Principal: rango min/max recursivo

Pasa dos cotas en cada llamada recursiva:

1. El nodo actual debe cumplir `min < node.data < max` (extremos abiertos si la cota es null / "sin límite").
2. Recurre a la izquierda con el mismo `min` y un nuevo max igual a `node.data`.
3. Recurre a la derecha con un nuevo min igual a `node.data` y el mismo `max`.
4. Nodo null: true.

Es un recorrido en profundidad. Cada nodo se comprueba una vez contra el rango más estrecho que imponen los ancestros.

### Opcional: in-order debe ir ordenado

El recorrido in-order de un BST visita los valores en orden no decreciente (aquí: estrictamente creciente). Así:

1. Recorre in-order.
2. Guarda el valor anterior.
3. Si el actual no es mayor que el anterior, falla.

Mismo tiempo O(N). Buena segunda respuesta o contraprueba. El método de rangos suele ser más fácil de explicar para "por qué este nodo es ilegal", porque señalas el min/max exacto que falló.

---

## 4. Solución en Java

Primero la solución principal (min/max). Luego una versión corta in-order.

```java
class TreeNode {
    int data;
    TreeNode left;
    TreeNode right;

    TreeNode(int data) {
        this.data = data;
    }
}

class ValidateBST {

    /** Entrada pública: el árbol vacío es un BST válido. */
    boolean isBST(TreeNode root) {
        return check(root, null, null);
    }

    /**
     * @param min cota inferior exclusiva, o null si no hay
     * @param max cota superior exclusiva, o null si no hay
     */
    private boolean check(TreeNode node, Integer min, Integer max) {
        if (node == null) {
            return true;
        }

        if (min != null && node.data <= min) {
            return false;
        }
        if (max != null && node.data >= max) {
            return false;
        }

        // Left: los valores deben quedar < node.data
        // Right: los valores deben quedar > node.data
        return check(node.left, min, node.data)
                && check(node.right, node.data, max);
    }
}
```

Recorrido de un árbol malo:

```
      20
     /
   10
     \
      25
```

| Llamada | node | min | max | Resultado |
| --- | --- | --- | --- | --- |
| 1 | 20 | null | null | ok, ir a left y right |
| 2 | 10 | null | 20 | ok (`10 < 20`) |
| 3 | 25 | 10 | 20 | falla: `25 >= 20` |
| right de 20 | null | 20 | null | true (no se alcanza si cortas al fallar) |

`25` es mayor que su padre `10`, así que un chequeo solo de hijos se queda contento. El rango sigue llevando max `20` del abuelo, y eso lo caza.

Comprobación in-order opcional:

```java
class ValidateBSTInOrder {
    private Integer prev = null;

    boolean isBST(TreeNode root) {
        prev = null;
        return inOrder(root);
    }

    private boolean inOrder(TreeNode node) {
        if (node == null) {
            return true;
        }
        if (!inOrder(node.left)) {
            return false;
        }
        if (prev != null && node.data <= prev) {
            return false;
        }
        prev = node.data;
        return inOrder(node.right);
    }
}
```

Reinicia `prev` al inicio de cada llamada pública si reutilizas el objeto. Una versión recursiva pura puede pasar `prev` como array de un elemento o un holder pequeño para que el "último visto" se actualice en la pila sin un campo.

Usar cotas `long` en lugar de `Integer` null también es habitual:

```java
boolean isBST(TreeNode root) {
    return checkLong(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean checkLong(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.data <= min || node.data >= max) return false;
    return checkLong(node.left, min, node.data)
            && checkLong(node.right, node.data, max);
}
```

Evita comprobaciones de `null`. Sigue valiendo para cualquier `int` del nodo porque un `int` no choca con los centinelas `long` como sí pasaría con cotas `int` y un nodo que vale `Integer.MIN_VALUE`.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra |
| --- | --- | --- |
| Recursión min/max | O(N) | pila O(H), H = altura (O(N) en el peor sesgo) |
| In-order con prev | O(N) | pila O(H) |
| Solo hijos (ingenuo) | O(N) | O(H), pero **incorrecto** en violaciones profundas |
| Max-izq / min-der en cada nodo (sin memo) | O(N²) peor | O(H) |

N es el número de nodos. En árboles equilibrados la profundidad de pila ronda log N. En entrevista suelen querer tiempo O(N) y el invariante global correcto, no un escaneo local padre-hijo.

---

## 6. Casos límite y errores habituales

Los entrevistadores tocan estos:

* **Árbol vacío** → true.
* **Un solo nodo** → true.
* **Duplicados** → con reglas estrictas, dos valores iguales fallan. Confirma la definición de BST de la empresa.
* **Árbol sesgado** (forma de lista) → sigue siendo O(N) en tiempo; la profundidad de pila rara vez importa en entrevista.
* **Valor igual a la cota** → `node.data <= min` o `>= max` debe fallar en BSTs estrictos.
* **Extremos de Integer** → prefiere cotas `Integer` nulas o centinelas `long` para que `Integer.MIN_VALUE` como dato real siga funcionando.

Errores comunes:

1. **Comparar solo con los hijos.** Falso positivo clásico en el árbol `20 / 10 / 25`.
2. **Actualizar mal ambas cotas en left/right.** Left conserva el min antiguo y pone max = padre. Right pone min = padre y conserva el max antiguo. Si los intercambias, árboles válidos fallan.
3. **Usar `int min = Integer.MIN_VALUE` con `node.data <= min`.** Una raíz legítima en `Integer.MIN_VALUE` parece ilegal. Usa cotas null o `long`.
4. **Olvidar reiniciar `prev` en el objeto in-order.** La segunda llamada reutiliza un valor anterior viejo.
5. **Permitir iguales en ambos lados.** Elige una política de duplicados una vez. No mezcles `<=` left y `<=` right sin pensarlo (rompe la unicidad de colocación).
6. **Devolver true en cuanto un subárbol va bien.** Los dos lados deben pasar: usa `&&`, no un true temprano de la izquierda sin mirar la derecha.

Boceto mínimo de uso:

```java
TreeNode root = new TreeNode(20);
root.left = new TreeNode(10);
root.right = new TreeNode(30);
root.left.right = new TreeNode(25); // inválido bajo 20

ValidateBST v = new ValidateBST();
boolean ok = v.isBST(root); // false
```

---

## 7. Resumen para explicárselo a un amigo

Validate BST hace una pregunta: ¿cada nodo está dentro del rango que imponen sus ancestros?

1. Definición: todo el subárbol izquierdo `<` nodo, todo el derecho `>` nodo, en recursión.
2. Mirar solo hijos no basta. Valores profundos pueden romper a un ancestro sin romper a su padre.
3. Solución principal: recursión con min y max. La llamada left recibe `max = node.data`. La right recibe `min = node.data`.
4. Null es válido. La primera violación devuelve false.
5. Opcional: el pase in-order debe ver valores estrictamente crecientes. Misma complejidad, otra historia.
6. Cuidado con duplicados y extremos de enteros al elegir el tipo de cotas.

Si puedes dibujar el contraejemplo `20 / 10 / 25`, apretar rangos por el camino izquierdo y mostrar dónde max `20` rechaza `25`, dominas el problema 4.5.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Check Balanced](/blog/es/ctci-4-4-check-balanced)
* Siguiente: [Successor](/blog/es/ctci-4-6-successor)