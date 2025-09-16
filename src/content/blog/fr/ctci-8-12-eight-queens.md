---
title: "Huit dames: placer 8 dames sans s'attaquer avec backtracking (Java)"
description: "Problème style CTCI 8.12 pour débutants: place huit dames sur un échiquier 8x8 sans partager ligne, colonne ni diagonale. Placement ligne par ligne, contrôles de conflit et backtracking propre en Java."
date: "2025-09-16"
tags: [Algorithmes]
coverImage: /assets/images/ctci-8-12-eight-queens.webp
previewImage: /assets/images/ctci-8-12-eight-queens.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.12 pour débutants: place huit dames sur un échiquier 8x8 sans partager ligne, colonne ni diagonale. Placement ligne par ligne, contrôles de conflit et backtracking propre en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Une dame d'échecs mange tout sur sa **ligne**, sa **colonne** ou l'une des deux **diagonales**. Place huit dames sur un échiquier 8x8 de façon qu'aucune ne puisse en capturer une autre. C'est le puzzle classique des **huit dames**, et en entretien c'est la façon la plus claire de montrer que tu sais faire du **backtracking**: tu essaies un placement, tu descends, tu annules quand tu es bloqué.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions de récursion en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide).

---

## 1. Analogie du quotidien

Imagine huit managers qui doivent s'asseoir à huit bureaux dans une grille de salles. Chaque manager exige:

* personne d'autre sur mon **étage** (ligne),
* personne d'autre dans mon **couloir** (colonne),
* personne d'autre sur l'un des **couloirs en diagonale** qui croisent mon bureau.

Tu avances **ligne par ligne** (ou colonne par colonne; même idée). Sur la ligne 0 tu essaies chaque colonne. Pour chaque essai tu passes à la ligne 1 et tu testes chaque colonne libre et non attaquante. Quand une ligne n'a plus de colonne légale, tu reviens d'une ligne et tu changes ce choix plus tôt. Quand les huit lignes sont remplies, tu as un plan complet. Tu continues pour lister **tous** les plans valides.

Ce chemin annuler-et-réessayer est le backtracking. Tu ne génères pas d'abord les 8! permutations de colonnes pour filtrer ensuite si tu peux élaguer plus tôt.

---

## 2. Problème en mots simples

**Entrée:** taille du plateau `n` (cas classique: `n = 8`).

**Sortie:** toutes les façons de placer `n` dames sur un plateau `n x n` sans qu'aucune n'en attaque une autre. Attaquer signifie même ligne, même colonne ou même diagonale.

**Que renvoyer en code:**

* Une liste de solutions. Chacune peut être un tableau d'indices de colonne par ligne, ou une liste de chaînes du plateau (style LeetCode), ou des plateaux imprimés. Choisis et dis-le.
* Le nombre de solutions est un bon suivi (`92` pour `n = 8`).

**Règles importantes:**

* Les dames attaquent à toute distance sur ligne, colonne et les deux diagonales (sans bloqueurs).
* Exactement une dame par solution sur chaque ligne **et** chaque colonne si tu utilises l'optimisation habituelle (voir plus bas). Tu n'as jamais besoin de deux sur la même ligne.
* Un plateau vide n'est pas une solution pour `n > 0`. Il faut placer les `n` dames.

