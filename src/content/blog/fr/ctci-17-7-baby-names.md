---
title: "Prénoms de Bébés: Regroupement de Synonymes par Composantes Connexes (CTCI 17.7)"
description: "Agrégez les fréquences de prénoms à travers des paires de synonymes grâce au parcours DFS de composantes connexes de graphes en temps linéaire O(V + E)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-7-baby-names.webp
previewImage: /assets/images/ctci-17-7-baby-names.webp
---

> **TL;DR**
> * **Le Problème du Livre:** On vous fournit deux listes : une recensant des prénoms et leurs fréquences d'attribution, et une autre listant des paires de prénoms synonymes (ex. `(John, Jon)`, `(Jon, Johnny)`). Produisez une liste consolidée associant chaque prénom canonique à sa fréquence cumulée.
> * **La Solution Optimale:** **Composantes Connexes de Graphe (DFS / Union-Find)** :
>   1. **Modélisation de Graphe** : Représenter chaque prénom comme un sommet $V$ et relier les paires équivalentes par des arêtes non orientées $E$.
>   2. **Parcours en Profondeur (DFS)** : Pour chaque prénom non encore exploré, visiter l'intégralité de sa composante connexe pour sommer les effectifs de toutes ses variantes.
>   3. **Consolidation** : Associer le total au prénom racine du sous-graphe.
>   4. S'exécute en **temps $O(V + E)$** et **espace $O(V + E)$**.
> * **Réalité en Production:** Résolution d'entités dans les graphes de connaissances (Wikidata) et déduplication de bases clients (MDM).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.7), l'énoncé est :

*"Regroupez les variantes de prenoms par transitivite et sommez leurs frequences d'attribution."*

## 2. Décomposition en Composantes Connexes

La structure de graphe non orienté permet de fusionner des synonymes indirects ($A \sim B$ et $B \sim C \implies A \sim C$) en une seule passe linéaire.

## Implémentation de Production

```java
import java.util.*;

public class BabyNames {

    public static class GraphNode {
        public final String name;
        public int frequency = 0;
        public final List<GraphNode> neighbors = new ArrayList<>();
        public boolean visited = false;

        public GraphNode(String name, int frequency) {
            this.name = name;
            this.frequency = frequency;
        }
    }

    public static Map<String, Integer> trulyPopularNames(
            Map<String, Integer> names,
            String[][] synonyms) {

        Map<String, GraphNode> graph = new HashMap<>();

        for (Map.Entry<String, Integer> entry : names.entrySet()) {
            graph.put(entry.getKey(), new GraphNode(entry.getKey(), entry.getValue()));
        }

        for (String[] pair : synonyms) {
            String name1 = pair[0];
            String name2 = pair[1];

            GraphNode node1 = graph.computeIfAbsent(name1, k -> new GraphNode(k, 0));
            GraphNode node2 = graph.computeIfAbsent(name2, k -> new GraphNode(k, 0));

            node1.neighbors.add(node2);
            node2.neighbors.add(node1);
        }

        Map<String, Integer> rootFrequencies = new HashMap<>();

        for (GraphNode node : graph.values()) {
            if (!node.visited) {
                int totalFrequency = getComponentFrequency(node);
                rootFrequencies.put(node.name, totalFrequency);
            }
        }

        return rootFrequencies;
    }

    private static int getComponentFrequency(GraphNode node) {
        if (node.visited) return 0;
        node.visited = true;

        int sum = node.frequency;
        for (GraphNode neighbor : node.neighbors) {
            sum += getComponentFrequency(neighbor);
        }
        return sum;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(V + E)` | Visite unique de chaque sommet et de chaque arête. |
| Espace Mémoire | `O(V + E)` | Liste d'adjacence et pile d'appels récursive. |

## Ingénierie des Systèmes en Production

### Architecture Système : Résolution d'Identité de Données

1. **Master Data Management (MDM) :** Déduplication de comptes clients multi-canaux (courriels, alias téléphoniques) fusionnés sous un identifiant unique.
2. **Elasticsearch Synsets :** Expansion de requêtes textuelles sur graphes lexicaux.

## Cas Limites et Robustesse

1. **Graphes Cycliques :** Le drapeau booléen `visited` neutralise les cycles fermés (`A=B, B=C, C=A`).
