---
title: "Cache LRU: Implémentation du Cache le Moins Récemment Utilisé (CTCI 16.25)"
description: "Problème CTCI 16.25 en Java: concevoir et implémenter un cache LRU avec des opérations get et put en temps O(1) à l'aide d'une HashMap et d'une liste doublement chaînée."
date: "2026-04-09"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-25-lru-cache.webp
previewImage: /assets/images/ctci-16-25-lru-cache.webp
---

> **TL;DR**
> * **Le Problème:** Concevoir une structure de données à capacité fixe qui expulse l'élément le moins récemment utilisé en cas de dépassement, avec `get` et `put` en temps $O(1)$.
> * **La Solution:** Une HashMap offre un accès instantané en $O(1)$, tandis qu'une liste doublement chaînée avec sentinelles head et tail permet de repositionner et d'évacuer les éléments en $O(1)$.
> * **Complexité:** Temps $O(1)$ pour chaque opération, Espace $O(N)$ borné par la capacité.

---

## 1. Implémentation Complète en Java

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
