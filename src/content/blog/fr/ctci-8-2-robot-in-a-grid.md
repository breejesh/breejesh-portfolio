---
title: "Robot dans une grille: un chemin droite/bas autour des cases bloquées (Java)"
description: "Problème style CTCI 8.2 pour débutants: le robot va du haut-gauche au bas-droit avec seulement droite et bas. Certaines cases sont interdites. DFS mémorisé (ou DP) trouve un chemin en Java."
date: "2026-05-10"
tags: [Algorithmes]
coverImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
previewImage: /assets/images/ctci-8-2-robot-in-a-grid.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.2 pour débutants: le robot va du haut-gauche au bas-droit avec seulement droite et bas. Certaines cases sont interdites. DFS mémorisé (ou DP) trouve un chemin en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu te tiens au coin nord-ouest d'une grille de carrefours. Tu ne peux marcher que vers l'**est** ou le **sud**. Certains carrefours sont fermés pour travaux. Peux-tu atteindre le coin sud-est, et si oui, par quelle suite de carrefours?

C'est le **robot dans une grille**: un labyrinthe avec deux mouvements légaux, des cases bloquées optionnelles, et **un** chemin (pas tous) comme réponse. La récursion dessine l'arbre de recherche. La mémoïsation (ou le DP) t'empêche de re-résoudre la même case morte encore et encore.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions de chemin sur grille en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 8 (récursion et programmation dynamique) continue après [Triple Step](/blog/fr/ctci-8-1-triple-step).

---

## 1. Analogie du quotidien

Imagine un petit plan de ville en lignes et colonnes de carrefours:

* Tu commences au carrefour haut-gauche `(0, 0)`.
* Le but est le bas-droit `(r - 1, c - 1)`.
* Depuis un carrefour ouvert tu peux aller **à droite** d'un pâté ou **en bas** d'un pâté. Pas de gauche, pas de haut, pas de diagonale.
* Certains carrefours sont grillagés. Tu ne peux pas t'y poser.
* Il te faut **n'importe quel** trajet légal du départ à l'arrivée, listé comme suite de carrefours. Pas tous les trajets, ni le plus court (avec seulement droite et bas, chaque chemin a la même longueur: exactement `(r - 1) + (c - 1)` mouvements).

Essaie une grille 3x3 avec le centre bloqué:

```
S . .
. X .
. . E
```

Un chemin: droite, droite, bas, bas (bord supérieur puis droit). Un autre: bas, bas, droite, droite (bord gauche puis inférieur). Les deux évitent le centre.

Si la première ligne et la première colonne sont bloquées juste après le départ, tu peux être coincé même si l'arrivée est libre. L'atteignabilité n'est pas "l'arrivée est-elle libre?"; c'est "existe-t-il une chaîne de cases libres reliées par droite/bas depuis le départ?"

---

## 2. Énoncé simple

**Entrée:** une grille de `r` lignes et `c` colonnes. Chaque case est libre ou interdite. En code: `true` = on peut marcher, `false` = bloqué. Départ `(0, 0)`. But `(r - 1, c - 1)`.

**Sortie:** une liste de points du départ au but formant un chemin valide, ou `null` / vide s'il n'y a pas de chemin.

**Mouvements:** depuis `(row, col)` seulement vers `(row, col + 1)` (droite) ou `(row + 1, col)` (bas), et seulement si la cible est dans les bornes et libre.

**Forme du point:**

```java
class Point {
    final int row;
    final int col;

    Point(int row, int col) {
        this.row = row;
        this.col = col;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        Point p = (Point) o;
        return row == p.row && col == p.col;
    }

    @Override
    public int hashCode() {
        return 31 * row + col;
    }

    @Override
    public String toString() {
        return "(" + row + "," + col + ")";
    }
}
```

**Petits exemples:**

| Idée de grille | Chemin? | Notes |
| --- | --- | --- |
| 1x1 libre | oui: `(0,0)` | départ = but |
| 1x1 bloquée | non | on ne peut pas se poser sur le départ |
| 2x2 tout libre | oui | ex. droite puis bas, ou bas puis droite |
| 2x2 seule `(0,1)` bloquée | oui | il faut bas puis droite |
| 2x2 avec `(0,1)` et `(1,0)` bloquées | non | les deux sorties du départ fermées |
| départ ou but bloqué | non | le chemin inclut les deux extrémités |

**À clarifier avant de coder:**

* Indexation: lignes d'abord, puis colonnes. Dis `maze[row][col]`, pas "x/y" sans définition claire.
* Le départ est-il garanti libre? Vérifie quand même.
* Un chemin ou tous les chemins? **Un chemin** pour ce problème.
* Représentation des cases bloquées? Grille booléenne, entiers `0/1`, ou un set de points: choisis.
* Grille vide ou null? Renvoie null.

