---
title: "Volume du Histogramme: Piégeage d'Eau par Deux Pointeurs en O(N) (CTCI 17.21)"
description: "Calculez le volume total d'eau piégée entre les barres d'un histogramme par un balayage en place avec deux pointeurs en temps O(N) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-21-volume-of-histogram.webp
previewImage: /assets/images/ctci-17-21-volume-of-histogram.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Étant donné un histogramme représenté par des hauteurs de barres, calculez le volume total d'eau qu'il peut retenir sous la pluie.
> * **La Solution Optimale:** **Piégeage d'Eau avec Deux Pointeurs In-Place**:
>   1. Initialiser `left=0`, `right=n-1`, `leftMax=0`, `rightMax=0`, `water=0`.
>   2. Si `height[left] <= height[right]`, l'eau au niveau de `left` vaut `leftMax - height[left]`, avancer `left`. Sinon, l'eau au niveau de `right` vaut `rightMax - height[right]`, reculer `right`.
>   3. S'exécute en **temps $O(N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Simulation d'inondation sur modèles numériques de terrain et masques de couverture de pixels GPU.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.21), l'énoncé est :

*"Imaginez un histogramme. Concevez un algorithme pour calculer le volume d'eau qu'il pourrait retenir si on y versait de l'eau par le haut."*

## 2. Pourquoi les Deux Pointeurs Fonctionnent

La clé : l'eau retenue à toute barre vaut `min(max_gauche, max_droite) - hauteur_barre`. Deux pointeurs permettent de calculer cela sans stocker de tableaux de maxima.

## Implémentation de Production

```java
public class VolumeOfHistogram {

    public static int computeHistogramVolume(int[] heights) {
        if (heights == null || heights.length < 3) return 0;

        int left = 0, right = heights.length - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;

        while (left < right) {
            if (heights[left] <= heights[right]) {
                leftMax = Math.max(leftMax, heights[left]);
                water += leftMax - heights[left];
                left++;
            } else {
                rightMax = Math.max(rightMax, heights[right]);
                water += rightMax - heights[right];
                right--;
            }
        }

        return water;
    }
}
```

## Analyse de Complexité

| Approche | Complexité Temporelle | Espace | Notes |
|---|---|---|---|
| **Deux Pointeurs** | **$O(N)$** | **$O(1)$** | **Optimal ; un seul passage.** |
| Tableaux Max G/D | $O(N)$ | $O(N)$ | Logique plus claire, deux tableaux auxiliaires. |
| Force Brute | $O(N^2)$ | $O(1)$ | Pour chaque barre, explorer gauche et droite. |

## Ingénierie des Systèmes en Production

1. **Modèles Numériques de Terrain (MNT) :** Simulations hydrologiques SIG calculant la rétention d'eau dans les bassins versants.
2. **Rasterisation GPU :** Calcul de masques de couverture de pixels pour l'anti-aliasing du tampon de profondeur.

## Cas Limites et Robustesse

1. **Tableau Monotone :** Produit `0` correctement (l'eau s'écoule d'un côté).
2. **Tous Zéros / Barre Unique :** Retourne `0`.
