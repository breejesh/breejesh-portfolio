---
title: "CTCI 1.8 Zero Matrix: mettre lignes et colonnes à zéro en place (Java)"
description: "Si une case vaut 0, mettez toute sa ligne et sa colonne à 0. Force brute d'abord, puis O(1) d'espace extra avec drapeaux sur la première ligne et colonne en Java."
date: "2025-10-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-8-zero-matrix.webp
previewImage: /assets/images/ctci-1-8-zero-matrix.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Si une case vaut 0, mettez toute sa ligne et sa colonne à 0. Force brute d'abord, puis O(1) d'espace extra avec drapeaux sur la première ligne et colonne en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Imaginez le plan de salle d'un théâtre. Si un siège est cassé, vous fermez toute la rangée et toute la colonne pour que personne ne s'assoie sur ce croisement. Le plan est une matrice d'entiers. Un zéro veut dire "cassé". Votre travail est d'appliquer chaque règle de siège cassé **en place**, sans construire un second plan complet si vous pouvez l'éviter.

C'est le problème style **Cracking the Coding Interview** **1.8 Zero Matrix**, du Chapitre 1 (Arrays and Strings). Partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Explication et code originaux, pas un copier-coller du livre.

---

## Le problème en mots simples

**Entrée:** une matrice `M x N` d'entiers (souvent `int[][]` en Java).

**Sortie:** modifier la matrice pour que si `matrix[i][j] == 0`, alors chaque entrée de la ligne `i` et chaque entrée de la colonne `j` devienne `0`.

**Règles qui comptent:**

* Faites-le **en place** si on le demande (relance très fréquente).
* Plusieurs zéros peuvent partager une ligne ou une colonne. Mettre à zéro deux fois est correct; le résultat doit ressembler à l'application de toutes les règles.
* Les zéros que vous écrivez en nettoyant ne doivent pas créer de **nouvelles** règles de "zéro d'origine". C'est le piège classique.

Exemple:

```
Avant:                  Après:
1  2  3  0              0  0  0  0
5  6  7  8       →      5  6  7  0
9  0 11 12              0  0  0  0
```

La ligne 0 a un zéro en colonne 3. La ligne 2 a un zéro en colonne 1. Les lignes 0 et 2 meurent, ainsi que les colonnes 1 et 3.

---

## Comment réfléchir avant de coder

### Force brute (et pourquoi elle échoue)

Vous parcourez pour trouver des zéros et, dès que vous en trouvez un, vous mettez tout de suite sa ligne et sa colonne à zéro.

**Bug:** vous transformez des non-zéros en zéros en plein parcours. Ensuite vous traitez ces nouveaux zéros comme des originaux et vous effacez la moitié de la matrice par accident.

### Mieux: deux passes avec des tableaux extra

1. Première passe: notez quelles lignes et quelles colonnes doivent être mises à zéro. Utilisez `boolean[] zeroRow` de longueur `M` et `boolean[] zeroCol` de longueur `N`.
2. Deuxième passe: pour chaque case `(r, c)`, si `zeroRow[r]` ou `zeroCol[c]`, écrivez `0`.

Temps `O(MN)`. Espace extra `O(M + N)`. C'est la réponse d'entretien propre s'ils n'exigent pas l'espace constant.

### Préférée: O(1) d'espace extra avec la première ligne et la première colonne

La matrice elle-même peut stocker les drapeaux.

* Utilisez la **ligne 0** comme drapeaux de colonnes: si la colonne `c` doit être annulée, mettez `matrix[0][c] = 0`.
* Utilisez la **colonne 0** comme drapeaux de lignes: si la ligne `r` doit être annulée, mettez `matrix[r][0] = 0`.
* La case `matrix[0][0]` appartient aux deux. Gardez deux booléens, `firstRowHasZero` et `firstColHasZero`, pour savoir si la ligne 0 et la colonne 0 doivent elles-mêmes être mises à zéro.

L'ordre compte:

1. Parcourez seulement la première ligne et la première colonne pour fixer les deux booléens.
2. Parcourez le reste de la matrice (`r >= 1`, `c >= 1`). Sur un zéro, marquez `matrix[r][0] = 0` et `matrix[0][c] = 0`.
3. Deuxième passe sur l'intérieur: si `matrix[r][0] == 0` ou `matrix[0][c] == 0`, mettez `matrix[r][c] = 0`.
4. **En dernier**, mettez la première ligne à zéro si besoin, puis la première colonne. Faites-le en dernier pour ne pas effacer les drapeaux trop tôt.

Tout le truc est là: stocker la comptabilité dans le bord, appliquer l'intérieur d'abord, corriger le bord à la fin.

---

## Solution Java (O(1) d'espace extra)

