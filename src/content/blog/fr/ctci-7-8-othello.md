---
title: "Othello: plateau, couleur, partie et règles de retournement en Java OOD"
description: "Problème style CTCI 7.8 pour débutants: concevoir Othello (Reversi) avec Board, couleur de Piece, flux de Game et logique de capture. Esquisse Java originale, pas une copie de livre."
date: "2025-08-23"
tags: [Algorithmes]
coverImage: /assets/images/ctci-7-8-othello.webp
previewImage: /assets/images/ctci-7-8-othello.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.8 pour débutants: concevoir Othello (Reversi) avec Board, couleur de Piece, flux de Game et logique de capture. Esquisse Java originale, pas une copie de livre.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

**Othello** (aussi appelé Reversi) est un jeu de plateau à deux. Chaque pion est noir d'un côté et blanc de l'autre. Quand tu prends en sandwich des pions adverses entre ton nouveau pion et un autre des tiens, ces pions passent à ta couleur. À ton tour tu dois capturer au moins un pion. Quand personne n'a de coup légal, la partie s'arrête. Gagne celui qui a le plus de pions.

C'est un problème de **conception orientée objet**. L'intervieweur veut des classes, des responsabilités et un algorithme de retournement clair, pas une IA complète. Ce billet est un enseignement original pour débutants avec une esquisse **Java**: `Color`, `Piece`, `Board`, `Player`, `Game`. Partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 7, conception orientée objet.

---

## 1. Analogie du quotidien

Imagine un plateau vert en plastique et un tas de pièces à deux faces. Noir et blanc commencent au centre en petit losange. Tu poses une pièce de ta couleur pour pincer une ligne droite de l'autre couleur contre une de tes pièces déjà posées. Tu retournes chaque pièce de cette ligne. Puis c'est au tour de l'autre.

Le travail de conception n'est pas "écrire Stockfish pour Othello". C'est: qui possède la grille, qui connaît la couleur actuelle d'un pion, qui décide si un coup est légal, et qui suit le tour quand il n'y a plus de coups.

---

## 2. Énoncé simple

**Règles à dire à voix haute:**

* Deux joueurs: Noir et Blanc. Le plateau standard est **8x8** (confirme la taille; certaines esquisses utilisent 10x10).
* Départ avec quatre pions au centre: deux noirs, deux blancs, en alternance.
* Un coup légal place ta couleur sur une case **vide** de sorte que, sur au moins une ligne droite (ligne, colonne ou diagonale), tu enfermes un ou plusieurs pions adverses entre le nouveau pion et un autre des tiens.
* Tous les pions adverses enfermés sur ces lignes **se retournent** à ta couleur.
* Tu dois retourner au moins un pion. Passer alors qu'il te reste un coup n'est pas autorisé. Si tu n'as aucun coup, tu passes (ou la partie finit quand les deux ne peuvent plus; dis quelle règle tu choisis).
* Fin: plus aucun coup légal des deux côtés (ou plateau plein). Gagnant = plus de pions de ta couleur. Égalité si les scores sont égaux.

**Othello classique vs un énoncé plus mince:** l'Othello complet retourne dans **huit** directions (diagonales incluses). Certains textes ne parlent que de gauche/droite et haut/bas. En entretien, demande. Ici on implémente **huit directions**, car c'est le vrai jeu et le cas le plus exigeant.

**Quoi concevoir:**

* Classes et enums
* Comment un coup est validé et appliqué
* Qui tient le score et le tour
* Comment la partie décide qu'elle est finie

**Pas requis sauf demande:** IA minimax, multijoueur réseau, graphismes, historique d'annulation.

---

## 3. Réfléchir d'abord

### Objets centraux

| Objet | Rôle |
| --- | --- |
| `Color` | `BLACK`, `WHITE`, et peut-être `EMPTY` pour les cases |
| `Piece` | Un pion: couleur courante, `flip()` |
| `Board` | Grille, placement, retournements, scores |
| `Player` | Couleur, tenter un coup |
| `Game` | Deux joueurs, tour, début, fin, gagnant |

### Bifurcations de conception à verbaliser

**Sous-classes BlackPiece et WhitePiece?** En général non. Un pion bascule souvent. Détruire un objet noir et en créer un blanc à chaque flip est bruyant. Un `Piece` avec un champ `Color` est plus simple.

