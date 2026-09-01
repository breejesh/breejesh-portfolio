---
title: "Ruta entre Nodos: Encontrar Camino entre Dos Nodos en un Grafo Dirigido (CTCI 4.1)"
description: "Disena un algoritmo utilizando busqueda en anchura (BFS) para determinar si existe una ruta entre dos nodos en un grafo dirigido en tiempo O(V + E)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-1-route-between-nodes.webp
previewImage: /assets/images/ctci-4-1-route-between-nodes.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un grafo dirigido, disena un algoritmo para descubrir si existe una ruta entre dos nodos.
> * **La Solución Óptima:** Utiliza **Busqueda en Anchura (BFS)** con una cola y control de estados (`Unvisited`, `Visiting`, `Visited`). BFS explora los vecinos nivel por nivel, garantizando encontrar el camino mas corto y evitando bucles infinitos en tiempo $O(V + E)$ y espacio $O(V)$.
> * **Realidad en Producción:** Rutas de conexion en redes sociales (grados de separacion) y analisis de alcanzabilidad de dependencias en malla de servicios.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 4.1), se nos plantea:

*"Dado un grafo dirigido, disena un algoritmo para descubrir si existe una ruta entre dos nodos."*

**Puntos de Discusión en Entrevistas:**
1. **Grafo Dirigido vs No Dirigido:** Una arista $u \to v$ no implica que exista retorno $v \to u$.
2. **BFS vs DFS:** Aunque DFS es facil de implementar recursivamente, puede quedar atrapado en ramas profundas o ciclos infinitos. BFS es preferible para validar alcanzabilidad y encontrar el camino mas corto.

## 2. Mecánica Algorítmica (BFS Iterativo)

1. Marcar todos los nodos del grafo como `State.Unvisited`.
2. Crear una cola `LinkedList<Node>`.
3. Marcar el nodo `start` como `State.Visiting` y agregarlo a la cola.
4. Mientras la cola no este vacia:
   * Extraer `u = queue.removeFirst()`.
   * Para cada vecino $v$ de $u$:
     * Si $v$ es `State.Unvisited`:
       * Si $v == end$, retornar `true` de inmediato.
       * Si no, marcar $v$ como `State.Visiting` y agregarlo a la cola.
   * Marcar $u$ como `State.Visited`.
5. Si la cola se vacia sin alcanzar `end`, retornar `false`.

## Implementación de Producción

```java
import java.util.LinkedList;

public class RouteBetweenNodes {
    public enum State { Unvisited, Visited, Visiting; }

    public static class Node {
        private Node[] adjacent;
        public int adjacentCount;
        private final String vertex;
        public State state;

        public Node(String vertex, int adjacentLength) {
            this.vertex = vertex;
            this.adjacent = new Node[adjacentLength];
            this.adjacentCount = 0;
            this.state = State.Unvisited;
        }

        public void addAdjacent(Node x) {
            if (adjacentCount < adjacent.length) {
                this.adjacent[adjacentCount] = x;
                adjacentCount++;
            }
        }

        public Node[] getAdjacent() { return adjacent; }
        public String getVertex() { return vertex; }
    }

    public static class Graph {
        private final Node[] nodes;
        public Graph(Node[] nodes) { this.nodes = nodes; }
        public Node[] getNodes() { return nodes; }
    }

    /**
     * Determina si existe una ruta dirigida entre start y end.
     * Complejidad Temporal: O(V + E)
     * Complejidad Espacial: O(V)
     */
    public static boolean search(Graph g, Node start, Node end) {
        if (start == end) return true;

        for (Node u : g.getNodes()) {
            u.state = State.Unvisited;
        }

        LinkedList<Node> queue = new LinkedList<>();

        start.state = State.Visiting;
        queue.add(start);

        while (!queue.isEmpty()) {
            Node u = queue.removeFirst();
            if (u != null) {
                for (Node v : u.getAdjacent()) {
                    if (v != null && v.state == State.Unvisited) {
                        if (v == end) {
                            return true;
                        } else {
                            v.state = State.Visiting;
                            queue.add(v);
                        }
                    }
                }
                u.state = State.Visited;
            }
        }

        return false;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(V + E)` | Visita cada vertice alcanzable $V$ y recorre cada arista dirigida $E$ a lo sumo una vez. |
| Espacio Auxiliar | `O(V)` | La cola almacena hasta $V$ nodos mas los estados de visita. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Grafos en Sistemas Distribuidos

1. **Malla de Servicios (Service Mesh - Istio/Envoy):** Comprobacion de alcanzabilidad de servicios upstream.
2. **Evaluación de Listas de Control de Acceso (ACL):** Verificacion de rutas de herencia en grafos de permisos de usuario.

## Casos Límite y Robustez en Producción

1. **Start igual a end (`start == end`):** Resuelto de inmediato retornando `true`.
2. **Grafo con ciclos ($A \to B \to C \to A$):** El seguimiento de estados previene ciclos infinitos.
