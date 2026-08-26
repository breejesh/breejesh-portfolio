---
title: "Magic Index: Trouver i tel que A[i] égale i (Java)"
description: "Problème style CTCI 8.3 pour débutants: dans un tableau trié, trouver un indice i avec A[i] == i. Valeurs distinctes: recherche binaire. Doublons: les deux côtés avec bornes resserrées."
date: "2026-05-01"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-3-magic-index.webp
previewImage: /assets/images/ctci-8-3-magic-index.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 8.3 pour débutants: dans un tableau trié, trouver un indice i avec A[i] == i. Valeurs distinctes: recherche binaire. Doublons: les deux côtés avec bornes resserrées.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Les chambres d'un hôtel s'alignent, numérotées 0, 1, 2, ... La liste des clients est triée par numéro de préférence de chambre. Un **indice magique** est une chambre où le numéro du client égale le numéro de la chambre: `A[i] == i`. Tu veux une telle chambre, ou la preuve qu'aucune n'existe, sans ouvrir chaque porte quand tu peux l'éviter.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de problèmes que les entretiens classiques de "point fixe dans un tableau trié", pas une copie du livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 8 (récursion et programmation dynamique) continue ici après la marche sur la grille.

---

## 1. Analogie du quotidien

Imagine des casiers peints de 0 à 6. Dans chacun tu glisses un billet avec un entier. Les billets sont déjà en ordre **croissant** de gauche à droite.

| Indice (casier) | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Valeur (billet) | -1 | 0 | 1 | 3 | 5 | 7 | 9 |

Le casier 3 contient le billet 3. C'est un indice magique. Le 4 contient 5, pas 4.

Si chaque billet est **unique**, la ligne triée a une forme nette: une fois que les valeurs dépassent leur indice et montent au moins aussi vite que les indices, l'égalité ne peut plus se cacher plus à droite. D'où la recherche binaire.

Si les billets peuvent **se répéter**, la ligne peut vaciller. La valeur 2 peut être à l'indice 1 et encore plus loin. Tu ne peux pas toujours jeter une moitié entière, mais tu peux encore sauter des plages impossibles pour un point fixe.

---

## 2. Énoncé clair

**Entrée:** un tableau trié d'entiers `A` (non décroissant). L'échauffement classique suppose des valeurs **distinctes**. Le follow-up autorise les **doublons**.

**Sortie:** un indice `i` avec `A[i] == i`, ou une sentinelle (ici `-1`) s'il n'y en a pas.

**Exemples (distincts):**

| Tableau | Indice magique | Pourquoi |
| --- | --- | --- |
| `{-1, 0, 1, 3, 5, 7, 9}` | `3` | `A[3] == 3` |
| `{0, 2, 3, 4, 5}` | `0` | la première case matche |
| `{1, 2, 3, 4}` | aucun | chaque valeur est strictement au-dessus de son indice |
| `{-10, -5, 2, 5}` | `2` | seul le milieu matche |

**Exemple avec doublons:**

```
A = {-10, -5, 2, 2, 2, 3, 4, 7, 9, 12, 13}
```

L'indice 7 marche (`A[7] == 7`). Selon le mid tu peux aussi tomber sur d'autres points fixes s'ils existent; en renvoyer un seul suffit pour ce problème.

**À clarifier en entretien:**

* Trié croissant? (Oui.)
* Distincts ou non? (Demande. Commence distinct, puis doublons.)
* N'importe quel indice magique ou le plus à gauche? (N'importe lequel sauf consigne contraire.)
* Tableau vide? Renvoie `-1`.
* Valeurs négatives autorisées? Oui. Les indices restent non négatifs, donc une valeur négative ne peut jamais égaler son indice.

---

## 3. Réfléchis d'abord

### Force brute

Parcours `i` de 0 à `n - 1`. Si `A[i] == i`, renvoie `i`. Temps O(n), espace O(1). Correct pour un petit n. En entretien on veut exploiter le tri.

### Valeurs distinctes: recherche binaire sur l'écart du point fixe

Regarde mid. Compare `A[mid]` et `mid`.

* **Égal:** terminé. Renvoie `mid`.
* **`A[mid] > mid`:** pour tout `j > mid`, tri + distincts implique `A[j] >= A[mid] + (j - mid) > mid + (j - mid) = j`. Donc `A[j] > j` pour toujours à droite. Cherche seulement à **gauche**: `0 .. mid - 1`.
* **`A[mid] < mid`:** pour tout `j < mid`, `A[j] <= A[mid] - (mid - j) < mid - (mid - j) = j`. Donc `A[j] < j` pour toujours à gauche. Cherche seulement à **droite**: `mid + 1 .. n - 1`.

C'est une recherche binaire classique avec une comparaison maison (`valeur - indice` traverse zéro). Profondeur de récursion O(log n).

