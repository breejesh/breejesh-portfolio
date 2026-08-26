---
title: "Dominos: Pourquoi un échiquier mutilé ne se paves pas (Java)"
description: "Problème style CTCI 6.3 pour débutants: plateau 8x8 sans deux coins opposés, 31 dominos. L'invariant de coloration prouve l'impossibilité. Comptes, croquis et visualisation Java optionnelle."
date: "2025-11-20"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-3-dominos.webp
previewImage: /assets/images/ctci-6-3-dominos.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 6.3 pour débutants: plateau 8x8 sans deux coins opposés, 31 dominos. L'invariant de coloration prouve l'impossibilité. Comptes, croquis et visualisation Java optionnelle.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un échiquier 8x8 a 64 cases. Enlève deux coins opposés et il en reste 62. Un domino couvre deux cases adjacentes. Donc 31 dominos couvriraient exactement 62 cases **si** un pavage existait. La question d'entretien est simple: **existe-t-il?**

La réponse surprenante est **non**. Pas parce que tu as raté une disposition maligne, mais parce qu'un **argument de coloration** montre que toute disposition est condamnée. Pas besoin d'essayer tous les pavages.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de problèmes que les classiques de maths et logique en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 6, puzzles de maths et logique, problème 6.3.

---

## 1. Analogie du quotidien

Imagine un sol de cuisine en damier, carreaux noirs et blancs en alternance. Toi et un ami avez chacun de la colle d'une seule couleur. Chaque tapis en forme de domino doit reposer sur **un carreau noir et un blanc**, car un domino, c'est deux cases côte à côte, et sur une coloration standard les cases voisines ont toujours des couleurs différentes.

Quelqu'un arrache **deux carreaux noirs** aux coins opposés et te donne 31 tapis. Tu as encore plus de blancs que de noirs. Chaque tapis enlève une case de chaque couleur. Tu manques d'abord de noirs, avec deux blancs restants et aucun tapis légal pour deux blancs. Toute la preuve, racontée comme un chantier de sol.

---

## 2. Énoncé en mots simples

**Mise en place:**

* Un échiquier **8x8** (64 cases).
* **Enlève deux coins opposés.** Sur un plateau standard ces coins partagent une couleur (tous deux "noirs" ou tous deux "blancs", selon ce que tu appelles noir).
* Tu as **31 dominos**. Chacun couvre **exactement deux cases adjacentes** (partagent un côté, pas seulement un coin).

**Question:** Les 31 dominos peuvent-ils couvrir chaque case restante sans chevauchement ni trou?

**Sortie du raisonnement (ce que veulent les interviewers):** un **oui ou non** clair, plus une **preuve**, pas une recherche à moitié finie.

**Nombres qui comptent:**

| Quantité | Valeur |
| --- | --- |
| Cases du plateau complet | 64 |
| Cases après deux retraits | 62 |
| Dominos pour une couverture totale | 31 |
| Cases noires en coloration standard | 32 |
| Cases blanches en coloration standard | 32 |
| Coins opposés retirés | 2 de la **même** couleur |
| Compte restant par couleur | 30 d'une couleur, 32 de l'autre |

**Clarifie avant de "résoudre":**

