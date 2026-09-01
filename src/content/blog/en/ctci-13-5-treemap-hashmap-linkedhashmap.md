---
title: "TreeMap vs. HashMap vs. LinkedHashMap: Internal Architectures and Selection Criteria in Java (CTCI 13.5)"
description: "Compare HashMap, TreeMap, and LinkedHashMap in Java, detailing Red-Black tree bins, insertion/access ordering, and LRU cache implementations."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
previewImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
---

> **TL;DR**
> * **The Book Problem:** Explain the differences between `TreeMap`, `HashMap`, and `LinkedHashMap`. Provide an example of when each would be the best choice.
> * **The Three Core Paradigms:**
>   1. **`HashMap`**: Array of buckets using linked lists and Red-Black tree bins ($\ge 8$ collisions). **$O(1)$ average time**, non-deterministic ordering. Best for high-speed key-value lookups.
>   2. **`TreeMap`**: Self-balancing **Red-Black Binary Search Tree** implementing `NavigableMap`. **Guaranteed $O(\log N)$ time**, strictly sorted by key comparator. Best for range queries (`subMap`) and sorted data export.
>   3. **`LinkedHashMap`**: `HashMap` augmented with a doubly linked list traversing all entries. **$O(1)$ time**, maintains strict **Insertion Order** or **Access Order**. Best for building bounded LRU caches via `removeEldestEntry()`.
> * **Production Reality:** Web session caching (`HashMap`), stock exchange order book price ladders (`TreeMap`), and in-memory bounded LRU buffers (`LinkedHashMap`).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 13.5), we are asked:

*"Explain the architectural differences between TreeMap, HashMap, and LinkedHashMap in the Java Collections Framework. Detail internal data structures, complexity bounds, and selection criteria."*

## 2. Structural & Architectural Matrix

| Dimension | `HashMap` | `TreeMap` | `LinkedHashMap` |
|---|---|---|---|
| **Underlying Structure** | Hash table (Buckets + TreeBins) | Red-Black Tree (`NavigableMap`) | Hash table + Doubly linked list |
| **Lookup / Insert Time** | $O(1)$ average ($O(\log N)$ worst) | Guaranteed $O(\log N)$ | $O(1)$ average |
| **Key Ordering** | None (Unordered) | Sorted (`Comparable` / `Comparator`) | Insertion-Order or Access-Order |
| **Null Key Support** | Yes (1 null key in bucket 0) | **No** (Throws `NullPointerException`) | Yes (1 null key) |
| **Memory Overhead** | Moderate (Bucket array + Node pointers) | Moderate (3 tree pointers + color bit) | Highest (Node pointers + 2 doubly-linked pointers) |

## Production Implementation & Selection Use Cases

```java
import java.util.*;

public class MapArchitectureShowcase {

    /**
     * Use Case 1: HashMap - High-Throughput O(1) Session Storage
     */
    public static void demonstrateHashMap() {
        Map<String, String> sessionStore = new HashMap<>();
        sessionStore.put("sess_9921", "User: Alice");
        sessionStore.put("sess_1042", "User: Bob");
        // O(1) direct bucket lookup
        String user = sessionStore.get("sess_9921");
        System.out.println("HashMap session lookup: " + user);
    }

    /**
     * Use Case 2: TreeMap - Sorted Range Queries & Financial Price Ladders
     */
    public static void demonstrateTreeMap() {
        // Automatically sorted by price descending
        NavigableMap<Double, Integer> orderBook = new TreeMap<>(Comparator.reverseOrder());
        orderBook.put(150.25, 500);
        orderBook.put(150.50, 1200);
        orderBook.put(149.80, 300);

        // Range query: Get all bids between 150.50 and 150.00 in O(log N)
        Map<Double, Integer> activeSpread = orderBook.subMap(150.50, true, 150.00, true);
        System.out.println("TreeMap Range Query Bids: " + activeSpread);
    }

    /**
     * Use Case 3: LinkedHashMap - Thread-Safe Bounded LRU Cache
     */
    public static class LRUCache<K, V> extends LinkedHashMap<K, V> {
        private final int maxCapacity;

        public LRUCache(int capacity) {
            // initialCapacity, loadFactor, accessOrder = true (enables LRU tracking)
            super(capacity, 0.75f, true);
            this.maxCapacity = capacity;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > maxCapacity; // Automatically purges least recently accessed entry
        }
    }
}
```

## Internal Mechanics Comparison

```
[HashMap]
Bucket[0] ──> [Entry A] ──> [Entry B]
Bucket[1] ──> [TreeBin (Red-Black Tree for N >= 8)]

[TreeMap]
        [Key: 50 (Black)]
       /                \
[Key: 25 (Red)]    [Key: 75 (Red)]

[LinkedHashMap]
Bucket Array (HashMap Lookup)
      │
      └─── Doubly Linked List running through ALL entries: [Head] <===> [A] <===> [B] <===> [Tail]
```

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Java 8 HashMap Treeification

1. **Hash Collision Defense (JEP 180):** In Java 8+, when bucket collisions in a `HashMap` reach 8 elements (`TREEIFY_THRESHOLD`) and the total table capacity exceeds 64, the linked list transforms into a balanced Red-Black Tree. This guarantees worst-case lookup degrades gracefully to $O(\log N)$ rather than $O(N)$, mitigating algorithmic complexity attacks.
2. **Access-Order Iteration:** In a `LinkedHashMap` configured with `accessOrder = true`, every `map.get(key)` unlinks the node from its current position in the doubly linked list and splices it to the tail in $O(1)$ time.

## Edge Cases & Production Hardening

1. **Concurrent Modification:** None of these three maps are thread-safe. For concurrent workloads, use `ConcurrentHashMap` or `ConcurrentSkipListMap` (concurrent alternative to `TreeMap`).
2. **Mutable Keys:** If an object used as a map key is mutated after insertion (changing its `hashCode()` or `compareTo()`), it becomes unretrievable, leaking memory. Always use immutable keys (`String`, `Integer`, Java `record`).
