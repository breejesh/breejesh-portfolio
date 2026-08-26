---
title: "Minesweeper: Board, Cell, bombes et flood fill des zéros (Java)"
description: "Problème style CTCI 7.10 pour débutants: conçois un Minesweeper texte avec Cell et Board, placement aléatoire des bombes, comptes de voisins, règles de clic et flood fill à l'ouverture d'un zéro."
date: "2025-12-30"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-10-minesweeper.webp
previewImage: /assets/images/ctci-7-10-minesweeper.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.10 pour débutants: conçois un Minesweeper texte avec Cell et Board, placement aléatoire des bombes, comptes de voisins, règles de clic et flood fill à l'ouverture d'un zéro.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Conçois un **Minesweeper en texte**. Un plateau `N x N` cache `B` bombes. Les autres cases portent un nombre (combien de bombes parmi les huit voisines) ou zéro (vide). Clic sur une bombe et tu perds. Clic sur un nombre et seule cette case s'ouvre. Clic sur un zéro et le plateau s'étend: ce vide, chaque vide connecté, et l'anneau de nombres autour de cette région s'ouvrent. Pose un drapeau sur les cases que tu crois bombes pour ne pas cliquer par erreur. Tu gagnes quand toutes les cases non-bombe sont exposées.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de conception orientée objet de jeux en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 7, conception orientée objet: Board, Cell, placer les bombes, clic avec flood fill sur les zéros.

---

## 1. Analogie du quotidien

Imagine une grille de papier couverte de post-it. Sous certains, une punaise (une bombe). Sous les autres, un petit compte de punaises proches, ou rien.

Tu enlèves un post-it:

* Punaise dessous: partie terminée.
* Un nombre: seul ce post-it part.
* Vide: tu continues d'enlever chaque post-it vide qui touche celui-ci, et tu enlèves aussi les post-it numérotés au bord de cette zone vide. Tu t'arrêtes aux nombres; tu ne traverses pas un nombre vers le vide suivant sauf si ce vide était déjà relié par des zéros.

Cette expansion du vide est un **flood fill**. Le plateau est une grille 2D de cellules. L'objet jeu suit si tu joues encore, si tu as déjà perdu, ou déjà gagné.

---

## 2. Problème en mots simples

**But:** classes et méthodes pour un Minesweeper texte jouable.

**Pièces centrales:**

| Pièce | Rôle |
| --- | --- |
| `Cell` | une case: bombe ou non, compte voisin, exposée?, drapeau? |
| `Board` | grille de cellules; place les bombes; calcule les nombres; flip / flood fill |
| `Game` (optionnel mais propre) | état, clic/drapeau utilisateur, win/lose, affichage |

**Règles:**