**Petit exemple (`n = 4`):** il y a exactement 2 solutions (selon l'affichage). Une d'elles:

```
. Q . .
. . . Q
Q . . .
. . Q .
```

Aucune dame ne partage ligne, colonne ou diagonale. Pour `n = 8` il y a **92** solutions distinctes (12 si tu ignores les symétries du plateau).

**À clarifier avant de coder:**

* `n = 8` fixe ou `n` général? Écris le général; démo avec 8.
* Tous les plateaux ou seulement le compte? Tous, c'est la demande classique.
* Représentation? `int[] columns` avec `columns[row] = col` suffit pour la logique; joli affichage ensuite.
* Lignes et colonnes indexées à 0? Oui en code.

---

## 3. Réfléchir d'abord

### La force brute est énorme

Il y a `C(64, 8)` façons de choisir 8 cases, ou `64 P 8` si l'ordre compte. La plupart sont illégales. Il faut de la structure.

### Une dame par ligne (et par colonne)

Si deux dames partagent une ligne, elles s'attaquent. Une solution est donc une **permutation** de colonnes pour les lignes `0 .. n-1`: la ligne `r` a exactement une dame en colonne `columns[r]`, et tous les `columns[r]` sont distincts.

Cela ramène la recherche à au plus `n!` permutations, et les diagonales filtrent encore la plupart.

Tu peux placer **ligne par ligne** ou **colonne par colonne**. Même idée. Ce billet place par **ligne**: pour la ligne `r`, essaie chaque colonne `c`.

### Ce que signifie "sous attaque"

Quand tu essaies une dame en `(row, col)`, chaque dame antérieure en `(r2, c2)` avec `r2 < row` ne doit pas l'attaquer:

1. **Même colonne:** `col == c2`
2. **Même diagonale:** `|col - c2| == |row - r2|`  
   (même distance vers le bas et sur le côté)

La même ligne n'arrive pas si tu places une dame par ligne.

### Squelette de backtracking

```
place(row):
  if row == n:
    enregistre une copie de columns
    return
  for col in 0 .. n-1:
    if isSafe(row, col):
      columns[row] = col
      place(row + 1)
      // pas besoin d'annuler explicitement si l'écriture suivante écrase columns[row]
```

`isSafe` ne regarde que les lignes `0 .. row-1`.

### Contrôles plus rapides (optionnel)

Parcourir les dames précédentes coûte `O(n)` par essai. Tu peux garder trois tableaux booléens pour des contrôles O(1):

| Tableau | Marque | Idée d'index |
| --- | --- | --- |
| `usedCol[c]` | colonne prise | `c` |
| `usedDiag1[d]` | une famille de diagonales | `row - col + (n - 1)` |
| `usedDiag2[d]` | l'autre famille | `row + col` |

Active les trois drapeaux à la pose, efface-les au retour arrière. Mêmes solutions; meilleures constantes. Les deux versions passent en entretien. Commence par le scan simple; cite les tableaux s'ils demandent d'accélérer.

### Pourquoi du backtracking, pas du DP pur

Tu as besoin de **chaque placement complet valide**, pas d'un seul score max. Les états se ramifient et les plateaux partiels illégaux meurent tôt. C'est de la recherche avec élagage, pas une table DP classique.

### Croquis tableau pour `n = 4`

1. Ligne 0, essaie col 0. Place.
2. Ligne 1: col 0 bloquée (colonne). col 1 bloquée (diagonale). Essaie col 2.
3. Ligne 2: beaucoup de cases bloquées; peut-être impasse.
4. Annule ligne 1, essaie col 3, continue.
5. Tu finis par les deux plateaux complets. Compte = 2.

Dire ça à voix haute montre que tu comprends élaguer et réessayer, pas seulement "récursion d'une façon ou d'une autre."

---

## 4. Solution Java

Version pédagogique: `n` général, une dame par ligne, validation contre les dames antérieures, cartes de colonnes et plateaux string optionnels.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * n-queens via backtracking.
 * columns[row] = column of the queen in that row.
 */
public class EightQueens {
    private final int n;
    private final List<int[]> placements = new ArrayList<>();

    public EightQueens(int n) {
        if (n < 1) {
            throw new IllegalArgumentException("n must be positive");
        }
        this.n = n;
    }

    /** All solutions as column arrays (length n). */
    public List<int[]> solvePlacements() {
        placements.clear();
        int[] columns = new int[n];
        Arrays.fill(columns, -1);
        place(0, columns);
        return new ArrayList<>(placements);
    }

    /** LeetCode-style boards: list of strings with 'Q' and '.'. */
    public List<List<String>> solveBoards() {
        List<List<String>> boards = new ArrayList<>();
        for (int[] cols : solvePlacements()) {
            boards.add(toBoard(cols));
        }
        return boards;
    }

    private void place(int row, int[] columns) {
        if (row == n) {
            placements.add(columns.clone());
            return;
        }
        for (int col = 0; col < n; col++) {
            if (isSafe(columns, row, col)) {
                columns[row] = col;
                place(row + 1, columns);
                // columns[row] will be overwritten on the next try
            }
        }
    }

    /** True if (row, col) does not attack any queen in rows 0 .. row-1. */
    private boolean isSafe(int[] columns, int row, int col) {
        for (int r = 0; r < row; r++) {
            int c = columns[r];
            if (c == col) {
                return false; // same column
            }
            // same diagonal: equal row distance and column distance
            if (Math.abs(c - col) == row - r) {
                return false;
            }
        }
        return true;
    }

    private List<String> toBoard(int[] columns) {
        List<String> board = new ArrayList<>(n);
        for (int r = 0; r < n; r++) {
            char[] line = new char[n];
            Arrays.fill(line, '.');
            line[columns[r]] = 'Q';
            board.add(new String(line));
        }
        return board;
    }

    public static void main(String[] args) {
        EightQueens eq = new EightQueens(8);
        List<int[]> all = eq.solvePlacements();
        System.out.println("solutions for n=8: " + all.size()); // 92

        EightQueens four = new EightQueens(4);
        List<List<String>> boards = four.solveBoards();
        System.out.println("solutions for n=4: " + boards.size()); // 2
        for (List<String> b : boards) {
            for (String row : b) {
                System.out.println(row);
            }
            System.out.println();
        }
    }
}
```

Le premier parcours pour `n = 4` dépend de l'ordre des colonnes, mais les deux plateaux valides apparaissent.

| Étape | Action | Notes |
| --- | --- | --- |
| départ | `place(0)` | essaie cols 0..3 pour la ligne 0 |
| place | set `columns[0]`, appelle `place(1)` | ligne plus profonde |
| refuse | `isSafe` false | même colonne ou diagonale |
| accepte complet | `row == n` | clone `columns` dans les résultats |
| continue | prochain `col` à la ligne courante | autres branches |
| fin | boucles épuisées | `n=4` → 2, `n=8` → 92 |

Variante drapeaux O(1) (esquisse):

```java
// usedCol[c], diag1[row - col + n - 1], diag2[row + col]
private void placeFast(int row, int[] columns,
                       boolean[] usedCol, boolean[] d1, boolean[] d2) {
    if (row == n) {
        placements.add(columns.clone());
        return;
    }
    for (int col = 0; col < n; col++) {
        int i1 = row - col + n - 1;
        int i2 = row + col;
        if (usedCol[col] || d1[i1] || d2[i2]) {
            continue;
        }
        usedCol[col] = d1[i1] = d2[i2] = true;
        columns[row] = col;
        placeFast(row + 1, columns, usedCol, d1, d2);
        usedCol[col] = d1[i1] = d2[i2] = false; // backtrack
    }
}
```

Même arbre de décisions. Les drapeaux rendent "cette case est-elle libre?" en temps constant.

---

## 5. Tableau de complexité

| Élément | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Arbre de recherche complet | borne O(n!) | O(n) récursion + O(n) columns | l'élagage coupe la plupart des branches |
| Version scan de `isSafe` | O(n) par candidat | O(1) hors columns | simple à coder et expliquer |
| Version tableaux de flags | O(1) par candidat | O(n) pour trois boolean[] | même recherche externe |
| Taille de sortie | Θ(S · n) à la copie | Θ(S · n) | S = nombre de solutions (92 pour n=8) |
| `n = 8` en pratique | petit | petit | finit instantanément sur un laptop |

L'interviewer veut que tu forces une dame par ligne, que tu vérifies colonnes et diagonales, et que tu clones le plateau en enregistrant une solution (pas le tableau mutable vivant).

---

## 6. Cas limites et erreurs fréquentes

Les interviewers touchent à ça:

* **`n = 1`:** une solution, une seule dame. Pas de cas spécial sauf demande.
* **`n = 2` et `n = 3`:** zéro solution. Liste vide correcte.
* **`n = 4`:** exactement 2. Bon test de fumée.
* **`n = 8`:** 92 solutions. Un autre nombre = contrôle de diagonale probablement faux.
* **Stocker le tableau vivant `columns`** dans la liste de résultats sans `clone()`. Chaque entrée finit comme la dernière permutation.
* **Oublier la valeur absolue sur la diagonale** ou ne regarder qu'une direction.
* **Autoriser deux dames dans une colonne** parce que tu n'as vérifié que les diagonales.
* **Off-by-one sur les index de flags** pour `row - col + n - 1` (doit rester non négatif).
* **Muter le plateau en itérant les résultats** après la recherche.

Erreurs courantes:

1. **Placer librement sur les 64 cases** sans une par ligne. Le code gonfle et embrouille.
2. **Ne vérifier que les cases adjacentes.** Les dames attaquent à toute distance.
3. **Réutiliser la même référence** liste/tableau pour chaque solution.
4. **Pas d'annulation sur les tableaux de flags.** Une colonne marquée used ne se libère jamais.
5. **Compter les symétries comme réponse principale** alors qu'on demandait tous les plateaux distincts (92, pas 12).
6. **Renvoyer seulement de jolis plateaux** sans prouver le compte pour `n = 8`.

Idée minimale de smoke:

```java
assert new EightQueens(1).solvePlacements().size() == 1;
assert new EightQueens(2).solvePlacements().size() == 0;
assert new EightQueens(3).solvePlacements().size() == 0;
assert new EightQueens(4).solvePlacements().size() == 2;
assert new EightQueens(8).solvePlacements().size() == 92;
```

---

## 7. Résumé à raconter à un ami

Huit dames demande: place huit dames sur un échiquier sans qu'elles s'attaquent.

1. Place **une dame par ligne**. Le choix par ligne est quelle **colonne**.
2. Les colonnes doivent toutes différer. Les diagonales ne doivent pas s'aligner (`|Δcol| == |Δrow|`).
3. **Backtrack:** essaie une colonne, récure sur la ligne suivante, annule et essaie la suivante quand tu es bloqué ou après avoir enregistré un plateau complet.
4. Enregistre une **copie** de chaque placement complet. Pour `n = 8` tu dois trouver **92** façons.
5. Accélération optionnelle: tableaux booléens pour colonnes utilisées et les deux familles de diagonales, chaque essai valide en O(1).

Si tu peux croquer `n = 4`, montrer un placement partiel raté, et expliquer pourquoi cloner le tableau solution compte, tu maîtrises le 8.12. La récursion ici n'est pas de la "mémoïsation magique." C'est une recherche disciplinée avec annulation.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Coins](/blog/fr/ctci-8-11-coins)
* Suivant: [Stack of Boxes](/blog/fr/ctci-8-13-stack-of-boxes)