---

## 3. Réfléchir d'abord

### La récursion colle aux mouvements

Depuis la case `(r, c)`, un chemin existe si la case est libre et:

* tu es au but, ou
* il y a un chemin depuis le voisin de droite, ou
* il y a un chemin depuis le voisin du bas.

Tu peux aussi chercher **en arrière** depuis le but: une case est atteignable si elle est libre et qu'on y arrive depuis celle du dessus ou de gauche (en travaillant du but vers l'origine). Mêmes ordres de grandeur. L'avant depuis l'origine reste naturel pour construire le chemin.

### La force brute est exponentielle

À chaque pas tu peux essayer deux branches. Un chemin fait environ `r + c` pas, donc l'arbre naïf est de l'ordre de `O(2^(r+c))` au pire. Pire: beaucoup d'itinéraires visitent la **même case**. Si c'est une impasse, tu redécouvres l'échec encore et encore.

### Mémoïser les échecs (et les succès)

L'optimisation clé: pour chaque case, pose une seule fois "y a-t-il un chemin d'ici au but?" Mets les **non** en cache dans un set de points échoués (ou un memo booléen 2D). Si tu as déjà prouvé qu'une case n'atteint pas le but, ne l'explore plus.

Avec ce cache, chaque case est explorée un nombre constant de fois. Le temps tombe à **O(r * c)**. L'espace est O(r * c) pour le memo plus O(r + c) pour le chemin et la profondeur de pile.

Tu peux aussi remplir une table DP `canReach[row][col]` de bas en haut depuis le but, puis marcher depuis le départ en choisissant droite ou bas quand la case suivante peut encore atteindre. Même O(r * c).

### Construire le chemin

Deux styles propres:

1. **En descendant:** quand l'appel récursif depuis ici réussit, insère ce point devant le suffixe (ou à la fin puis inverse).
2. **Depuis le but vers l'origine:** démarre au but, essaie gauche et haut; quand un sous-chemin vers l'origine existe, ajoute le point courant.

Les deux conviennent. Ci-dessous, recherche **vers l'avant** depuis l'origine avec un set de cases échouées.

### Esquisse au tableau

1. Dessine un 3x3, bloque le centre.
2. DFS depuis `(0,0)`: essaie droite, récursion; essaie bas, récursion.
3. Marque une case échouée seulement après l'échec des deux directions.
4. Quand tu touches `(2,2)`, le succès remonte et chaque cadre ajoute son point à la liste.

---

## 4. Solution Java

DFS mémorisé depuis le départ. Cases libres = `true`.

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Find one path from top-left to bottom-right.
 * Moves: right or down only. maze[r][c] == true means free.
 */
public class RobotInAGrid {

    public List<Point> getPath(boolean[][] maze) {
        if (maze == null || maze.length == 0 || maze[0].length == 0) {
            return null;
        }
        List<Point> path = new ArrayList<>();
        Set<Point> failed = new HashSet<>();
        if (findPath(maze, 0, 0, path, failed)) {
            return path;
        }
        return null;
    }

    /**
     * Returns true if there is a path from (row, col) to the goal.
     * On success, path contains points from (row, col) through the goal in order.
     */
    private boolean findPath(
            boolean[][] maze,
            int row,
            int col,
            List<Point> path,
            Set<Point> failed) {

        int rows = maze.length;
        int cols = maze[0].length;

        if (row < 0 || col < 0 || row >= rows || col >= cols || !maze[row][col]) {
            return false;
        }

        Point here = new Point(row, col);
        if (failed.contains(here)) {
            return false;
        }

        boolean atGoal = (row == rows - 1) && (col == cols - 1);

        if (atGoal
                || findPath(maze, row, col + 1, path, failed)
                || findPath(maze, row + 1, col, path, failed)) {
            // Recursion filled the suffix (right or down branch).
            // Add this cell at the front so the full list is start -> goal.
            path.add(0, here);
            return true;
        }

        failed.add(here);
        return false;
    }
}
```

`path.add(0, here)` garde l'ordre départ → but. Si tu préfères des append O(1), pousse en remontant et inverse à la fin, ou collecte depuis le but vers l'arrière et inverse une fois.

### Variante: DP bottom-up puis reconstruction

```java
public List<Point> getPathDp(boolean[][] maze) {
    if (maze == null || maze.length == 0 || maze[0].length == 0) {
        return null;
    }
    int rows = maze.length;
    int cols = maze[0].length;
    if (!maze[0][0] || !maze[rows - 1][cols - 1]) {
        return null;
    }

    // canReach[r][c]: can we reach the goal from (r, c)?
    boolean[][] canReach = new boolean[rows][cols];
    canReach[rows - 1][cols - 1] = true;

    for (int r = rows - 1; r >= 0; r--) {
        for (int c = cols - 1; c >= 0; c--) {
            if (!maze[r][c]) {
                canReach[r][c] = false;
                continue;
            }
            if (r == rows - 1 && c == cols - 1) {
                continue;
            }
            boolean right = (c + 1 < cols) && canReach[r][c + 1];
            boolean down = (r + 1 < rows) && canReach[r + 1][c];
            canReach[r][c] = right || down;
        }
    }

    if (!canReach[0][0]) {
        return null;
    }

    List<Point> path = new ArrayList<>();
    int r = 0;
    int c = 0;
    path.add(new Point(0, 0));
    while (r != rows - 1 || c != cols - 1) {
        if (c + 1 < cols && canReach[r][c + 1]) {
            c++;
        } else if (r + 1 < rows && canReach[r + 1][c]) {
            r++;
        } else {
            return null; // should not happen if table is correct
        }
        path.add(new Point(r, c));
    }
    return path;
}
```

Même big-O. Pratique pour une histoire itérative sans pile de récursion.

### Checks minimaux

```java
boolean[][] open2 = {
    {true, true},
    {true, true}
};
// path length 3, e.g. (0,0)-(0,1)-(1,1) or (0,0)-(1,0)-(1,1)