* La grille est `N x N` avec exactement `B` bombes (ou `rows x cols` si tu généralises).
* Le nombre d'une case non-bombe est le nombre de voisines bombes parmi 8 au plus.
* Clic gauche (découvrir):
  * Bombe → perte (on l'expose; la partie finit).
  * Nombre > 0 → n'expose que cette case.
  * Nombre 0 → flood fill des zéros et inclut les nombres du bord.
* Clic droit (drapeau): bascule un drapeau sur une case cachée. Les cases à drapeau ne se découvrent pas au clic.
* Victoire quand chaque case non-bombe est exposée. Les drapeaux n'ont pas besoin de coller aux bombes pour gagner (règle classique: seules les cases sûres doivent être ouvertes).

**À clarifier en entretien:**

* Le premier clic peut-il être garanti sûr? (Bonne règle produit; pas exigée par l'énoncé classique.)
* Placement des bombes: cases aléatoires distinctes, ou liste fixe pour les tests?
* Que affiche l'UI texte pour caché, drapeau, bombe, vide, nombre?
* Clics hors limites: ignorer ou lever une exception?

**Forme des signatures:**

```java
class Cell { /* bomb, number, exposed, flagged */ }

class Board {
    Board(int n, int bombCount);
    void placeBombs(/* random or seed */);
    void setNumbers();
    // returns true if the click was safe (not a bomb), false if bomb hit
    boolean flipCell(int r, int c);
    void toggleFlag(int r, int c);
    boolean allNonBombsExposed();
    // optional: print for debugging
    void print(boolean revealAll);
}
```

---

## 3. Réfléchir d'abord

### Les classes d'abord, les pixels ensuite

Les interviewers veulent de la structure plus qu'une UI soignée.

* **`Cell`**: données d'une case. Logique légère (getters/setters, peut-être `isBlank()`).
* **`Board`**: possède le tableau 2D, placement des bombes, comptes de voisins, uncover + flood fill.
* **`Game`**: boucle, saisie, messages win/lose. Fine couche sur `Board`.

Tu peux fusionner Game dans Board pour un entretien court. Préfère la séparation si le temps le permet.

### Place les bombes, puis compte les voisins

L'ordre compte:

1. Crée toutes les cellules non-bombe, nombre 0, cachées, sans drapeau.
2. Place `B` bombes sur des cases aléatoires distinctes.
3. Pour chaque case non-bombe, compte les voisines bombes dans les 8 directions et stocke ce compte.

Si tu comptes d'abord et places les bombes ensuite, chaque nombre est faux.

```
directions (dr, dc):
  (-1,-1) (-1,0) (-1,1)
  ( 0,-1)        ( 0,1)
  ( 1,-1) ( 1,0) ( 1,1)
```

Ignore les coordonnées hors plateau. Un coin a 3 voisins, un bord 5, une case intérieure 8.

### Règles de clic et flood fill

```
flip(r, c):
  if out of bounds or already exposed or flagged: return (no-op / still safe)
  if cell is bomb: expose it; return false (lose)
  // safe cell
  flood from (r, c) using BFS or DFS
  return true
```

Flood fill (esquisse BFS):

1. Démarre une file avec `(r, c)`.
2. Tant que la file n'est pas vide, prends une cellule:
   * Si déjà exposée, saute.
   * Expose-la.
   * Si son nombre est **strictement positif**, **n'étends pas** plus loin depuis cette case (c'est le bord de la région vide).
   * Si son nombre est **0**, enfile les 8 voisines dans les bornes encore cachées, sans drapeau (et non bombes; les zéros ne sont pas sur des bombes si les nombres sont corrects).

Cela colle au Minesweeper classique: les nombres du bord s'ouvrent, mais le flood ne creuse pas à travers eux vers des régions de zéros déconnectées.

### Pourquoi ne pas ouvrir seulement le zéro cliqué?

Si tu n'ouvres qu'un vide, le jeu paraît cassé. Les joueurs attendent la cascade. Les interviewers veulent aussi entendre "BFS/DFS flood fill" comme algorithme des vides connectés.

### Drapeaux

Les drapeaux sont un verrou d'UI:

* Bascule sur une case cachée.
* Une case à drapeau ignore les clics de découverte.
* Le drapeau ne change ni le plan des bombes ni les nombres voisins.
* Il faut enlever le drapeau avant de pouvoir ouvrir la case.

### Condition de victoire

Après un flip réussi:

* Compte les cases non-bombe exposées, ou suis `remaining = N*N - B` et décrémente à chaque exposition.
* Quand remaining atteint 0, l'état devient WON.
* Toucher une bombe met LOST tout de suite.

Un compteur donne des checks de victoire en O(1). Scanner la grille après chaque clic est O(N²) et convient aux petits plateaux.

### Ce qu'il ne faut pas surconstruire

* Pas besoin d'un framework graphique complet.
* Pas besoin de multijoueur ni de timers sauf demande.
* Des hiérarchies "NumberCell vs BombCell" paient rarement; un simple `boolean isBomb` plus `int adjacent` suffit.

---

## 4. Solution Java

### Cell

```java
class Cell {
    private final int row;
    private final int col;
    private boolean bomb;
    private boolean exposed;
    private boolean flagged;
    private int adjacentBombs; // 0..8 for non-bombs; unused or 0 for bombs

    Cell(int row, int col) {
        this.row = row;
        this.col = col;
    }

    int getRow() { return row; }
    int getCol() { return col; }

    boolean isBomb() { return bomb; }
    void setBomb(boolean bomb) { this.bomb = bomb; }

    boolean isExposed() { return exposed; }
    void setExposed(boolean exposed) { this.exposed = exposed; }

    boolean isFlagged() { return flagged; }
    void setFlagged(boolean flagged) { this.flagged = flagged; }

    int getAdjacentBombs() { return adjacentBombs; }
    void setAdjacentBombs(int n) { this.adjacentBombs = n; }

    boolean isBlank() {
        return !bomb && adjacentBombs == 0;
    }
}
```

### Board: construire, placer les bombes, fixer les nombres

```java
import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.Queue;
import java.util.Random;
import java.util.Set;

class Board {
    private static final int[][] DIRS = {
        {-1, -1}, {-1, 0}, {-1, 1},
        {0, -1},           {0, 1},
        {1, -1},  {1, 0},  {1, 1}
    };

    private final int n;
    private final int bombCount;
    private final Cell[][] grid;
    private int unexposedSafe; // non-bomb cells still hidden
    private boolean exploded;

    Board(int n, int bombCount, long seed) {
        if (n <= 0) {
            throw new IllegalArgumentException("n must be positive");
        }
        if (bombCount < 0 || bombCount > n * n) {
            throw new IllegalArgumentException("invalid bombCount");
        }
        this.n = n;
        this.bombCount = bombCount;
        this.grid = new Cell[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                grid[r][c] = new Cell(r, c);
            }
        }
        placeBombs(seed);
        setNumbers();
        this.unexposedSafe = n * n - bombCount;
        this.exploded = false;
    }

    private void placeBombs(long seed) {
        Random rng = new Random(seed);
        Set<Integer> used = new HashSet<>();
        while (used.size() < bombCount) {
            int idx = rng.nextInt(n * n);
            if (!used.add(idx)) {
                continue;
            }
            int r = idx / n;
            int c = idx % n;
            grid[r][c].setBomb(true);
        }
    }

    private void setNumbers() {
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c].isBomb()) {
                    continue;
                }
                int count = 0;
                for (int[] d : DIRS) {
                    int nr = r + d[0];
                    int nc = c + d[1];
                    if (inBounds(nr, nc) && grid[nr][nc].isBomb()) {
                        count++;
                    }
                }
                grid[r][c].setAdjacentBombs(count);
            }
        }
    }

    private boolean inBounds(int r, int c) {
        return r >= 0 && r < n && c >= 0 && c < n;
    }

    Cell getCell(int r, int c) {
        return grid[r][c];
    }

    boolean hasExploded() {
        return exploded;
    }

    boolean isWon() {
        return !exploded && unexposedSafe == 0;
    }
}
```

### Board: drapeau et clic avec flood fill

```java
    /** Toggle flag on a hidden cell. No-op if already exposed. */
    void toggleFlag(int r, int c) {
        if (!inBounds(r, c) || exploded || isWon()) {
            return;
        }
        Cell cell = grid[r][c];
        if (cell.isExposed()) {
            return;
        }
        cell.setFlagged(!cell.isFlagged());
    }

    /**
     * Uncover cell (r, c). Returns false if a bomb was hit.
     * Returns true if the click was safe or ignored (flagged / already open).
     */
    boolean flipCell(int r, int c) {
        if (!inBounds(r, c) || exploded || isWon()) {
            return !exploded;
        }
        Cell start = grid[r][c];
        if (start.isExposed() || start.isFlagged()) {
            return true;
        }
        if (start.isBomb()) {
            start.setExposed(true);
            exploded = true;
            return false;
        }

        // BFS flood fill for zeros; expose bordering numbers
        Queue<Cell> q = new ArrayDeque<>();
        q.add(start);

        while (!q.isEmpty()) {
            Cell cur = q.poll();
            if (cur.isExposed() || cur.isFlagged() || cur.isBomb()) {
                continue;
            }
            cur.setExposed(true);
            unexposedSafe--;

            if (cur.getAdjacentBombs() > 0) {
                // number cell: stop expanding through it
                continue;
            }

            // blank (zero): expand to all neighbors
            int cr = cur.getRow();
            int cc = cur.getCol();
            for (int[] d : DIRS) {
                int nr = cr + d[0];
                int nc = cc + d[1];
                if (!inBounds(nr, nc)) {
                    continue;
                }
                Cell next = grid[nr][nc];
                if (!next.isExposed() && !next.isFlagged() && !next.isBomb()) {
                    q.add(next);
                }
            }
        }
        return true;
    }
```

### Affichage texte (aide optionnelle)

```java
    /**
     * Text view. If revealAll is true, show bombs and numbers regardless of exposed.
     * Hidden: '.', flagged: 'F', bomb: '*', blank: ' ', number: digit char.
     */
    void print(boolean revealAll) {
        for (int r = 0; r < n; r++) {
            StringBuilder line = new StringBuilder();
            for (int c = 0; c < n; c++) {
                Cell cell = grid[r][c];
                char ch;
                if (!revealAll && cell.isFlagged() && !cell.isExposed()) {
                    ch = 'F';
                } else if (!revealAll && !cell.isExposed()) {
                    ch = '.';
                } else if (cell.isBomb()) {
                    ch = '*';
                } else if (cell.getAdjacentBombs() == 0) {
                    ch = ' ';
                } else {
                    ch = (char) ('0' + cell.getAdjacentBombs());
                }
                line.append(ch).append(' ');
            }
            System.out.println(line.toString().trim());
        }
    }
```

### Petit parcours

Suppose un plateau 3x3 avec une bombe en `(1,1)`. Les nombres autour sont tous `1`. Le centre est `*`. Coins et bords qui touchent la bombe montrent `1`. Il n'y a pas de région de zéros, donc chaque clic sûr ouvre exactement une case. Huit clics sûrs gagnent; clic au centre perd.

Maintenant un plateau 5x5 avec des bombes seulement près des coins, de sorte que le milieu est une mer de zéros. Clic au centre:

1. Le centre est 0 → enfile les voisins.
2. Chaque 0 voisin s'expose et s'étend.
3. Les cases numérotées au bord de ce lac de zéros s'exposent une fois et arrêtent le flood.
4. Un clic peut ouvrir des dizaines de cases. C'est la fonctionnalité que les interviewers veulent bien implémentée.

### Tests déterministes sans UI complète

```java
// fixed seed so bomb layout is stable in unit tests
Board board = new Board(5, 3, 42L);
assert board.flipCell(2, 2); // hope safe; adjust seed if needed
board.toggleFlag(0, 0);
assert !board.hasExploded();
// after enough safe flips:
// assert board.isWon();
```

Pour une démo d'entretien, fixe les positions de bombes au lieu du hasard si tu veux un scénario stable.

```java
// alternative for demos: placeBombsFromList(List of [r,c])
```

---

## 5. Table de complexité

| Opération | Temps | Notes d'espace |
| --- | --- | --- |
| Construire la grille | O(N²) | N² cellules |
| Placer B bombes | O(B) espéré avec set; pire O(N²) de retries si dense | set d'indices |
| setNumbers | O(N²) | 8 checks de voisin par case |
| flipCell sur un nombre | O(1) | expose une case |
| flipCell sur une grande région de zéros | O(K) pour K cases ouvertes (jusqu'à O(N²)) | file BFS O(K) |
| toggleFlag | O(1) | |
| Victoire avec compteur | O(1) | `unexposedSafe` |
| Victoire par parcours complet | O(N²) | sans champ extra |

Pour les tailles d'entretien (N entre 8 et 30), tout ce qui précède convient. Donne la borne du flood fill comme "travail proportionnel aux cases révélées."

---

## 6. Cas limites et erreurs fréquentes

Les interviewers touchent ceux-ci:

* **N = 1, B = 1:** la seule case est une bombe. Le premier clic perd. Gagner est impossible sans règle spéciale.
* **N = 1, B = 0:** un vide. Un clic et tu gagnes.
* **B = 0:** tout le plateau est des zéros. Un clic flood-fill tout et gagne.
* **B = N²:** chaque case est une bombe. Aucun clic sûr.
* **Clic hors limites:** ignore ou lève; fixe le contrat.
* **Clic sur case à drapeau:** pas de découverte (il faut d'abord enlever le drapeau).
* **Clic déjà exposé:** no-op, toujours sûr.
* **Double exposition en BFS:** protège avec `isExposed` pour ne pas décrémenter `unexposedSafe` deux fois.
* **Flood à travers les nombres:** faux. Les nombres s'ouvrent mais n'enfilent pas leurs voisins.
* **Flood vers les bombes:** n'enfile jamais de cellules bombe. Vérifie quand même `!isBomb()` par sécurité.

Erreurs fréquentes:

1. **Compter les voisins avant de placer les bombes.**
2. **Seulement 4 directions** au lieu de 8 (Minesweeper utilise les diagonales).
3. **N'ouvrir que le zéro cliqué** sans flood fill.
4. **S'étendre au-delà des nombres** vers des régions non liées.
5. **Oublier que les drapeaux bloquent les clics.**
6. **Gagner quand toutes les bombes sont flaguées** au lieu de quand toutes les non-bombes sont ouvertes (la victoire classique est l'exposition des cases sûres).
7. **Décalage d'un sur `unexposedSafe`** en revisistant une case dans la file.
8. **Afficher les bombes au joueur** pendant la partie (vue debug vs vue joueur).

Idée minimale de smoke:

```java
Board empty = new Board(3, 0, 1L);
assert empty.flipCell(1, 1);
assert empty.isWon(); // all zeros opened in one flood

Board one = new Board(1, 1, 1L);
assert !one.flipCell(0, 0);
assert one.hasExploded();
```

---

## 7. Résumé à expliquer à un ami

Minesweeper comme problème d'OOD, c'est trois idées:

1. **`Cell`** porte bombe, nombre, exposé, drapeau pour une case.
2. **`Board`** place `B` bombes, puis écrit les comptes de voisins sur 8 directions.
3. **Clic** soit perd sur une bombe, soit ouvre un nombre, soit fait un **flood fill BFS/DFS** d'une région de zéros et de son bord numéroté. Les drapeaux ne bloquent que les clics accidentels. Tu gagnes quand chaque case non-bombe est exposée.

Si tu peux dessiner un petit plateau, placer des bombes, remplir les nombres et dérouler un flood fill à la main, tu maîtrises le problème 7.10. Les interviewers veulent que tes classes collent aux noms du jeu et que l'expansion des zéros soit une vraie recherche sur la grille, pas un vague "ouvrir les cases proches."

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Circular Array](/blog/fr/ctci-7-9-circular-array)
* Suivant: [File System](/blog/fr/ctci-7-11-file-system)