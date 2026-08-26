---
title: "CTCI 1.7 Rotate Matrix: tourner une grille NxN de 90 degrés in place (Java)"
description: "Faire pivoter une matrice NxN de 90 degrés dans le sens horaire sans seconde matrice. Échange 4 cellules couche par couche en Java, avec schémas texte et cas limites."
date: "2025-11-12"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-7-rotate-matrix.webp
previewImage: /assets/images/ctci-1-7-rotate-matrix.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Faire pivoter une matrice NxN de 90 degrés dans le sens horaire sans seconde matrice. Échange 4 cellules couche par couche en Java, avec schémas texte et cas limites.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Imagine une photo carrée sur une table. Tu veux la mettre à l'horizontale, donc tu fais tourner la feuille de **90 degrés dans le sens horaire**. Chaque coin part vers un autre coin. Le centre reste au centre. Tu n'achètes pas une seconde copie pour y coller les pixels. Tu bouges la même feuille.

C'est le problème: faire pivoter une matrice **N par N** de 90 degrés **in place**. Sans une seconde matrice complète.

Chapitre 1, problème 1.7 de la série style CTCI. Plan de la série: [Cracking the Coding Interview en Java](/blog/fr/ctci-series-guide). Tag: **Algorithmes**.

---

## Le problème en mots simples

**Entrée:** une matrice carrée `matrix` de taille `N x N`. Chaque case contient une valeur (vois chaque case comme un pixel).

**Sortie:** le même objet matrice, valeurs réarrangées pour que l'image soit tournée de **90 degrés dans le sens horaire**.

**Contrainte importante:** le faire **in place**. Objectif: mémoire extra O(1) (quelques temporaires), pas une copie N x N.

Sens horaire veut dire:

- La ligne du haut devient la colonne de droite.
- La colonne de droite devient la ligne du bas (dans l'ordre qui correspond à l'ancien top).
- Et ainsi de suite autour du carré.

Le sens antihoraire, c'est la même idée avec le cycle inversé. En entretien on veut presque toujours l'horaire sauf mention contraire. Demande une fois si tu doutes.

---

## Petit exemple à dessiner à la main

Commence avec N = 4. Les lettres rendent le mouvement lisible:

```
Avant:                  Après 90 deg horaire:
A  B  C  D              M  I  E  A
E  F  G  H              N  J  F  B
I  J  K  L              O  K  G  C
M  N  O  P              P  L  H  D
```

Vérifie un coin: `A` était en haut à gauche. Après rotation, `A` est en haut à droite. `D` va en bas à droite. `P` en bas à gauche. `M` en haut à gauche.

Vérifie une case intérieure: `F` était en (1,1). Après rotation elle est en (1,2), là où était `G`. Le centre 2x2 tourne aussi comme son propre carré.

---

## Comment réfléchir avant de coder

### Force brute (facile, mais pas in place)

Crée une nouvelle matrice `out` de taille N x N.

Pour chaque case `(r, c)`:

```
out[c][N - 1 - r] = matrix[r][c]
```

Pourquoi? La ligne devient colonne. L'ancien indice de ligne décide à quelle distance du bord **droit** tu atterris.

```
(r, c)  -->  (c, N - 1 - r)
```

Exemples sur le 4x4 ci-dessus:

| De | Vers | Lettre |
| --- | --- | --- |
| (0,0) | (0,3) | A |
| (0,3) | (3,3) | D |
| (3,0) | (0,0) | M |
| (1,2) | (2,2) | G |

C'est correct et O(N²) en temps. Espace O(N²). L'interviewer demandera: peux-tu éviter la seconde matrice?

### Meilleure idée: faire tourner quatre cases à la fois

Tu ne peux pas déplacer une case vers sa nouvelle place sans écraser quelqu'un. Donc tu sauves une case dans un temporaire, puis tu parcours un **cycle de quatre**:

```
top  -->  right  -->  bottom  -->  left  -->  top
```

Fais-le pour chaque position sur le bord d'une couche, puis avance vers l'intérieur.

### Couches (anneaux d'oignon)

