---
title: "First Common Ancestor: LCA sin enlaces al padre (Java)"
description: "Problema estilo CTCI 4.8 para principiantes: encuentra el ancestro común más profundo de dos nodos en un árbol binario (no tiene que ser BST). Prefiere un pase recursivo que devuelve un objeto de estado; subir por parent es la alternativa."
date: "2026-05-09"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-8-first-common-ancestor.webp
previewImage: /assets/images/ctci-4-8-first-common-ancestor.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.8 para principiantes: encuentra el ancestro común más profundo de dos nodos en un árbol binario (no tiene que ser BST). Prefiere un pase recursivo que devuelve un objeto de estado; subir por parent es la alternativa.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Dos personas en un árbol familiar. Subes desde cada una hacia la raíz más antigua. La primera persona que ambas rutas tocan es un ancestro común. El **primer** ancestro común es el más profundo: lo más cerca posible de las dos personas, no la raíz salvo que la raíz sea el único punto compartido.

Este post es enseñanza original para principiantes en **Java**. Misma familia que el LCA clásico de entrevistas, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Problema **4.8**: árbol binario, no necesariamente BST. Preferimos una solución **sin enlaces al padre**.

---

## 1. Analogía del árbol

Imagina el organigrama de una empresa dibujado como árbol binario. Cada caja tiene como mucho dos reportes debajo. Alice y Bob están en algún sitio del gráfico. El jefe en común más lejos del CEO (más cerca de Alice y Bob) es el first common ancestor.

Distinciones importantes:

* **Ancestro de X** en muchos enunciados de entrevista incluye a X. Si Bob reporta bajo Alice, Alice puede ser la respuesta.
* **Primero / más bajo** significa más profundo en el árbol, no "primero" en un recorrido de izquierda a derecha.
* **No** es un BST. No puedes usar el orden de valores para decidir izquierda o derecha. Solo tienes estructura: hijo izquierdo, hijo derecho, y quizá un puntero al padre si el entrevistador lo da.

Si los nodos tuvieran `parent`, el problema se parece a dos caminos que suben a una autopista compartida, parecido a la intersección de listas. Sin padres, empiezas en la raíz y bajas con recursión.

---

## 2. Problema en palabras simples

**Objetivo:** dada la raíz de un árbol binario y dos nodos `p` y `q` que pueden o no estar en ese árbol, devolver su nodo first common ancestor, o `null` si no puedes nombrar uno.

**Restricciones que importan:**

* Árbol binario, no necesariamente BST.
* Evitar guardar una lista de todos los ancestros (el sabor clásico de "no almacenes nodos extra en una estructura").
* Preferir **sin parent** en `TreeNode`.
* Aclara si `p` o `q` pueden ser la respuesta cuando uno cuelga del otro (normalmente sí).
* Aclara qué pasa si un nodo no está en el árbol (normalmente `null`).

**Forma del nodo (sin parent):**

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

**Ejemplo pequeño**

```
        3
       / \
      5   1
     / \ / \
    6  2 0  8
      / \
     7   4
```

* FCA de `6` y `4` es `5`.
* FCA de `5` y `4` es `5` (el nodo se cubre a sí mismo).
* FCA de `6` y `8` es `3`.

---

## 3. Piensa primero

### Alternativa: enlaces al padre, subir como intersección de listas

Si cada nodo tiene `parent`:

1. Mide la profundidad de `p` y de `q` subiendo a la raíz.
2. Sube el nodo más profundo hasta que ambos queden a la misma profundidad.
3. Sube ambos de uno en uno hasta que los punteros coincidan. Ese nodo es el first common ancestor.

Tiempo O(D) con D la profundidad del más profundo. Espacio extra O(1) además del árbol. Misma idea que la intersección de CTCI 2.7: dos caminos que comparten un sufijo hacia la raíz.

Útil cuando la API ya guarda padres. No es el camino principal si el entrevistador dice "los nodos solo conocen a sus hijos."

### Ingenuo sin padres: chequeos de lado con `covers`

Desde la raíz, pregunta "¿el subárbol izquierdo cubre `p`?" y "¿el izquierdo cubre `q`?"