### Doublons: les deux côtés, mais resserrés

Le saut "distincts" casse quand les valeurs peuvent rester plates. Exemple:

```
index: 0  1  2  3  4  5
value: 1  1  1  3  5  6
```

À mid 2, `A[2] == 1 < 2`. Avec la règle distincts tu ne chercherais qu'à droite; d'autres formes cassent l'abandon d'un seul côté. Règle sûre avec doublons:

1. Vérifie mid. Si match, renvoie-le.
2. Cherche à gauche sur une plage **serrée**: de `start` à `Math.min(mid - 1, A[mid])`.
3. Si la gauche échoue, cherche à droite de `Math.max(mid + 1, A[mid])` à `end`.

Pourquoi le min/max?

* Un indice magique `k` à gauche doit vérifier `k <= mid - 1` et `A[k] == k`. Le tri force `A[k] <= A[mid]`, donc `k <= A[mid]`. Borne haute gauche: `min(mid - 1, A[mid])`.
* À droite, `k >= mid + 1` et `k == A[k] >= A[mid]`, donc borne basse: `max(mid + 1, A[mid])`.

Pire cas encore O(n) si beaucoup de doublons ouvrent souvent les deux branches. En moyenne bien mieux qu'un scan pur quand le tableau est surtout strict. Tu utilises encore l'ordre au lieu de l'ignorer.

### Récursion vs itération

Le cas distinct se mappe proprement sur une boucle (comme binary search). Le cas doublons est plus simple en récursif: essaie gauche, puis droite. Pile O(log n) en partitions équilibrées, jusqu'à O(n) dans les cas moches. Les interviewers acceptent en général la forme récursive.

---

## 4. Solution Java

### Entiers distincts

```java
/**
 * Magic index for a sorted array of distinct ints.
 * Returns some i with A[i] == i, or -1 if none.
 */
public static int magicIndexDistinct(int[] a) {
    if (a == null || a.length == 0) {
        return -1;
    }
    return magicIndexDistinct(a, 0, a.length - 1);
}

private static int magicIndexDistinct(int[] a, int lo, int hi) {
    if (lo > hi) {
        return -1;
    }
    int mid = lo + (hi - lo) / 2;
    int val = a[mid];
    if (val == mid) {
        return mid;
    }
    if (val > mid) {
        // fixed point, if any, is strictly left
        return magicIndexDistinct(a, lo, mid - 1);
    }
    // val < mid: search right
    return magicIndexDistinct(a, mid + 1, hi);
}
```

Jumeau itératif (même logique):

```java
public static int magicIndexDistinctIter(int[] a) {
    if (a == null || a.length == 0) {
        return -1;
    }
    int lo = 0;
    int hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int val = a[mid];
        if (val == mid) {
            return mid;
        }
        if (val > mid) {
            hi = mid - 1;
        } else {
            lo = mid + 1;
        }
    }
    return -1;
}
```

### Avec doublons (plages resserrées)

```java
/**
 * Magic index when the sorted array may contain duplicates.
 * Still returns any match, or -1.
 */
public static int magicIndex(int[] a) {
    if (a == null || a.length == 0) {
        return -1;
    }
    return magicIndex(a, 0, a.length - 1);
}

private static int magicIndex(int[] a, int lo, int hi) {
    if (lo > hi) {
        return -1;
    }
    int mid = lo + (hi - lo) / 2;
    int val = a[mid];
    if (val == mid) {
        return mid;
    }

    // Left: only indices that can still equal their value
    int leftHi = Math.min(mid - 1, val);
    int left = magicIndex(a, lo, leftHi);
    if (left >= 0) {
        return left;
    }

    // Right: skip indices that cannot match
    int rightLo = Math.max(mid + 1, val);
    return magicIndex(a, rightLo, hi);
}
```

Préfère la méthode **distinct** quand l'interviewer garantit l'unicité (histoire plus claire, vrai O(log n)). Passe à la version générale dès qu'on parle de doublons ou de "non décroissant".

---

## 5. Parcours pas à pas

### Distincts: `{-1, 0, 1, 3, 5, 7, 9}`

| lo | hi | mid | A[mid] | Action |
| --- | --- | --- | --- | --- |
| 0 | 6 | 3 | 3 | égal, renvoie 3 |

Un coup. Mid chanceux, mais les mêmes règles le trouvent depuis d'autres départs.

### Échec distincts: `{1, 2, 3, 4}`

| lo | hi | mid | A[mid] | Action |
| --- | --- | --- | --- | --- |
| 0 | 3 | 1 | 2 | 2 > 1, va à gauche |
| 0 | 0 | 0 | 1 | 1 > 0, va à gauche |
| 0 | -1 | | | vide, renvoie -1 |

