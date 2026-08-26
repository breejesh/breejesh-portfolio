---
title: "Route Between Nodes: buscar un camino en un grafo dirigido (Java)"
description: "Problema estilo CTCI 4.1 para principiantes: dado un grafo dirigido, decide si hay una ruta del nodo S al nodo E. BFS preferido frente a DFS, con una lista simple de vecinos GraphNode en Java."
date: "2025-09-14"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-1-route-between-nodes.webp
previewImage: /assets/images/ctci-4-1-route-between-nodes.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.1 para principiantes: dado un grafo dirigido, decide si hay una ruta del nodo S al nodo E. BFS preferido frente a DFS, con una lista simple de vecinos GraphNode en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Las ciudades viven de calles de un solo sentido. Puedes salir de casa y llegar al parque en tres giros, pero el camino de vuelta puede no existir si todas las flechas apuntan al revés. Un **grafo dirigido** es ese mapa: las aristas tienen dirección. La pregunta es simple: partiendo del nodo S, ¿puedes seguir solo flechas legales y aterrizar en el nodo E?

Este post es enseñanza original para principiantes en **Java**. Misma familia de alcanzabilidad en grafos de entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí abre el capítulo 4 (árboles y grafos).

---

## 1. Analogía de calles de un solo sentido

Imagina un centro pequeño:

* Los cruces son **nodos**.
* Las calles de un solo sentido son **aristas dirigidas**. Una flecha de A a B permite A → B. **No** permite B → A salvo que exista una segunda flecha.
* Estás en el cruce S. Quieres saber si el cruce E es alcanzable sin saltarte las normas.

No necesitas el trayecto más corto para este problema. Solo un **sí o no**: ¿existe alguna ruta legal?

Si pruebas a mano todos los caminos, te quedarás en bucle cuando el mapa tenga un ciclo (una manzana que puedes rodear). Toda búsqueda debe **marcar cruces visitados** y no reexpandirlos.

La búsqueda en anchura (BFS) explora como una onda desde S: primero los vecinos de S, luego los de ellos, y así. La búsqueda en profundidad (DFS) se mete por un camino hasta el final y luego retrocede. Ambas responden alcanzabilidad. En entrevista suele preferirse BFS para este sí/no: sin riesgo de pila de recursión, y descubres E la primera vez que la tocas (camino más corto en saltos si más adelante importa).

---

## 2. Problema en palabras simples

**Entrada:** un grafo dirigido, un nodo inicio `S` y un nodo fin `E`.

**Salida:** `true` si hay un camino dirigido de `S` a `E`, si no `false`.

**Forma de nodo que usamos:**

```java
import java.util.ArrayList;
import java.util.List;

class GraphNode {
    String name;
    List<GraphNode> neighbors = new ArrayList<>();

    GraphNode(String name) {
        this.name = name;
    }

    void addNeighbor(GraphNode n) {
        neighbors.add(n);
    }
}
```

Cada nodo solo conoce sus aristas salientes (`neighbors`). El grafo completo es lo que cables entre nodos. No hace falta una clase `Graph` aparte para la comprobación si ya tienes referencias a `S` y `E`.

**Ejemplos pequeños:**

| Aristas (dirigidas) | S | E | Respuesta | Por qué |
| --- | --- | --- | --- | --- |
| A→B, B→C | A | C | true | A → B → C |
| A→B, B→C | C | A | false | no hay flecha de vuelta hacia A |
| A→B, B→A | A | B | true | arista directa |
| A→A (solo bucle), sin más aristas | A | A | true | inicio igual a fin (o bucle) |
| A→B, C→D (dos componentes) | A | D | false | D no es alcanzable desde A |

**Aclara antes de programar:**

* ¿Dirigido o no dirigido? (Dirigido. No trates las aristas como bidireccionales salvo que te lo digan.)
* ¿Y si `S == E`? (Normalmente `true`: camino vacío. Confírmalo.)
* ¿Se permiten ciclos? (Sí. Hay que marcar visitados.)
* ¿Entradas null? (`false` o excepción. Elige un contrato.)
* ¿Aristas con peso? (Irrelevante para pura alcanzabilidad.)

---

## 3. Piensa primero (BFS preferido)

### Instinto DFS

Desde el nodo actual, recurre en cada vecino no visitado. Si alguna llamada encuentra `E`, devuelve true. Marca visitados para no ciclar.

Funciona. Peros en entrevista:

* Grafos profundos rompen la pila de llamadas (la pila por defecto de Java no es enorme).
* Puedes perderte en un callejón largo antes de probar el camino corto que sí llega a `E`.

### BFS (preferido aquí)

Usa una cola:

1. Si `S == E`, devuelve `true`.
2. Mete `S` en la cola. Marca `S` visitado.
3. Mientras la cola no esté vacía:
   * Saca el frente `u`.
   * Para cada vecino `v` de `u`:
     * Si `v == E`, devuelve `true`.
     * Si `v` no está visitado, márcalo y encola.
4. La cola se vacía → no hay ruta → `false`.

Por qué es el valor por defecto limpio:

* Cola explícita, sin miedo a profundidad de recursión.
* La primera vez que ves `E`, sabes que existe un camino más corto en número de aristas. Propiedad gratis para follow-ups.
* El conjunto de visitados garantiza expandir cada nodo como mucho una vez: trabajo O(V + E).

### Búsqueda bidireccional (mención opcional)

Si el grafo es enorme y puedes caminar **desde S** y **hacia atrás desde E** (hace falta el grafo inverso), encontrarse en el medio puede recortar trabajo. La mayoría de soluciones de entrevista se quedan en BFS desde un origen. Menciona bidireccional solo si empujan escala.

