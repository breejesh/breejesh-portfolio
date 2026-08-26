---
title: "Paths with Sum: contar caminos hacia abajo que suman un objetivo (Java)"
description: "Problema estilo CTCI 4.12 para principiantes: cuenta cada camino en un árbol binario que sume un valor objetivo. Solo padre a hijo. Fuerza bruta desde cada nodo, luego suma acumulada más un HashMap de prefijos."
date: "2026-06-20"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-12-paths-with-sum.webp
previewImage: /assets/images/ctci-4-12-paths-with-sum.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.12 para principiantes: cuenta cada camino en un árbol binario que sume un valor objetivo. Solo padre a hijo. Fuerza bruta desde cada nodo, luego suma acumulada más un HashMap de prefijos.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Bajas por un sendero de montaña. En cada cruce hay un número: subida o bajada. Quieres todos los tramos cuyo cambio neto sea un objetivo, por ejemplo 8. Un tramo puede empezar a mitad del camino, terminar a mitad, y nunca subir de nuevo. Eso es **paths with sum** en un árbol binario: solo de padre a hijo, cualquier inicio, cualquier fin.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de suma en caminos de árboles en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí cierra el capítulo 4, árboles y grafos.

---

## 1. Analogía cotidiana

Piensa en un árbol familiar de depósitos y retiros. Cada persona tiene un padre arriba y hasta dos hijos abajo. El dinero en una persona es su transacción.

Un **camino** aquí no es cualquier relación social. Es bajar en línea recta por el árbol: abuelo a padre a hijo. No saltas de lado. No vuelves a subir.

Eliges a cualquier persona como inicio y a cualquier descendiente como fin (incluido el inicio solo). Sumas los valores de esa cadena hacia abajo. Si la suma es el objetivo, la cuentas.

Ejemplo con objetivo `8`:

```
        10
       /  \
      5   -3
     / \    \
    3   2   11
   / \   \
  3  -2   1
```

Tres caminos suman 8:

* `5 → 3`
* `5 → 2 → 1`
* `-3 → 11`

`10 → 5` es 15, no cuenta. Un solo nodo con valor 8 también contaría.

---

## 2. Problema en palabras simples

**Entrada:** raíz de un árbol binario. Cada nodo guarda un `int` (positivo, negativo o cero). Un entero `targetSum`.

**Salida:** cuántos caminos hacia abajo suman exactamente `targetSum`.

**Reglas:**

* El camino solo va **padre → hijo** (hacia abajo).
* Puede empezar en cualquier nodo, no solo la raíz.
* Puede terminar en cualquier nodo, no solo una hoja.
* Un solo nodo es un camino válido de longitud 1.
* Puede haber negativos, así que no puedes podar con "la suma ya es demasiado grande".

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

**Ejemplos:**

| Idea del árbol | Objetivo | Cuenta | Por qué |
| --- | --- | --- | --- |
| árbol de arriba | 8 | 3 | `5→3`, `5→2→1`, `-3→11` |
| un solo nodo `8` | 8 | 1 | el nodo solo |
| un solo nodo `1` | 8 | 0 | nada llega a 8 |
| raíz `null` | lo que sea | 0 | árbol vacío |
| solo `1 → 2 → 3` | 3 | depende de 2 | tramos que suman 3 según la forma |

**Aclara antes de codear:**

* Valores negativos? (Sí. Bloquean cortes tempranos simples.)
* Caminos que se solapan se cuentan por separado? (Sí.)
* Camino contiguo hacia abajo? (Sí. No te saltas un hijo del medio.)
* Devolvemos los caminos o solo el conteo? (Solo el conteo.)

---

## 3. Piensa primero

### Bruta: cada nodo es un posible inicio

Para cada nodo `u`, lanza un DFS que empiece en `u` y solo baje. Mantén una suma acumulada. Cada vez que iguale el objetivo, suma 1 a la respuesta. Sigue aunque ya hayas acertado: un camino más largo puede volver a acertar (hay negativos).

Tiempo: desde cada uno de N nodos puedes recorrer O(N) descendientes en un árbol degenerado, O(N²) en el peor caso. En un árbol equilibrado se acerca a O(N log N). Espacio O(H) por la pila de recursión.

Vale como primera respuesta. En entrevista suelen querer el pase lineal después.

