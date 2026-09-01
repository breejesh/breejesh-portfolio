---
title: "Taille des Bassins: Composantes Connexes en 8 Directions et Flood-Fill (CTCI 16.19)"
description: "Calculez la superficie de toutes les étendues d'eau contiguës dans une grille topographique grâce à un parcours en profondeur (DFS) en temps O(R * C)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-19-pond-sizes.webp
previewImage: /assets/images/ctci-16-19-pond-sizes.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une matrice d'entiers représentant un relief où $0$ désigne l'eau et les entiers positifs l'altitude. Un bassin est une région d'eau connectée dans 8 directions (verticale, horizontale, diagonale). Calculez la taille de chaque bassin.
> * **La Solution Optimale:** **Parcours en Profondeur (DFS / Flood-Fill) en 8 Directions** :
>   1. **Balayage Matriciel** : Parcourir toutes les coordonnées $(r, c)$ de la grille $R \times C$.
>   2. **Exploration DFS** : Dès qu'une cellule d'eau ($0$) est rencontrée :
>      * Marquer la cellule comme visitée (assignation `matrice[r][c] = -1`).
>      * Explorer récursivement les 8 voisins immédiats.
>      * Sommer les cellules aquatiques connexes ($1 + \sum \text{DFS}(\text{voisin})$).
>   3. S'exécute en **temps $O(R \cdot C)$** et **espace $O(R \cdot C)$**.
> * **Réalité en Production:** Cartographie satellitaire des inondations et segmentation d'images dans OpenCV.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.19), l'énoncé est :

*"Evaluez la surface de chacun des bassins d'eau connectes selon 8 axes au sein d'une matrice topographique."*

## 2. Masque de Voisinage à 8 Directions

L'ensemble des directions est décrit par $(\Delta r, \Delta c) \in \{-1, 0, 1\}^2 \setminus \{(0, 0)\}$.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class PondSizes {

    public static List<Integer> computePondSizes(int[][] land) {
        if (land == null || land.length == 0 || land[0].length == 0) {
            return Collections.emptyList();
        }

        List<Integer> pondSizes = new ArrayList<>();
        int rows = land.length;
        int cols = land[0].length;

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (land[r][c] == 0) {
                    int size = computePondSize(land, r, c);
                    pondSizes.add(size);
                }
            }
        }

        return pondSizes;
    }

    private static int computePondSize(int[][] land, int r, int c) {
        if (r < 0 || r >= land.length || c < 0 || c >= land[0].length || land[r][c] != 0) {
            return 0;
        }

        land[r][c] = -1;
        int size = 1;

        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                if (dr == 0 && dc == 0) continue;
                size += computePondSize(land, r + dr, c + dc);
            }
        }

        return size;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(R * C)` | Chaque cellule est visitée un nombre borné de fois. |
| Espace Mémoire | `O(R * C)` | Pile récursive proportionnelle à la taille maximale d'un bassin. |

## Ingénierie des Systèmes en Production

### Architecture Système : Télédétection Radar et SIG

1. **Données Radar Satellitaires :** L'analyse d'images radar Copernicus Sentinel-1 extrait les zones inondées via des algorithmes d'étiquetage en composantes connexes.
2. **Union-Find Distribué :** Traitement à large échelle sur architectures distribuées (Apache Spark).

## Cas Limites et Robustesse

1. **Validation des Bornes :** Vérification stricte des indices $(r, c)$ avant tout accès mémoire.
