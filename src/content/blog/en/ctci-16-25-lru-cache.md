---
title: "LRU Cache: Designing a High-Throughput O(1) Least Recently Used In-Memory Cache (CTCI 16.25)"
description: "How to design and implement an LRU (Least Recently Used) cache with O(1) get and put operations using a Doubly Linked List and Hash Map, with production insights on lock striping and Redis cache eviction."
date: "2026-05-06"
tags: [Algorithms & Data Structures, Backend & Databases]
coverImage: /assets/images/ctci-16-25-lru-cache.webp
previewImage: /assets/images/ctci-16-25-lru-cache.webp
---

> **TL;DR**
> * **The Book Problem:** Design and build a Least Recently Used (LRU) cache for a key-value store with fixed capacity. Support `get(key)` and `put(key, value)` in $O(1)$ time.
> * **The Core Breakthrough:** Combine a **HashMap** (for $O(1)$ key lookup) with a **Doubly Linked List** (for $O(1)$ node removal and head-insertion without array shifting).
> * **Production Reality:** Powers Redis LRU eviction policies, operating system page replacement (Page Frame Reclaim), and CPU hardware cache hierarchies.

## 1. Problem Statement & The Book Contract

In *Cracking the Coding Interview* (Problem 16.25), we are asked to implement an LRU Cache with a maximum capacity $C$ supporting two operations:
* `V get(K key)`: Return value if key exists, and mark this key as the most recently used. If absent, return null.
* `void put(K key, V value)`: Insert or update key-value pair. If capacity is exceeded, evict the least recently used key prior to insertion.

Both operations must execute strictly in $O(1)$ constant time.

## 2. The Naive Approach & Why It Breaks in Production

A naive implementation might use a single `ArrayList` or `ArrayDeque`:
* To retrieve an item, scan the list in $O(N)$ time.
* To mark an item as recently used, remove it from the middle of the array and append to the end. In an array, removing an element forces an $O(N)$ shift of all subsequent elements.

Under high throughput (e.g. 100,000 requests/sec), an $O(N)$ cache lookup creates severe CPU bottlenecks and memory cache thrashing.

## 3. The Optimal Dual-Structure: HashMap + Doubly Linked List

We pair two data structures:
1. **Hash Map (`Map<K, Node<K,V>>`):** Provides instant $O(1)$ mapping from key to node pointer.
2. **Doubly Linked List with Sentinel Head & Tail:** Stores nodes in order of recency. The most recently accessed node resides at `head.next`, and the least recently accessed node resides at `tail.prev`.

* **On `get(key)`:** Lookup node in HashMap in $O(1)$. Unlink node from its current position in the Doubly Linked List (`node.prev.next = node.next; node.next.prev = node.prev`) and insert immediately after dummy `head` in $O(1)$.
* **On `put(key, value)`:** If key exists, update value and move to head. If key is new and size reaches capacity $C$, evict `tail.prev`, remove its entry from the HashMap, and insert the new node at `head.next`.

## Production Implementation

```java
import java.util.HashMap;
import java.util.Map;

public class LRUCache<K, V> {
    private static class Node<K, V> {
        K key;
        V value;
        Node<K, V> prev, next;
        Node(K k, V v) { this.key = k; this.value = v; }
    }

    private final int capacity;
    private final Map<K, Node<K, V>> map = new HashMap<>();
    private final Node<K, V> head = new Node<>(null, null); // Dummy head
    private final Node<K, V> tail = new Node<>(null, null); // Dummy tail

    public LRUCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("Capacity must be positive");
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public synchronized V get(K key) {
        Node<K, V> node = map.get(key);
        if (node == null) return null;

        moveToHead(node);
        return node.value;
    }

    public synchronized void put(K key, V value) {
        Node<K, V> node = map.get(key);
        if (node != null) {
            node.value = value;
            moveToHead(node);
        } else {
            if (map.size() >= capacity) {
                Node<K, V> evicted = popTail();
                map.remove(evicted.key);
            }
            Node<K, V> newNode = new Node<>(key, value);
            map.put(key, newNode);
            addHead(newNode);
        }
    }

    private void addHead(Node<K, V> node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node<K, V> node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(Node<K, V> node) {
        removeNode(node);
        addHead(node);
    }

    private Node<K, V> popTail() {
        Node<K, V> res = tail.prev;
        removeNode(res);
        return res;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| get(key) Time Complexity | `O(1)` | Direct hash lookup + 4 pointer updates. |
| put(key, value) Time Complexity | `O(1)` | Hash insertion + node splicing. |
| Space Complexity | `O(C)` | Exactly C nodes in HashMap and Doubly Linked List. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Redis Cache Eviction & Linux Page Reclaim

The LRU Cache is the fundamental building block of modern distributed caching:

1. **Redis `maxmemory` Eviction Policies (`allkeys-lru` / `volatile-lru`):** In true high-throughput memory stores like Redis, maintaining an exact Doubly Linked List across 100M keys creates excessive pointer overhead (24 bytes per key). Instead, Redis implements an **Approximated LRU Algorithm**: each object stores a 24-bit timestamp of its last access time. When memory is full, Redis samples 5 random keys and evicts the one with the oldest timestamp, achieving 99% accuracy of exact LRU with zero pointer memory overhead.
2. **Lock Striping and ConcurrentLRUCache (Guava / Caffeine Cache):** Under high multi-threaded contention, a global `synchronized` lock creates lock contention bottlenecks. Production libraries (like Ben Manes' **Caffeine**) use **Lock-Free Read Buffers** (ring buffers of hit counters) and asynchronous batch drain queues to achieve millions of reads/sec per core without blocking.
3. **Linux Kernel Page Frame Reclaiming (Active/Inactive Lists):** The Linux kernel maintains two linked lists (`active_list` and `inactive_list`) to track dirty memory pages. Pages accessed recently are promoted to the active list; unreferenced pages drift to the tail of the inactive list and are paged out to disk swap.

## Edge Cases & Production Hardening

1. Null keys or values: Production implementations should explicitly disallow nulls or handle them with dedicated sentinel objects.
2. Capacity = 1: The single element is immediately replaced on subsequent put without dangling pointers.
3. Thread safety under high concurrency: Use synchronized methods or read-write locks (`ReentrantReadWriteLock`).