Une matrice N x N, ce sont des anneaux emboîtés:

```
Couche 0: anneau extérieur (lignes/cols 0 et N-1)
Couche 1: anneau suivant (lignes/cols 1 et N-2)
...
```

Combien de couches? `N / 2` (division entière). Pour N = 4 tu as 2 couches. Pour N = 5 tu as 2 anneaux et une case centrale qui ne bouge pas.

```
N = 5, couches = 2

* * * * *     couche extérieure
* + + + *     couche intérieure
* + o + *     o est le centre, reste
* + + + *
* * * * *
```

---

## Une couche, pas à pas

Concentre-toi sur la couche `layer` d'une matrice N x N.

```
first = layer
last  = N - 1 - layer
```

Sur cet anneau tu parcours des offsets `i` de `0` à `last - first - 1` (tu t'arrêtes avant le coin déjà couvert par l'offset suivant; chaque cycle de 4 gère un "slot" du côté).

Pour chaque offset `i`:

```
// positions du cycle (carte de destination horaire)
top    = matrix[first][first + i]
right  = matrix[first + i][last]
bottom = matrix[last][last - i]
left   = matrix[last - i][first]
```

Rotation horaire: chaque valeur va là où allait celle du côté **précédent**:

```
temp   = top
top    <- left      // le côté gauche monte en top
left   <- bottom    // le bottom passe en left
bottom <- right     // le right passe en bottom
right  <- temp      // l'ancien top va en right
```

Sous forme d'indices (à écrire au tableau):

```
temp = matrix[first][first + i]

matrix[first][first + i]       = matrix[last - i][first]       // top    <- left
matrix[last - i][first]        = matrix[last][last - i]        // left   <- bottom
matrix[last][last - i]         = matrix[first + i][last]       // bottom <- right
matrix[first + i][last]        = temp                          // right  <- old top
```

### Un offset sur l'anneau extérieur (N = 4, layer 0, i = 0)

```
Avant (coins extérieurs seulement):

A  B  C  D
E  .  .  H
I  .  .  L
M  N  O  P

Cycle: A (top) , D (right) , P (bottom) , M (left)

Après ce cycle:

M  B  C  A
E  .  .  H
I  .  .  L
P  N  O  D
```

Ensuite `i = 1` fait tourner les quatre suivants sur les côtés (`B`, `H`, `O`, `I`), et ainsi de suite jusqu'à la fin de l'anneau extérieur. Puis `layer = 1` fait tourner le 2x2 intérieur.

### Second modèle mental optionnel: transpose puis inverser les lignes

Autre approche correcte:

1. **Transpose:** échange `matrix[r][c]` et `matrix[c][r]` pour `c > r`.
2. **Inverse chaque ligne.**

```
A B C D     transpose      A E I M     inverse lignes      M I E A
E F G H     --------->     B F J N     -------------->     N J F B
I J K L                    C G K O                         O K G C
M N O P                    D H L P                         P L H D
```

Même résultat. Couche par couche est l'histoire classique de l'anneau in place; transpose + inverse est souvent plus simple à taper sous stress. Connais les deux. Code-en un proprement.

---

## Solution Java (couche par couche)

```java
/**
 * Fait pivoter une matrice N x N de 90 degrés sens horaire in place.
 * Retourne false si la matrice est null ou non carrée; true si ok.
 */
public final class RotateMatrix {

    private RotateMatrix() {}

    public static boolean rotate(int[][] matrix) {
        if (matrix == null || matrix.length == 0) {
            return false;
        }
        int n = matrix.length;
        for (int[] row : matrix) {
            if (row == null || row.length != n) {
                return false; // pas carrée
            }
        }

        // Chaque couche de l'extérieur vers l'intérieur
        for (int layer = 0; layer < n / 2; layer++) {
            int first = layer;
            int last = n - 1 - layer;

            for (int i = first; i < last; i++) {
                int offset = i - first;

                // sauver top
                int top = matrix[first][first + offset];

                // left -> top
                matrix[first][first + offset] = matrix[last - offset][first];

                // bottom -> left
                matrix[last - offset][first] = matrix[last][last - offset];

                // right -> bottom
                matrix[last][last - offset] = matrix[first + offset][last];

                // top -> right
                matrix[first + offset][last] = top;
            }
        }
        return true;
    }
}
```

