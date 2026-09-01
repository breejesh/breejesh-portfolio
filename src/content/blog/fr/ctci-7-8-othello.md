---
title: "Othello: Architecture Orientée Objet et Moteur de Jeu Reversi (CTCI 7.8)"
description: "Concevez les classes et la logique du moteur d'Othello (Reversi) avec retournement directionnel selon 8 axes et décompte de score en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-8-othello.webp
previewImage: /assets/images/ctci-7-8-othello.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Au jeu d'Othello, chaque pion a une face blanche et une face noire. Lorsqu'un pion adverse est encadré sur une ligne horizontale, verticale ou diagonale, il est retourné. Concevez le jeu.
> * **La Solution Optimale:** Architecture par Lancer de Rayons (Raycasting) : (1) Enums `Color` (`Black`, `White`) et `Direction` (8 vecteurs cardinaux et diagonaux) ; (2) Modèle `Piece` avec méthode `flip()` ; (3) Plateau $8 \times 8$ dans `Board` implémentant `placeColor()` pour projeter des rayons et retourner les pièces prises en tenaille ; (4) Gestionnaire de partie `Game` calculant les scores en temps $O(1)$.
> * **Réalité en Production:** Moteurs de jeux au tour par tour (Échecs / Go) et algorithmes Minimax avec élagage Alpha-Bêta.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 7.8), l'énoncé est :

*"Concevez le jeu d'Othello (Reversi) en detaillant les classes, structures de donnees et la logique de retournement des pions dans les 8 directions."*

## 2. Architecture Orientée Objet

1. **`Color` & `Direction` (Enums) :** Définition des couleurs et des 8 vecteurs de déplacement.
2. **`Piece` :** Encapsule l'état d'un pion et son retournement via `flip()`.
3. **`Board` :** Grille $8 \times 8$, suivi des scores et exécution de `placeColor()`.
4. **`Game` :** Gestion des tours et détection de fin de partie.

## Implémentation de Production

```java
public class OthelloGame {
    public enum Color {
        White, Black;
        public Color getOpposite() { return this == White ? Black : White; }
    }

    public enum Direction {
        UP(-1, 0), DOWN(1, 0), LEFT(0, -1), RIGHT(0, 1),
        UP_LEFT(-1, -1), UP_RIGHT(-1, 1), DOWN_LEFT(1, -1), DOWN_RIGHT(1, 1);

        public final int dRow;
        public final int dCol;
        Direction(int dr, int dc) { this.dRow = dr; this.dCol = dc; }
    }

    public static class Piece {
        private Color color;
        public Piece(Color c) { this.color = c; }
        public void flip() { color = color.getOpposite(); }
        public Color getColor() { return color; }
    }

    public static class Board {
        public static final int ROWS = 8;
        public static final int COLS = 8;
        private final Piece[][] board = new Piece[ROWS][COLS];
        private int blackCount = 2;
        private int whiteCount = 2;

        public Board() {
            board[3][3] = new Piece(Color.White);
            board[3][4] = new Piece(Color.Black);
            board[4][3] = new Piece(Color.Black);
            board[4][4] = new Piece(Color.White);
        }

        public boolean placeColor(int row, int col, Color color) {
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS || board[row][col] != null) {
                return false;
            }

            int flipped = 0;
            for (Direction dir : Direction.values()) {
                flipped += flipSection(row, col, color, dir);
            }

            if (flipped <= 0) return false;

            board[row][col] = new Piece(color);
            if (color == Color.Black) {
                blackCount += flipped + 1;
                whiteCount -= flipped;
            } else {
                whiteCount += flipped + 1;
                blackCount -= flipped;
            }
            return true;
        }

        private int flipSection(int row, int col, Color color, Direction dir) {
            int r = row + dir.dRow;
            int c = col + dir.dCol;
            int count = 0;

            while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] != null) {
                if (board[r][c].getColor() == color) {
                    if (count == 0) return 0;
                    int currR = row + dir.dRow;
                    int currC = col + dir.dCol;
                    while (currR != r || currC != c) {
                        board[currR][currC].flip();
                        currR += dir.dRow;
                        currC += dir.dCol;
                    }
                    return count;
                }
                count++;
                r += dir.dRow;
                c += dir.dCol;
            }
            return 0;
        }

        public int getBlackCount() { return blackCount; }
        public int getWhiteCount() { return whiteCount; }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Placer Pion | `O(1)` | Parcourt au plus 64 cases fixes sur une grille $8 \times 8$. |
| Espace Auxiliaire | `O(1)` | Grille fixe de taille $8 \times 8$. |

## Ingénierie des Systèmes en Production

### Architecture Système : Moteurs d'Évaluation d'IA

1. **Représentations Bitboard :** Modélisation du plateau sous forme de deux entiers 64 bits (`long`) pour un traitement parallèle des coups via décalages binaires.
2. **Élagage Minimax Alpha-Bêta :** Exploration arborescente des positions stables.

## Cas Limites et Robustesse

1. **Coup sans prise :** Rejeté avec retour `false` sans modification d'état.