* Respuestas distintas: `p` y `q` se separan bajo este nodo, así que este nodo es el FCA.
* Mismo lado: solo recursas a ese lado.

Correcto, pero cada `covers` recorre un subárbol y lo llamas muchas veces. Sigues en O(N) en un árbol equilibrado, con peores constantes porque los mismos nodos se escanean una y otra vez.

### Preferido: una recursión, devolver estado

Solo quieres recorrer el árbol una vez. Un helper recursivo devuelve un pequeño **objeto de estado**:

* Un candidato `node` (puede ser `p`, `q`, un ancestro real, o `null`)
* Una bandera `isAncestor` que dice "este `node` ya es el verdadero first common ancestor"

Reglas que suben:

1. Subárbol vacío → `(null, false)`.
2. Izquierda y derecha devuelven un nodo no nulo → la raíz actual es el ancestro común (`isAncestor = true`).
3. La raíz actual es `p` o `q`, y el otro objetivo se encontró en un subárbol → la raíz actual es un ancestro verdadero.
4. La raíz actual es `p` o `q`, y el otro **no** está abajo → devuelve esta raíz con `isAncestor = false` (solo "encontré un objetivo").
5. Solo un lado encontró algo → pasa ese resultado hacia arriba (salvo que aplique el paso 3).
6. Si un hijo ya puso `isAncestor = true`, corta y burbujea ese resultado.

¿Por qué la bandera? Sin ella, "encontré `p` pero no `q`" se ve igual que "`p` cuelga de `q`" si solo devuelves un puntero. La bandera separa **LCA real** de **hallazgo parcial**. Arriba, si `isAncestor` es false, devuelves `null` (nodo ausente o pareja incompleta).

Esa es la solución que conviene codificar y explicar primero.

---

## 4. Solución Java (sin parent)

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}

/** Estado de un pase recursivo. */
class Result {
    TreeNode node;
    boolean isAncestor;

    Result(TreeNode node, boolean isAncestor) {
        this.node = node;
        this.isAncestor = isAncestor;
    }
}

class FirstCommonAncestor {

    /**
     * First common ancestor de p y q bajo root, o null si no hay
     * un par válido completamente presente (por ejemplo un nodo ausente).
     */
    TreeNode commonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        Result r = helper(root, p, q);
        return r.isAncestor ? r.node : null;
    }

    private Result helper(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null) {
            return new Result(null, false);
        }

        // Mismo nodo pedido dos veces (p == q == root)
        if (root == p && root == q) {
            return new Result(root, true);
        }

        Result left = helper(root.left, p, q);
        if (left.isAncestor) {
            return left; // ya cerrado abajo
        }

        Result right = helper(root.right, p, q);
        if (right.isAncestor) {
            return right;
        }

        if (left.node != null && right.node != null) {
            // p y q en subárboles distintos
            return new Result(root, true);
        }

        if (root == p || root == q) {
            // Un objetivo aquí; ancestro real solo si el otro estaba abajo
            boolean foundOther = left.node != null || right.node != null;
            return new Result(root, foundOther);
        }

        // Sube el lado que encontró un nodo (o null)
        TreeNode bubble = left.node != null ? left.node : right.node;
        return new Result(bubble, false);
    }
}
```

Recorrido del ejemplo con `p = 6`, `q = 4` (ambos bajo `5`):

| Paso | Foco | Qué sube | Notas |
| --- | --- | --- | --- |
| 1 | Hoja `6` | node=`6`, false | root coincide con `p` |
| 2 | Subárbol de `2` halla `4` | node=`4`, false | derecha de `2` |
| 3 | Nodo `2` | burbujea `4` | no es p/q |
| 4 | Nodo `5`: izq tiene `6`, der tiene `4` | node=`5`, **true** | ambos lados no nulos |
| 5 | Raíz `3` | izq ya `isAncestor` | corta y devuelve `5` |

Si `q` fuera un nodo fuera del árbol, podrías burbujear `p` con `isAncestor = false` hasta arriba, y el método público devuelve `null`. Ahí la bandera justifica su existencia.

---

## 5. Alternativa: subir con parent

Cuando `TreeNode` tiene `parent`:

```java
class TreeNodeWithParent {
    int val;
    TreeNodeWithParent left;
    TreeNodeWithParent right;
    TreeNodeWithParent parent;
}

