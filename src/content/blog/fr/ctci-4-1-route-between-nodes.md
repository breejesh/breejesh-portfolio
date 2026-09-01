---
title: "Route Entre Nœuds: Trouver un Chemin Entre Deux Nœuds dans un Graphe Orienté (CTCI 4.1)"
description: "Concevez un algorithme basé sur le parcours en largeur (BFS) pour déterminer s'il existe une route entre deux nœuds dans un graphe orienté en temps O(V + E)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-1-route-between-nodes.webp
previewImage: /assets/images/ctci-4-1-route-between-nodes.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Étant donné un graphe orienté, concevez un algorithme pour savoir s'il existe un chemin entre deux nœuds.
> * **La Solution Optimale:** Utilisez un **Parcours en Largeur (BFS)** avec une file d'attente et un suivi des états (`Unvisited`, `Visiting`, `Visited`). Le BFS explore les voisins niveau par niveau, garantissant de trouver le chemin le plus court tout en évitant les boucles infinies en temps $O(V + E)$ et espace $O(V)$.
> * **Réalité en Production:** Calcul d'itinéraires dans les réseaux sociaux (degrés de séparation) et analyse d'accessibilité dans les maillages de services (Service Mesh).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 4.1), la question posée est :

*"Étant donné un graphe orienté, concevez un algorithme permettant de déterminer s'il existe une route entre deux nœuds."*

**Points Clés pour l'Entretien :**
1. **Graphe Orienté vs Non Orienté :** Un arc $u \to v$ n'implique pas l'existence de $v \to u$.
2. **BFS vs DFS :** Le BFS est préféré au DFS pour les tests d'accessibilité car il évite de se perdre dans des branches infinies et garantit la découverte du plus court chemin.

## 2. Mécanique Algorithmique (BFS Itératif)

1. Marquer tous les nœuds du graphe comme `State.Unvisited`.
2. Créer une file `LinkedList<Node>`.
3. Marquer le nœud `start` comme `State.Visiting` et l'insérer dans la file.
4. Tant que la file n'est pas vide :
   * Défiler `u = queue.removeFirst()`.
   * Pour chaque voisin $v$ de $u$ :
     * Si $v$ est `State.Unvisited` :
       * Si $v == end$, retourner `true` immédiatement.
       * Sinon, marquer $v$ comme `State.Visiting` et l'enfiler.
   * Marquer $u$ comme `State.Visited`.
5. Si la file s'épuise sans atteindre `end`, retourner `false`.

## Implémentation de Production

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
     * Determine s'il existe une route orientee entre start et end.
     * Complexite Temporelle: O(V + E)
     * Complexite Spatiale: O(V)
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

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(V + E)` | Visite chaque sommet accessible $V$ et parcourt chaque arc orienté $E$ au plus une fois. |
| Espace Auxiliaire | `O(V)` | La file stocke au plus $V$ nœuds en mémoire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Routage dans les Systèmes Distribués

1. **Maillage de Services (Istio / Envoy) :** Contrôle des dépendances réseau et détection de ruptures de liaison.
2. **Évaluation des Permissions IAM :** Parcours de graphes d'héritage de rôles.

## Cas Limites et Robustesse

1. **Départ identique à l'arrivée (`start == end`) :** Retourne immédiatement `true`.
2. **Graphe contenant des cycles ($A \to B \to C \to A$) :** Le marquage d'états empêche les boucles infinies.
