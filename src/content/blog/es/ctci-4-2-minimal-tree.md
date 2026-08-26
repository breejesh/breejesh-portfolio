---
title: "Minimal Tree: BST equilibrado desde un array ordenado (Java)"
description: "Problema estilo CTCI 4.2 para principiantes: dado un array ordenado de enteros únicos, construye un árbol de búsqueda binaria de altura mínima. Elige el medio como raíz y recurre en cada mitad."
date: "2026-02-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-2-minimal-tree.webp
previewImage: /assets/images/ctci-4-2-minimal-tree.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.2 para principiantes: dado un array ordenado de enteros únicos, construye un árbol de búsqueda binaria de altura mínima. Elige el medio como raíz y recurre en cada mitad.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Una línea ordenada de números únicos ya es media búsqueda binaria en árbol. La pregunta es *qué* valor pones de raíz para que el árbol quede bajo. Si insertas de izquierda a derecha en un BST vacío, obtienes un palo de altura N. Elige el medio del array como raíz, repite el truco en cada mitad, y la altura cae a unos log2(N).

Este post es enseñanza original para principiantes en **Java**. Misma familia de construcción de BST en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). El capítulo 4 sigue aquí después de abrir con grafos.

---

## 1. Analogía de la estantería equilibrada

Imagina una estantería ordenada con libros del 1 al 7:

`[1, 2, 3, 4, 5, 6, 7]`

Quieres un **árbol de búsqueda binaria**: el hijo izquierdo siempre guarda valores menores, el derecho mayores. También quieres el árbol lo **más bajo posible** (altura mínima), para que las búsquedas no recorran una espina larga.

Si pones 1 de raíz e insertas 2, 3, 4, ... obtienes:

```
1
 \
  2
   \
    3
     ...
```

Altura 7. Doloroso.

Si pones **4** (el medio) de raíz, la mitad izquierda `[1, 2, 3]` es el subárbol izquierdo y la derecha `[5, 6, 7]` el derecho. Repite en cada mitad: el medio de la izquierda es 2, el de la derecha es 6. Queda un árbol frondoso de altura 3:

```
      4
     / \
    2   6
   / \ / \
  1  3 5  7
```

Ese patrón es todo el algoritmo: **medio como raíz, recurre a la izquierda, recurre a la derecha**.

---

## 2. Problema en palabras simples

**Entrada:** un array ordenado de enteros únicos en orden creciente. Ejemplo: `int[] arr = {1, 2, 3, 4, 5, 6, 7}`.

**Salida:** la raíz de un árbol de búsqueda binaria con todos los valores y la **menor altura posible**.

**Forma del nodo que usamos:**

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

**Reglas y aclaraciones:**

* Valores únicos (sin duplicados que colocar a izquierda o derecha).
* El array ya está ordenado ascendente. No hace falta ordenar.
* Altura mínima significa tan equilibrado como un BST con N claves únicas puede ser: altura floor(log2(N)) + 1 en forma llena, o cercana cuando N no es uno menos que una potencia de dos.
* Puedes devolver `null` para un rango vacío (array vacío o subarray vacío).

**Aclara en la entrevista**

* ¿El array está garantizado ordenado y único? (Sí en esta versión clásica.)
* ¿Hacen falta punteros al padre? (No en este problema.)
* ¿Copias trozos del array o pasas índices? (Los índices son más limpios y O(1) extra por llamada.)

---

## 3. Piensa antes de codificar

### Ingenuo: insertar uno a uno desde la izquierda

Empieza vacío, llama `insert(arr[i])` de i = 0 a N-1.

* BST correcto: sí.
* Altura: O(N) porque el orden ordenado siempre va a la derecha.
* Tiempo: O(N log N) si los inserts reequilibran, u O(N^2) con insert ingenuo sobre entrada ordenada.

Menciónalo y descártalo para el objetivo de altura.

### Mejor idea: elegir la raíz con cuidado

En un BST, la raíz debe quedar entre el subárbol izquierdo y el derecho. Para un array **ordenado**, cualquier índice `mid` puede ser la raíz del subarray `arr[start..end]`:

* Subárbol izquierdo = BST de `arr[start..mid-1]`
* Subárbol derecho = BST de `arr[mid+1..end]`

Para minimizar altura, izquierda y derecha deben tener casi el mismo tamaño. El índice medio lo logra:

```
mid = (start + end) / 2
```

(o `start + (end - start) / 2` si te importa el overflow en arrays enormes).

Caso base: si `start > end`, devuelve `null`. Ese lado no tiene nodos.

Es la misma estructura que la búsqueda binaria, pero **construyes un árbol** en lugar de buscar.

Por qué es un BST válido: todo valor a la izquierda de mid es menor que `arr[mid]`, todo a la derecha es mayor. La recursión lo conserva en cada subárbol. Por qué la altura es mínima: cada nivel divide a la mitad los elementos que quedan, así que la profundidad es O(log N).

---

## 4. Solución en Java

