---
title: "List of Depths: una linked list por nivel del árbol (Java)"
description: "Problema estilo CTCI 4.3 para principiantes: convierte un árbol binario en una lista de linked lists, una por profundidad. Primero BFS por niveles, DFS opcional con índice de profundidad, en Java claro."
date: "2025-10-19"
tags: [Algoritmos]
coverImage: /assets/images/ctci-4-3-list-of-depths.webp
previewImage: /assets/images/ctci-4-3-list-of-depths.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.3 para principiantes: convierte un árbol binario en una lista de linked lists, una por profundidad. Primero BFS por niveles, DFS opcional con índice de profundidad, en Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un edificio tiene pisos. Todos en el piso 0 son un grupo. Todos en el piso 1 son otro. Misma idea en un árbol binario: la **profundidad 0** es solo la raíz, la **profundidad 1** son los hijos de la raíz, y así. El trabajo no es recorrer el árbol al azar. Es producir una lista de nodos por cada profundidad, para poder entregar "todos en este nivel" sin volver a caminar el árbol.

Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas de recorrido por niveles en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide).

---

## 1. Analogía cotidiana

Imagina un edificio de oficinas con la gente dispuesta como un árbol:

* Piso 0: la CEO (raíz).
* Piso 1: los dos reportes directos.
* Piso 2: sus reportes, y así.

RR.HH. quiere un **portapapeles por piso**: una linked list de todos los que están en ese piso, de izquierda a derecha si recorres el edificio por niveles.

Puedes:

1. **Ir piso por piso** con una cola de gente en el piso actual (BFS). Procesas a todos en el piso k, los escribes en el portapapeles k, y encolas a sus hijos para el piso k+1.
2. **Visitar personas una a una** y darles una nota con su número de piso (DFS). Cuando encuentras a alguien en el piso d, lo añades al portapapeles d. Si aún no existe, lo creas.

Ambos terminan con la misma forma: una lista de listas, índice = profundidad.

---

## 2. Problema en palabras simples

**Entrada:** la raíz de un árbol binario (o `null` si está vacío).

**Salida:** una lista de linked lists de nodos. La entrada `i` tiene todos los nodos a profundidad `i`, normalmente de izquierda a derecha en ese nivel si usas BFS.

Si el árbol tiene altura H (aristas en el camino raíz-hoja más largo), obtienes H+1 listas (profundidades 0 a H). Un árbol vacío da una lista exterior vacía.

**Forma de nodo que usamos:**

```java
class TreeNode {
    int data;
    TreeNode left;
    TreeNode right;

    TreeNode(int data) {
        this.data = data;
    }
}
```

**Ejemplo:**

```
        4
       / \
      2   6
     / \   \
    1   3   7
```

Esperado (valores; las listas guardan objetos nodo):

| Profundidad | Lista (izquierda a derecha) |
| --- | --- |
| 0 | 4 |
| 1 | 2 → 6 |
| 2 | 1 → 3 → 7 |

**Aclara antes de codear:**

* ¿Linked lists de **referencias a nodos**, o copias de valores? (Referencias a los nodos del árbol, salvo que digan lo contrario.)
* ¿Orden dentro del nivel? (Normalmente izquierda a derecha. BFS lo da gratis.)
* ¿Podemos usar `java.util.LinkedList` / `ArrayList`? (Sí en esta serie.)
* ¿Árbol vacío y un solo nodo?

---

## 3. Primero piensa

### Enfoque A: BFS por niveles (principal)

Es el encaje natural. El recorrido por niveles ya agrupa por profundidad.

1. Si `root` es `null`, devuelve un resultado vacío.
2. Mete la raíz en una cola.
3. Mientras la cola no esté vacía:
   * Anota `levelSize = queue.size()` (cuántos nodos hay en esta profundidad ahora).
   * Crea una linked list nueva para esta profundidad.
   * Repite `levelSize` veces: saca un nodo, añádelo a la lista del nivel, encola left y right si existen.
   * Añade la lista del nivel al resultado.

¿Por qué `levelSize`? Sin eso no sabes dónde termina una profundidad y empieza la siguiente, porque la cola también guarda los hijos del siguiente nivel.

### Enfoque B: DFS con profundidad (opcional)

Recurre con `(node, depth)`:

1. Mantén una `List<LinkedList<TreeNode>>` exterior.
2. Al visitar un nodo en profundidad `d`, si `result.size() == d`, añade una linked list vacía nueva (eres el primer visitante de esa profundidad).
3. Añade el nodo a `result.get(d)`.
4. Recurre a la izquierda con `d + 1`, luego a la derecha con `d + 1`.

El orden de visita es preorden (raíz, izquierda, derecha). Dentro de un nivel, izquierda a derecha se mantiene si siempre vas izquierda antes que derecha.

DFS sirve cuando ya piensas en recursión, o cuando quieres evitar una cola explícita. BFS suele ser más claro en entrevistas de "una lista por nivel".

### Qué no hacer

* Construir una sola lista gigante de todos los nodos y luego intentar partir por profundidad sin guardar la profundidad. Perdiste el agrupamiento.
* Mutar `left`/`right` del árbol para formar las listas. El problema quiere listas **nuevas** de nodos, no un árbol destruido (salvo que lo pidan).

---

## 4. Solución en Java

### BFS (principal)

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

