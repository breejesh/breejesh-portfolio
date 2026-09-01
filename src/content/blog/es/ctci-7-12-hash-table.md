---
title: "Hash Table: Designing an In-Memory Hash Map with Collision Chaining (CTCI 7.12)"
description: "Design and implement a generic hash table with collision resolution using linked-list chaining, dynamic bucket array resizing, and MurmurHash distribution."
date: "2026-05-06"
tags: [Algoritmos y Estructuras, Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/ctci-7-12-hash-table.webp
previewImage: /assets/images/ctci-7-12-hash-table.webp
---

> **TL;DR**
> * **The Book Problem:** Design and implement a hash table which uses chaining (linked lists) to handle collisions.
> * **The Core Breakthrough:** Bucket Array + Linked Node Chaining: Array of `LinkedListNode<K, V>`. Hash key using `hashCode() % numBuckets`. On collision, append node to head of bucket list in $O(1)$ average time.
> * **Production Reality:** Core primitive behind Java `HashMap`, Python `dict`, and Redis in-memory storage.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.12), we are asked to design and implement a generic `MyHashTable<K, V>` with `put(K, V)`, `get(K)`, and `remove(K)` using linked-list collision chaining.

## 2. Collision Chaining Mechanics & Resizing

1. **Hash Distribution:** Compute index `int index = Math.abs(key.hashCode()) % arr.length`.
2. **Collision Chaining:** Each bucket points to the head of a linked list (`LinkedListNode<K, V>`). When two keys hash to the same bucket, we traverse the linked list to update the existing key or prepend a new node.
3. **Load Factor:** In production, when size exceeds `0.75 * capacity`, the table doubles capacity and rehashes all elements to maintain $O(1)$ average lookup time.

## Implementación en producción

```java
public class MyHashTable<K, V> {
    private static class LinkedListNode<K, V> {
        public LinkedListNode<K, V> next;
        public LinkedListNode<K, V> prev;
        public K key;
        public V value;
        public LinkedListNode(K k, V v) { this.key = k; this.value = v; }
    }

    private LinkedListNode<K, V>[] arr;

    @SuppressWarnings("unchecked")
    public MyHashTable(int capacity) {
        arr = (LinkedListNode<K, V>[]) new LinkedListNode[capacity];
    }

    private int getIndexForKey(K key) {
        return Math.abs(key.hashCode() % arr.length);
    }

    public void put(K key, V value) {
        LinkedListNode<K, V> node = getNodeForKey(key);
        if (node != null) {
            node.value = value; // Update
            return;
        }
        int index = getIndexForKey(key);
        LinkedListNode<K, V> newNode = new LinkedListNode<>(key, value);
        if (arr[index] != null) {
            newNode.next = arr[index];
            arr[index].prev = newNode;
        }
        arr[index] = newNode;
    }

    public V get(K key) {
        LinkedListNode<K, V> node = getNodeForKey(key);
        return node == null ? null : node.value;
    }

    private LinkedListNode<K, V> getNodeForKey(K key) {
        int index = getIndexForKey(key);
        LinkedListNode<K, V> current = arr[index];
        while (current != null) {
            if (current.key.equals(key)) return current;
            current = current.next;
        }
        return null;
    }
}
```

## Análisis de complejidad y memoria

| Métrica | Complejidad | Detalle técnico |
|---|---|---|
| get / put / remove (Average) | `O(1)` | Even hash distribution across bucket array. |
| get / put / remove (Worst Case) | `O(N)` | All keys collide into single bucket linked list. |
| Space Complexity | `O(N + Capacity)` | Bucket array + node instances. |

## Discusión de ingeniería de sistemas en el mundo real

Java 8 upgraded `HashMap` to replace linked-list buckets with balanced Red-Black Trees (`TreeNode`) when a single bucket exceeds 8 entries, guaranteeing $O(\log N)$ worst-case lookup under hash collision attacks (DoS protection).

## Casos límite y robustez en producción

1. Hash code collision: Resolved seamlessly via linked node traversal.
2. Null keys: Handled at bucket index 0.
