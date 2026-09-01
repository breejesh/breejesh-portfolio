---
title: "Recherche dans une Matrice Triée: Algorithme Saddleback 2D (CTCI 10.9)"
description: "Recherchez un élément dans une matrice M x N où chaque ligne et chaque colonne est triée en ordre croissant via élagage Saddleback en temps O(M + N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
previewImage: /assets/images/ctci-10-9-sorted-matrix-search.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une matrice de dimensions $M \times N$ dans laquelle chaque ligne et chaque colonne est ordonnée par ordre croissant. Écrivez une méthode pour trouver un élément donné.
> * **La Solution Optimale:** **Élagage Saddleback depuis le Coin Supérieur Droit** : (1) Se positionner en `(row = 0, col = N - 1)` ; (2) Si `matrix[row][col] == target`, l'élément est trouvé ; (3) Si `matrix[row][col] > target`, toute la colonne courante contient des valeurs strictement supérieures à la cible, on décrémente `col--` ; (4) Si `matrix[row][col] < target`, toute la ligne courante contient des valeurs inférieures, on incrémente `row++` ; (5) S'exécute en **temps optimal $O(M + N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Requêtes spatiales d'encadrement dans PostGIS et filtrage de grilles 2D dans les carnets d'ordres boursiers.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.9), l'énoncé est :

*"Recherchez un element dans une matrice M x N dont toutes les lignes et colonnes sont triees en ordre croissant."*

## 2. Principe de l'Élagage Saddleback

Partir de $(0, 0)$ est inefficace car aller à droite ou vers le bas augmente la valeur sans critère de décision univoque.

En partant du **coin supérieur droit $(0, \text{colonnes} - 1)$** :
* Aller à **gauche** diminue la valeur.
* Aller vers le **bas** augmente la valeur.

Chaque itération élimine définitivement une ligne ou une colonne de l'espace de recherche :
$$\text{Nombre d'Étapes Maximal} = M + N$$

## Implémentation de Production

```java
public class SortedMatrixSearch {
    /**
     * Recherche elem dans une matrice 2D triee.
     * Complexite Temporelle: O(M + N)
     * Complexite Spatiale: O(1)
     */
    public static boolean findElement(int[][] matrix, int elem) {
        if (matrix == null || matrix.length == 0 || matrix[0].length == 0) {
            return false;
        }

        int row = 0;
        int col = matrix[0].length - 1;

        while (row < matrix.length && col >= 0) {
            if (matrix[row][col] == elem) {
                return true;
            } else if (matrix[row][col] > elem) {
                col--;
            } else {
                row++;
            }
        }
        return false;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(M + N)` | Chaque pas incrémente `row` ou décrémente `col`. |
| Espace Auxiliaire | `O(1)` | Deux simples variables d'indices entiers. |

## Ingénierie des Systèmes en Production

### Architecture Système : Filtres Spatiaux et Financiers

1. **Intersections Géospatiales R-Tree (PostGIS) :** Élimination par boîte englobante 2D évitant le parcours des cellules internes.
2. **Carnets d'Ordres de Bourse :** Recherche rapide dans des grilles 2D prix/volume à très faible latence.

## Cas Limites et Robustesse

1. **Valeur Inférieure à `matrix[0][0]` :** Décrémente `col` jusqu'à sortie immédiate avec retour `false`.
2. **Valeur Supérieure à `matrix[M-1][N-1]` :** Incrémente `row` jusqu'à sortie immédiate avec retour `false`.
