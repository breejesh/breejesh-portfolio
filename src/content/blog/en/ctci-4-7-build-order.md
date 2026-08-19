---
title: "Build Order: Project Dependencies with Topological Sort (Java)"
description: "CTCI-style problem 4.7 for beginners: projects and dependency pairs, find a valid build order or fail if a cycle exists. Kahn indegree queue and DFS in plain Java."
date: "2026-04-28"
tags: [Algorithms]
coverImage: /assets/images/ctci-4-7-build-order.webp
previewImage: /assets/images/ctci-4-7-build-order.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 4.7 for beginners: projects and dependency pairs, find a valid build order or fail if a cycle exists. Kahn indegree queue and DFS in plain Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You ship a small monorepo. Package `d` needs `a` and `b` first. Package `c` needs `d`. Package `b` needs `f`. If you compile in the wrong order, the build dies. If two packages need each other, no order works and you must stop with an error. That is **build order**: a list of projects plus dependency edges, and a safe sequence that respects every edge.

This post is original teaching for beginners in **Java**. Same problem family as classic interview dependency graphs, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 4, trees and graphs.

---

## 1. Everyday analogy

Think of cooking a multi-course meal where some dishes must finish before others start:

* **Projects** are dishes: soup, bread, main, dessert.
* A **dependency** `(A, B)` means "B needs A ready first." You cannot plate B until A is done.
* A valid **build order** is any sequence that respects every "needs first" rule. There may be more than one valid sequence.
* A **cycle** is "soup needs bread and bread needs soup." No kitchen can finish that. Report error.

Draw each dish as a node. Draw an arrow from A to B when B depends on A (`A → B` means build A before B). The graph is directed. What you need is a **topological order** of that graph: every edge goes from earlier in the list to later.

If the graph has a cycle, no topological order exists. That is the interview punchline.

---

## 2. Plain problem statement

**Input:**

* `projects`: list of project names (strings, or any comparable id).
* `dependencies`: list of pairs `(before, after)` where `after` depends on `before`. Build `before` first.

**Output:**

* An ordered list of all projects that respects every dependency, or
* An error signal if no such order exists (cycle, or missing project handling you define).

**Classic sample:**

| Item | Value |
| --- | --- |
| projects | `a, b, c, d, e, f` |
| dependencies | `(a, d), (f, b), (b, d), (f, a), (d, c)` |
| one valid order | `f, e, a, b, d, c` (or other legal permutations) |

Read the pairs carefully. `(a, d)` means **d depends on a**, so a comes before d. Edge `a → d`.

**Clarify before coding:**

* Are project names unique? (Yes. Treat them as node ids.)
* Can a project appear in dependencies but not in `projects`? (Usually no. Validate or add it. Pick a contract.)
* Self-dependency `(x, x)`? (Cycle of length 1. Fail.)
* Multiple valid orders: any one is fine unless they ask for all orders (that is a different problem).
* Return type on failure: `null`, empty list, or throw. State it out loud.

---

## 3. Think first

### Graph model

Build a directed graph:

* One node per project.
* For each dependency `(before, after)`, add edge `before → after`.
* Track **indegree**: how many projects must finish before this one can start.

Projects with indegree 0 have no remaining blockers. They can go into the build next.

### Approach A: Kahn (indegree + queue)

This is the clean interview default.

1. Build adjacency list: map each project to the list of projects that depend on it.
2. Compute indegree for every project.
3. Put every project with indegree 0 into a queue (or any FIFO / list you pop from).
4. While the queue is not empty:
   * Pop `p`, append `p` to the result order.
   * For each neighbor `n` of `p`, decrement `indegree[n]`. If it hits 0, enqueue `n`.
5. If `result.size() == projects.length`, return the order. Else a cycle (or disconnected mess that never drained) blocked some nodes: error.

Why this works: you only ship a project when every predecessor has already been shipped. If a cycle exists, those nodes never reach indegree 0, so the queue empties early.

### Approach B: DFS with colors

1. States: `0` unvisited, `1` visiting (on the current recursion stack), `2` done.
2. DFS from every unvisited node. When you leave a node for good (post-order), push it onto a stack (or prepend to a list).
3. If you ever follow an edge into a `1` node, you found a back edge: cycle → error.
4. At the end, reverse the post-order list (or pop the stack) for the build order.

Same asymptotic cost. Kahn is often easier to explain with the "ready queue" story. DFS is natural if you already live in recursion for trees.

### What not to do

* Randomly try all permutations: N! is not an interview answer.
* BFS without indegrees: you lose the "all parents done" signal.
* Only sorting project names alphabetically: ignores edges.

---

## 4. Java solution (Kahn)