### Optimizada: suma acumulada + conteos de prefijo

En un array, "cuántos subarrays suman el objetivo" usa un mapa de sumas prefijo. Un camino que solo baja en el árbol es como un subarray sobre una espina raíz-hoja, pero el tramo puede empezar a mitad.

Define `runningSum` en un nodo como la suma desde la **raíz del árbol** hasta ese nodo (el camino activo del DFS).

Si un ancestro tenía prefijo `S` y el actual es `runningSum`, el tramo **debajo de ese ancestro hasta aquí** suma `runningSum - S`.

Quieres `runningSum - S == targetSum`, o sea `S == runningSum - targetSum`.

Mantén un `HashMap<Integer, Integer>`: cuántas veces ha aparecido cada suma prefijo en el **camino actual raíz → aquí**. En cada nodo:

1. Consulta `runningSum - targetSum` en el mapa. Ese conteo es cuántos caminos **terminan en este nodo** y suman el objetivo.
2. Suma 1 a la entrada de `runningSum`.
3. Recurre izquierda y derecha.
4. **Backtrack**: resta 1 (borra si queda en cero). Los hermanos no deben ver este prefijo.

Siembra el mapa con `0 → 1` antes de caminar. Modela un prefijo vacío encima de la raíz, para que un camino que empieza en la raíz también cuadre cuando `runningSum == targetSum`.

Un solo DFS visita cada nodo una vez. El mapa es O(1) amortizado por nodo. Tiempo O(N). Espacio extra O(H) en la pila y como mucho O(H) claves vivas en el camino actual si limpias al volver (O(N) en un palo).

---

## 4. Solución en Java

### Fuerza bruta (primer pase claro)

```java
int countPathsBrute(TreeNode root, int targetSum) {
    if (root == null) {
        return 0;
    }
    return countFrom(root, targetSum)
        + countPathsBrute(root.left, targetSum)
        + countPathsBrute(root.right, targetSum);
}

/** Caminos que empiezan en 'node' y solo bajan. */
int countFrom(TreeNode node, long remaining) {
    if (node == null) {
        return 0;
    }
    int count = 0;
    if (node.val == remaining) {
        count++;
    }
    count += countFrom(node.left, remaining - node.val);
    count += countFrom(node.right, remaining - node.val);
    return count;
}
```

Usar `remaining` (cuánto falta) es la misma idea que una suma que crece. Cualquier estilo vale.

### Principal: mapa de prefijos (objetivo de entrevista)

```java
import java.util.HashMap;
import java.util.Map;

int countPathsWithSum(TreeNode root, int targetSum) {
    Map<Integer, Integer> prefixCounts = new HashMap<>();
    prefixCounts.put(0, 1); // prefijo vacío encima de la raíz
    return dfs(root, 0, targetSum, prefixCounts);
}

int dfs(TreeNode node, int runningSum, int targetSum, Map<Integer, Integer> prefixCounts) {
    if (node == null) {
        return 0;
    }

    runningSum += node.val;

    int pathsEndingHere = prefixCounts.getOrDefault(runningSum - targetSum, 0);

    prefixCounts.put(runningSum, prefixCounts.getOrDefault(runningSum, 0) + 1);

    int total = pathsEndingHere
        + dfs(node.left, runningSum, targetSum, prefixCounts)
        + dfs(node.right, runningSum, targetSum, prefixCounts);

    int c = prefixCounts.get(runningSum);
    if (c == 1) {
        prefixCounts.remove(runningSum);
    } else {
        prefixCounts.put(runningSum, c - 1);
    }

    return total;
}
```

Recorrido del árbol de ejemplo con objetivo `8` al llegar al `5` izquierdo (suma desde la raíz: `10 + 5 = 15`):

| Paso | runningSum | Busca `runningSum - 8` | Idea del mapa | Caminos que terminan aquí |
| --- | --- | --- | --- | --- |
| en 10 | 10 | 2 → 0 | put 10 | 0 |
| en 5 | 15 | 7 → 0 | put 15 | 0 |
| en 3 izq. | 18 | 10 → 1 (prefijo de la raíz) | camino `5→3` | 1 |
| en hijo 3 | 21 | 13 → 0 | | 0 |
| en -2 | 16 | 8 → 0 | | 0 |
| vuelta; en 2 | 17 | 9 → 0 | | 0 |
| en 1 | 18 | 10 → 1 | camino `5→2→1` | 1 |
| lado der. -3 | 7 | -1 → 0 | | 0 |
| en 11 | 18 | 10 → 1 | camino `-3→11` | 1 |