boolean[][] blockedCenter = {
    {true, true, true},
    {true, false, true},
    {true, true, true}
};
// still possible via top-right or bottom-left corridor

boolean[][] wall = {
    {true, false},
    {false, true}
};
// null path: both exits from start blocked
```

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| DFS naïf, sans mémo | O(2^(r+c)) pire | O(r + c) pile + chemin | Revisite les cases mortes |
| DFS mémo (set d'échecs) | O(r * c) | O(r * c) mémo + O(r + c) chemin/pile | Chaque case une fois |
| DP bottom-up + marche | O(r * c) | O(r * c) table | Pas de récursion; un chemin reconstruit |
| Longueur du chemin (si trouvé) | - | O(r + c) points | Toujours `(r - 1) + (c - 1) + 1` cases |

En entretien, il faut nommer le piège exponentiel, puis montrer le set de mémo (ou la table DP) qui ramène à du linéaire en nombre de cases.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers testent:

* **Départ ou but bloqué:** échec immédiat.
* **1x1 libre:** le chemin est la seule case.
* **Une seule ligne ou colonne:** un seul couloir; tout blocage le coupe.
* **Null ou grille de taille zéro:** renvoie null; n'indexe pas `maze[0]`.
* **Lignes de longueurs différentes:** suppose rectangulaire; sinon valide `maze[i].length`.
* **x/y sans définir la ligne:** préfère `row` et `col`.

Erreurs courantes:

1. **Oublier la mémoïsation.** Le code a l'air juste et s'écroule sur de grandes grilles avec beaucoup de blocs près de la fin.
2. **Mémoïser seulement "visité" pour les cycles.** Avec seulement droite/bas il n'y a pas de cycles, mais les cases **échouées** ont toujours besoin d'un cache car plusieurs parents partagent un enfant.
3. **Marquer échoué trop tôt** (avant d'essayer les deux directions).
4. **Off-by-one sur le but** (`rows` vs `rows - 1`).
5. **Muter la grille comme visitée** sans restaurer, puis rater un second appel.
6. **Renvoyer les cases dans le mauvais ordre** (but → départ) sans inverser.
7. **Traiter bloqué comme libre** en mélangeant les conventions `true`/`false`.

---

## 7. Récap pour un ami

Robot sur une grille, version entretien:

1. Départ haut-gauche, but bas-droit. Mouvements: **droite** ou **bas** seulement. Certaines cases interdites.
2. Récursion: depuis une case libre, essaie droite, essaie bas; succès si tu atteins le but.
3. Sans cache, la même case morte est explorée via beaucoup de parents: temps exponentiel.
4. **Mémo:** retiens les cases qui n'atteignent pas le but. Chaque case une fois → O(r * c).
5. Construis un chemin en enregistrant les points aux retours réussis (ou table DP + marche gloutonne).
6. Vérifie départ/but libres, bornes, et entrée vide.

Si tu peux dessiner un petit labyrinthe, marquer une case échouée pour qu'un second parent la saute, et écrire la méthode récursive mémorisée sans bugs d'index, tu maîtrises le 8.2. Suite du chapitre: [Magic Index](/blog/fr/ctci-8-3-magic-index).

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Triple Step](/blog/fr/ctci-8-1-triple-step)
* Suivant: [Magic Index](/blog/fr/ctci-8-3-magic-index)