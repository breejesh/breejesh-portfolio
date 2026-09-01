---
title: "Cache: Architecture de Cache de Requêtes Distribué et Invalidation Multi-Niveaux (CTCI 9.5)"
description: "Concevez une couche de cache distribuée à haute disponibilité pour moteur de recherche avec éviction LRU en temps O(1) et invalidation événementielle."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-9-5-cache.webp
previewImage: /assets/images/ctci-9-5-cache.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Imaginez un serveur web pour un moteur de recherche simplifié avec 100 machines répondant aux requêtes en appelant un cluster coûteux `processSearch(string query)`. Le routage des requêtes étant aléatoire, concevez un système de cache et expliquez sa stratégie d'invalidation lors de la mise à jour des données.
> * **La Solution Optimale:** Architecture Hybride à Deux Niveaux : (1) **Cache Local L1** : Chaque nœud frontal gère un LRU en mémoire pour les requêtes ultra-populaires (zéro saut réseau) ; (2) **Cluster Distribué L2** : Couche Redis / Memcached partitionnée par hachage cohérent ; (3) **Structure LRU** : Table de hachage + liste doublement chaînée opérant en $O(1)$ ; (4) **Invalidation** : Expiration par TTL et bus d'événements Pub/Sub lors des réindexations.
> * **Réalité en Production:** Caches de moteurs de recherche (Google / Bing) et passerelles de bordure CDN.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 9.5), l'énoncé est :

*"Concevez un systeme de cache distribue pour 100 serveurs frontaux interrogeant un moteur de recherche lourd et detaillez la strategie d'invalidation lors des mises a jour d'index."*

## 2. Options d'Architecture : Local vs Distribué vs Hybride

1. **Cache Local Isolé :** Zéro latence réseau mais faible efficacité globale car la même recherche est répliquée sur 100 serveurs.
2. **Cache Distribué Dédié :** Taux de succès élevé et mémoire optimisée via `hash(query)`.
3. **Cache Hybride L1/L2 :** Combinaison optimale d'un L1 local pour les requêtes virales et d'un L2 distribué pour le reste du trafic.

## Implémentation de Production

```java
import java.util.HashMap;
import java.util.Map;

public class LRUQueryCache {
    public static class Node {
        public String query;
        public String[] results;
        public Node prev;
        public Node next;

        public Node(String q, String[] res) {
            this.query = q;
            this.results = res;
        }
    }

    private final int capacity;
    private final Map<String, Node> map = new HashMap<>();
    private final Node head = new Node(null, null);
    private final Node tail = new Node(null, null);

    public LRUQueryCache(int cap) {
        this.capacity = cap;
        head.next = tail;
        tail.prev = head;
    }

    public synchronized String[] get(String query) {
        Node node = map.get(query);
        if (node == null) return null;

        detach(node);
        attach(node);
        return node.results;
    }

    public synchronized void put(String query, String[] results) {
        if (map.containsKey(query)) {
            Node node = map.get(query);
            node.results = results;
            detach(node);
            attach(node);
            return;
        }

        if (map.size() >= capacity) {
            Node lru = tail.prev;
            detach(lru);
            map.remove(lru.query);
        }

        Node newNode = new Node(query, results);
        attach(newNode);
        map.put(query, newNode);
    }

    private void attach(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    private void detach(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
}
```

## Analyse de Complexité et Architecture

| Opération | Complexité | Détail Technique |
|---|---|---|
| Lecture Cache (`get`) | `O(1)` | Recherche directe par pointeur et repositionnement en tête. |
| Écriture Cache (`put`) | `O(1)` | Insertion et éviction en temps constant dans la liste chaînée. |
| Empreinte Mémoire | `O(C)` | Strictement bornée par la capacité $C$ configurée. |

## Ingénierie des Systèmes en Production

### Architecture Système : Stratégies d'Invalidation

1. **Expiration par TTL (Time to Live) :** Dégradation temporelle naturelle (ex. 300 s).
2. **Invalidation par Événements Kafka :** Diffusion de messages lors de l'ingestion de nouveaux documents pour purger les requêtes impactées.

## Cas Limites et Robustesse

1. **Effet de Ruée (Cache Stampede) :** Utilisation de verrous à exécution unique (single-flight mutex) pour éviter les requêtes concurrentes redondantes vers le moteur de recherche.
2. **Mise en Cache des Résultats Vides :** Cache avec TTL court pour les requêtes sans réponse afin de bloquer les attaques par pénétration.