**Séparer `Game` et `Board`?** Oui si tu peux te permettre la couche. `Board` connaît la géométrie et les flips. `Game` connaît les tours, les passes et "qui a gagné". Les fusionner marche pour une micro-esquisse; des classes séparées se lisent mieux en entretien.

**Qui tient le score?** `Board` peut garder des compteurs black/white et les mettre à jour à l'ajout ou au flip. Scanner la grille après chaque coup marche aussi en 8x8 (taille `O(1)`).

**`Game` singleton?** Optionnel. Pratique si tout passe par une instance. Gênant si tu veux deux parties concurrentes en tests. Préfère une instance normale sauf si l'intervieweur pousse le singleton.

**Cases vides:** `null` dans `Piece[][]`, ou une couleur sentinelle `EMPTY`. Les deux marchent. Null demande de la prudence. Un enum `Color` avec `EMPTY` clarifie parfois les tests.

### Algorithme de retournement (le noyau dur)

Huit vecteurs de direction:

```
(-1,-1) (-1,0) (-1,1)
( 0,-1)        ( 0,1)
( 1,-1) ( 1,0) ( 1,1)
```

Pour une case candidate `(r, c)` et la couleur `me`:

1. La case doit être dans les bornes et vide.
2. Pour chaque direction `d`:
   * Un pas: il faut au moins un pion adverse.
   * Continue tant que ce sont des pions adverses.
   * Si tu rencontres ensuite un pion de `me`, cette direction est une **ligne de capture**. Collecte les cases intermédiaires.
   * Si tu touches vide ou bord avant `me`, la direction échoue.
3. Si aucune direction n'a capturé, le coup est illégal.
4. Si légal: place `me` en `(r, c)`, retourne chaque adverse collecté, mets à jour les scores, change de tour.

Cette boucle est presque tout le jeu. L'UI n'est que du décor autour.

### Initialisation

Centre standard 8x8 (lignes/cols 0-based, taille `n = 8`):

```
(n/2-1, n/2-1) = WHITE
(n/2-1, n/2)   = BLACK
(n/2,   n/2-1) = BLACK
(n/2,   n/2)   = WHITE
```

Noir joue souvent en premier. Dis-le.

---

## 4. Solution Java (esquisse de conception)

Squelette pédagogique, pas un produit livré. L'important: propriété claire et flips corrects.

### Color et directions

```java
public enum Color {
    BLACK,
    WHITE,
    EMPTY;

    public Color opposite() {
        if (this == BLACK) return WHITE;
        if (this == WHITE) return BLACK;
        return EMPTY;
    }
}

/** Eight rays used by classic Othello / Reversi. */
public final class Directions {
    public static final int[][] DIRS = {
        {-1, -1}, {-1, 0}, {-1, 1},
        { 0, -1},          { 0, 1},
        { 1, -1}, { 1, 0}, { 1, 1}
    };

    private Directions() {}
}
```

### Piece

```java
public class Piece {
    private Color color;

    public Piece(Color color) {
        if (color == null || color == Color.EMPTY) {
            throw new IllegalArgumentException("piece needs BLACK or WHITE");
        }
        this.color = color;
    }

    public Color getColor() {
        return color;
    }

    public void flip() {
        color = color.opposite();
    }
}
```

### Board: placer, retourner, score

