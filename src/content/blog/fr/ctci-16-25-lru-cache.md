---
title: "Cache LRU: Conception d'un Cache en Mémoire O(1) Haute Performance (CTCI 16.25)"
description: "Comment concevoir et implémenter un cache LRU (Least Recently Used) avec get et put en O(1) via une liste doublement chaînée et une table de hachage."
date: "2026-05-06"
tags: [Algorithmes et Structures, Backend et Bases de Données]
coverImage: /assets/images/ctci-16-25-lru-cache.webp
previewImage: /assets/images/ctci-16-25-lru-cache.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez un cache LRU de capacité fixe où `get(key)` et `put(key, value)` s'exécutent en temps constant $O(1)$.
> * **La Solution Optimale:** Associer une **HashMap** (pour la recherche instantanée en $O(1)$) à une **Liste Doublement Chaînée** (pour le déplacement et l'éviction de nœuds en $O(1)$ sans décalage de tableau).
> * **Réalité en Production:** Politiques d'éviction de Redis (`allkeys-lru`), recyclage de pages de mémoire dans le noyau Linux et caches matériels CPU.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.25), l'énoncé est :

*"Implémentez une structure de cache LRU de capacité C supportant get et put en temps strictement constant O(1)."*

## 2. Synergie HashMap + Liste Doublement Chaînée

La table de hachage fait correspondre chaque clé au pointeur de son nœud. La liste doublement chaînée avec sentinelles (`head` et `tail`) permet de réordonner les nœuds sans balayage mémoire.

## Implémentation de Production

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
    private final Node<K, V> head = new Node<>(null, null); // Sentinelle Head
    private final Node<K, V> tail = new Node<>(null, null); // Sentinelle Tail

    public LRUCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("La capacité doit être positive");
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

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Temps get(key) | `O(1)` | Accès direct par table de hachage et 4 réassignations de pointeurs. |
| Temps put(key, value) | `O(1)` | Insertion hash et chaînage immédiat. |
| Espace Mémoire | `O(C)` | Exactement C nœuds alloués. |

## Ingénierie des Systèmes en Production

### Architecture Système : Éviction dans Redis et Noyau Linux

1. **Redis Approximated LRU :** Échantillonnage aléatoire de clés pour supprimer le surcoût de 24 octets de pointeurs par clé en mémoire.
2. **Caffeine Cache :** Anneaux de tampons sans verrou (lock-free ring buffers) pour supporter des millions de lectures concurrentes sans contention.
3. **Linux Page Reclaim :** Listes actives et inactives triant les pages sales avant déchargement vers la partition swap.

## Cas Limites et Robustesse

1. **Capacité Égale à 1 :** Remplacement immédiat du nœud sans fuite de mémoire.
2. **Protection Concurrente :** Synchronisation des méthodes pour accès multi-thread sûr.
