---
title: "Huit Reines: Problème des N-Reines et Invariants de Collision Diagonale (CTCI 8.12)"
description: "Placez huit reines sur un échiquier 8x8 sans conflit de ligne, colonne ou diagonale par retour sur trace avec représentation 1D en temps O(8!)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-12-eight-queens.webp
previewImage: /assets/images/ctci-8-12-eight-queens.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez un algorithme pour afficher toutes les manières de disposer huit reines sur un échiquier $8 \times 8$ de sorte qu'aucune reine ne partage la même ligne, colonne ou diagonale.
> * **La Solution Optimale:** Retour sur Trace avec Représentation 1D : (1) Chaque ligne contenant obligatoirement une reine, l'état est modélisé par `Integer[] columns` où `columns[ligne] = col` ; (2) Progression ligne par ligne ; (3) Validation des conflits de colonne (`col1 == col2`) et de pente diagonale ($|col_2 - col_1| == row_1 - row_2$) ; (4) Identifie l'ensemble des **92 solutions distinctes** en temps $O(8!)$ et mémoire auxiliaire $O(1)$.
> * **Réalité en Production:** Problèmes de Satisfaction de Contraintes (CSP) dans les solveurs SMT (Z3) et ordonnanceurs d'infrastructures (Kubernetes).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.12), l'énoncé est :

*"Trouvez toutes les configurations possibles de 8 reines sur un echiquier 8x8 sans aucune prise mutuelle."*

## 2. Invariant Diagonal et Tableau 1D

### Représentation Compacte
On élimine les conflits de ligne par conception : la ligne $r$ porte la reine $r$. Le tableau `columns[r] = c` indique la colonne assignée à la reine de la ligne $r$.

### Invariant de Collision Diagonale
Deux reines en $(r_1, c_1)$ et $(r_2, c_2)$ s'attaquent en diagonale si et seulement si :
$$|c_2 - c_1| == |r_2 - r_1|$$

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.List;

public class EightQueens {
    private static final int GRID_SIZE = 8;

    /**
     * Calcule les 92 solutions du probleme des 8 reines.
     * Complexite Temporelle: O(GRID_SIZE!)
     * Complexite Spatiale: O(GRID_SIZE)
     */
    public static List<Integer[]> placeQueens() {
        List<Integer[]> results = new ArrayList<>();
        Integer[] columns = new Integer[GRID_SIZE];
        placeQueensHelper(0, columns, results);
        return results;
    }

    private static void placeQueensHelper(int row, Integer[] columns, List<Integer[]> results) {
        if (row == GRID_SIZE) {
            results.add(columns.clone());
            return;
        }

        for (int col = 0; col < GRID_SIZE; col++) {
            if (checkValid(columns, row, col)) {
                columns[row] = col;
                placeQueensHelper(row + 1, columns, results);
            }
        }
    }

    private static boolean checkValid(Integer[] columns, int row1, int col1) {
        for (int row2 = 0; row2 < row1; row2++) {
            int col2 = columns[row2];

            // Conflit de colonne
            if (col1 == col2) return false;

            // Conflit diagonal
            int columnDistance = Math.abs(col2 - col1);
            int rowDistance = row1 - row2;
            if (columnDistance == rowDistance) return false;
        }
        return true;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N!)` | L'élagage précoce filtre drastiquement l'arbre de recherche, isolant les 92 solutions. |
| Espace Auxiliaire | `O(N)` | Tableau 1D de 8 entiers et pile de 8 appels récursifs. |

## Ingénierie des Systèmes en Production

### Architecture Système : Résolution de Contraintes (CSP)

1. **Solveurs SMT (Z3 de Microsoft) :** Vérification formelle de code et analyse de sécurité par réduction en contraintes booléennes avec retour sur trace élagué.
2. **Ordonnancement Kubernetes :** Placement de pods selon des contraintes d'anti-affinité et de topologie réseau.

## Cas Limites et Robustesse

1. **Exactitude :** Génère rigoureusement les 92 solutions valides pour $N = 8$.
