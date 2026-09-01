---
title: "La Fourmi de Langton: Automates Cellulaires sur Grille Infinie (CTCI 16.22)"
description: "Simulez l'automate cellulaire de la fourmi de Langton sur un plan 2D infini à l'aide de HashSets de coordonnées et de boîtes englobantes en O(K)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-22-langtons-ant.webp
previewImage: /assets/images/ctci-16-22-langtons-ant.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Une fourmi évolue sur une grille infinie de cellules blanches. À chaque étape :
>   * Sur une case blanche : inverser la couleur en noir, tourner de $90^\circ$ à droite et avancer d'une unité.
>   * Sur une case noire : inverser la couleur en blanc, tourner de $90^\circ$ à gauche et avancer d'une unité.
>   * Simulez les $K$ premiers déplacements et affichez la grille résultante.
> * **La Solution Optimale:** **HashSet de Coordonnées Éparses et Boîte Englobante Dynamique** :
>   1. **Plan Infini** : Ne stocker que les coordonnées des cases noires dans un `HashSet<Position>`.
>   2. **Boîte Englobante** : Suivre `minRow`, `maxRow`, `minCol`, `maxCol` pour n'afficher que le rectangle englobant utile.
>   3. S'exécute en **temps $O(K)$** et **espace $O(K)$**.
> * **Réalité en Production:** Hachage spatial dans les moteurs physiques et automates de Turing universels.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.22), l'énoncé est :

*"Reproduisez la dynamique de la fourmi de Langton sur une grille 2D infinie pour K iterations et affichez le motif matriciel final."*

## 2. Propriété d'Émergence

Après une phase pseudo-chaotique d'environ 10 000 étapes, la fourmi entre dans un comportement périodique en construisant une « autoroute » diagonale de période 104.

## Implémentation de Production

```java
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class LangtonsAnt {

    public enum Orientation {
        RIGHT(0, 1), DOWN(1, 0), LEFT(0, -1), UP(-1, 0);

        public final int dRow, dCol;
        Orientation(int dRow, int dCol) {
            this.dRow = dRow; this.dCol = dCol;
        }

        public Orientation turnRight() { return values()[(ordinal() + 1) % 4]; }
        public Orientation turnLeft() { return values()[(ordinal() + 3) % 4]; }
    }

    public static class Position {
        public final int row, col;
        public Position(int row, int col) {
            this.row = row; this.col = col;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Position)) return false;
            Position pos = (Position) o;
            return row == pos.row && col == pos.col;
        }

        @Override
        public int hashCode() {
            return Objects.hash(row, col);
        }
    }

    public static class AntSimulation {
        private int row = 0, col = 0;
        private Orientation orientation = Orientation.RIGHT;
        private final Set<Position> blackCells = new HashSet<>();
        private int minRow = 0, maxRow = 0, minCol = 0, maxCol = 0;

        public void step() {
            Position currentPos = new Position(row, col);
            if (blackCells.contains(currentPos)) {
                blackCells.remove(currentPos);
                orientation = orientation.turnLeft();
            } else {
                blackCells.add(currentPos);
                orientation = orientation.turnRight();
            }

            row += orientation.dRow;
            col += orientation.dCol;

            minRow = Math.min(minRow, row);
            maxRow = Math.max(maxRow, row);
            minCol = Math.min(minCol, col);
            maxCol = Math.max(maxCol, col);
        }

        public void simulate(int k) {
            for (int i = 0; i < k; i++) step();
        }

        public String printBoard() {
            StringBuilder sb = new StringBuilder();
            for (int r = minRow; r <= maxRow; r++) {
                for (int c = minCol; c <= maxCol; c++) {
                    if (r == row && c == col) {
                        sb.append(orientation.name().charAt(0));
                    } else if (blackCells.contains(new Position(r, c))) {
                        sb.append('X');
                    } else {
                        sb.append('_');
                    }
                }
                sb.append('\n');
            }
            return sb.toString();
        }
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(K)` | $K$ étapes avec opérations de hachage amorties $O(1)$. |
| Espace Mémoire | `O(K)` | Au plus $K$ positions enregistrées dans le HashSet. |

## Ingénierie des Systèmes en Production

### Architecture Système : Hachage Spatial

1. **Moteurs Physiques (Box2D) :** Partitionnement spatial des coordonnées pour éviter l'allocation de mémoires denses.

## Cas Limites et Robustesse

1. **Coordonnées Négatives :** Gérées naturellement sans débordement de tableau.
