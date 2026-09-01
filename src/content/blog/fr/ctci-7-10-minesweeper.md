---
title: "Démineur: Moteur de Grille Orienté Objet et Remplissage par Inondation (CTCI 7.10)"
description: "Concevez et implémentez un jeu de démineur avec génération aléatoire de mines, calcul du voisinage et propagation par inondation en temps O(R * C)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-10-minesweeper.webp
previewImage: /assets/images/ctci-7-10-minesweeper.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez et implémentez un jeu de démineur (Minesweeper). Sur une grille $N \times N$ avec $B$ bombes cachées, cliquer sur une bombe fait perdre la partie. Cliquer sur une case vide révèle le nombre de bombes adjacentes. Si ce nombre vaut 0, les cases voisines sont révélées récursivement.
> * **La Solution Optimale:** Moteur de Parcours par Inondation (Flood Fill BFS) : (1) Modèle `Cell` encapsulant l'état de bombe, révélation et compteur de voisins ; (2) Modèle `Board` gérant le placement aléatoire des bombes et le précalcul des indicateurs ; (3) `clickCell()` déclenchant une propagation BFS en présence d'une case à 0 bombe en temps $O(R \times C)$ et espace $O(R \times C)$.
> * **Réalité en Production:** Algorithmes de pot de peinture (Photoshop) et analyse de bassins versants en géomatique.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 7.10), l'énoncé est :

*"Concevez et implementez le jeu classique du Demineur avec gestion des mines, indicateurs de voisinage et expansion automatique des zones vides."*

## 2. Architecture des Classes

1. **`Cell` :** Représente une case de la grille avec ses états (bombe, révélée, drapeaux, mines voisines).
2. **`Board` :** Gère la matrice $R \times C$, le mélange aléatoire des bombes et l'algorithme de flood-fill.
3. **`Game` :** Coordonne les transitions d'état du jeu (`RUNNING`, `WON`, `LOST`).

## Implémentation de Production

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.Random;

public class MinesweeperGame {
    public enum GameState { RUNNING, WON, LOST }

    public static class Cell {
        private final int row;
        private final int col;
        private boolean isBomb = false;
        private boolean isExposed = false;
        private int adjacentMines = 0;

        public Cell(int r, int c) { this.row = r; this.col = c; }
        public boolean isBomb() { return isBomb; }
        public void setBomb(boolean bomb) { this.isBomb = bomb; }
        public boolean isExposed() { return isExposed; }
        public void expose() { this.isExposed = true; }
        public boolean isBlank() { return adjacentMines == 0; }
        public int getAdjacentMines() { return adjacentMines; }
        public void setAdjacentMines(int count) { this.adjacentMines = count; }
    }

    public static class Board {
        private final int rows;
        private final int cols;
        private final int totalBombs;
        private final Cell[][] cells;
        private int unexposedRemaining;

        public Board(int rows, int cols, int bombs) {
            this.rows = rows;
            this.cols = cols;
            this.totalBombs = bombs;
            this.unexposedRemaining = (rows * cols) - bombs;
            this.cells = new Cell[rows][cols];

            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    cells[r][c] = new Cell(r, c);
                }
            }
            placeBombs();
            calculateNeighborCounts();
        }

        private void placeBombs() {
            Random rand = new Random();
            int placed = 0;
            while (placed < totalBombs) {
                int r = rand.nextInt(rows);
                int c = rand.nextInt(cols);
                if (!cells[r][c].isBomb()) {
                    cells[r][c].setBomb(true);
                    placed++;
                }
            }
        }

        private void calculateNeighborCounts() {
            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    if (!cells[r][c].isBomb()) {
                        int count = 0;
                        for (int dr = -1; dr <= 1; dr++) {
                            for (int dc = -1; dc <= 1; dc++) {
                                int nr = r + dr, nc = c + dc;
                                if (inBounds(nr, nc) && cells[nr][nc].isBomb()) {
                                    count++;
                                }
                            }
                        }
                        cells[r][c].setAdjacentMines(count);
                    }
                }
            }
        }

        private boolean inBounds(int r, int c) {
            return r >= 0 && r < rows && c >= 0 && c < cols;
        }

        public GameState clickCell(int r, int c) {
            if (!inBounds(r, c) || cells[r][c].isExposed()) return GameState.RUNNING;

            Cell cell = cells[r][c];
            if (cell.isBomb()) {
                cell.expose();
                return GameState.LOST;
            }

            Queue<Cell> queue = new LinkedList<>();
            cell.expose();
            unexposedRemaining--;
            queue.add(cell);

            while (!queue.isEmpty()) {
                Cell curr = queue.poll();
                if (curr.isBlank()) {
                    for (int dr = -1; dr <= 1; dr++) {
                        for (int dc = -1; dc <= 1; dc++) {
                            int nr = curr.row + dr, nc = curr.col + dc;
                            if (inBounds(nr, nc) && !cells[nr][nc].isExposed() && !cells[nr][nc].isBomb()) {
                                cells[nr][nc].expose();
                                unexposedRemaining--;
                                queue.add(cells[nr][nc]);
                            }
                        }
                    }
                }
            }

            return unexposedRemaining == 0 ? GameState.WON : GameState.RUNNING;
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Clic sur Case | `O(R * C)` | Le BFS parcourt au pire la totalité des cases non piégées. |
| Espace Auxiliaire | `O(R * C)` | Matrice de cases et file BFS. |

## Ingénierie des Systèmes en Production

### Architecture Système : Moteurs d'Inondation

1. **Outil Pot de Peinture (Logiciels Graphiques) :** Propagation de couleur sur des régions contiguës par seuillage.
2. **Modélisation Hydrologique (SIG) :** Simulation d'écoulement sur grilles d'élévation topographique.

## Cas Limites et Robustesse

1. **Validation des Indices :** `inBounds()` garantit l'absence d'exceptions de dépassement de bornes.