---

## 4. Solución Java

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.Set;

class GraphNode {
    String name;
    List<GraphNode> neighbors = new ArrayList<>();

    GraphNode(String name) {
        this.name = name;
    }

    void addNeighbor(GraphNode n) {
        neighbors.add(n);
    }
}

class RouteBetweenNodes {

    /** True if a directed path exists from start to end. */
    static boolean routeExists(GraphNode start, GraphNode end) {
        if (start == null || end == null) {
            return false;
        }
        if (start == end) {
            return true;
        }

        Queue<GraphNode> queue = new LinkedList<>();
        Set<GraphNode> visited = new HashSet<>();

        queue.add(start);
        visited.add(start);

        while (!queue.isEmpty()) {
            GraphNode current = queue.poll();
            for (GraphNode neighbor : current.neighbors) {
                if (neighbor == end) {
                    return true;
                }
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.add(neighbor);
                }
            }
        }
        return false;
    }

    // Optional: same idea with DFS recursion
    static boolean routeExistsDfs(GraphNode start, GraphNode end) {
        if (start == null || end == null) {
            return false;
        }
        if (start == end) {
            return true;
        }
        Set<GraphNode> visited = new HashSet<>();
        return dfs(start, end, visited);
    }

    private static boolean dfs(GraphNode current, GraphNode end, Set<GraphNode> visited) {
        if (current == end) {
            return true;
        }
        visited.add(current);
        for (GraphNode neighbor : current.neighbors) {
            if (!visited.contains(neighbor)) {
                if (dfs(neighbor, end, visited)) {
                    return true;
                }
            }
        }
        return false;
    }
}
```

Recorrido con `A → B → C`, más `A → D`, ruta de A a C:

| Paso | Cola (frente primero) | Visitados | Acción |
| --- | --- | --- | --- |
| 0 | A | {A} | inicio |
| 1 | B, D | {A} | expandir A; encolar B y D |
| 2 | D, C | {A,B} | expandir B; ver C == end → true |

Si el fin fuera E sin aristas desde el componente de A, BFS vaciaría la cola y devolvería false.

La identidad de objeto (`neighbor == end`) es correcta cuando `S` y `E` son las mismas referencias que usa el grafo. Si reconstruyes nodos por nombre, compara nombres o ids. En entrevista casi siempre te pasan los objetos reales.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| BFS | O(V + E) | O(V) cola + visitados | cada nodo y arista una vez (salientes) |
| DFS recursivo | O(V + E) | O(V) visitados + pila | misma cota; profundidad hasta V |
| Sin visitados | puede ciclar | - | roto con ciclos |

`V` = nodos alcanzables en el peor caso (o del grafo entero si marcas global). `E` = aristas que recorres. No necesitas más de O(V) entradas visitadas.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan esto:

* **`S == E`** → `true` (camino vacío) salvo que redefinan el problema.
* **`null` en inicio o fin** → `false` (o throw). No hagas NPE en `start.neighbors`.
* **Solo un bucle propio** → si `S` no es `E`, el bucle en `S` no alcanza `E` por arte de magia.
* **Ciclos** → el set de visitados es obligatorio. Sin él, A→B→A se cuelga.
* **Grafo desconectado** → `E` inalcanzable debe dar `false`, no una excepción.
* **Nodo sin aristas salientes** → la expansión no hace nada; la búsqueda sigue con el resto de la cola.
* **Aristas múltiples / vecinos duplicados** → visitados mantienen el trabajo lineal.

Errores comunes:

1. **Tratar el grafo como no dirigido.** Añadir aristas inversas en silencio está mal aquí.
2. **Olvidar visitados.** Bucle infinito en cualquier ciclo.
3. **Marcar visitado demasiado tarde.** Marca al encolar (BFS) para no meter el mismo nodo mil veces desde padres distintos.
4. **Comparar mal por nombre o por datos cuando los objetos difieren.** Prefiere igualdad por referencia en `GraphNode` si eso es lo que guarda el grafo.
5. **Arrancar BFS sin meter `S` en visitados.** Un ciclo de vuelta a `S` reexpande para siempre.
6. **Devolver true solo al desencolar `E` y nunca mirar vecinos.** O descubres al ver el vecino o al desencolar; sé consistente. El código de arriba devuelve true en cuanto un vecino es `end`.

Uso mínimo:

```java
GraphNode a = new GraphNode("A");
GraphNode b = new GraphNode("B");
GraphNode c = new GraphNode("C");
a.addNeighbor(b);
b.addNeighbor(c);

boolean ok = RouteBetweenNodes.routeExists(a, c); // true
boolean no = RouteBetweenNodes.routeExists(c, a); // false
```

---

## 7. Recap para un amigo

Route Between Nodes es alcanzabilidad dirigida:

1. Los nodos guardan una lista de vecinos (solo aristas salientes).
2. Pregunta: ¿puedes ir de S a E siguiendo esas flechas?
3. BFS desde S con cola y set de visitados. Si ves E, true. Si la cola se vacía, false.
4. DFS también vale; BFS es el default más seguro en entrevista (sin recursión profunda, O(V+E) claro).
5. Siempre marca visitados. Dirigido significa que A→B no implica B→A. S==E es true.

Si dibujas tres nodos, corres BFS a mano y explicas por qué visitados importan en un ciclo, dominas el 4.1. El capítulo 4 empieza con la pregunta de grafo más útil y simple: ¿E es alcanzable desde S?

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Animal Shelter](/blog/es/ctci-3-6-animal-shelter)
* Siguiente: [Minimal Tree](/blog/es/ctci-4-2-minimal-tree)