```java
import java.util.ArrayList;
import java.util.List;

public class Board {
    private final int size;
    private final Piece[][] grid;
    private int blackCount;
    private int whiteCount;

    public Board(int size) {
        if (size < 2 || size % 2 != 0) {
            throw new IllegalArgumentException("size should be even and >= 2");
        }
        this.size = size;
        this.grid = new Piece[size][size];
    }

    public void initialize() {
        // clear
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                grid[r][c] = null;
            }
        }
        blackCount = 0;
        whiteCount = 0;

        int m = size / 2;
        setPiece(m - 1, m - 1, Color.WHITE);
        setPiece(m - 1, m, Color.BLACK);
        setPiece(m, m - 1, Color.BLACK);
        setPiece(m, m, Color.WHITE);
    }

    private void setPiece(int r, int c, Color color) {
        grid[r][c] = new Piece(color);
        if (color == Color.BLACK) blackCount++;
        else whiteCount++;
    }

    public boolean inBounds(int r, int c) {
        return r >= 0 && r < size && c >= 0 && c < size;
    }

    public Color colorAt(int r, int c) {
        if (!inBounds(r, c) || grid[r][c] == null) return Color.EMPTY;
        return grid[r][c].getColor();
    }

    /**
     * Returns cells that would flip if me plays at (r, c).
     * Empty list means illegal move.
     */
    public List<int[]> capturesIfPlace(int r, int c, Color me) {
        List<int[]> all = new ArrayList<>();
        if (!inBounds(r, c) || grid[r][c] != null || me == Color.EMPTY) {
            return all;
        }
        Color opp = me.opposite();

        for (int[] d : Directions.DIRS) {
            int nr = r + d[0];
            int nc = c + d[1];
            List<int[]> line = new ArrayList<>();

            // need at least one opponent
            while (inBounds(nr, nc) && colorAt(nr, nc) == opp) {
                line.add(new int[] { nr, nc });
                nr += d[0];
                nc += d[1];
            }

            // line ends with our color
            if (!line.isEmpty() && inBounds(nr, nc) && colorAt(nr, nc) == me) {
                all.addAll(line);
            }
        }
        return all;
    }

    public boolean isLegalMove(int r, int c, Color me) {
        return !capturesIfPlace(r, c, me).isEmpty();
    }

    /** Place me at (r, c). Returns false if illegal. */
    public boolean place(int r, int c, Color me) {
        List<int[]> flips = capturesIfPlace(r, c, me);
        if (flips.isEmpty()) return false;

        grid[r][c] = new Piece(me);
        if (me == Color.BLACK) blackCount++;
        else whiteCount++;

        for (int[] cell : flips) {
            Piece p = grid[cell[0]][cell[1]];
            Color before = p.getColor();
            p.flip();
            // one less for opponent, one more for me
            if (before == Color.BLACK) {
                blackCount--;
                whiteCount++;
            } else {
                whiteCount--;
                blackCount++;
            }
        }
        return true;
    }

    public boolean hasAnyMove(Color me) {
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                if (isLegalMove(r, c, me)) return true;
            }
        }
        return false;
    }

    public int getScore(Color c) {
        if (c == Color.BLACK) return blackCount;
        if (c == Color.WHITE) return whiteCount;
        return 0;
    }

    public int getSize() {
        return size;
    }
}
```

### Player et Game

```java
public class Player {
    private final Color color;

    public Player(Color color) {
        this.color = color;
    }

    public Color getColor() {
        return color;
    }
}

public class Game {
    public enum State { RUNNING, BLACK_WINS, WHITE_WINS, DRAW }

    private final Board board;
    private final Player black;
    private final Player white;
    private Color turn;
    private State state;

    public Game(int size) {
        board = new Board(size);
        black = new Player(Color.BLACK);
        white = new Player(Color.WHITE);
        turn = Color.BLACK;
        state = State.RUNNING;
        board.initialize();
    }

    public Color getTurn() {
        return turn;
    }

    public State getState() {
        return state;
    }

    public Board getBoard() {
        return board;
    }

    /**
     * Current player tries (r, c).
     * Returns true if the disc was placed.
     */
    public boolean play(int r, int c) {
        if (state != State.RUNNING) return false;
        if (!board.place(r, c, turn)) return false;
        advanceTurnOrFinish();
        return true;
    }

    private void advanceTurnOrFinish() {
        Color next = turn.opposite();
        if (board.hasAnyMove(next)) {
            turn = next;
            return;
        }
        // opponent must pass
        if (board.hasAnyMove(turn)) {
            // same player moves again
            return;
        }
        // neither can move
        finish();
    }

    private void finish() {
        int b = board.getScore(Color.BLACK);
        int w = board.getScore(Color.WHITE);
        if (b > w) state = State.BLACK_WINS;
        else if (w > b) state = State.WHITE_WINS;
        else state = State.DRAW;
    }
}
```

### Petite séquence mentale

Après `initialize()` en 8x8, Noir joue une ouverture légale. `place` doit:

