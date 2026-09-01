---
title: "Sous-Matrice Maximale: Algorithme de Kadane Étendu en 2D pour le Rectangle de Somme Maximale (CTCI 17.24)"
description: "Trouvez la sous-matrice de somme maximale dans une matrice MxN d'entiers en réduisant les lignes à des sommes 1D et en appliquant Kadane sur tous les couples de lignes en O(M^2 * N) temps."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-24-max-submatrix.webp
previewImage: /assets/images/ctci-17-24-max-submatrix.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Étant donné une matrice $M \times N$ d'entiers (éventuellement négatifs), trouvez la sous-matrice à la plus grande somme possible.
> * **La Solution Optimale:** **Kadane 2D via Collapse de Sommes de Colonnes par Paire de Lignes**:
>   1. Fixer une ligne supérieure `r1` et inférieure `r2`. Pour chaque colonne `c`, calculer `colSum[c] = sum(matrix[r1..r2][c])`.
>   2. Appliquer **Kadane 1D** à `colSum[]` pour trouver les colonnes gauche/droite optimales.
>   3. Itérer sur tous les $O(M^2)$ couples de lignes, Kadane $O(N)$ par couple.
>   4. Temps : **$O(M^2 \cdot N)$**. Espace : **$O(N)$** pour les sommes de colonnes.
> * **Réalité en Production:** Extraction de rectangle de gain maximal dans les heatmaps P&L financiers.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.24), l'énoncé est :

*"Ecrivez un algorithme pour trouver la sous-matrice avec la plus grande somme possible."*

## 2. Mécanique du Kadane 2D

Réduire tout couple de lignes en un vecteur 1D de sommes de colonnes ramène le problème au classique sous-tableau de somme maximale 1D, résolvible en $O(N)$ avec Kadane.

## Implémentation de Production

```java
public class MaxSubmatrix {

    public static int[] maxSubmatrix(int[][] matrix) {
        int rows = matrix.length, cols = matrix[0].length;
        int[] best = {Integer.MIN_VALUE, 0, 0, 0, 0};

        for (int r1 = 0; r1 < rows; r1++) {
            int[] colSum = new int[cols];
            for (int r2 = r1; r2 < rows; r2++) {
                for (int c = 0; c < cols; c++) colSum[c] += matrix[r2][c];
                int[] kadane = kadane(colSum, cols);
                if (kadane[0] > best[0]) best = new int[]{kadane[0], r1, kadane[1], r2, kadane[2]};
            }
        }
        return best;
    }

    private static int[] kadane(int[] arr, int n) {
        int maxSum = Integer.MIN_VALUE, current = 0;
        int start = 0, end = 0, tempStart = 0;
        for (int i = 0; i < n; i++) {
            current += arr[i];
            if (current > maxSum) { maxSum = current; start = tempStart; end = i; }
            if (current < 0) { current = 0; tempStart = i + 1; }
        }
        return new int[]{maxSum, start, end};
    }
}
```

## Analyse de Complexité

| Phase | Complexité Temporelle | Espace |
|---|---|---|
| Itération des Paires de Lignes | $O(M^2)$ | — |
| Mise à Jour des Sommes + Kadane | $O(N)$ par paire | $O(N)$ |
| **Total** | **$O(M^2 \cdot N)$** | **$O(N)$** |

## Ingénierie des Systèmes en Production

1. **Heatmaps P&L Financiers :** Identification de fenêtres rectangulaires de gain maximal dans les matrices de rendements d'actifs.
2. **Régions de Luminosité en Imagerie Médicale :** Détection de la région d'intensité maximale dans les coupes CT/PET.

## Cas Limites et Robustesse

1. **Tous Négatifs :** Retourne la cellule la moins négative (Kadane gère ce cas).
2. **Ligne / Colonne Unique :** Dégénère proprement en Kadane 1D.