### Même logique avec transpose + inverse des lignes

```java
public static void rotateViaTranspose(int[][] matrix) {
    int n = matrix.length;

    // Transpose
    for (int r = 0; r < n; r++) {
        for (int c = r + 1; c < n; c++) {
            int tmp = matrix[r][c];
            matrix[r][c] = matrix[c][r];
            matrix[c][r] = tmp;
        }
    }

    // Inverser chaque ligne
    for (int r = 0; r < n; r++) {
        for (int c = 0; c < n / 2; c++) {
            int tmp = matrix[r][c];
            matrix[r][c] = matrix[r][n - 1 - c];
            matrix[r][n - 1 - c] = tmp;
        }
    }
}
```

Les deux sont in place. Choisis-en un et sois prêt à expliquer l'autre en une phrase.

---

## Complexité

| Approche | Temps | Espace extra |
| --- | --- | --- |
| Copie vers une nouvelle matrice | O(N²) | O(N²) |
| Cycles de 4 couche par couche | O(N²) | O(1) |
| Transpose + inverse des lignes | O(N²) | O(1) |

Il faut toucher chaque case une fois (ou un nombre constant de fois), donc O(N²) est optimal pour des matrices denses.

---

## Cas limites que l'interviewer pousse

| Cas | Ce qui doit se passer |
| --- | --- |
| `N = 0` ou null | No-op ou refus; pas de crash |
| `N = 1` | Une seule case; déjà "tournée" |
| `N = 2` | Une couche, un offset par côté (les quatre coins) |
| `N` impair | La case centrale ne bouge pas; toujours `N/2` couches |
| Pas carrée | Définis le comportement; les vraies images peuvent être MxN, mais ce problème est NxN |
| Valeurs objets / gros structs | Même arithmétique d'indices; seul le type du temp change |

Clarifie aussi la **direction**: horaire vs antihoraire. Pour l'antihoraire, inverse l'ordre des affectations du cycle de 4 (ou transpose puis inverse les **colonnes**).

---

## Auto-vérification rapide (N = 3)

```
1 2 3      rotate CW      7 4 1
4 5 6      --------->     8 5 2
7 8 9                     9 6 3
```

Couche 0 seulement (`N/2 = 1`). Offsets sur l'anneau extérieur:

1. Cycle `1, 3, 9, 7` → place `7` haut-gauche, `1` haut-droit, `3` bas-droit, `9` bas-gauche.
2. Cycle `2, 6, 8, 4` → termine les côtés.
3. Le centre `5` reste.

Si ton code affiche ça, les indices sont bons.

---

## Explique-le à un ami

Tu as une grille carrée de pixels. Tu veux la faire tourner de 90 degrés dans le sens horaire sans allouer une seconde grille complète.

Traite-la comme un oignon. Sur chaque anneau, marche le long d'un côté. À chaque position, quatre cases échangent: top, right, bottom, left. Sauve-en une dans un temporaire pour ne pas la perdre, écris les trois autres, puis mets le temporaire dans le dernier trou. Finis l'anneau, entre d'un cran, recommence jusqu'au milieu.

Le temps est proportionnel au nombre de cases. La mémoire extra, c'est essentiellement une case temporaire. C'est tout le truc.

---

## Pratique suivante

* Code les deux versions de mémoire (cycle par couches, puis transpose + inverse).
* Passe le problème en **antihoraire** et n'ajuste que le cycle.
* Bonus: faire pivoter une image **M x N** (il faut un nouveau buffer ou une autre représentation; pure in place pour non carré est un autre puzzle).

Accueil de la série: [guide CTCI en Java](/blog/fr/ctci-series-guide). Prochain problème tableaux du plan: [Zero Matrix](/blog/fr/ctci-1-8-zero-matrix).