Total 3. El mapa solo refleja ancestros del camino DFS activo gracias al backtrack.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Bruta: DFS desde cada nodo | O(N²) peor, ~O(N log N) equilibrado | O(H) pila | Fácil de explicar primero |
| Suma acumulada + HashMap | O(N) | O(H) típico, O(N) en palo | Respuesta preferida en entrevista |
| Guardar listas raíz-hoja y escanear | O(N²) copias | O(N) o peor | Pesado; evita |

N es el número de nodos. H es la altura. El mapa gana porque cada nodo hace trabajo constante una vez.

---

## 6. Casos límite y errores frecuentes

Los entrevistadores tocan estos:

* **Raíz null** → 0.
* **Un solo nodo igual al objetivo** → 1. Depende de la semilla `0 → 1`.
* **Un solo nodo distinto** → 0.
* **Todo negativo, objetivo positivo** → recorre todo; sin salida temprana.
* **Ceros en el árbol** → un cero alarga el camino sin cambiar la suma; varios aciertos solapados son reales.
* **Objetivo 0** → cuentan caminos de nodos reales que suman 0; no inventes un camino vacío. Con la semilla del mapa, un nodo cuya suma iguala un prefijo previo marca un tramo no vacío.
* **Cadena degenerada** → mapa y pila crecen a O(N); sigue correcto y lineal.
* **El mismo prefijo dos veces en un camino** (ceros o negativos que se anulan) → el mapa guarda un **conteo**, no un booleano.

Errores comunes:

1. **No hacer backtrack del mapa.** Un prefijo del subárbol izquierdo se filtra al derecho.
2. **Olvidar `prefixCounts.put(0, 1)`.** Se subcuentan caminos que empiezan en la raíz.
3. **Parar cuando la suma iguala el objetivo.** Caminos más largos pueden volver a acertar con negativos o ceros. Sigue el DFS.
4. **Permitir punteros al padre o caminos arbitrarios con LCA.** El problema es **solo hacia abajo**.
5. **Usar identidad de nodo en el mapa en vez de sumas prefijo.**
6. **Desbordamiento de `int`.** En entrevista suele bastar `int`; menciona `long` si los valores pueden ser enormes.

Prueba mínima:

```java
TreeNode root = new TreeNode(10);
root.left = new TreeNode(5);
root.right = new TreeNode(-3);
root.left.left = new TreeNode(3);
root.left.right = new TreeNode(2);
root.right.right = new TreeNode(11);
root.left.left.left = new TreeNode(3);
root.left.left.right = new TreeNode(-2);
root.left.right.right = new TreeNode(1);

System.out.println(countPathsWithSum(root, 8)); // 3
System.out.println(countPathsWithSum(null, 8)); // 0
System.out.println(countPathsWithSum(new TreeNode(8), 8)); // 1
```

---

## 7. Resumen para contárselo a un amigo

Paths with Sum pregunta: cuántos tramos hacia abajo (padre a hijo) en un árbol binario suman un objetivo?

1. Bruta: desde cada nodo, baja y cuenta sumas que acierten. Correcto, hasta O(N²).
2. Mejor: DFS con suma acumulada desde la raíz. Mapa de cuántas veces aparece cada prefijo en el camino actual.
3. En cada nodo, los caminos que terminan aquí y aciertan son el conteo de `runningSum - target` en el mapa.
4. Siembra `0 → 1`. Incrementa el prefijo actual antes de los hijos. Decrementa (backtrack) después.
5. Negativos y ceros: no podes por "suma demasiado grande". Todos los solapes cuentan.

Si dibujas el árbol de ejemplo, muestras por qué tres caminos dan 8, y explicas por qué importa el backtrack del HashMap, dominas el 4.12. El capítulo 4 cierra con un recorrido de árbol que en el fondo es un truco de sumas prefijo.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Random Node](/blog/es/ctci-4-11-random-node)
* Siguiente: [Insertion](/blog/es/ctci-5-1-insertion)