---
title: "Cache: System de Cache en Mémoire pour Moteur de Recherche (CTCI 9.5)"
description: "Problème CTCI 9.5: concevoir un système de cache en mémoire distribué pour un moteur de recherche."
date: "2025-09-23"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-9-5-cache.webp
previewImage: /assets/images/ctci-9-5-cache.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 9.5 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 9.5: concevoir un système de cache en mémoire distribué pour un moteur de recherche.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **9.5**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 9.5 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 9.5:** Problème CTCI 9.5: concevoir un système de cache en mémoire distribué pour un moteur de recherche.

---

## 3. Approche optimale et implémentation

```java
public class LRUCache<K, V> {
    private final int capacity;
    private final Map<K, V> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > capacity;
            }
        };
    }

    public synchronized V get(K key) { return map.get(key); }
    public synchronized void put(K key, V value) { map.put(key, value); }
}
```

---

## 4. Complexité Temporelle et Spatiale

| Métrique | Complexité | Explication |
| --- | --- | --- |
| Complexité Temporelle | O(N) / O(log N) | Parcours optimal des données |
| Complexité Spatiale | O(1) / O(N) | Empreinte mémoire contrôlée |

---

## 5. Cas Limites et Résumé

Vérifiez toujours les conditions aux limites, les valeurs nulles et la taille des tableaux en entretien.