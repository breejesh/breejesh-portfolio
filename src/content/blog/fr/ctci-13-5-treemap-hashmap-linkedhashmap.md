---
title: "TreeMap vs. HashMap vs. LinkedHashMap: Architectures et Sélection en Java (CTCI 13.5)"
description: "Comparez HashMap, TreeMap et LinkedHashMap en Java : arbres Rouge-Noir par alvéole, ordonnancement par insertion/accès et conception de caches LRU."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
previewImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Expliquez les différences entre `TreeMap`, `HashMap` et `LinkedHashMap`. Donnez un exemple d'utilisation optimale pour chacun.
> * **Les Trois Paradigmes Fondamentaux :**
>   1. **`HashMap`** : Table de hachage par alvéoles utilisant des listes chaînées et des nœuds d'arbres Rouge-Noir ($\ge 8$ collisions). **Temps moyen $O(1)$**, non ordonné. Optimal pour les accès directs clé-valeur.
>   2. **`TreeMap`** : **Arbre Binaire de Recherche Rouge-Noir** auto-équilibré (`NavigableMap`). **Temps garanti $O(\log N)$**, trié strictement par comparateur. Optimal pour les requêtes d'intervalles (`subMap`) et données ordonnées.
>   3. **`LinkedHashMap`** : `HashMap` enrichie d'une liste doublement chaînée reliant toutes les entrées. **Temps $O(1)$**, préserve l'**Ordre d'Insertion** ou l'**Ordre d'Accès**. Optimal pour réaliser des caches LRU via `removeEldestEntry()`.
> * **Réalité en Production:** Caches de sessions web (`HashMap`), carnets d'ordres boursiers (`TreeMap`) et tampons de cache LRU (`LinkedHashMap`).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 13.5), l'énoncé est :

*"Distinguez les structures TreeMap, HashMap et LinkedHashMap dans le framework des collections Java, leurs complexites et leurs cas d'usage optimaux."*

## 2. Tableau Comparatif des Structures

| Critère | `HashMap` | `TreeMap` | `LinkedHashMap` |
|---|---|---|---|
| **Structure Interne** | Table de hachage (Alvéoles + TreeBins) | Arbre Rouge-Noir (`NavigableMap`) | Table de hachage + Liste doublement chaînée |
| **Temps d'Accès** | $O(1)$ moyen ($O(\log N)$ pire cas) | $O(\log N)$ garanti | $O(1)$ moyen |
| **Ordre des Clés** | Aucun (Aléatoire) | Trié (`Comparable` / `Comparator`) | Ordre d'insertion ou d'accès |
| **Support de Clé Null** | Oui (1 clé nulle) | **Non** (`NullPointerException`) | Oui (1 clé nulle) |
| **Empreinte Mémoire** | Modérée | Modérée (pointeurs d'arbre) | Élevée (pointeurs hash + double chaînage) |

## Implémentation de Production

```java
import java.util.*;

public class MapArchitectureShowcase {

    public static void demonstrateHashMap() {
        Map<String, String> sessionStore = new HashMap<>();
        sessionStore.put("sess_1", "Alice");
        System.out.println("HashMap: " + sessionStore.get("sess_1"));
    }

    public static void demonstrateTreeMap() {
        NavigableMap<Double, Integer> carnetOrdres = new TreeMap<>(Comparator.reverseOrder());
        carnetOrdres.put(150.50, 100);
        carnetOrdres.put(150.25, 500);

        // Requête de plage en O(log N)
        Map<Double, Integer> plage = carnetOrdres.subMap(150.50, true, 150.00, true);
        System.out.println("TreeMap Plage: " + plage);
    }

    public static class LRUCache<K, V> extends LinkedHashMap<K, V> {
        private final int capacite;

        public LRUCache(int cap) {
            super(cap, 0.75f, true); // true active le suivi d'accès LRU
            this.capacite = cap;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > capacite; // Éviction automatique du plus ancien
        }
    }
}
```

## Ingénierie des Systèmes en Production

### Architecture Système : Équilibrage d'Alvéoles en Java 8 (JEP 180)

1. **Protection Anti-Collisions :** Lorsqu'une alvéole atteint 8 entrées, la liste chaînée est convertie en arbre Rouge-Noir, bornant la recherche à $O(\log N)$.
2. **Ordre d'Accès LRU :** Dans `LinkedHashMap` avec `accessOrder = true`, chaque lecture `get(key)` replace l'élément en queue de liste en $O(1)$.

## Cas Limites et Robustesse

1. **Accès Concurrents :** Aucune de ces structures n'est thread-safe. Utiliser `ConcurrentHashMap` ou `ConcurrentSkipListMap`.
2. **Clés Mutables :** Modifier l'état d'une clé après insertion corrompt la table ou l'arbre. Privilégier les types immuables (`String`, `record`).