class ListOfDepths {
    public static List<LinkedList<TreeNode>> createLevelLists(TreeNode root) {
        List<LinkedList<TreeNode>> result = new ArrayList<>();
        if (root == null) {
            return result;
        }

        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);

        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            LinkedList<TreeNode> level = new LinkedList<>();

            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.remove();
                level.add(node);
                if (node.left != null) {
                    queue.add(node.left);
                }
                if (node.right != null) {
                    queue.add(node.right);
                }
            }

            result.add(level);
        }

        return result;
    }
}
```

Recorrido del árbol de ejemplo:

| Paso | Cola antes del nivel | levelSize | Lista del nivel | Hijos encolados |
| --- | --- | --- | --- | --- |
| 1 | [4] | 1 | 4 | 2, 6 |
| 2 | [2, 6] | 2 | 2 → 6 | 1, 3, luego 7 |
| 3 | [1, 3, 7] | 3 | 1 → 3 → 7 | (ninguno) |
| 4 | vacía | parar | | |

El tamaño del resultado es 3. Profundidades 0, 1, 2.

### DFS (opcional)

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

class ListOfDepthsDfs {
    public static List<LinkedList<TreeNode>> createLevelLists(TreeNode root) {
        List<LinkedList<TreeNode>> result = new ArrayList<>();
        createLevelLists(root, 0, result);
        return result;
    }

    private static void createLevelLists(
            TreeNode node,
            int depth,
            List<LinkedList<TreeNode>> result) {
        if (node == null) {
            return;
        }

        if (result.size() == depth) {
            result.add(new LinkedList<TreeNode>());
        }

        result.get(depth).add(node);
        createLevelLists(node.left, depth + 1, result);
        createLevelLists(node.right, depth + 1, result);
    }
}
```

Mismo ejemplo, orden de appends en preorden: 4, luego 2, 1, 3, luego 6, 7. Al final:

* profundidad 0: [4]
* profundidad 1: [2, 6]
* profundidad 2: [1, 3, 7]

Mismo agrupamiento que BFS.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra (además de la salida) |
| --- | --- | --- |
| BFS por niveles | O(N) | O(W) cola, W = ancho máximo del árbol |
| DFS recursivo | O(N) | O(H) pila de llamadas, H = altura |

N es el número de nodos. Tocás cada nodo una vez y lo añades una vez: tiempo lineal.

El espacio de salida es O(N) en ambos casos: cada nodo aparece en exactamente una lista interior. Eso lo exige el problema, no es overhead opcional.

En un árbol completo, el ancho máximo es cerca de N/2 en el último nivel, así que la cola BFS puede ser Θ(N). En un árbol flaco (siempre un hijo), la cola es chica y la pila DFS es Θ(N).

---

## 6. Casos borde y errores comunes

Los entrevistadores tocan estos:

* **Árbol vacío** (`root == null`) → lista exterior vacía, no una lista con una lista vacía adentro.
* **Un solo nodo** → una lista con solo ese nodo.
* **Árbol desbalanceado** → el lado más profundo sigue teniendo sus listas; los hermanos ausentes simplemente no aparecen.
* **Sesgado a izquierda o derecha** → una lista por profundidad existente; tamaño 1 en cada una.
* **Valores duplicados** → las listas guardan referencias a nodos, así que dos nodos con `data == 5` son entradas distintas.

Errores comunes:

1. **Olvidar `levelSize` en BFS.** Mezclás profundidades en un solo paso o necesitás un marcador/null de más.
2. **Encolar hijos null** sin chequear y luego NPE al tratarlos como nodos reales.
3. **Usar la profundidad como índice sin crecer la lista exterior en DFS.** La primera vez que ves profundidad d, hay que crear la lista.
4. **Devolver valores en vez de nodos** (o al revés) cuando la firma pedía otra cosa.
5. **Reconectar `left`/`right` en una linked list** y romper el árbol original.
6. **Off-by-one en profundidad vs altura.** La raíz tiene profundidad 0. Número de listas = altura + 1 si el árbol no está vacío.

Uso mínimo:

```java
TreeNode root = new TreeNode(4);
root.left = new TreeNode(2);
root.right = new TreeNode(6);
// ... cuelga 1, 3, 7

List<LinkedList<TreeNode>> levels = ListOfDepths.createLevelLists(root);
// levels.get(0) es 4
// levels.get(1) es 2 → 6
// levels.get(2) es 1 → 3 → 7
```

---

## 7. Resumen: explícaselo a un amigo

List of Depths es "agrupar nodos del árbol por número de piso":

1. **BFS:** procesá la cola en lotes del tamaño del nivel. Cada lote es una linked list. Los hijos esperan el siguiente lote.
2. **DFS:** pasá la profundidad en la recursión. Añadí cada nodo a `lists.get(depth)`. Creá la lista la primera vez que llegás a esa profundidad.
3. Árbol vacío → ninguna lista. Solo raíz → una lista de un nodo.
4. Tiempo O(N). Espacio extra: ancho de la cola o altura de la recursión, más las listas de salida.

Si podés dibujar los pisos del edificio, escribir el bucle BFS con `levelSize` sin mirar, y nombrar un caso borde (raíz null), dominás el 4.3.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Minimal Tree](/blog/es/ctci-4-2-minimal-tree)
* Siguiente: [Check Balanced](/blog/es/ctci-4-4-check-balanced)