* Adjacent veut dire partage d'un côté? (Oui.)
* Les dominos peuvent tourner? (Horizontal ou vertical, les deux vont.)
* Seulement les coins opposés, ou n'importe quel couple? (Énoncé classique: opposés. Les coins adjacents ont des couleurs différentes; cette variante est une autre question.)
* Le plateau est-il toujours peint en damier? (Tu peux choisir cette coloration. C'est un outil de preuve, pas une peinture obligatoire du plateau physique.)

---

## 3. Réfléchis d'abord

### Envies naïves: chercher un pavage

Tu pourrais backtracker: placer un domino, récursiver, annuler. Sur 62 cases la recherche est grosse si tu ne gères pas les symétries. Ici on ne veut pas un solveur général d'exact cover. On veut l'invariant.

### Mieux: invariant de parité / coloration

Colorie le plateau comme un échiquier:

```
(r + c) even  -> black   (or white; pick one convention and stick to it)
(r + c) odd   -> white
```

Deux cases qui partagent un côté diffèrent de 1 sur exactement une coordonnée. Donc l'une a `r+c` pair, l'autre impair. **Chaque domino couvre un noir et un blanc.**

Un pavage parfait de 31 dominos couvrirait **31 noirs et 31 blancs**.

De quelle couleur sont les coins opposés?

Coins d'un 8x8 (lignes et colonnes 0-indexées `0..7`):

```
(0,0)  r+c = 0  even
(0,7)  r+c = 7  odd
(7,0)  r+c = 7  odd
(7,7)  r+c = 14 even
```

Paires opposées:

* `(0,0)` et `(7,7)`: les deux **pairs** (même couleur).
* `(0,7)` et `(7,0)`: les deux **impairs** (même couleur).

Enlève deux coins opposés et tu enlèves **deux cases d'une seule couleur**. Il reste **30 de cette couleur et 32 de l'autre**.

31 dominos voudraient 31+31. Tu as 30+32. **Impossible.**

### Ce que la preuve est et n'est pas

* C'est un argument de **condition nécessaire**: s'il existait un pavage, le compte noir égalerait le blanc. Ce n'est pas le cas. Donc pas de pavage.
* Elle **ne** dit **pas** "tout plateau avec autant de noirs que de blancs se pave." L'égalité est nécessaire, pas toujours suffisante. Ici l'inégalité suffit à tuer le problème.

### Contraste: enlever deux cases de couleurs différentes

Si tu enlèves un noir et un blanc (par exemple deux coins adjacents), les comptes restent 31 et 31. L'argument de coloration n'interdit plus un pavage. En fait beaucoup de ces plateaux **peuvent** se paver. C'est pourquoi "opposés" porte le sens de l'énoncé.

---

## 4. Solution Java (aides au raisonnement + croquis optionnel)

Pas besoin de code de prod pour la preuve. Quand même, un petit helper Java qui colorie le plateau, retire les coins opposés et imprime les comptes rend l'invariant concret dans un IDE d'entretien.

```java
public final class DominosBoard {
    private static final int N = 8;

    /** Color: 0 = black (even r+c), 1 = white (odd r+c). */
    public static int color(int r, int c) {
        return (r + c) & 1;
    }

    /**
     * Count remaining black (0) and white (1) after removing two opposite corners.
     * pair 0: (0,0) and (N-1,N-1); pair 1: (0,N-1) and (N-1,0).
     */
    public static int[] remainingColorCounts(int oppositePair) {
        boolean[][] removed = new boolean[N][N];
        if (oppositePair == 0) {
            removed[0][0] = true;
            removed[N - 1][N - 1] = true;
        } else {
            removed[0][N - 1] = true;
            removed[N - 1][0] = true;
        }

        int black = 0;
        int white = 0;
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                if (removed[r][c]) {
                    continue;
                }
                if (color(r, c) == 0) {
                    black++;
                } else {
                    white++;
                }
            }
        }
        return new int[] {black, white};
    }

    /** True only if remaining black == remaining white (necessary for any domino tiling). */
    public static boolean colorCountsAllowTiling(int oppositePair) {
        int[] counts = remainingColorCounts(oppositePair);
        return counts[0] == counts[1];
    }

    /** ASCII board: B/W for colors, . for removed. */
    public static String sketch(int oppositePair) {
        boolean[][] removed = new boolean[N][N];
        if (oppositePair == 0) {
            removed[0][0] = true;
            removed[N - 1][N - 1] = true;
        } else {
            removed[0][N - 1] = true;
            removed[N - 1][0] = true;
        }

        StringBuilder sb = new StringBuilder();
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                if (removed[r][c]) {
                    sb.append('.');
                } else {
                    sb.append(color(r, c) == 0 ? 'B' : 'W');
                }
                if (c + 1 < N) {
                    sb.append(' ');
                }
            }
            if (r + 1 < N) {
                sb.append('\n');
            }
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        for (int pair = 0; pair <= 1; pair++) {
            int[] counts = remainingColorCounts(pair);
            System.out.println("pair=" + pair
                    + " black=" + counts[0]
                    + " white=" + counts[1]
                    + " allowTiling=" + colorCountsAllowTiling(pair));
            System.out.println(sketch(pair));
            System.out.println();
        }
        // pair=0 black=30 white=32 allowTiling=false
        // pair=1 black=32 white=30 allowTiling=false
    }
}
```

### Optionnel: backtracking naïf (montre que la recherche échoue; pas requis)

Pour contraster "recherche" et "preuve", un petit solveur sur un plateau **plus petit** suffit en démo. Le 8x8 mutilé s'essouffle sans bons élagages. Le point de l'entretien: tu ne **devrais pas** avoir besoin de cette recherche.

```java
// Illustration only: try to tile a board represented as free cells.
// Returns true if some complete domino cover exists.
static boolean canTile(boolean[][] free) {
    int r = -1, c = -1;
    outer:
    for (int i = 0; i < free.length; i++) {
        for (int j = 0; j < free[i].length; j++) {
            if (free[i][j]) {
                r = i;
                c = j;
                break outer;
            }
        }
    }
    if (r < 0) {
        return true; // no free cells left: success
    }

    // place horizontal
    if (c + 1 < free[r].length && free[r][c + 1]) {
        free[r][c] = false;
        free[r][c + 1] = false;
        if (canTile(free)) {
            return true;
        }
        free[r][c] = true;
        free[r][c + 1] = true;
    }
    // place vertical
    if (r + 1 < free.length && free[r + 1][c]) {
        free[r][c] = false;
        free[r + 1][c] = false;
        if (canTile(free)) {
            return true;
        }
        free[r][c] = true;
        free[r + 1][c] = true;
    }
    return false;
}
```

Pour le 8x8 mutilé, `colorCountsAllowTiling` renvoie déjà false, donc tu peux ignorer `canTile`.

---

## 5. Parcours des cas classiques

### Cas A: coins opposés `(0,0)` et `(7,7)`

Les deux ont `r+c` pair (noirs dans notre convention).

```
Full board:  32 B, 32 W
Remove 2 B:  30 B, 32 W
Dominos need equal counts per color → impossible
```

### Cas B: coins opposés `(0,7)` et `(7,0)`

Les deux impairs (blancs).

```
Remove 2 W:  32 B, 30 W
Still unequal → impossible
```

### Cas C: mini-plateau mental 2x2, enlever les coins opposés

```
B W
W B
```

Enlève les deux B: restent deux W en diagonale. Aucune paire ne partage un côté. Deux cases de même couleur qui ne se touchent qu'en coin ne prennent pas de domino. Même invariant, dessin plus petit.

### Cas D: enlever un noir et un blanc

Comptes: 31 B, 31 W. La coloration n'interdit plus un pavage. Beaucoup de configurations marchent. Dis-le à voix haute pour montrer que tu connais la frontière de l'argument.

### Test rapide

```java
public static void main(String[] args) {
    int[] a = DominosBoard.remainingColorCounts(0);
    int[] b = DominosBoard.remainingColorCounts(1);
    assert a[0] + a[1] == 62;
    assert b[0] + b[1] == 62;
    assert a[0] != a[1];
    assert b[0] != b[1];
    assert !DominosBoard.colorCountsAllowTiling(0);
    assert !DominosBoard.colorCountsAllowTiling(1);
    System.out.println("counts invariant ok");
}
```

---

## 6. Complexité, bords, conseils d'entretien

| Sujet | Réponse |
| --- | --- |
| Décision pour cette instance | Impossible (pas de pavage) |
| Outil de preuve | Coloration d'échiquier; chaque domino prend un noir + un blanc |
| Après retrait des coins opposés | 30 d'une couleur, 32 de l'autre |
| Temps avec la preuve | Raisonnement O(1); O(n²) si tu parcours un plateau n×n pour compter |
| Espace extra pour un croquis | O(n²) avec plateau explicite, ou O(1) si tu raisons seulement |
| Alternative par recherche | Backtracking exponentiel; inutile une fois l'invariant cassé |

**Erreurs fréquentes:**

1. **Chercher une disposition spéciale** au lieu d'un invariant.
2. **Oublier que les coins opposés sont de même couleur.** Dessine les quatre coins et marque les couleurs d'abord.
3. **Dire "62 est pair donc ça marche."** La taille paire est nécessaire pour des dominos, pas suffisante.
4. **Affirmer qu'égal noir/blanc pave toujours.** Nécessaire, pas suffisant. Ici tu n'as besoin que de la nécessité.
5. **Confondre opposés et adjacents.** Les adjacents ont des couleurs différentes; le piège classique utilise les opposés.
6. **Trop coder.** Une preuve correcte en deux minutes bat un solveur cassé en trente.

**Comment le dire (version 30 secondes):**

1. Colorie le plateau noir/blanc.
2. Chaque domino couvre un de chaque.
3. Les coins opposés sont de la même couleur, donc le retrait laisse 30 et 32.
4. Donc 31 dominos ne peuvent pas couvrir le plateau.

**Où l'idée revient plus tard:**

* Arguments d'invariant dans les puzzles (équilibre, parité, arithmétique modulaire).
* Intuition de matching: les dominos sont des arêtes d'un graphe biparti noir vs blanc; parties inégales → pas de matching parfait.
* Autres questions de plateaux "mutilés" et de pavage en entretien.

---

## 7. Résumé à raconter à un ami

Dominos (problème 6.3) est un problème de **logique**, pas une usine à code.

1. Plateau 8x8, deux coins opposés enlevés: 62 cases, donc 31 dominos iraient juste au compte.
2. Colorie le plateau. Les cases adjacentes ont toujours des couleurs différentes.
3. Chaque domino couvre un noir et un blanc.
4. Les coins opposés sont de la **même** couleur, donc tu enlèves deux d'une couleur.
5. Il reste 30 et 32. Un pavage complet voudrait 31 et 31. Impossible.

Si tu marques les quatre coins, énonces le fait de même couleur, et termines avec le compte 30/32, tu possèdes le problème 6.3. Pas besoin de poser un seul domino sur la feuille.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Basketball](/blog/fr/ctci-6-2-basketball)
* Suivant: [Ants on a Triangle](/blog/fr/ctci-6-4-ants-on-a-triangle)