```java
public final class ZeroMatrix {

    private ZeroMatrix() {}

    /**
     * If any cell is 0, set its entire row and column to 0.
     * Mutates matrix in place. O(1) extra space via first row/col flags.
     */
    public static void setZeros(int[][] matrix) {
        if (matrix == null || matrix.length == 0 || matrix[0].length == 0) {
            return;
        }

        int rows = matrix.length;
        int cols = matrix[0].length;

        boolean firstRowHasZero = false;
        boolean firstColHasZero = false;

        // Does row 0 already contain a zero?
        for (int c = 0; c < cols; c++) {
            if (matrix[0][c] == 0) {
                firstRowHasZero = true;
                break;
            }
        }

        // Does column 0 already contain a zero?
        for (int r = 0; r < rows; r++) {
            if (matrix[r][0] == 0) {
                firstColHasZero = true;
                break;
            }
        }

        // Use first row / first col as flags for the rest of the matrix.
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (matrix[r][c] == 0) {
                    matrix[r][0] = 0;
                    matrix[0][c] = 0;
                }
            }
        }

        // Zero interior cells based on flags.
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (matrix[r][0] == 0 || matrix[0][c] == 0) {
                    matrix[r][c] = 0;
                }
            }
        }

        // Zero first row last (it held column flags).
        if (firstRowHasZero) {
            for (int c = 0; c < cols; c++) {
                matrix[0][c] = 0;
            }
        }

        // Zero first column last (it held row flags).
        if (firstColHasZero) {
            for (int r = 0; r < rows; r++) {
                matrix[r][0] = 0;
            }
        }
    }
}
```

Variante optionnelle plus claire en espace `O(M + N)` (même idée, tableaux de drapeaux séparés):

```java
public static void setZerosWithFlagArrays(int[][] matrix) {
    if (matrix == null || matrix.length == 0 || matrix[0].length == 0) {
        return;
    }
    int rows = matrix.length;
    int cols = matrix[0].length;
    boolean[] zeroRow = new boolean[rows];
    boolean[] zeroCol = new boolean[cols];

    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (matrix[r][c] == 0) {
                zeroRow[r] = true;
                zeroCol[c] = true;
            }
        }
    }

    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (zeroRow[r] || zeroCol[c]) {
                matrix[r][c] = 0;
            }
        }
    }
}
```

En entretien, commencez par les tableaux de drapeaux pour que l'idée soit évidente, puis compressez les drapeaux dans la première ligne et la première colonne quand on demande l'espace constant.

---

## Complexité

| Approche | Temps | Espace extra |
| --- | --- | --- |
| Mise à zéro immédiate pendant le parcours | `O(MN)` au pire, mais incorrect | `O(1)` |
| Tableaux de drapeaux | `O(MN)` | `O(M + N)` |
| Drapeaux première ligne / première col | `O(MN)` | `O(1)` |

Vous devez regarder chaque case au moins une fois, donc le temps `O(MN)` est attendu. Le combat porte sur l'espace et sur le fait de ne pas empoisonner le parcours avec les zéros que vous venez d'écrire.

---

## Cas limites que les interviewers testent

* **Matrice nulle ou vide.** Retournez sans planter.
* **1 x 1.** `[0]` reste `[0]`. `[5]` reste `[5]`.
* **Une seule ligne ou une seule colonne.** Les drapeaux première ligne / première col marchent encore; les boucles intérieures ne font rien.
* **Zéro uniquement en `matrix[0][0]`.** Les deux booléens deviennent true. Toute la première ligne et toute la première colonne se vident. L'intérieur peut rester s'il n'y a pas d'autres zéros.
* **Toutes les cases déjà à zéro.** Le résultat est tout zéro. Correct.
* **Aucun zéro.** La matrice ne change pas. Le parcours coûte encore `O(MN)`.
* **Rectangulaire, pas carrée.** Le code utilise `rows` et `cols` séparément. N'assumez jamais un carré.
* **Négatifs et positifs.** Seul `0` déclenche. N'importez pas des idées "falsy" d'autres langages.

---

## Erreurs courantes

1. **Mettre à zéro pendant la passe de découverte.** Crée de faux zéros d'origine.
2. **Effacer la première ligne ou la première colonne avant de les utiliser comme drapeaux.** Vous perdez la carte.
3. **Oublier les deux booléens** et surcharger `matrix[0][0]` pour "la ligne 0 meurt" et "la col 0 meurt" sans soin.
4. **Assumer une matrice carrée** et utiliser une seule longueur pour les deux dimensions.
5. **Renvoyer une nouvelle matrice** quand l'énoncé demandait en place (gaspille l'espace et peut faire échouer les tests d'identité).

---

## Explique à un ami

Tu as une grille. Tout zéro veut dire "tue toute cette ligne et toute cette colonne". Si tu tues pendant que tu cherches encore, tu inventes de nouveaux zéros et tu tues trop. Donc d'abord **retiens** quelles lignes et colonnes doivent mourir. Tu peux le retenir dans deux tableaux booléens, ou tu peux griffonner ces rappels dans la première ligne et la première colonne de la grille elle-même, avec deux petits booléens pour la première ligne et la première colonne. Ensuite tu remplis le milieu à partir de ces rappels. Seulement à la fin tu nettoies la première ligne et la première colonne si elles étaient marquées.

Le temps est proportionnel au nombre de cases. La mémoire extra peut être constante si tu réutilises le bord de la matrice comme carnet.

---

## Série

* Guide de la série: [Cracking the Coding Interview en Java](/blog/fr/ctci-series-guide)
* Précédent: [1.7 Rotate Matrix](/blog/fr/ctci-1-7-rotate-matrix)
* Suivant: [1.9 String Rotation](/blog/fr/ctci-1-9-string-rotation)

Entraînez-vous sur la version tableaux de drapeaux jusqu'à pouvoir l'écrire à froid, puis sur la version drapeaux de bord une fois sans regarder. Cette deuxième version montre que vous savez gérer l'état avec soin sous pression.