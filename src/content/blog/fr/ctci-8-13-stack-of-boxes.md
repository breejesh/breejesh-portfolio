---
title: "Pile de Boîtes: Empilement 3D par Programmation Dynamique LIS (CTCI 8.13)"
description: "Calculez la hauteur maximale d'une pile de boîtes 3D où chaque boîte doit être strictement plus petite en largeur, hauteur et profondeur en temps O(N^2)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-13-stack-of-boxes.webp
previewImage: /assets/images/ctci-8-13-stack-of-boxes.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Vous disposez d'un ensemble de $n$ boîtes aux dimensions largeur $w_i$, hauteur $h_i$ et profondeur $d_i$. Les boîtes ne peuvent pas être pivotées et ne peuvent être empilées que si chaque boîte est strictement plus petite que la boîte sous-jacente sur les 3 axes. Calculez la hauteur maximale de la pile.
> * **La Solution Optimale:** Programmation Dynamique LIS 3D : (1) Trier les boîtes par ordre décroissant de hauteur ; (2) Utiliser une table `stackMap[i]` stockant la hauteur maximale avec la boîte `i` comme base ; (3) Parcourir les boîtes $j > i$ aux dimensions strictement inférieures $(w_j < w_i, h_j < h_i, d_j < d_i)$ ; (4) S'exécute en **temps $O(N^2)$** et **espace $O(N)$**.
> * **Réalité en Production:** Emballage et chargement de conteneurs 3D (3D Bin Packing) et ordonnancement topologique sur graphes DAG.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.13), l'énoncé est :

*"Calculez la hauteur maximale d'une tour de boites tridimensionnelles sous la contrainte d'une decroissance stricte en largeur, hauteur et profondeur."*

## 2. Modélisation Mathématique : DAG et Tri

En triant les boîtes par ordre décroissant de hauteur ($h_0 \ge h_1 \dots$), la boîte $j$ ne peut reposer sur $i$ que si $j > i$. Le problème se réduit à la recherche de la Plus Longue Sous-Séquence Décroissante (LIS) sur un graphe orienté acyclique (DAG).

$$\text{maxHeight}(i) = h_i + \max_{j > i, \text{canBeAbove}(i, j)} \text{maxHeight}(j)$$

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class StackOfBoxes {
    public static class Box {
        public final int width;
        public final int height;
        public final int depth;

        public Box(int w, int h, int d) {
            this.width = w;
            this.height = h;
            this.depth = d;
        }

        public boolean canBeAbove(Box other) {
            if (other == null) return true;
            return this.width < other.width &&
                   this.height < other.height &&
                   this.depth < other.depth;
        }
    }

    /**
     * Calcule la hauteur maximale d'empilement.
     * Complexite Temporelle: O(N^2)
     * Complexite Spatiale: O(N)
     */
    public static int createStack(List<Box> boxes) {
        if (boxes == null || boxes.isEmpty()) return 0;

        Collections.sort(boxes, new Comparator<Box>() {
            @Override
            public int compare(Box b1, Box b2) {
                return Integer.compare(b2.height, b1.height);
            }
        });

        int[] stackMap = new int[boxes.size()];
        int maxHeight = 0;

        for (int i = 0; i < boxes.size(); i++) {
            int height = createStackHelper(boxes, i, stackMap);
            maxHeight = Math.max(maxHeight, height);
        }

        return maxHeight;
    }

    private static int createStackHelper(List<Box> boxes, int bottomIndex, int[] stackMap) {
        if (bottomIndex < boxes.size() && stackMap[bottomIndex] > 0) {
            return stackMap[bottomIndex];
        }

        Box bottom = boxes.get(bottomIndex);
        int maxSubHeight = 0;

        for (int i = bottomIndex + 1; i < boxes.size(); i++) {
            if (boxes.get(i).canBeAbove(bottom)) {
                int height = createStackHelper(boxes, i, stackMap);
                maxSubHeight = Math.max(maxSubHeight, height);
            }
        }

        int totalHeight = maxSubHeight + bottom.height;
        stackMap[bottomIndex] = totalHeight;
        return totalHeight;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N^2)` | Tri en $O(N \log N)$ et mémoïsation évaluant les couples $(i, j)$ en $O(N^2)$. |
| Espace Auxiliaire | `O(N)` | Tableau de mémoïsation et profondeur d'appels $O(N)$. |

## Ingénierie des Systèmes en Production

### Architecture Système : Empilement Logistique 3D

1. **Optimisation d'Entrepôt et Palettisation (Amazon) :** Algorithmes d'agencement 3D pour maximiser le taux de remplissage sous contraintes de stabilité.
2. **Ordonnancement dans les Compilateurs :** Calcul de la hauteur critique dans les DAGs d'instructions pour limiter les cycles d'attente CPU.

## Cas Limites et Robustesse

1. **Aucun Empilement Possible (Tailles Identiques) :** Renvoie la hauteur de la plus grande boîte individuelle.
2. **Liste Vide :** Renvoie 0.
