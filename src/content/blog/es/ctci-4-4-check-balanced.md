---
title: "Check Balanced: diferencia de altura como mucho uno (Java)"
description: "Problema estilo CTCI 4.4 para principiantes: decide si un árbol binario está equilibrado. Calcula la altura en una sola pasada y devuelve una señal de fallo en cuanto un nodo tenga subárboles con alturas que difieren en más de uno."
date: "2026-01-08"
tags: [Algoritmos]
coverImage: /assets/images/ctci-4-4-check-balanced.webp
previewImage: /assets/images/ctci-4-4-check-balanced.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.4 para principiantes: decide si un árbol binario está equilibrado. Calcula la altura en una sola pasada y devuelve una señal de fallo en cuanto un nodo tenga subárboles con alturas que difieren en más de uno.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un árbol está **equilibrado en altura** cuando cada nodo tiene subárboles izquierdo y derecho cuyas alturas difieren en como mucho uno. No solo la raíz. Cada nodo hacia abajo tiene que pasar la misma prueba. Una rama izquierda profunda y una derecha corta bajo un nodo intermedio ya desequilibran el árbol, aunque desde arriba "se vea bien".

Este post es enseñanza original para principiantes en **Java**. Misma familia de recursión sobre árboles en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 4, problema 4.4.

---

## 1. Equilibrio como un nivel de burbuja

Pon un nivel de burbuja en cada junta de un móvil colgado del techo. Cada junta tiene un brazo izquierdo y uno derecho. Los brazos pueden diferir un poco (un "escalón"), pero no dos o más. Si una junta está inclinada, falla todo el móvil, no solo el gancho de arriba.

En un árbol binario:

* La altura de una hoja es 0 (o 1, según tu convenio; elige uno y manténlo).
* La altura de un nodo es `1 + max(height(left), height(right))`.
* En ese nodo, `|height(left) - height(right)|` debe ser como mucho 1.
* La altura de un hijo null es -1 si las hojas tienen altura 0. Trata null como -1 y hoja como 0 de forma coherente.

El convenio habitual de entrevista usado abajo: **null tiene altura -1**, una hoja tiene altura `0`, un nodo con dos hojas tiene altura `1`.

---

## 2. Problema en palabras simples

**Objetivo:** devolver `true` si el árbol binario está equilibrado, si no `false`.

**Definición:** para cada nodo, las alturas de sus dos subárboles difieren en como mucho 1. Ambos subárboles deben estar equilibrados por dentro.

**Entrada:** raíz de un árbol binario (`TreeNode` con `left` y `right`).

**Salida:** boolean.

**Aclara antes de codificar:**

* Árbol vacío (raíz `null`): equilibrado (`true`).
* Altura de null: `-1` (común) o `0` (vale si eres coherente).
* Árboles perfectos / completos / llenos: palabras cercanas, no son lo mismo que "equilibrado" aquí. Quédate con la definición de diferencia de alturas.

**Ejemplos**

| Boceto del árbol | Equilibrado? | Por qué |
| --- | --- | --- |
| Un solo nodo | si | ambos lados null |
| Raíz solo con hijo izquierdo | si | alturas 0 y -1, diff 1 |
| Cadena izquierda de tres nodos, sin rama derecha bajo la raíz | no | bajo la raíz, altura izq 1, der -1, diff 2 |
| Árbol lleno pequeño de altura 2 | si | cada nodo difiere 0 o 1 |

---

## 3. Piensa primero

### Ingenuo: helper de altura llamado dos veces por nodo

```
isBalanced(n):
  if n is null: return true
  hl = height(n.left)
  hr = height(n.right)
  if |hl - hr| > 1: return false
  return isBalanced(n.left) and isBalanced(n.right)
```

Correcto. Lento. `height` recorre cada subárbol, y lo llamas en cada nodo, así que los mismos nodos se visitan otra vez. Peor caso alrededor de O(N log N) en un árbol equilibrado, O(N^2) en uno sesgado.

### Preferido: una pasada, altura o señal de fallo

Mientras calculas la altura de abajo arriba, también compruebas la regla de equilibrio. Si un subárbol ya está desequilibrado, no devuelvas una altura real. Devuelve un **centinela de fallo** (en bocetos cortos a menudo `-1`; abajo usamos `Integer.MIN_VALUE` para que no choque con la altura null `-1`).

Patrón limpio en entrevistas:

* El helper devuelve la altura de un subárbol equilibrado.
* Si el subárbol está desequilibrado, devuelve el centinela de fallo.
* El padre ve el centinela de cualquiera de los hijos y lo propaga sin más trabajo.
* Método público: `checkHeight(root) != UNBALANCED`.

Eso es **un DFS**, O(N) en tiempo, O(H) en pila. Salida temprana cuando encuentras el primer nodo malo al subir.

Por qué importa ir de abajo arriba: necesitas ambas alturas hijas antes de decidir el padre. El postorden es natural. Un preorden "compruebame primero, luego recurre" sigue necesitando las alturas de ambos lados, así que re-recorres o cacheas. La pasada combinada altura+chequeo es la fusión limpia.

