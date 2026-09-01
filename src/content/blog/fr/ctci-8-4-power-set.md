---
title: "Ensemble des Parties: Génération de Tous les Sous-Ensembles (CTCI 8.4)"
description: "Générez les 2^N sous-ensembles d'un ensemble par récurrence combinatoire et masquage binaire en temps O(N * 2^N) et espace O(N * 2^N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-4-power-set.webp
previewImage: /assets/images/ctci-8-4-power-set.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une méthode pour renvoyer tous les sous-ensembles d'un ensemble donné.
> * **La Solution Optimale:** Doublage Combinatoire / Masquage Binaire : (1) **Approche Récursive** : Cloner les sous-ensembles du sous-problème et y adjoindre l'élément courant ; (2) **Approche par Masque Binaire** : Parcourir l'entier $k$ de $0$ à $2^N - 1$, où le bit $i$ de $k$ indique la présence de l'élément $i$. Les deux approches s'exécutent en temps optimal $O(N \cdot 2^N)$ et espace $O(N \cdot 2^N)$.
> * **Réalité en Production:** Sélection de caractéristiques en apprentissage automatique et optimiseurs de requêtes SQL.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.4), l'énoncé est :

*"Ecrivez une methode pour renvoyer tous les sous-ensembles d'un ensemble donne."*

## 2. Approches Algorithmiques

1. **Récurrence par Doublage :** On calcule $P(n-1)$, on duplique chaque sous-ensemble en y ajoutant l'élément $n$, puis on fusionne les deux listes.
2. **Masquage Binaire :** Tout entier $k \in [0, 2^n - 1]$ encode un sous-ensemble unique. Si le $i$-ème bit vaut 1, l'élément $i$ est inclus.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.List;

public class PowerSet {
    /**
     * Approche par Masque Binaire.
     * Complexite Temporelle: O(N * 2^N)
     * Complexite Spatiale: O(N * 2^N)
     */
    public static List<List<Integer>> getSubsetsBitmask(List<Integer> set) {
        List<List<Integer>> allSubsets = new ArrayList<>();
        int max = 1 << set.size(); // 2^N

        for (int k = 0; k < max; k++) {
            List<Integer> subset = new ArrayList<>();
            for (int i = 0; i < set.size(); i++) {
                if (((k >> i) & 1) == 1) {
                    subset.add(set.get(i));
                }
            }
            allSubsets.add(subset);
        }

        return allSubsets;
    }

    /**
     * Approche Recursive.
     * Complexite Temporelle: O(N * 2^N)
     * Complexite Spatiale: O(N * 2^N)
     */
    public static List<List<Integer>> getSubsetsRecursive(List<Integer> set, int index) {
        List<List<Integer>> allSubsets;
        if (set.size() == index) {
            allSubsets = new ArrayList<>();
            allSubsets.add(new ArrayList<>());
        } else {
            allSubsets = getSubsetsRecursive(set, index + 1);
            int item = set.get(index);
            List<List<Integer>> moreSubsets = new ArrayList<>();
            for (List<Integer> subset : allSubsets) {
                List<Integer> newSubset = new ArrayList<>(subset);
                newSubset.add(item);
                moreSubsets.add(newSubset);
            }
            allSubsets.addAll(moreSubsets);
        }
        return allSubsets;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N * 2^N)` | Génère $2^N$ sous-ensembles avec $N / 2$ copies en moyenne. |
| Espace Auxiliaire | `O(N * 2^N)` | Stockage de la collection complète dans le tas. |

## Ingénierie des Systèmes en Production

### Architecture Système : Sélection Combinatoire

1. **Optimiseurs de Requêtes SQL (System R) :** Énumération des plans de jointure sur l'ensemble des parties des tables impliquées.
2. **Recherche d'Hyperparamètres :** Évaluation exhaustive des combinaisons de variables explicatives.

## Cas Limites et Robustesse

1. **Ensemble Vide :** Renvoie `[[]]` (contenant le sous-ensemble vide).
2. **Grandes Tailles ($N \ge 30$) :** Gardes de sécurité anti-débordement mémoire.
