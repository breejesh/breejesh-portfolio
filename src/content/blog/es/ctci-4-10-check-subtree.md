---
title: "CTCI 4.10 Check Subtree: ¿T2 está dentro de T1? (Java)"
description: "T1 es mucho mayor que T2. Decide si T2 es subárbol de T1: busca la raíz de T2 en T1 y haz matchTree, o serializa preorden con nulos y usa contains. Java, O(n + km) vs O(n + m)."
date: "2026-05-24"
tags: [Algorithms]
coverImage: /assets/images/ctci-4-10-check-subtree.webp
previewImage: /assets/images/ctci-4-10-check-subtree.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** T1 es mucho mayor que T2. Decide si T2 es subárbol de T1: busca la raíz de T2 en T1 y haz matchTree, o serializa preorden con nulos y usa contains. Java, O(n + km) vs O(n + m).
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes un árbol binario grande **T1** y un árbol mucho más pequeño **T2**. La pregunta es fácil de enunciar y fácil de fallar: ¿es **T2 un subárbol de T1**? Eso significa que algún nodo `n` en T1 tiene debajo una rama idéntica a T2, misma estructura y mismos valores, hasta las hojas. Si cortas el árbol en `n`, deberías obtener T2, no "algo que empieza como T2".

Este post es el problema **4.10 Check Subtree** de la [serie CTCI en Java](/blog/es/ctci-series-guide). Enseñanza original, no copia de un libro. Dos enfoques sólidos: búsqueda recursiva más comparación de árboles, y cadenas en preorden con marcadores de null.

---

## Imagen cotidiana

Piensa en el organigrama de una empresa (T1) y la foto de un equipo (T2).

* T2 es subárbol solo si algún manager en T1 tiene **exactamente** ese equipo debajo: las mismas personas en los mismos asientos izquierda/derecha, incluidas las sillas vacías (hijos null).
* No basta con que los mismos nombres aparezcan en algún sitio del organigrama. Importan el orden y la forma.
* No basta con que un camino de la raíz a una hoja coincida con T2. Subárbol significa la forma completa enraizada bajo algún nodo.

Así: encuentra un candidato a raíz en T1 y prueba que todo el árbol pequeño encaja. O escribe ambos árboles como una cadena cuidadosa y pregunta si la cadena pequeña está dentro de la grande.

---

## Problema en palabras simples

**Entrada:** raíces de dos árboles binarios, `t1` y `t2`. Se asume que T1 es mucho mayor que T2 (el marco habitual en entrevista).

**Salida:** `true` si T2 es subárbol de T1; si no, `false`.

**Definición:** T2 es subárbol de T1 si existe un nodo `n` en T1 tal que el subárbol enraizado en `n` es **idéntico** a T2 (valores y estructura).

**Ejemplos**

```
T1:          1
           /   \
          2     3
         / \   /
        4   5 6

T2:      2
        / \
       4   5
```

Respuesta: `true`. El hijo izquierdo de la raíz de T1 coincide por completo con T2.

```
T2':     2
        /
       4
```

Respuesta: `false` si el nodo `2` de T1 sigue teniendo hijo derecho `5`. Debe coincidir la estructura, no solo una forma parcial.

**Aclara en la entrevista**

* T2 vacío: a menudo se trata como subárbol de cualquier cosa (o se rechaza; elige un contrato). T1 vacío con T2 no vacío es `false`.
* Los valores pueden repetirse en T1, así que puede haber varios candidatos.
* Compara por **valor y estructura**, no por referencia de objeto (los árboles suelen ser objetos distintos).
* Árbol binario, no necesariamente un BST.

**Forma del nodo**

```java
public class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}
```

---

## Cómo pensar antes de codificar

### Enfoque A: buscar la raíz y luego matchTree

