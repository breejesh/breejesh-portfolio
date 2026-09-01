---
title: "Index Magique: Recherche Binaire de Point Fixe dans un Tableau Trié (CTCI 8.3)"
description: "Trouvez un index magique où A[i] = i dans un tableau trié d'entiers distincts ou avec doublons par recherche binaire adaptée en temps O(log N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-3-magic-index.webp
previewImage: /assets/images/ctci-8-3-magic-index.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Un index magique dans un tableau $A[0 \dots n - 1]$ est défini tel que $A[i] = i$. Étant donné un tableau trié d'entiers distincts, trouvez un index magique s'il existe. SUITE : Qu'en est-il si les valeurs contiennent des doublons ?
> * **La Solution Optimale:** Recherche Binaire de Point Fixe : (1) **Éléments Distincts** : Si $A[\text{mid}] > \text{mid}$, aucun point fixe ne peut se trouver à droite, garantissant un temps $O(\log N)$ ; (2) **Avec Doublons** : Élagage récursif à gauche sur $[start, \min(\text{mid}-1, A[\text{mid}])]$ et à droite sur $[\max(\text{mid}+1, A[\text{mid}]), end]$ en temps moyen $O(\log N)$ et pire cas $O(N)$.
> * **Réalité en Production:** Recherche de points fixes en analyse de flot de données de compilateurs.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.3), l'énoncé est :

*"Trouvez un indice magique A[i] = i dans un tableau trie d'entiers distincts, puis etendez l'algorithme au cas avec doublons."*

## 2. Démarche Algorithmique

1. **Cas d'Éléments Distincts :** Chaque élément étant strictement croissant :
   * Si $A[\text{mid}] > \text{mid}$, alors pour tout $j > \text{mid}$, $A[j] > j$. La recherche se restreint strictement à gauche.
   * Si $A[\text{mid}] < \text{mid}$, la recherche se restreint à droite.
2. **Cas avec Doublons :** La rupture de stricte croissance impose d'explorer les deux côtés en élaguant les intervalles incompatibles grâce aux bornes $\min(\text{mid}-1, A[\text{mid}])$ et $\max(\text{mid}+1, A[\text{mid}])$.

## Implémentation de Production

```java
public class MagicIndex {
    /**
     * Elements DISTINCTS.
     * Complexite Temporelle: O(log N)
     * Complexite Spatiale: O(log N)
     */
    public static int magicDistinct(int[] array) {
        return magicDistinct(array, 0, array.length - 1);
    }

    private static int magicDistinct(int[] array, int start, int end) {
        if (end < start) return -1;

        int mid = start + (end - start) / 2;
        if (array[mid] == mid) {
            return mid;
        } else if (array[mid] > mid) {
            return magicDistinct(array, start, mid - 1);
        } else {
            return magicDistinct(array, mid + 1, end);
        }
    }

    /**
     * Elements avec DOUBLONS.
     * Complexite Temporelle: O(log N) moyen, O(N) pire cas.
     * Complexite Spatiale: O(log N)
     */
    public static int magicNonDistinct(int[] array) {
        return magicNonDistinct(array, 0, array.length - 1);
    }

    private static int magicNonDistinct(int[] array, int start, int end) {
        if (end < start) return -1;

        int midIndex = start + (end - start) / 2;
        int midValue = array[midIndex];

        if (midValue == midIndex) {
            return midIndex;
        }

        int leftIndex = Math.min(midIndex - 1, midValue);
        int left = magicNonDistinct(array, start, leftIndex);
        if (left >= 0) return left;

        int rightIndex = Math.max(midIndex + 1, midValue);
        return magicNonDistinct(array, rightIndex, end);
    }
}
```

## Analyse de Complexité et Mémoire

| Mode | Complexité Temporelle | Espace Auxiliaire | Détail Technique |
|---|---|---|---|
| Entiers Distincts | `O(log N)` | `O(log N)` | Recherche dichotomique standard. |
| Avec Doublons | `O(log N)` moy. / `O(N)` pire | `O(log N)` | Double recherche élaguée. |

## Ingénierie des Systèmes en Production

### Architecture Système : Points Fixes et Compilateurs

1. **Analyse de Flot de Données :** Détection de variables vivantes par calcul itératif de points fixes fonctionnels ($f(x) = x$).
2. **Index Partitionnés Monotones :** Découpage de plages d'index sans parcours séquentiel intégral.

## Cas Limites et Robustesse

1. **Tableau sans point fixe :** Renvoie `-1`.
2. **Tableau vide :** Traité immédiatement.
