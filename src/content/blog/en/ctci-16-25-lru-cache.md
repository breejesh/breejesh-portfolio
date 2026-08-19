---
title: "LRU Cache: Implement Least Recently Used Cache (CTCI 16.25)"
description: "CTCI problem 16.25 in Java: design and build a Least Recently Used (LRU) cache with O(1) get and put using a HashMap and Doubly Linked List."
date: "2026-04-09"
tags: [Algorithms, Data Structures]
coverImage: /assets/images/ctci-16-25-lru-cache.webp
previewImage: /assets/images/ctci-16-25-lru-cache.webp
---

> **TL;DR**
> * **The Problem:** Design a fixed-capacity data structure that evicts the least recently accessed item when full, supporting both `get` and `put` in $O(1)$ time.
> * **The Insight:** A hash map gives instant $O(1)$ key lookups, while a doubly linked list with dummy head and tail sentinels gives instant $O(1)$ node relocation and eviction.
> * **Complexity:** $O(1)$ Time for both operations, $O(N)$ Space bounded by capacity.

You have a small desk that fits only three open books. You reach for books as you study. When you need a fourth book, you do not throw away a random one; you pack away the book you have not touched for the longest time. That is an **LRU (Least Recently Used) Cache**.

In production systems, caching is what keeps database query latency from blowing up your p99 response times. In interviews, this is the gold standard question to prove you can marry two foundational data structures into one cohesive machine.

---

## 1. Why Neither Structure Works Alone

| Data Structure | Get by Key | Insert / Update | Remove Oldest | Why It Fails Alone |
| --- | --- | --- | --- | --- |
| **Array / ArrayList** | $O(1)$ index, $O(N)$ key | $O(N)$ shift | $O(N)$ shift | Moving elements is too slow |
| **Singly Linked List** | $O(N)$ search | $O(1)$ at head | $O(N)$ to find tail prev | Cannot remove a middle node in $O(1)$ |
| **HashMap alone** | $O(1)$ key lookup | $O(1)$ put | $O(N)$ to scan timestamps | No ordering of access history |
| **HashMap + Doubly Linked List** | **$O(1)$** via map | **$O(1)$** at head | **$O(1)$** from tail | **The winning combination** |

---

## 2. The Architectural Model

```
[Head Sentinel] <-> [Most Recent Node] <-> ... <-> [Least Recent Node] <-> [Tail Sentinel]
```

- **`get(key)`**: Look up the node in the hash map. If found, detach the node from its current position in the list and splice it right after `head`. Return the value.
- **`put(key, value)`**: If the key exists, update its value and move it to the head. If it is a new key, create a node, attach it after `head`, and register it in the map. If capacity is exceeded, detach the node right before `tail` and delete its entry from the map.

---

## 3. Complete Java Implementation

```java
import java.util.HashMap;
import java.util.Map;

public class LRUCacheCustom {
    private static class Node {
        int key;
        int value;
        Node prev;
        Node next;

        Node(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private final int capacity;
    private final Map<Integer, Node> map;
    private final Node head;
    private final Node tail;

    public LRUCacheCustom(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Capacity must be positive");
        }
        this.capacity = capacity;
        this.map = new HashMap<>();

        // Initialize dummy sentinels to eliminate null checks
        this.head = new Node(0, 0);
        this.tail = new Node(0, 0);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    public int get(int key) {
        Node node = map.get(key);
        if (node == null) {
            return -1;
        }
        // Promote accessed node to most recently used
        moveToHead(node);
        return node.value;
    }

    public void put(int key, int value) {
        Node existingNode = map.get(key);

        if (existingNode != null) {
            existingNode.value = value;
            moveToHead(existingNode);
            return;
        }

        if (map.size() >= capacity) {
            // Evict least recently used item (node right before tail)
            Node lru = tail.prev;
            removeNode(lru);
            map.remove(lru.key);
        }

        Node newNode = new Node(key, value);
        map.put(key, newNode);
        addToHead(newNode);
    }

    private void addToHead(Node node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(Node node) {
        removeNode(node);
        addToHead(node);
    }
}
```

---

## 4. Complexity & Production Edge Cases

| Metric | Complexity | Explanation |
| --- | --- | --- |
| **Get Latency** | $O(1)$ | Hash lookup plus four pointer updates |
| **Put Latency** | $O(1)$ | Hash insertion plus constant-time pointer wiring |
| **Space Overhead** | $O(C)$ | Exactly bounded by configured cache capacity $C$ |

### Pitfalls in Real-World Usage
1. **Thread Safety**: This implementation is single-threaded. For high-concurrency environments, wrap mutations in synchronized blocks or use a read-write lock (`ReentrantReadWriteLock`).
2. **Memory Leaks on Node Removal**: Always unlink both `prev` and `next` references when detaching nodes to ensure immediate garbage collection eligibility.
3. **Dummy Sentinels**: Never write this without dummy `head` and `tail` nodes. Without sentinels, handling empty lists and boundary edge cases requires dozens of fragile `if (head == null)` conditions.