1. Recorre T1 (DFS o BFS). Cuando un nodo tenga `val == t2.val`, llama a `matchTree(node, t2)`.
2. `matchTree(a, b)` es true solo si ambos son null, o ambos no null con el mismo valor y subárboles izquierdo y derecho que coinciden.
3. Si algún candidato encaja del todo, devuelve true. Si T1 termina sin coincidencia, false.

Es el enfoque que la mayoría esboza primero. Es claro y no necesita memoria extra de cadenas.

Coste en el peor caso: puedes comparar T2 en muchos sitios de T1. Si T1 tiene tamaño `n`, T2 tamaño `m`, y muchos nodos comparten el valor de la raíz de T2, puedes gastar hasta unos O(n · m). Cuando los valores son poco repetidos, se acerca a O(n + m).

### Enfoque B: preorden con marcadores null y contains

1. Serializa T1 y T2 con un recorrido **preorden** que **registra hijos null** (por ejemplo `X` para null, o un esquema con delimitadores).
2. Pregunta si la cadena de T2 es **subcadena** de la de T1.

Por qué importan los marcadores null: sin ellos, formas distintas pueden serializar igual. Con ellos, un trozo contiguo del preorden del árbol grande que iguala la serialización completa del pequeño significa que las formas enraizadas coinciden. Aún necesitas separadores para que valores como `12` no finjan ser `1` y luego `2`. Un patrón habitual es envolver valores: `"#3#"` y `"#X#"` para null, unir, y luego `contains`.

Tiempo: O(n + m) para construir las cadenas (y la búsqueda de subcadena es lineal con un buen método; el `contains` de Java vale mencionarlo). Espacio: O(n + m) para las cadenas.

Hábito de entrevista: lidera con **búsqueda + matchTree**. Menciona el método de cadenas como segundo ángulo que cambia espacio por una lógica de emparejamiento más simple.

---

## Solución Java: búsqueda + matchTree

```java
public class CheckSubtree {

    public static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    /**
     * Returns true if t2 is a subtree of t1 (same values and structure under some node).
     * Empty t2 is treated as a subtree. Null t1 with non-empty t2 is not.
     */
    public static boolean containsTree(TreeNode t1, TreeNode t2) {
        if (t2 == null) {
            return true;
        }
        if (t1 == null) {
            return false;
        }
        return subTree(t1, t2);
    }

    /** Walk t1; at each node try a full match against t2. */
    private static boolean subTree(TreeNode r1, TreeNode r2) {
        if (r1 == null) {
            return false;
        }
        if (r1.val == r2.val && matchTree(r1, r2)) {
            return true;
        }
        return subTree(r1.left, r2) || subTree(r1.right, r2);
    }

    /** True only if both trees are identical from these roots. */
    private static boolean matchTree(TreeNode a, TreeNode b) {
        if (a == null && b == null) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        if (a.val != b.val) {
            return false;
        }
        return matchTree(a.left, b.left) && matchTree(a.right, b.right);
    }
}
```

Traza del primer ejemplo: `subTree` recorre T1, llega al nodo `2`, `matchTree` comprueba `2/4/5` contra T2 y devuelve true. Listo.

Si el nodo `2` de T1 tuviera otro hijo derecho, `matchTree` falla y la búsqueda sigue por el resto de T1.

---

## Solución Java: cadenas preorden + contains

```java
public class CheckSubtreeSerialized {

    public static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    public static boolean containsTree(TreeNode t1, TreeNode t2) {
        if (t2 == null) {
            return true;
        }
        if (t1 == null) {
            return false;
        }
        String s1 = serialize(t1);
        String s2 = serialize(t2);
        return s1.contains(s2);
    }

    /** Preorder with null markers and value wrappers so tokens cannot glue. */
    private static String serialize(TreeNode node) {
        StringBuilder sb = new StringBuilder();
        write(node, sb);
        return sb.toString();
    }

    private static void write(TreeNode node, StringBuilder sb) {
        if (node == null) {
            sb.append("#X#");
            return;
        }
        sb.append('#').append(node.val).append('#');
        write(node.left, sb);
        write(node.right, sb);
    }
}
```

