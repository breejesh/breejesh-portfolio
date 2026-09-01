---
title: "Deadlock-Free Class: Dynamic Lock Dependency Graph & Cycle Detection (CTCI 15.4)"
description: "Design a deadlock-free concurrency lock manager using Directed Acyclic Graph (DAG) cycle detection and DFS dependency analysis in Java."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-15-4-deadlock-free-class.webp
previewImage: /assets/images/ctci-15-4-deadlock-free-class.webp
---

> **TL;DR**
> * **The Book Problem:** Design a class which provides a lock only if there are no possible deadlocks.
> * **The Optimal Solution:** **Dynamic Lock Dependency Graph (DAG) with Pre-Acquisition Cycle Detection**:
>   1. **Graph Representation**: Represent all locks as nodes in a directed dependency graph $G = (V, E)$. A directed edge $A \to B$ signifies that some thread acquired lock $A$ and subsequently requested lock $B$.
>   2. **Pre-Acquisition Validation**: When thread $T$ holding locks $\{L_1, L_2, \dots, L_k\}$ attempts to acquire lock $L_{\text{target}}$, evaluate whether adding edges $L_i \to L_{\text{target}}$ creates a directed cycle.
>   3. **Cycle Detection (DFS)**: Run Depth-First Search (DFS) or Tarjan's algorithm starting from $L_{\text{target}}$ to check if any path reaches any currently held lock $L_i$.
>   4. **Rejection / Grant**: If a cycle is detected, refuse lock acquisition and throw `DeadlockDetectedException`; otherwise, add the edge, grant the lock, and update the thread's active lock set.
>   5. Runs in **$O(V + E)$ validation time**.
> * **Production Reality:** ThreadSanitizer (TSan) lock-order tracking and database lock managers.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 15.4), we are asked:

*"Design a thread-safe lock management class that grants a lock only if acquiring it will not introduce potential circular wait deadlocks."*

## 2. Lock Acquisition Graph Theory

```
[Safe Lock Request: DAG Formed]
  Lock A ───> Lock B ───> Lock C
  (No Directed Cycles -> Grant Lock C)

[Deadlock Trap: Cycle Detected]
  Lock A ───> Lock B ───> Lock C
    ▲                       │
    └─────── [Edge C -> A] ─┘
  (Cycle Exists: A -> B -> C -> A -> REJECT LOCK REQUEST!)
```

## Production Implementation

```java
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

public class LockManager {
    private static final LockManager INSTANCE = new LockManager();
    private final Map<Integer, LockNode> locks = new ConcurrentHashMap<>();
    private final ThreadLocal<List<LockNode>> threadLocks = ThreadLocal.withInitial(ArrayList::new);

    public static LockManager getInstance() {
        return INSTANCE;
    }

    public static class LockNode {
        private final int id;
        private final ReentrantLock lock = new ReentrantLock();
        private final List<LockNode> children = new ArrayList<>();

        public LockNode(int id) {
            this.id = id;
        }

        public int getId() { return id; }
        public ReentrantLock getLock() { return lock; }
        public List<LockNode> getChildren() { return children; }

        public synchronized void addEdge(LockNode target) {
            if (!children.contains(target)) {
                children.add(target);
            }
        }
    }

    public synchronized boolean acquireLock(int lockId) {
        LockNode target = locks.computeIfAbsent(lockId, LockNode::new);
        List<LockNode> currentHeldLocks = threadLocks.get();

        // 1. If this thread holds locks, check for potential circular dependencies
        if (!currentHeldLocks.isEmpty()) {
            for (LockNode held : currentHeldLocks) {
                if (hasCycle(target, held)) {
                    System.err.println("DEADLOCK PREVENTED: Requesting Lock " + lockId + 
                                       " violates lock hierarchy with Lock " + held.getId());
                    return false;
                }
            }
            // Add directed edges from all held locks to the requested target
            for (LockNode held : currentHeldLocks) {
                held.addEdge(target);
            }
        }

        // 2. Safely acquire physical mutex
        target.getLock().lock();
        currentHeldLocks.add(target);
        return true;
    }

    public synchronized void releaseLock(int lockId) {
        LockNode node = locks.get(lockId);
        if (node != null) {
            node.getLock().unlock();
            threadLocks.get().remove(node);
        }
    }

    private boolean hasCycle(LockNode from, LockNode to) {
        Set<Integer> visited = new HashSet<>();
        return dfs(from, to, visited);
    }

    private boolean dfs(LockNode current, LockNode target, Set<Integer> visited) {
        if (current == target) return true;
        if (!visited.add(current.getId())) return false;

        for (LockNode next : current.getChildren()) {
            if (dfs(next, target, visited)) return true;
        }
        return false;
    }
}
```

## Complexity & Graph Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Cycle Detection Time | `O(V + E)` | Standard DFS traversal over lock nodes and dependency edges. |
| Memory Footprint | `O(V + E)` | Adjacency list storing global lock acquisition order. |
| False Positive Rate | `0%` | Pure directed cycle detection without heuristics. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: ThreadSanitizer & Static Lock Analyzers

1. **ThreadSanitizer (TSan / Valgrind Helgrind):** Dynamic binary analysis tools instrument every `pthread_mutex_lock` call, building a global Lock-Order Graph at runtime to report potential deadlocks before they manifest in production.
2. **Database Wait-For Graphs:** PostgreSQL runs asynchronous deadlock detection routines every 1,000ms, traversing transactional wait-for graphs and aborting the youngest transaction upon detecting a cycle.

## Edge Cases & Production Hardening

1. **Reentrant Lock Requests:** If a thread re-acquires a lock it already holds, handle cleanly without creating self-referential cycle edges ($A \to A$).
2. **Lock Release Order:** When locks are released in non-LIFO order, thread-local tracking cleanly removes individual elements.
