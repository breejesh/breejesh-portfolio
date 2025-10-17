---
title: "Insertion: glisser l'entier M dans N entre les bits i et j (Java)"
description: "Problème style CTCI 5.1 pour débutants: efface les bits i à j dans N, décale M de i, puis OR. Masques de bits, parcours de l'exemple classique, et code Java."
date: "2025-10-17"
tags: [Algorithmes]
coverImage: /assets/images/ctci-5-1-insertion.webp
previewImage: /assets/images/ctci-5-1-insertion.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 5.1 pour débutants: efface les bits i à j dans N, décale M de i, puis OR. Masques de bits, parcours de l'exemple classique, et code Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as une longue étagère de livres (l'entier `N`). Un court segment d'emplacements au milieu est réservé à un nouveau lot (`M`). Tu vides ces emplacements, tu glisses les nouveaux livres, et tu laisses le reste intact. C'est l'**insertion de bits**: écrire les bits de `M` dans `N` du bit `i` jusqu'au bit `j`.

Ce billet est un enseignement original pour débutants en **Java**. Même famille d'échauffements bit manipulation en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 5, bit manipulation, commence ici.

---

## 1. Analogie du quotidien

Imagine une carte d'hôtel avec une rangée de petites lumières. Certaines sont déjà allumées ou éteintes (`N`). Un code invité (`M`) doit occuper une fenêtre fixe de ces positions, disons de la lumière `i` à la lumière `j` (le bit 0 est le moins significatif, à droite).

Tu n'allumes pas les lumières une par une à la main si tu peux l'éviter. Tu fais ceci:

1. **Éteins** chaque lumière de la fenêtre (efface ces bits).
2. Aligne le code pour que son bit le plus bas tombe sur la lumière `i` (décale `M` de `i` vers la gauche).
3. Fusionne avec OR: là où le code veut allumer, ça s'allume; là où il veut éteint, la fenêtre effacée reste à 0; hors fenêtre, rien ne change.

Ces trois gestes reviennent dans toute bonne réponse.

---

## 2. Énoncé simple

**Entrée:** deux entiers `N` et `M`, et deux indices de bit `i` et `j` (base 0 depuis la droite). En entretien, suppose un `int` 32 bits sauf indication contraire.

**Sortie:** `N` avec les bits `i` à `j` remplacés par les bits de `M`. Le bit `0` de `M` se place à la position `i` du résultat. Les bits hauts de `M` remplissent vers `j`.

**Hypothèses à formuler:**

* La fenêtre `i..j` est assez large pour tous les bits utiles de `M` (livre: `M` tient entre `i` et `j`).
* `i <= j`.
* Les bits hors de `[i, j]` dans `N` restent identiques.
* Si l'hypothèse de place tient, les bits de `M` au-dessus de `j` sont hors sujet; certains masquent quand même `M` à la largeur de la fenêtre.

**Exemple classique** (binaire pour y voir clair; le bit 0 est le chiffre le plus à droite):

```
N = 10000000000   (binary)
M = 10011
i = 2
j = 6

Result = 10001001100
```

Après insertion, les bits 2-6 du résultat valent `10011` (la valeur de `M`), et le reste de `N` est inchangé.

**Clarifie avant de coder:**

* Le bit 0 est le LSB (à droite)? (Oui pour ce problème.)
* `int` signé vs unsigned? En Java tout est complément à deux signé, mais pour du pur bit work tu traites le motif sur 32 bits.
* `M` doit tenir exactement, ou seulement "au moins" la largeur? (Suppose que ça tient; masque extra optionnel.)
* Type de retour: même largeur que `N` (`int`, ou `long` si tu veux de la marge).

---

## 3. Réfléchis d'abord

### Mauvais réflexe: poser les bits de M un par un

Tu *pourrais* boucler `k` de 0 à `j - i`, lire le bit `k` de `M` et l'écrire dans le bit `i + k` de `N`. Ça marche, mais l'entretien veut la version masque: effacer une plage, aligner, OR. Moins de branches, et tu montres que tu comprends les masques.

### Bonne forme: clear, shift, OR

1. **Effacer** les bits `i` à `j` dans `N` avec un masque à 0 sur cette plage et 1 ailleurs.
2. **Décaler** `M` de `i` vers la gauche pour que le bit 0 de `M` soit au bit `i`.
3. **OR** du `N` effacé avec le `M` décalé.

Les trois étapes sont des opérations mot O(1) sur un entier de largeur fixe.

### Construire le masque d'effacement

Tu veux quelque chose comme:

```
// for i=2, j=6 on a short word for illustration:
// ones, then zeros from j down to i, then ones again on the low side
// ...11110000011  (zeros in bits 2..6)
```

En deux morceaux:

* **Uns à gauche:** garder les bits à partir de `j + 1` vers le haut.  
  `left = ~0 << (j + 1)`  
  En Java, `~0` est tout à 1 (`-1`). Un décalage gauche de `j + 1` met des zéros sur les bits `0..j`.

* **Uns à droite:** garder les bits de `0` à `i - 1`.  
  `right = (1 << i) - 1`  
  Ce sont `i` uns bas. Si `i == 0`, c'est `0` (rien à garder à droite).

* **Masque:** `mask = left | right`  
  Zéros exactement sur les bits `i..j`, uns partout ailleurs.

* **N effacé:** `nCleared = N & mask`

* **Fusion:** `nCleared | (M << i)`