Idea del ejemplo (tokens simplificados): T2 puede verse como `#2##4##X##X##5##X##X#`. Ese bloque completo debe aparecer dentro de la serialización de T1 para un true. Los envoltorios `#` evitan que `12` parezca `1` seguido de `2`.

---

## Complejidad

| Enfoque | Tiempo (aprox.) | Espacio extra | Notas |
| --- | --- | --- | --- |
| búsqueda + matchTree | O(n + k · m) peor ~ O(n · m) | O(h) recursión (altura de T1 / T2) | `k` = veces que el valor de la raíz de T2 aparece en T1 |
| cadena preorden + contains | O(n + m) construir (+ búsqueda lineal) | O(n + m) cadenas | emparejamiento más simple; pagas memoria |

`n` = nodos en T1, `m` = nodos en T2. El enunciado dice que T1 es mucho mayor que T2, así que ambos son prácticos; di qué compromiso eliges.

---

## Casos límite que pinchan en entrevista

1. **T2 null / vacío.** Contrato: suele ser `true` (el vacío es subárbol). Decláralo.
2. **T1 null, T2 no vacío.** `false`.
3. **Árboles idénticos.** T2 igual a T1. El primer nodo encaja del todo; `true`.
4. **Valores de raíz repetidos.** Varios nodos en T1 iguales a la raíz de T2; solo uno es match completo (o ninguno). No te detengas en el primer valor sin `matchTree`.
5. **Mismos valores, forma incorrecta.** Izquierda/derecha intercambiados, o falta un null. `matchTree` y la serialización con null lo capturan.
6. **T2 más grande que T1.** Solo puede ser true si son iguales en tamaño y estructura; suele ser false. Ambos algoritmos siguen bien.
7. **T2 de un solo nodo.** True si y solo si ese valor aparece en algún sitio de T1.
8. **Árboles profundos y finos.** La profundidad de recursión es la altura. Menciona la pila; hay variantes iterativas si les importa.

---

## Errores comunes

* Comprobar solo que todo valor de T2 aparece en T1 (igualdad de multiconjuntos). Se ignora la forma.
* Emparejar un **camino** en lugar de un **subárbol completo** (olvidar hermanos y nulls).
* Serializar **sin marcadores null**, de modo que topologías distintas chocan.
* Serializar sin **delimitadores de valor**, de modo que valores de varios dígitos se pegan (`12` vs `1`,`2`).
* En `subTree`, comparar valores y devolver true sin llamar a `matchTree` sobre toda la forma.
* Mutar T1 o T2 durante la comprobación.
* Confundir "subárbol" con "T2 es un rango BST dentro de un BST". Este problema es de árboles binarios generales e identidad estructural.

---

## Resumen para contárselo a un amigo

¿Está el árbol pequeño sentado en algún sitio dentro del grande como una rama completa?

Recorre el grande. Cada vez que veas el valor de la raíz del pequeño, compara las formas enteras: ambos null, o mismo valor e izquierda y derecha iguales. Si algún candidato encaja, sí.

O escribe ambos árboles como texto preorden que registra hijos vacíos y envuelve cada valor. Si el texto pequeño está dentro del grande, las formas coinciden.

En la entrevista, lidera con búsqueda + matchTree. Guarda el truco de la cadena como segunda historia cuando pidan otra vía.

---

## Práctica

1. Codifica `containsTree` y `matchTree` de memoria en papel.
2. Dibuja un T1 con dos nodos iguales a la raíz de T2; solo uno es subárbol de verdad. Traza qué candidato falla.
3. Serializa un árbol minúsculo con y sin marcadores null; muestra cómo dos formas distintas chocan sin marcadores.
4. Explica O(n · m) frente a O(n + m) y cuándo aparece cada uno.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [BST Sequences](/blog/es/ctci-4-9-bst-sequences)
* Siguiente: [Random Node](/blog/es/ctci-4-11-random-node)