```java
public class MinimalTree {

    static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    /** Build a minimal-height BST from a sorted unique array. */
    public static TreeNode createMinimalBST(int[] arr) {
        if (arr == null || arr.length == 0) {
            return null;
        }
        return build(arr, 0, arr.length - 1);
    }

    private static TreeNode build(int[] arr, int start, int end) {
        if (start > end) {
            return null;
        }

        int mid = start + (end - start) / 2;
        TreeNode node = new TreeNode(arr[mid]);
        node.left = build(arr, start, mid - 1);
        node.right = build(arr, mid + 1, end);
        return node;
    }
}
```

Recorrido sobre `{1, 2, 3, 4, 5, 6, 7}`:

| Rango de llamada | índice mid | valor raíz | rango izq. | rango der. |
| --- | --- | --- | --- | --- |
| 0..6 | 3 | 4 | 0..2 | 4..6 |
| 0..2 | 1 | 2 | 0..0 | 2..2 |
| 0..0 | 0 | 1 | vacío | vacío |
| 2..2 | 2 | 3 | vacío | vacío |
| 4..6 | 5 | 6 | 4..4 | 6..6 |
| 4..4 | 4 | 5 | vacío | vacío |
| 6..6 | 6 | 7 | vacío | vacío |

Árbol resultante (el mismo dibujo de la estantería):

```
      4
     / \
    2   6
   / \ / \
  1  3 5  7
```

Arrays de longitud impar dejan un medio limpio en la raíz. Longitud par (por ejemplo `{1, 2, 3, 4}`) puede usar cualquiera de los dos índices centrales según la división entera. Ambos dan altura mínima; la forma puede variar un poco, no la clase de altura.

El recorrido in-order del árbol terminado reimprime el array ordenado original. Es una comprobación mental rápida después de codificar.

---

## 5. Tabla de complejidad

| Pieza | Coste | Por qué |
| --- | --- | --- |
| Tiempo | O(N) | cada índice del array se convierte en un nodo; trabajo constante por índice |
| Pila extra | O(log N) | la profundidad de recursión es la altura del árbol |
| Espacio del árbol | O(N) | N nodos guardados |
| Inserts ordenados ingenuos | O(N^2) tiempo, O(N) altura | espina derecha |

No necesitas arrays extra para las mitades. Los índices reutilizan el mismo `arr`.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **Array vacío o null** → devuelve `null`.
* **Un solo elemento** → un nodo, ambos hijos null. Altura 1.
* **Dos elementos** → una raíz, un hijo (izq. o der. según mid). Altura 2.
* **Longitud par** → cualquiera de los dos centros vale; quédate con una fórmula y explícala.
* **Ya "ves" el árbol en la cabeza** → igual escribe la regla recursiva del medio; no hardcodes formas.

Errores comunes:

1. **Insertar valores ordenados de izquierda a derecha en un BST vacío.** BST correcto, altura terrible.
2. **Copiar subarrays en cada llamada** (`Arrays.copyOfRange`). Funciona, pero gasta tiempo y memoria. Prefiere `start`/`end`.
3. **Off-by-one en los límites.** Izquierda es `start..mid-1`, derecha `mid+1..end`. Incluir `mid` otra vez duplica la raíz.
4. **Usar `mid = (start + end) / 2` con índices enormes.** Prefiere `start + (end - start) / 2` donde el int puede desbordar (mismo hábito que binary search).
5. **Olvidar el caso base `start > end`.** Recursión infinita o caos de null.
6. **Construir un árbol completo estilo heap sin orden BST.** La completez sola no da orden de búsqueda; la regla del medio del rango ordenado da equilibrio y BST.

Esbozo mínimo de uso:

```java
int[] sorted = {1, 2, 3, 4, 5, 6, 7};
TreeNode root = MinimalTree.createMinimalBST(sorted);
// root.val == 4, left subtree has 1..3, right has 5..7
```

Helper opcional para comprobar la altura tras construir:

```java
static int height(TreeNode n) {
    if (n == null) return 0;
    return 1 + Math.max(height(n.left), height(n.right));
}
// for 7 nodes, height should be 3
```

---

## 7. Recap para contárselo a un amigo

Minimal Tree es "haz el BST más bajo desde un array ordenado y único":

1. El array ya está ordenado. Eso regala el orden BST al partir alrededor de una raíz.
2. Elige el elemento del medio como raíz del rango actual.
3. La mitad izquierda construye el hijo izquierdo. La derecha, el derecho.
4. Rango vacío devuelve `null`. Un elemento devuelve una hoja.
5. Tiempo O(N), altura O(log N). No insertes claves ordenadas una a una o crece un palo.

Si puedes dibujar `{1,2,3,4,5,6,7}` en el árbol equilibrado de arriba y explicar por qué el medio gana a "siempre coger el primero", dominas el 4.2. Después toca recorrer un árbol por profundidad.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Route Between Nodes](/blog/es/ctci-4-1-route-between-nodes)
* Siguiente: [List of Depths](/blog/es/ctci-4-3-list-of-depths)