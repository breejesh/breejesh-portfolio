---
title: "Route Between Nodes: Finding Path Between Two Nodes in a Directed Graph (CTCI 4.1)"
description: "Design an algorithm using Breadth-First Search (BFS) to determine if a route exists between two nodes in a directed graph in O(V + E) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-1-route-between-nodes.webp
previewImage: /assets/images/ctci-4-1-route-between-nodes.webp
---

> **TL;DR**
> * **The Book Problem:** Given a directed graph, design an algorithm to find out whether there is a route between two nodes.
> * **The Optimal Solution:** Use **Breadth-First Search (BFS)** with a queue and node state tracking (`Unvisited`, `Visiting`, `Visited`). BFS explores neighbors level-by-level, finding the shortest path and avoiding infinite loops on cyclic graphs in $O(V + E)$ time and $O(V)$ space.
> * **Production Reality:** Social network connection pathfinding (LinkedIn degree of separation), IP network route discovery, and dependency reachability analysis.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.1), we are asked:

*"Given a directed graph, design an algorithm to find out whether there is a route between two nodes."*

**Key Interview Discussion Points:**
1. **Directed vs. Undirected:** In a directed graph, an edge $u \to v$ does not imply $v \to u$.
2. **BFS vs. DFS:** While Depth-First Search (DFS) is simple to implement recursively, it can get trapped in deep branches or endless cycles in large graphs. Breadth-First Search (BFS) is preferred when looking for the shortest route or checking simple reachability.
3. **Bidirectional Search:** Searching simultaneously forward from `start` and backward from `end` can reduce the search space from $O(b^d)$ to $O(b^{d/2})$ where $b$ is branching factor and $d$ is distance.

## 2. Algorithmic Mechanics (Iterative BFS)

1. Mark all nodes in the graph as `State.Unvisited`.
2. Create a `LinkedList<Node>` to serve as our BFS queue.
3. Mark `start` node as `State.Visiting` and enqueue it.
4. While the queue is not empty:
   * Dequeue `u = queue.removeFirst()`.
   * For each neighbor $v$ of $u$:
     * If $v$ is `State.Unvisited`:
       * If $v == end$, return `true` immediately.
       * Else, mark $v$ as `State.Visiting` and enqueue $v$.
   * Mark $u$ as `State.Visited`.
5. If the queue is exhausted without reaching `end`, return `false`.

## Production Implementation

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
     * Determines if a directed path exists between start and end nodes.
     * Time Complexity: O(V + E)
     * Space Complexity: O(V)
     */
    public static boolean search(Graph g, Node start, Node end) {
        if (start == end) return true;

        // Reset all node states
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

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(V + E)` | Visits every reachable vertex $V$ and traverses each directed edge $E$ at most once. |
| Auxiliary Space | `O(V)` | Queue stores at most $V$ nodes in the worst case, plus state markers. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Graph Reachability in Distributed Systems

1. **Service Mesh Routing (Istio / Envoy):** Validates upstream dependency reachability and detects broken routing configurations.
2. **Access Control Lists (ACL) Role Traversal:** IAM security evaluators perform graph searches on role inheritance graphs to determine user resource permissions.

## Edge Cases & Production Hardening

1. **Start equals end (`start == end`):** Handled immediately at entry, returning `true`.
2. **Disconnected graph or dead ends:** Queue empties and returns `false`.
3. **Graph with cycles ($A \to B \to C \to A$):** Visited state tracking prevents infinite loops.
