---
title: "Robot dans une Grille: Recherche de Chemin avec Mémoïsation (CTCI 8.2)"
description: "Trouvez un chemin pour un robot se déplaçant vers la droite et le bas dans une grille r x c avec obstacles par retour sur trace mémoïsé en O(R * C)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
previewImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Imaginez un robot situé dans le coin supérieur gauche d'une grille à $r$ lignes et $c$ colonnes. Il ne peut se déplacer que vers la droite ou vers le bas, mais certaines cellules contiennent des obstacles infranchissables. Concevez un algorithme trouvant un chemin du coin supérieur gauche au coin inférieur droit.
> * **La Solution Optimale:** Recherche Inverse DFS avec Mémoïsation : (1) Explorer à rebours de $(r-1, c-1)$ vers $(0, 0)$ ; (2) Si un chemin est validé depuis la case supérieure ou gauche, enregistrer la coordonnée ; (3) Stocker les impasses dans un ensemble `HashSet<Point> failedPoints` pour éviter les explorations redondantes, réduisant la complexité de $O(2^{R+C})$ à **$O(R \times C)$ en temps** et **$O(R + C)$ en pile d'appels**.
> * **Réalité en Production:** Guidage de robots mobiles autonomes (Amazon Kiva) et routage Manhattan de circuits intégrés (VLSI).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.2), l'énoncé est :

*"Trouvez un chemin valide pour un robot dans une grille r x c comportant des obstacles, le robot ne pouvant se deplacer que vers la droite et vers le bas."*

## 2. Élagage des Impasses par `failedPoints`

Sans mémoïsation, la redondance des sous-problèmes engendre une complexité exponentielle en $O(2^{R+C})$.

En mémorisant les cellules dont l'exploration échoue dans un ensemble `failedPoints`, toute visite ultérieure est immédiatement coupée en temps $O(1)$.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Objects;

public class RobotInGrid {
    public static class Point {
        public final int row;
        public final int col;

        public Point(int r, int c) { this.row = r; this.col = c; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Point)) return false;
            Point p = (Point) o;
            return row == p.row && col == p.col;
        }

        @Override
        public int hashCode() { return Objects.hash(row, col); }
    }

    public static ArrayList<Point> getPath(boolean[][] maze) {
        if (maze == null || maze.length == 0) return null;
        ArrayList<Point> path = new ArrayList<>();
        HashSet<Point> failedPoints = new HashSet<>();

        if (getPathHelper(maze, maze.length - 1, maze[0].length - 1, path, failedPoints)) {
            return path;
        }
        return null;
    }

    private static boolean getPathHelper(boolean[][] maze, int row, int col,
                                         ArrayList<Point> path, HashSet<Point> failedPoints) {
        if (row < 0 || col < 0 || !maze[row][col]) return false;

        Point p = new Point(row, col);
        if (failedPoints.contains(p)) return false;

        boolean isAtOrigin = (row == 0) && (col == 0);

        if (isAtOrigin || getPathHelper(maze, row - 1, col, path, failedPoints)
                       || getPathHelper(maze, row, col - 1, path, failedPoints)) {
            path.add(p);
            return true;
        }

        failedPoints.add(p);
        return false;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(R * C)` | Chaque case de la grille est examinée au maximum une fois. |
| Espace Auxiliaire | `O(R * C)` | Ensemble des points échoués et pile de récursion $O(R + C)$. |

## Ingénierie des Systèmes en Production

### Architecture Système : Routage sur Grille

1. **Flottes de Robots Logistiques (Amazon Kiva) :** Algorithmes de réservation spatio-temporelle pour éviter les blocages.
2. **Routage de Pistes VLSI :** Algorithme de Lee pour l'interconnexion optimale des broches électroniques.

## Cas Limites et Robustesse

1. **Départ ou Arrivée Bloqués :** Renvoie immédiatement `null`.
2. **Absence de Chemin :** Épuisement des cases accessibles et retour `null`.
