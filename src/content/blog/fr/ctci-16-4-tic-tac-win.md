---
title: "Victoire au Morpion: Pré-Calcul d'États et Validation Incrémentale (CTCI 16.4)"
description: "Détectez les victoires au Tic-Tac-Toe pour des grilles 3x3 et NxN génériques à l'aide de tables de hachage en base 3 et de compteurs incrémentaux en O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-4-tic-tac-win.webp
previewImage: /assets/images/ctci-16-4-tic-tac-win.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez un algorithme pour déterminer si un joueur a gagné une partie de Morpion (Tic-Tac-Toe).
> * **Les Solutions Optimales :**
>   1. **Requêtes Répétées ($3 \times 3$)** : Pré-calculer les $3^9 = 19\,683$ configurations possibles dans un tableau indexé par hachage en base 3. Résolution en **temps $O(1)$**.
>   2. **Grille Générique $N \times N$** : Vérifier $N$ lignes, $N$ colonnes et 2 diagonales en **temps $O(N)$** et **espace $O(1)$**.
>   3. **Suivi Incrémental par Coup ($N \times N$)** : Maintenir des compteurs par ligne, colonne et diagonales mis à jour en **temps $O(1)$** par coup joué.
> * **Réalité en Production:** Moteurs de jeux au tour par tour et tables de transposition Minimax avec hachage de Zobrist.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.4), l'énoncé est :

*"Evaluez les conditions de victoire au morpion en comparant l'analyse statique NxN, le pre-calcul base 3 et le suivi incrementale."*

## 2. Typologie des Approches

* **Pré-Calcul Base-3 :** Encode l'état 3x3 sous forme d'entier unique pour consultation directe en mémoire.
* **Compteurs Incrémentaux :** Incrémente $+1$ pour X et $-1$ pour O. L'atteinte d'une valeur $\pm N$ signale une victoire immédiate.

## Implémentation de Production

```java
public class TicTacToe {
    public enum Piece { Empty, X, O }

    public static class TicTacToeGame {
        private final int n;
        private final int[] rows;
        private final int[] cols;
        private int diagonal = 0;
        private int antiDiagonal = 0;

        public TicTacToeGame(int n) {
            this.n = n;
            this.rows = new int[n];
            this.cols = new int[n];
        }

        public Piece move(int r, int c, Piece player) {
            if (player == Piece.Empty) return Piece.Empty;
            int val = (player == Piece.X) ? 1 : -1;

            rows[r] += val;
            cols[c] += val;
            if (r == c) diagonal += val;
            if (r + c == n - 1) antiDiagonal += val;

            int target = (player == Piece.X) ? n : -n;
            if (rows[r] == target || cols[c] == target || diagonal == target || antiDiagonal == target) {
                return player;
            }
            return Piece.Empty;
        }
    }
}
```

## Analyse de Complexité

| Approche | Temps par Coup | Espace Mémoire | Cas d'Usage Optimal |
|---|---|---|---|
| **Compteurs Incrémentaux** | **$O(1)$** | $O(N)$ | Parties interactives en temps réel. |
| **Balayage Complet** | $O(N)$ | $O(1)$ | Validation ponctuelle d'état. |
| **Pré-Calcul Base-3** | **$O(1)$** | $19{,}7\text{ Ko}$ | Grilles 3x3 statiques. |

## Ingénierie des Systèmes en Production

### Architecture Système : Tables de Transposition et Bitboards

1. **Tables de Transposition (Hachage de Zobrist) :** Les moteurs d'échecs stockent les configurations de plateaux dans des tables de hachage de 64 bits pour éviter de réévaluer des positions identiques dans l'arbre Minimax.
2. **Représentation Bitboard :** Compression des grilles sur des entiers de 64 bits (`long`) pour valider les alignements via des masques binaires en un cycle processeur.

## Cas Limites et Robustesse

1. **Match Nul :** Grille saturée sans alignement gagnant qualifiée de match nul.
