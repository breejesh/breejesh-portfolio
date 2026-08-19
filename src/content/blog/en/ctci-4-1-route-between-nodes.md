---
title: "Route Between Nodes: Path Search in a Directed Graph (Java)"
description: "CTCI-style problem 4.1 for beginners: given a directed graph, decide if there is a route from node S to node E. BFS preferred over DFS, with a simple GraphNode neighbors list in Java."
date: "2025-09-14"
tags: [Algorithms]
coverImage: /assets/images/ctci-4-1-route-between-nodes.webp
previewImage: /assets/images/ctci-4-1-route-between-nodes.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 4.1 for beginners: given a directed graph, decide if there is a route from node S to node E. BFS preferred over DFS, with a simple GraphNode neighbors list in Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

Cities run on one-way streets. You can leave home and reach the park in three turns, but the reverse path may not exist if every arrow points the wrong way. A **directed graph** is that map: edges have a direction. The question is simple: starting at node S, can you follow only legal arrows and land on node E?

This post is original teaching for beginners in **Java**. Same problem family as classic interview graph reachability, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 4 (trees and graphs) opens here.

---

## 1. One-way streets analogy

Picture a small downtown:

* Intersections are **nodes**.
* One-way streets are **directed edges**. A arrow from A to B means you may drive A → B. It does **not** let you drive B → A unless a second arrow exists.
* You stand at intersection S. You want to know if intersection E is reachable without breaking traffic rules.

You do not need the shortest drive for this problem. You only need **yes or no**: is there any legal route at all?

If you try every possible path by hand, you will loop forever when the map has a cycle (a block you can circle). So every search must **mark visited intersections** and never re-expand them.

Breadth-first search (BFS) explores like a ripple from S: first the neighbors of S, then their neighbors, and so on. Depth-first search (DFS) dives down one road as far as it can, then backtracks. Both can answer reachability. Interviews usually prefer BFS for this yes/no question: no recursion stack risk, and you discover E at the first time you touch it (shortest path in hops if you care later).

---

## 2. Plain problem statement

**Input:** a directed graph, a start node `S`, and an end node `E`.

**Output:** `true` if there is a directed path from `S` to `E`, otherwise `false`.

**Node shape we use:**

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

Each node only knows its outgoing edges (`neighbors`). The full graph is whatever nodes you wire together. You do not need a separate `Graph` class for the reachability check if you already hold references to `S` and `E`.

**Tiny examples:**

| Edges (directed) | S | E | Answer | Why |
| --- | --- | --- | --- | --- |
| A→B, B→C | A | C | true | A → B → C |
| A→B, B→C | C | A | false | no edge back toward A |
| A→B, B→A | A | B | true | direct edge |
| A→A (self loop only), no other edges | A | A | true | start equals end (or self loop) |
| A→B, C→D (two components) | A | D | false | D is unreachable from A |

**Clarify before coding:**

* Directed or undirected? (Directed. Do not treat edges as two-way unless stated.)
* What if `S == E`? (Usually `true`: the empty path. Confirm with the interviewer.)
* Cycles allowed? (Yes. You must track visited nodes.)
* Null inputs? (Return `false` or throw. Pick a contract.)
* Weighted edges? (Irrelevant for pure reachability.)

---

## 3. Think first (BFS preferred)

### DFS instinct

From the current node, recurse into each unvisited neighbor. If any call finds `E`, return true. Mark visited on the way so cycles do not infinite-loop.

Works. Downsides in interviews:

* Deep graphs blow the call stack (Java default stack is not huge).
* You may wander a long dead-end branch before trying the short path that actually hits `E`.

### BFS (preferred for this problem)

Use a queue:

1. If `S == E`, return `true`.
2. Put `S` in a queue. Mark `S` visited.
3. While the queue is not empty:
   * Poll the front node `u`.
   * For each neighbor `v` of `u`:
     * If `v == E`, return `true`.
     * If `v` is not visited, mark it and enqueue it.
4. Queue empties → no route → return `false`.

Why this is the clean default:

* Explicit queue, no recursion depth worry.
* First time you dequeue (or first time you see) `E`, you know a shortest path in number of edges exists. Nice free property for follow-up questions.
* Visited set guarantees each node is expanded at most once: O(V + E) work.

### Bidirectional search (optional mention)

If the graph is huge and you can walk **out from S** and **backward into E** (need reverse edges), meeting in the middle can cut work. Most interview solutions stay with single-source BFS. Mention bidirectional only if the interviewer pushes scale.

---

## 4. Java solution

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

Walkthrough on `A → B → C`, plus `A → D`, ask route A to C:

| Step | Queue (front first) | Visited | Action |
| --- | --- | --- | --- |
| 0 | A | {A} | start |
| 1 | B, D | {A} | expand A; enqueue B and D |
| 2 | D, C | {A,B} | expand B; see C == end → return true |

If the end were E with no edges into it from A's component, BFS would drain the queue and return false.

Object identity (`neighbor == end`) is correct when `S` and `E` are the same object references the graph uses. If nodes were rebuilt by name, compare names or ids instead. Interviews almost always pass the real node objects.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| BFS | O(V + E) | O(V) queue + visited | each node and edge looked at once (outgoing) |
| DFS recursive | O(V + E) | O(V) visited + call stack | same asymptotics; stack depth up to V |
| No visited set | can loop forever | - | broken on cycles |

`V` = number of nodes reachable in the worst case (or in the whole graph if you mark globally). `E` = edges you traverse. You never need more than O(V) visited entries.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **`S == E`** → return `true` (empty path) unless they redefine the problem.
* **`null` start or end** → `false` (or throw). Do not NPE on `start.neighbors`.
* **Self-loop only** → if `S` is not `E`, a self-loop on `S` does not magically reach `E`.
* **Cycles** → visited set is mandatory. Without it, A→B→A hangs.
* **Disconnected graph** → unreachable `E` must yield `false`, not an exception.
* **Node with no outgoing edges** → expand does nothing; search continues from other queue items.
* **Multiple edges / duplicate neighbors** → visited still keeps work linear.

Common mistakes:

1. **Treating the graph as undirected.** Adding reverse edges silently is wrong for this problem.
2. **Forgetting visited.** Instant infinite loop on any cycle.
3. **Marking visited too late.** Mark when you enqueue (BFS) so the same node is not queued many times from different parents.
4. **Comparing by name with `==` on strings incorrectly, or comparing data when objects differ.** Prefer reference equality on `GraphNode` when that is what the graph holds.
5. **Starting BFS without putting `S` in visited.** Then a cycle back to `S` re-expands forever.
6. **Returning true only when you dequeue `E`, but never checking neighbors for `E`.** Either check on discovery or on dequeue; be consistent. The code above returns true as soon as a neighbor equals `end`, which is fine and a bit faster.

Minimal usage sketch:

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

## 7. Explain to a friend recap

Route Between Nodes is directed reachability:

1. Graph nodes hold a list of neighbors (outgoing edges only).
2. Ask: can you walk from S to E following those arrows?
3. BFS from S with a queue and a visited set. If you ever see E, return true. If the queue empties, return false.
4. DFS also works; BFS is the safer interview default (no deep recursion, clear O(V+E)).
5. Always mark visited. Directed means A→B does not imply B→A. S==E is true.

If you can draw three nodes, run BFS by hand, and explain why visited matters on a cycle, you own problem 4.1. Chapter 4 starts with the simplest useful graph question: is E reachable from S?

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Animal Shelter](/blog/en/ctci-3-6-animal-shelter)
* Next: [Minimal Tree](/blog/en/ctci-4-2-minimal-tree)