Chaque valeur est au-dessus de son indice; la recherche se vide correctement.

### Doublons: `{-10, -5, 2, 2, 2, 3, 4, 7, 9, 12, 13}`

Supposons que mid tombe sur l'indice 5 (`A[5] == 3`).

* Pas égal.
* Haut gauche = `min(4, 3) = 3`. Cherche `0..3`.
* Dans cette plage tu ne touches peut-être pas 7; gauche renvoie -1.
* Bas droit = `max(6, 3) = 6`. Cherche `6..10`.
* Le mid de là peut être 8 (`A[8] == 9 > 8`) ou 7 (`A[7] == 7`). Quand mid vaut 7, renvoie 7.

Les bornes resserrées sautent l'indice 5 lui-même (déjà testé) et peuvent sauter des cases mortes quand `val` et `mid` divergent beaucoup.

### Checks rapides dans le code

```java
int[] distinct = {-1, 0, 1, 3, 5, 7, 9};
assert magicIndexDistinct(distinct) == 3;

int[] none = {1, 2, 3, 4};
assert magicIndexDistinct(none) == -1;

int[] dups = {-10, -5, 2, 2, 2, 3, 4, 7, 9, 12, 13};
int m = magicIndex(dups);
assert m >= 0 && dups[m] == m;

assert magicIndex(new int[]{}) == -1;
assert magicIndex(null) == -1;
assert magicIndex(new int[]{0}) == 0;
assert magicIndex(new int[]{1}) == -1;
```

---

## 6. Complexité, bords, conseils d'entretien

| Sujet | Distincts | Avec doublons |
| --- | --- | --- |
| Temps | O(log n) | O(log n) meilleur, O(n) pire |
| Espace extra | O(log n) récursion ou O(1) itératif | O(log n) à O(n) de pile |
| Tri requis | oui | oui (non décroissant) |
| Négatifs | ok; seuls les indices non négatifs peuvent matcher | idem |

**Bords:**

* Vide / null → `-1`.
* Un élément `{0}` → `0`; `{5}` → `-1`.
* Magique aux extrémités: indice 0 ou `n - 1`.
* Tout négatif: pas d'indice magique (les valeurs n'attrapent jamais un indice non négatif).
* Tableau plat de la même valeur `v`: seul l'indice `v` peut marcher, et seulement si `0 <= v < n` et `A[v] == v`.

**Bugs fréquents:**

1. Utiliser la règle d'un seul côté (distincts) après que les doublons sont autorisés.
2. Oublier de tester `A[mid] == mid` avant de brancher.
3. Off-by-one sur `lo`/`hi` (`mid - 1` / `mid + 1`).
4. Sur doublons, chercher tout `0..mid-1` et `mid+1..n-1` sans le skip `min`/`max` (toujours correct, juste plus lent; mentionne l'optimisation).
5. Renvoyer seulement un booléen alors qu'on demandait l'indice.
6. Overflow sur `(lo + hi) / 2` en entiers de largeur fixe; préfère `lo + (hi - lo) / 2`.

**Comment le raconter:**

1. Reformule: "Trouver i avec A[i] == i dans un tableau trié."
2. Brute O(n), puis "trié + distincts implique binary search d'un seul côté."
3. Prouve l'abandon de côté avec l'argument distincts + tri en une phrase chacun.
4. Code proprement la version distinct.
5. Follow-up: "Avec doublons, cherche les deux côtés mais clip avec min(mid-1, A[mid]) et max(mid+1, A[mid])."

---

## 7. Récap à raconter à un ami

Magic Index demande un point fixe dans un tableau trié: l'indice égale la valeur.

1. La force brute est une boucle droite. Utilise-la seulement si n est petit ou si le tableau n'est pas trié.
2. **Distincts + trié:** compare mid à `A[mid]`. Trop haut: seul la gauche peut marcher. Trop bas: seule la droite. C'est binary search sur l'écart.
3. **Doublons:** vérifie mid, puis récure à gauche jusqu'à `min(mid - 1, A[mid])`, puis à droite depuis `max(mid + 1, A[mid])`. L'ordre tue encore les bandes d'indices impossibles.
4. Renvoie n'importe quel indice qui matche, ou `-1`. Les négatifs ne matchent jamais un indice valide.
5. Le chemin distinct est O(log n). Le chemin doublons peut dégrader en O(n); dis-le à voix haute.

Si tu peux marcher `{-1,0,1,3,5,7,9}` jusqu'à l'indice 3 et expliquer pourquoi les doublons demandent les deux côtés avec bornes coupées, tu maîtrises le problème 8.3. Ensuite: construire chaque sous-ensemble d'un ensemble.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Robot in a Grid](/blog/fr/ctci-8-2-robot-in-a-grid)
* Suivant: [Power Set](/blog/fr/ctci-8-4-power-set)