---

## 4. Solución Java

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}

class CheckBalanced {
    // Distinct from null height (-1) so failure never looks like an empty child.
    private static final int UNBALANCED = Integer.MIN_VALUE;

    public boolean isBalanced(TreeNode root) {
        return checkHeight(root) != UNBALANCED;
    }

    /** Height if this subtree is balanced; UNBALANCED if any node fails. */
    private int checkHeight(TreeNode node) {
        if (node == null) {
            return -1;
        }

        int left = checkHeight(node.left);
        if (left == UNBALANCED) {
            return UNBALANCED;
        }

        int right = checkHeight(node.right);
        if (right == UNBALANCED) {
            return UNBALANCED;
        }

        if (Math.abs(left - right) > 1) {
            return UNBALANCED;
        }

        return Math.max(left, right) + 1;
    }
}
```

Por qué `Integer.MIN_VALUE` en vez de reutilizar `-1`? La altura de null ya es `-1`. Si también usas `-1` para "desequilibrado", el padre no distingue "hijo izquierdo ausente" de "subárbol izquierdo fallo". Un centinela de fallo distinto es más fácil de defender en la sala.

Recorrido (equilibrado):

```
      1
     / \
    2   3
   /
  4
```

* Nodo 4: izq -1, der -1, diff 0, altura 0.
* Nodo 2: izq 0, der -1, diff 1, altura 1.
* Nodo 3: izq -1, der -1, diff 0, altura 0.
* Nodo 1: izq 1, der 0, diff 1, altura 2.
* `checkHeight` devuelve 2, no `UNBALANCED` → `true`.

Recorrido (desequilibrado):

```
    1
   /
  2
 /
3
```

* Nodo 3: altura 0.
* Nodo 2: izq 0, der -1, altura 1.
* Nodo 1: izq 1, der -1, diff 2 → devolver `UNBALANCED` → `false`.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Helper de altura en cada nodo | O(N log N) a O(N^2) | O(H) recursión | Simple, no ideal |
| Una pasada altura + señal de fallo | O(N) | O(H) pila | Cada nodo una vez |
| DFS con pila explícita, misma lógica | O(N) | O(H) | Raro en entrevista; recursión basta |

H es la altura del árbol. Árbol sesgado: H = N, pila O(N). Árbol equilibrado: H = log N.

---

## 6. Casos limite y errores comúnes

Los entrevistadores pinchan aquí:

* **Raíz null** → equilibrado.
* **Un solo nodo** → equilibrado.
* **Solo un brazo largo** bajo un nodo profundo, la raíz sigue "corta" → sigue siendo false; comprueba cada nodo, no solo la raíz.
* **Diff exactamente 1** → permitido. Diff 2 → fallo.
* **Ambos subárboles altos pero iguales** → bien si cada lado está equilibrado por dentro.

Errores comúnes:

1. **Solo comparar alturas en la raíz.** Un desequilibrio profundo bajo un hijo sigue siendo desequilibrio.
2. **Llamar `height` por separado a izquierda y derecha en cada nodo.** Respuestá correcta, riesgo cuadrático. Sube a la pasada combinada.
3. **Usar `-1` para altura null y para fallo.** Confunde. Usa un centinela de fallo distinto.
4. **Olvidar el retorno temprano.** Cuando un hijo ya fallo, propaga; no hace falta seguir midiendo el hermano si ya sabes que la respuestá es false (optimizacion opcional; peor caso sigue O(N) si el nodo malo es el último).
5. **Off-by-one en altura de null.** Null = -1 y hoja = 0 deja limpio el `max + 1`. Si null = 0, la hoja pasa a 1; dilo en voz alta para que el entrevistador siga tus números.
6. **AVL vs "equilibrado".** Aquí "equilibrado" es la definición de diferencia de alturas, no un paseo completo de insercion AVL salvo que lo pidan.

Uso mínimo:

```java
TreeNode root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
boolean ok = new CheckBalanced().isBalanced(root); // true
```

---

## 7. Explicaselo a un amigo

Check Balanced es un DFS de árbol que junta dos trabajos en uno:

1. Define altura: null es -1, si no `1 + max(left, right)`.
2. En cada nodo, cuando ambos hijos responden, si alguno fallo, fallas. Si `|left - right| > 1`, fallas.
3. Si no, devuelves tu altura para que el padre haga el mismo chequeo.
4. La API pública es un boolean: el helper no devolvio el centinela de fallo.

Si dibujas una cadena izquierda de tres nodos, muestras la diff de 2 en la raíz y la contrastas con el helper de una pasada O(N), dominas el 4.4. Siguiente: validar rangos de BST, misma columna vertebral recursiva, otra regla.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [List of Depths](/blog/es/ctci-4-3-list-of-depths)
* Siguiente: [Validate BST](/blog/es/ctci-4-5-validate-bst)