1. Rejeter les lignes vides qui n'enferment pas de blancs.
2. Retourner exactement les blancs pris en sandwich sur chaque rayon réussi.
3. Garder `blackCount + whiteCount` égal au nombre de pions sur le plateau.

Si plus tard Blanc n'a aucun coup mais Noir en a encore un, Noir rejoue. Si aucun des deux n'en a, appelle `finish()`.

---

## 5. Complexité

La taille `n` est 8 dans le vrai jeu, donc tout est constant en pratique. Si `n` est général:

| Opération | Temps | Espace |
| --- | --- | --- |
| `capturesIfPlace` | O(n) pire cas (8 rayons, chacun jusqu'à n pas) | O(n) liste de flips |
| `place` | O(n) | O(n) |
| `hasAnyMove` | O(n² · n) = O(n³) naïf | O(n) |
| Partie entière (au plus n² coups) | O(n⁵) avec hasAnyMove naïf à chaque tour | O(n²) plateau |

En entretien, dis: **8x8 est minuscule**. La correction des flips bat l'astuce asymptotique. S'ils poussent l'optimisation, précalcule les coups légaux après chaque place, ou ne parcours que les cases vides.

---

## 6. Cas limites et pièges

* **Jouer sur une case occupée:** illégal.
* **Jouer avec zéro flip:** illégal même si la case est vide.
* **Bords et coins:** moins de directions; la même boucle suffit.
* **Capture uniquement diagonale:** doit marcher si tu affirmes huit directions.
* **Passe quand l'adversaire ne peut pas mais toi oui:** la même couleur rejoue; ne termine pas trop tôt.
* **Les deux bloqués avec des cases vides:** la partie finit quand même; les vides ne se retournent pas tout seuls.
* **Score qui dérive:** en retournant, ajuste les deux compteurs. Facile de se tromper si tu n'incrémentes que le gagnant du flip.
* **Sous-classer Noir/Blanc:** à éviter; la couleur est un état, pas un type.
* **Oublier les diagonales** quand on attend le vrai Othello.
* **Coder en dur 10x10** sans demander; le standard est 8x8.

Erreurs fréquentes:

1. Retourner tout le rayon y compris les cases vides.
2. Retourner quand le rayon touche le bord sans ton pion de fermeture.
3. Autoriser un coup qui ne fait que "toucher" un adverse sans pion à toi au bout.
4. Terminer au premier passe au lieu de vérifier l'autre joueur.
5. Mettre toutes les règles uniquement dans `Player` pour que le plateau ne puisse plus valider de la même façon une IA ou un client réseau.

Idées de smoke minimales:

```java
Game g = new Game(8);
// center is set; try an illegal far corner
System.out.println(g.play(0, 0)); // false
// try a known legal opening for Black on standard setup
// (exact coordinates depend on your center convention; assert isLegalMove first)
Board b = g.getBoard();
for (int r = 0; r < 8; r++) {
    for (int c = 0; c < 8; c++) {
        if (b.isLegalMove(r, c, Color.BLACK)) {
            System.out.println("legal " + r + "," + c);
        }
    }
}
```

---

## 7. Recap à raconter à un ami

1. Othello, c'est sandwich et retournement sur une grille. Ton nouveau pion doit piéger des adverses en ligne droite contre un autre des tiens.
2. Modélise la **couleur comme donnée**, pas comme deux sous-classes à reconstruire à chaque flip.
3. `Board` possède la grille et le calcul des flips. `Game` possède les tours et la fin de partie.
4. Regarde huit directions. Une direction compte seulement si tu traverses un ou plusieurs adverses puis tu te retrouves toi-même.
5. Illégal = case vide avec zéro ligne de capture. Légal = placer, retourner, mettre à jour les scores.
6. Si l'adversaire n'a aucun coup, tu peux rejouer. Si personne n'en a, compare les compteurs.

Si tu peux dessiner la marche du rayon sur papier et nommer quelle classe le possède, tu maîtrises le 7.8. La conception objet ici, c'est surtout "mettre la logique de flip au même endroit et garder les règles de tour ennuyeuses."

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Chat Server](/blog/fr/ctci-7-7-chat-server)
* Suivant: [Circular Array](/blog/fr/ctci-7-9-circular-array)