TreeNodeWithParent commonAncestorWithParents(
        TreeNodeWithParent p, TreeNodeWithParent q) {
    int delta = depth(p) - depth(q);
    TreeNodeWithParent first = delta > 0 ? q : p;   // más superficial
    TreeNodeWithParent second = delta > 0 ? p : q;  // más profundo
    second = goUpBy(second, Math.abs(delta));

    while (first != second && first != null && second != null) {
        first = first.parent;
        second = second.parent;
    }
    return (first == null || second == null) ? null : first;
}

int depth(TreeNodeWithParent node) {
    int d = 0;
    while (node != null) {
        node = node.parent;
        d++;
    }
    return d;
}

TreeNodeWithParent goUpBy(TreeNodeWithParent node, int delta) {
    while (delta > 0 && node != null) {
        node = node.parent;
        delta--;
    }
    return node;
}
```

Menciona esto en la entrevista después de la solución recursiva con estado: "Si hay parents, iguala profundidades y sube juntos; misma idea que intersección de listas." Luego vuelve a la versión sin parent como default en árboles binarios planos.

---

## 6. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | ¿Necesita parent? |
| --- | --- | --- | --- |
| Subir por parent (alinear profundidad) | O(D) | O(1) | sí |
| `covers` repetido + ramificar | O(N) (peores constantes) | O(H) pila | no |
| Una recursión + estado `Result` | O(N) | O(H) pila | no |

N = nodos del árbol, D = profundidad del más profundo, H = altura (pila de recursión). Sin parents ni índices extra no ganas el peor caso O(N), porque un nodo ausente te obliga a mirar casi todo.

---

## 7. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **Un nodo es ancestro del otro** → la respuesta es el de arriba (`isAncestor` se pone true cuando el segundo se halla debajo).
* **`p == q`** → ese nodo (si está).
* **Uno o ambos ausentes** → `null` con `isAncestor == false` arriba.
* **La raíz es el único ancestro común** → los objetivos viven en lados distintos de la raíz (o uno es la raíz y el otro cuelga).
* **Árbol vacío / root null** → `null`.
* **No es BST** → nunca compares `val` para elegir dirección.

Errores comunes:

1. **Devolver el primer hallazgo parcial como LCA** sin bandera ni un barrido previo de "existen ambos".
2. **Guardar caminos completos raíz-nodo** en listas cuando el problema pide evitar ese estilo (vale como calentamiento; dilo y avanza).
3. **Usar lógica de BST** en un árbol binario plano.
4. **Olvidar que `p` o `q` pueden ser la respuesta** cuando uno cubre al otro.
5. **Mutar el árbol** o los parents cuando solo necesitabas un recorrido de lectura.

Uso mínimo:

```java
// construye el árbol de ejemplo con raíz 3 ... luego:
TreeNode ans = new FirstCommonAncestor().commonAncestor(root, node6, node4);
// ans.val == 5
```

---

## 8. Explicar a un amigo

First Common Ancestor en un árbol binario plano:

1. El nodo más profundo cuyo subárbol contiene ambos objetivos (un nodo cuenta en su propio subárbol).
2. Con parent: iguala profundidades, sube juntos hasta que los punteros coincidan.
3. Sin parent (preferido): un DFS que devuelve **estado** (`node` + `isAncestor`).
4. Ambos hijos reportan un hallazgo → el nodo actual es el LCA.
5. El nodo actual es un objetivo y el otro se halló abajo → el actual es el LCA.
6. Hallazgo parcial sin la bandera true → sube; arriba devuelves `null` si nunca se confirmó.

Si puedes dibujar el ejemplo, marcar dónde izquierda y derecha reportan un hit, y explicar por qué existe la bandera, dominas el 4.8.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Build Order](/blog/es/ctci-4-7-build-order)
* Siguiente: [BST Sequences](/blog/es/ctci-4-9-bst-sequences)