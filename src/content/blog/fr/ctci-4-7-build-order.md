---
title: "Build Order: Topological Sort & Dependency Resolution (CTCI 4.7)"
description: "Given a list of projects and a list of dependencies, find a build order that allows the projects to be built using Kahn's algorithm and DFS topological sort in O(P + D) time."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-4-7-build-order.webp
previewImage: /assets/images/ctci-4-7-build-order.webp
---

> **TL;DR**
> * **The Book Problem:** You are given a list of projects and a list of dependencies. Find a build order that allows the projects to be built. If no valid build order exists, return an error.
> * **The Core Breakthrough:** Kahn's In-Degree Algorithm / DFS Topological Sort: (1) Compute in-degrees of all project nodes; (2) Add nodes with 0 incoming dependencies to build queue; (3) Decrement neighbor in-degrees as nodes are processed; (4) If output list length $< P$, a circular dependency cycle exists in $O(P + D)$ time.
> * **Production Reality:** Package dependency resolution (npm, Cargo, Maven), Docker multi-stage build graphs, and Kubernetes reconcilers.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.7), we are given a list of projects $P$ and pairs of dependencies $(a, b)$ where project $a$ must be built before project $b$. We must return a valid sequential build order or detect circular dependency cycles.

## 2. Topological Sorting via Kahn's In-Degree Algorithm

1. Build a directed adjacency graph and an in-degree array `inDegree[node]`.
2. Initialize a processing queue with all nodes having `inDegree == 0` (projects with no prerequisites).
3. Dequeue a project, append it to the build order, and for each outgoing edge $(u, v)$, decrement `inDegree[v]--`.
4. When `inDegree[v] == 0`, push $v$ into the queue.
5. If the final build order contains fewer than $|P|$ projects, a cycle exists (deadlock).

## Implémentation de production

```java
import java.util.*;

public class BuildOrder {
    public static List<String> findBuildOrder(String[] projects, String[][] dependencies) {
        Map<String, List<String>> graph = new HashMap<>();
        Map<String, Integer> inDegree = new HashMap<>();

        for (String p : projects) {
            graph.put(p, new ArrayList<>());
            inDegree.put(p, 0);
        }

        for (String[] dep : dependencies) {
            String parent = dep[0];
            String child = dep[1];
            graph.get(parent).add(child);
            inDegree.put(child, inDegree.get(child) + 1);
        }

        Queue<String> queue = new LinkedList<>();
        for (String p : projects) {
            if (inDegree.get(p) == 0) queue.offer(p);
        }

        List<String> buildOrder = new ArrayList<>();
        while (!queue.isEmpty()) {
            String curr = queue.poll();
            buildOrder.add(curr);

            for (String neighbor : graph.get(curr)) {
                inDegree.put(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) == 0) {
                    queue.offer(neighbor);
                }
            }
        }

        if (buildOrder.size() != projects.length) {
            return null; // Circular dependency detected!
        }
        return buildOrder;
    }
}
```

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| Time Complexity | `O(P + D)` | Linear in number of projects P and dependencies D. |
| Auxiliary Space | `O(P + D)` | Adjacency list and in-degree map storage. |

## Analyse d'ingénierie système en production réelle

Build systems (Bazel, Gradle, Turborepo) and package managers (npm, Cargo) compile Directed Acyclic Graphs (DAGs) using Kahn's algorithm to schedule parallel multi-core compilation tasks.

## Cas limites et durcissement en production

1. Circular dependency cycle (`a -> b -> a`): Detected when queue empties prematurely, returns null.
2. Disjoint independent subgraphs: Processed cleanly in parallel.