```java
import java.util.*;

public class BuildOrder {

    /**
     * @param projects list of project names
     * @param dependencies each pair [before, after]: after depends on before
     * @return a valid build order, or null if a cycle (or incomplete graph) blocks one
     */
    public static String[] findBuildOrder(String[] projects, String[][] dependencies) {
        Map<String, List<String>> graph = new HashMap<>();
        Map<String, Integer> indegree = new HashMap<>();

        for (String p : projects) {
            graph.put(p, new ArrayList<>());
            indegree.put(p, 0);
        }

        for (String[] dep : dependencies) {
            String before = dep[0];
            String after = dep[1];
            if (!graph.containsKey(before) || !graph.containsKey(after)) {
                // dependency names a project we do not know: treat as error
                return null;
            }
            graph.get(before).add(after);
            indegree.put(after, indegree.get(after) + 1);
        }

        Queue<String> ready = new ArrayDeque<>();
        for (String p : projects) {
            if (indegree.get(p) == 0) {
                ready.add(p);
            }
        }

        List<String> order = new ArrayList<>();
        while (!ready.isEmpty()) {
            String p = ready.poll();
            order.add(p);
            for (String next : graph.get(p)) {
                int d = indegree.get(next) - 1;
                indegree.put(next, d);
                if (d == 0) {
                    ready.add(next);
                }
            }
        }

        if (order.size() != projects.length) {
            return null; // cycle: some projects never became ready
        }
        return order.toArray(new String[0]);
    }
}
```

Walkthrough of the sample:

| Step | Ready queue (example) | Build so far | Notes |
| --- | --- | --- | --- |
| start | `f, e` (indegree 0) | - | `a` waits on `f`; `b` on `f`; others wait too |
| take `f` | `e, a, b` | `f` | finishing `f` unlocks `a` and `b` |
| take `e` | `a, b` | `f, e` | `e` has no dependents in this sample |
| take `a` | `b` | `f, e, a` | `d` still needs `b` as well |
| take `b` | `d` | `f, e, a, b` | both parents of `d` done → indegree 0 |
| take `d` | `c` | `f, e, a, b, d` | unlocks `c` |
| take `c` | empty | `f, e, a, b, d, c` | size matches → success |

Queue order among indegree-0 nodes is not unique. Getting `e` later is also fine: `f, a, b, d, c, e` works too.

### Optional DFS sketch

```java
// 0 = unvisited, 1 = visiting, 2 = done
// return false from dfs if cycle detected
boolean dfs(String node, Map<String, List<String>> graph,
            Map<String, Integer> state, Deque<String> stack) {
    state.put(node, 1);
    for (String next : graph.get(node)) {
        int s = state.get(next);
        if (s == 1) {
            return false; // back edge
        }
        if (s == 0 && !dfs(next, graph, state, stack)) {
            return false;
        }
    }
    state.put(node, 2);
    stack.push(node); // post-order: dependents already pushed under us
    return true;
}
```

Call `dfs` for every unvisited project. If all succeed, pop the stack into the result array. Same cycle rule: gray-to-gray edge fails.

---

## 5. Complexity table

| Piece | Time | Space |
| --- | --- | --- |
| Build graph + indegrees | O(V + E) | O(V + E) |
| Kahn process | O(V + E) | O(V) for queue and order |
| DFS process | O(V + E) | O(V) recursion + stack worst case |
| Overall | O(V + E) | O(V + E) |

`V` is the number of projects, `E` is the number of dependency pairs. Both approaches are linear in the size of the graph. That is optimal: you must read every edge at least once.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty project list** → empty order is fine.
* **Projects with no dependencies** → all go into the ready set immediately; any permutation of them is valid.
* **Single project, no edges** → `[that project]`.
* **Self-edge `(x, x)`** → indegree never clears for x, or DFS sees a back edge. Error.
* **Simple cycle** `a → b → a` → error after the queue drains with leftover nodes.
* **Dependency names a missing project** → decide: error vs auto-create. Code above returns error.
* **Duplicate dependency pairs** → double-count indegree if you naively add twice. Dedup edges or accept stricter counts only if your input guarantees unique pairs.

Common mistakes:

1. **Reversing the edge.** `(a, d)` means d depends on a. Edge is `a → d`, not `d → a`. Flip it and your order is wrong even when acyclic.
2. **Forgetting projects with indegree 0 that have no edges.** Isolated projects still belong in the order.
3. **Stopping when the queue is empty without comparing sizes.** That is exactly how you miss a cycle.
4. **Mutating the original dependency list as your only structure.** Build an adjacency map; do not destroy the input.
5. **Assuming a unique order.** Many DAGs have many topological orders. Return any valid one unless asked otherwise.
6. **Using undirected thinking.** This graph is directed. An edge only constrains one direction.

Minimal usage sketch:

```java
String[] projects = {"a", "b", "c", "d", "e", "f"};
String[][] deps = {
    {"a", "d"}, {"f", "b"}, {"b", "d"}, {"f", "a"}, {"d", "c"}
};
String[] order = BuildOrder.findBuildOrder(projects, deps);
// non-null example: [f, e, a, b, d, c]
```

---

## 7. Explain to a friend recap

Build Order is topological sort on a project dependency graph:

1. Node per project. Edge `before → after` when after needs before.
2. **Kahn:** start with indegree 0, emit a project, enable neighbors, repeat. If you cannot emit every project, there is a cycle.
3. **DFS:** recurse, fail on back edges (visiting again), emit in reverse post-order.
4. Time O(V + E). Space O(V + E) for the graph.
5. Multiple answers can be correct. Only cycles (or invalid input) force an error.

If you can draw the arrows the right way, fill a ready queue, and explain why leftover nodes mean a cycle, you own problem 4.7. Same skill shows up in package managers, CI pipelines, and course-prerequisite planners.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Successor](/blog/en/ctci-4-6-successor)
* Next: [First Common Ancestor](/blog/en/ctci-4-8-first-common-ancestor)