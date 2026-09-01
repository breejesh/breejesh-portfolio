---
title: "Carré Noir Maximum: DP de Comptages Droite et Bas pour le Plus Grand Carré Tout Noir (CTCI 17.23)"
description: "Trouvez le plus grand sous-carré entièrement composé de pixels noirs via des tableaux DP de comptages droite-bas précalculés avec balayage O(N^3) et vérification O(1) par cellule."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-23-max-black-square.webp
previewImage: /assets/images/ctci-17-23-max-black-square.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Étant donné une matrice $N \times N$ de cellules noires et blanches, trouvez le plus grand sous-carré dont les quatre bords sont entièrement composés de pixels noirs.
> * **La Solution Optimale:** **DP de Comptages Droite+Bas avec Balayage Décroissant**:
>   1. **Précalculer**: Pour chaque cellule `(r, c)`, calculer `right[r][c]` = cellules noires consécutives à droite, `down[r][c]` = cellules noires consécutives vers le bas.
>   2. **Balayer**: Pour chaque taille décroissante, vérifier les quatre coins d'un carré candidat avec les tableaux précalculés en $O(1)$.
>   3. Temps : **$O(N^3)$** dans le pire cas. Espace : **$O(N^2)$** pour les tables DP.
> * **Réalité en Production:** Détection de ROI en imagerie médicale et validation de tuiles de calcul GPU.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.23), l'énoncé est :

*"Imaginez une matrice carrée ou chaque cellule est noire ou blanche. Concevez un algorithme pour trouver le plus grand sous-carre dont les quatre bords sont entierement noirs."*

## 2. Précalcul DP et Validation des Coins

Les tableaux `right` et `down` permettent de valider les quatre coins de tout candidat en $O(1)$ sans parcourir le bord entier.

## Implémentation de Production

```java
public class MaxBlackSquare {

    static final int BLACK = 1, WHITE = 0;

    public static int[] findSquare(int[][] matrix) {
        int n = matrix.length;
        int[][] right = new int[n][n];
        int[][] down  = new int[n][n];

        for (int r = n - 1; r >= 0; r--) {
            for (int c = n - 1; c >= 0; c--) {
                if (matrix[r][c] == BLACK) {
                    right[r][c] = (c + 1 < n) ? right[r][c + 1] + 1 : 1;
                    down[r][c]  = (r + 1 < n) ? down[r + 1][c]  + 1 : 1;
                }
            }
        }

        for (int sz = n; sz >= 1; sz--) {
            for (int r = 0; r <= n - sz; r++) {
                for (int c = 0; c <= n - sz; c++) {
                    if (right[r][c] >= sz && down[r][c] >= sz
                            && down[r][c + sz - 1] >= sz
                            && right[r + sz - 1][c] >= sz) {
                        return new int[]{r, c, sz};
                    }
                }
            }
        }
        return null;
    }
}
```

## Analyse de Complexité

| Phase | Complexité Temporelle | Espace |
|---|---|---|
| Précalcul DP (right + down) | $O(N^2)$ | $O(N^2)$ |
| Balayage des Carrés | $O(N^3)$ pire cas | $O(1)$ par vérification |
| **Total** | **$O(N^3)$** | **$O(N^2)$** |

## Ingénierie des Systèmes en Production

1. **Détection de ROI Médical :** Identification de régions homogènes sombres dans les IRM pour la segmentation automatisée des lésions.
2. **Validation de Tuiles GPU :** Vérification que les limites des tuiles de calcul tombent dans des régions valides avant de lancer des grilles CUDA/Metal.

## Cas Limites et Robustesse

1. **Matrice Tout Blanche :** Retourne `null`.
2. **Cellule Noire Unique :** Retourne `{r, c, 1}`.