Attention en Java: si `j == 31`, alors `j + 1 == 32`. Un shift de 32 sur un `int` est masqué modulo 32 (`<< 32` ne fait rien sur `int`). Si la fenêtre touche le haut des 32 bits, utilise `long` pour le calcul du shift, ou traite `j == 31` avec `left = 0`. Les entretiens choisissent souvent `j` sous 31, mais signale le piège.

---

## 4. Solution Java

```java
/**
 * Insert M into N between bits i and j (inclusive).
 * Bit 0 is the least significant bit.
 * Assumes M fits in the window [i, j].
 */
int insertion(int N, int M, int i, int j) {
    // 1) Mask with 0s from bit i through bit j, 1s elsewhere.
    int allOnes = ~0;                 // 0xFFFFFFFF as a pattern
    int left = allOnes << (j + 1);    // 1s, then 0s from bit j downward
    int right = (1 << i) - 1;         // 1s in bits 0..i-1
    int mask = left | right;          // 0s only in [i, j]

    // 2) Clear the window in N.
    int nCleared = N & mask;

    // 3) Align M and merge.
    int mShifted = M << i;
    return nCleared | mShifted;
}
```

### Plus sûr si j peut valoir 31

```java
int insertionSafe(int N, int M, int i, int j) {
    int right = (1 << i) - 1;
    int left;
    if (j >= 31) {
        left = 0; // no bits above 31 on a 32-bit int
    } else {
        left = (~0) << (j + 1);
    }
    int mask = left | right;
    return (N & mask) | (M << i);
}
```

### Optionnel: borner M à la largeur de la fenêtre

Si tu ne fais pas pleinement confiance à "M tient":

```java
int width = j - i + 1;
int mMasked = M & ((width >= 32) ? ~0 : (1 << width) - 1);
return (N & mask) | (mMasked << i);
```

Toujours O(1). Bon follow-up si on demande les bits hauts sales de `M`.

---

## 5. Parcours de l'exemple classique

```
N = 10000000000   (binary)   // think of this as bits; leading 1 is bit 10
M = 10011
i = 2, j = 6
```

**Étape A: masque d'effacement**

* `left = ~0 << 7` → 7 bits bas à 0, bits hauts à 1  
* `right = (1 << 2) - 1` → `11` en binaire  
* `mask = left | right` → zéros sur les bits 2-6, uns ailleurs  

**Étape B: effacer N**

* `nCleared = N & mask`  
* Les bits 2-6 de `N` deviennent 0. Dans le dessin classique ce segment était déjà 0, donc `N` a l'air identique, mais l'étape compte quand ces bits valaient 1.

**Étape C: décaler et OR**

* `M << 2` = `10011` décalé de deux places → bits 2-6 contiennent `10011`  
* OR dans le `N` effacé → `10001001100`

Vérification en code:

```java
int N = 0b10000000000;
int M = 0b10011;
int result = insertion(N, M, 2, 6);
// result binary: 10001001100
// Integer.toBinaryString(result) -> "10001001100"
```

Autre contrôle rapide: si `N` avait des 1 dans la fenêtre, le clear les efface d'abord pour que l'OR ne laisse pas un 1 collant là où `M` voulait 0.

```java
// N has 1s in bits 2-6; after insert they must match M, not the old 1s
int dirty = 0b10001111100;
int cleaned = insertion(dirty, 0b10011, 2, 6);
// still 10001001100 in the low part of interest
```

---

## 6. Complexité, bords, conseils d'entretien

| Sujet | Réponse |
| --- | --- |
| Temps | O(1) pour des ints de largeur fixe |
| Espace extra | O(1) |
| Ordre des bits | 0 = LSB (droite) |
| `i == 0` | `right = 0`; la fenêtre commence au bit le moins significatif |
| `i == j` | fenêtre d'un bit; `M` devrait être 0 ou 1 pour un ajustement propre |
| `j == 31` | attention à `<< (j + 1)` sur un `int` Java |
| Négatifs | mêmes ops bit; ne pense pas en décimal avant d'imprimer |

**Bugs fréquents:**

* Off-by-one sur `j + 1` en construisant `left`.
* Décaler `M` de `j` au lieu de `i`.
* Utiliser AND pour fusionner au lieu de OR après clear (AND éteindrait les 1 de `M` contre les zéros de `N`).
* Oublier d'effacer d'abord: l'OR seul ne peut jamais transformer un 1 de `N` en 0 là où `M` met 0.

**Comment le raconter:**

1. Reformule: "Remplace les bits i à j de N par M; LSB de M en i."
2. Dessine une courte chaîne de bits et marque la fenêtre.
3. Dis clear, shift, OR.
4. Écris le masque avec moitiés gauche et droite.
5. Mentionne le quirk de shift Java pour `j == 31` s'il te reste 10 secondes.

---

## 7. Explique à un ami

Insertion (problème 5.1) demande: placer l'entier `M` dans l'entier `N` pour que `M` occupe les bits `i` à `j`.

1. Masque à 0 sur les bits `i..j` et 1 ailleurs: `left | right` avec `left = ~0 << (j + 1)` et `right = (1 << i) - 1`.
2. Effacer: `N & mask`.
3. Aligner: `M << i`.
4. Fusionner: `N` effacé OR `M` décalé.
5. Attention aux shifts Java si `j` vaut 31. Optionnel: masquer `M` à la largeur de la fenêtre.

Si tu dessines l'exemple classique `10000000000` / `10011` / `i=2,j=6` et expliques pourquoi le clear doit précéder l'OR, tu maîtrises le début du chapitre 5.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Paths with Sum](/blog/fr/ctci-4-12-paths-with-sum)
* Suivant: [Binary to String](/blog/fr/ctci-5-2-binary-to-string)