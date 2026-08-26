---
title: "Next Number: même nombre de bits 1, voisin plus grand et plus petit (Java)"
description: "Problème style CTCI 5.4 pour débutants: à partir d'un int positif, trouver le suivant plus grand et le suivant plus petit qui gardent le même nombre de bits 1. Compter les zéros et uns de fin, basculer un bit, réarranger le reste."
date: "2026-05-31"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-4-next-number.webp
previewImage: /assets/images/ctci-5-4-next-number.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 5.4 pour débutants: à partir d'un int positif, trouver le suivant plus grand et le suivant plus petit qui gardent le même nombre de bits 1. Compter les zéros et uns de fin, basculer un bit, réarranger le reste.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as un sac de chiffres binaires avec un nombre fixe de `1`. Tu peux les réordonner, mais tu n'ajoutes pas de uns et tu n'en jettes aucun. Parmi tous les nombres formables ainsi, lequel se place juste au-dessus de la valeur courante, et lequel juste en dessous ? C'est **Next Number**: même popcount, voisins les plus proches sur la droite des entiers.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions de manipulation de bits en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 5, manipulation de bits.

---

## 1. Analogie du quotidien

Imagine une rangée d'interrupteurs. Certains sont ON (`1`), d'autres OFF (`0`). Règle du puzzle: chaque motif légal doit garder **exactement le même nombre d'interrupteurs ON**.

* Le motif **suivant plus grand** est le plus petit entier strictement supérieur à l'actuel qui a encore le même nombre de ON.
* Le motif **suivant plus petit** est le plus grand entier strictement inférieur à l'actuel avec le même nombre de ON.

La force brute testerait `n+1`, `n+2`, ... et compterait les bits à chaque fois. Ça marche pour de petites démos. En entretien, on veut une construction bit à bit: trouver le bon endroit pour basculer un bit, puis tasser les uns restants selon la direction.

---

## 2. Énoncé en clair

**Entrée:** un `int n` positif (en entretien, traite-le comme un motif 32 bits en complément à deux; reste sur les non négatifs sauf consigne contraire).

**Sortie:**

* `getNext(n)`: le plus petit nombre **plus grand que** `n` avec le même nombre de bits `1`, ou un sentinelle (par exemple `-1`) s'il n'existe pas dans la largeur du mot.
* `getPrev(n)`: le plus grand nombre **plus petit que** `n` avec le même nombre de bits `1`, ou un sentinelle s'il n'existe pas.

**Même nombre de bits 1** veut dire même popcount: `Integer.bitCount(result) == Integer.bitCount(n)`.

**Exemples:**

| n (binaire) | Uns | Suivant plus grand | Suivant plus petit |
| --- | --- | --- | --- |
| `11011001111100` (13948) | 9 | `11011010001111` (13967) | (existe; voir l'idée du parcours ci-dessous) |
| `10110` (22) | 3 | `11001` (25) | `10101` (21) |
| `10011100` (156) | 4 | `10100011` (163) | `10011010` (154) |
| `1` | 1 | `10` (2) | aucun (retourner `-1`) |
| seulement des uns sur les k bits bas, rien de libre plus haut | k | peut ne pas exister si aucun zéro ne peut monter | existe souvent s'il y a des zéros au-dessus |

**À clarifier avant de coder:**

* Positifs seulement, ou 32 bits complets avec bit de signe ? (Commence positif; cite 31 comme bit haut pratique pour un `int` positif.)
* Si next/prev n'existe pas ? (`-1` ou exception; choisis et tiens-t'y.)
* `n == 0` autorisé ? (Zéro uns: seul zéro a zéro uns. Ni next ni prev.)
* Les deux réponses dans une méthode, ou deux helpers ?

---

## 3. Réfléchir d'abord

### Brute (bon échauffement)

```
next = n + 1
while bitCount(next) != bitCount(n): next++
```

Même idée vers le bas pour prev. Correct pour de petits n. Au pire le gap est grand, et sur un mot fixe il faut s'arrêter au débordement. On attend en général du travail de bits en O(1) ou O(taille du mot).

### Idée pour le suivant plus grand

Tu veux la **plus petite** hausse qui garde le nombre de 1.

Donc:

1. Trouve le **zéro non final le plus à droite**: le `0` le plus bas qui a au moins un `1` à sa droite. Appelle son index `p`.
2. Bascule ce `0` en `1`. Le nombre augmente, tu as temporairement un `1` de trop.
3. Efface tous les bits sous `p`.
4. Remets les uns que tu "dois" aux positions **les plus à droite** sous `p`, mais seulement `c1 - 1` (tu as déjà payé un flip pour le 1 en `p`). Cela minimise la valeur sous `p`.

Comment trouver `p` sans balayer au hasard:

* `c0` = nombre de `0` de fin (depuis le bit 0 vers le haut).
* `c1` = nombre de `1` juste après ces zéros (une série de uns).
* Alors `p = c0 + c1`. Le bit `p` est le zéro juste à gauche de cette série de uns.

### Idée pour le suivant plus petit

Miroir:

1. Compte les `1` de fin (`c1`), puis les zéros au-dessus (`c0`).
2. La position `p = c0 + c1` est le **un non final le plus à droite**.
3. Baisse ce `1` en `0` (le nombre diminue) et efface les bits en dessous.
4. Place `c1 + 1` uns avec le tassement standard: un bloc de `(c1 + 1)` uns décalé de `(c0 - 1)`.

S'il n'y a pas de zéro au-dessus des uns bas (motif du type `000...00111`), tu ne peux pas descendre avec le même compte.

### Raccourcis arithmétiques (mêmes comptes)

Une fois `c0` et `c1` connus:

* Suivant plus grand: `n + (1 << c0) + (1 << (c1 - 1)) - 1`
* Suivant plus petit: `n - (1 << c1) - (1 << (c0 - 1)) + 1`

Mêmes résultats que basculer et retasser. Bonne deuxième implémentation après le dessin des bits.

---

## 4. Solution Java

### getNext: suivant plus grand à même nombre de bits

```java
/**
 * Smallest number greater than n with the same number of 1 bits.
 * Returns -1 if none exists within a 32-bit positive pattern.
 */
int getNext(int n) {
    if (n <= 0) {
        return -1;
    }

    int c = n;
    int c0 = 0; // trailing zeros
    int c1 = 0; // ones right after those zeros

    // count trailing zeros
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }
    // count ones after that
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }

    // no larger number with same 1-count in 32-bit space
    // (e.g. 111...11000...0 with no non-trailing zero to flip)
    if (c0 + c1 == 31 || c0 + c1 == 0) {
        return -1;
    }

    int p = c0 + c1; // position of rightmost non-trailing zero

    // Flip the zero at p to one.
    n |= (1 << p);

    // Clear all bits to the right of p.
    n &= ~((1 << p) - 1);

    // Insert (c1 - 1) ones on the right.
    n |= (1 << (c1 - 1)) - 1;

    return n;
}
```

**Jumeau arithmétique:**

```java
int getNextArithmetic(int n) {
    if (n <= 0) {
        return -1;
    }
    int c = n;
    int c0 = 0;
    int c1 = 0;
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }
    if (c0 + c1 == 31 || c0 + c1 == 0 || c1 == 0) {
        return -1;
    }
    return n + (1 << c0) + (1 << (c1 - 1)) - 1;
}
```

### getPrev: suivant plus petit à même nombre de bits

```java
/**
 * Largest number less than n with the same number of 1 bits.
 * Returns -1 if none exists.
 */
int getPrev(int n) {
    if (n <= 0) {
        return -1;
    }

    int c = n;
    int c0 = 0; // zeros after the trailing ones
    int c1 = 0; // trailing ones

    // count trailing ones
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }
    if (c == 0) {
        // pattern like 00...00111: no smaller with same ones
        return -1;
    }

    // count zeros after those ones
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }

    int p = c0 + c1; // rightmost non-trailing one

    // Clear bits from p down through 0.
    n &= (-1 << (p + 1)); // same as ~0 << (p + 1)

    // Sequence of (c1 + 1) ones.
    int mask = (1 << (c1 + 1)) - 1;

    // Place that block as far right as allowed: leave (c0 - 1) zeros at the bottom.
    n |= mask << (c0 - 1);

    return n;
}
```

**Jumeau arithmétique:**

```java
int getPrevArithmetic(int n) {
    if (n <= 0) {
        return -1;
    }
    int c = n;
    int c0 = 0;
    int c1 = 0;
    while ((c & 1) == 1) {
        c1++;
        c >>>= 1;
    }
    if (c == 0) {
        return -1;
    }
    while ((c & 1) == 0 && c != 0) {
        c0++;
        c >>>= 1;
    }
    if (c0 == 0) {
        return -1;
    }
    return n - (1 << c1) - (1 << (c0 - 1)) + 1;
}
```

Utilise `>>>` (décalage non signé) en parcourant `c`, pour qu'un `1` haut (bit de signe) ne fasse pas boucler avec `>>` arithmétique. Pour des entrées positives d'entretien, les deux marchent; `>>>` est une meilleure habitude.

---

## 5. Parcours

### Suivant plus grand: 13948

```
n  = 11011001111100
       trailing zeros: 00  → c0 = 2
       then ones: 11111    → c1 = 5
       p = 7  (0-based from the right)

Flip bit 7:     11011011111100
Clear below 7:  11011010000000
Add c1-1 = 4 ones on the right:
                11011010001111  = 13967
```

Vérifie: les deux ont neuf `1`, et rien entre 13948 et 13967 n'a neuf `1`.

### Suivant plus petit: 156 (`10011100`)

```
n  = 10011100
       trailing ones: none → c1 = 0
       then zeros: 00      → c0 = 2
       next bit is 1, so p = 2

Clear from bit 2 down:  10011000
mask = (c1 + 1) ones = 1
shift by (c0 - 1) = 1:  10011010  = 154
```

Quatre uns chacun. 155 en a cinq, donc 154 est le voisin.

### Petit cas: 22 (`10110`)

| Direction | Comptes | Résultat binaire | Décimal |
| --- | --- | --- | --- |
| next | c0=1, c1=2, p=3 | `11001` | 25 |
| prev | c1=0, c0=1, p=1 | `10101` | 21 |

---

## 6. Complexité, bords, conseils d'entretien

| Sujet | Réponse |
| --- | --- |
| Temps | O(b) pour compter les séries, b = taille du mot (32). Flip et masques en O(1). |
| Espace extra | O(1) |
| Alternative brute | O(gap) incréments; le gap peut être grand |
| Pas de next | Motifs sans zéro non final à basculer (garde avec `c0 + c1`) |
| Pas de prev | Tous les uns uniquement en bas (`c == 0` après les uns de fin) |
| `n = 0` | Seul zéro a zéro uns; `-1` des deux côtés |
| Bit de signe | Préfère `>>>` en balayant; reste positif en entretien |

**Bugs fréquents:**

1. Utiliser `>>` arithmétique sur un intermédiaire négatif en élargissant les cas.
2. Off-by-one: insérer `c1` uns au lieu de `c1 - 1` après le basculement vers le haut.
3. Oublier d'effacer sous `p` avant d'insérer les uns (vieux bits cassent le compte).
4. Dire qu'il n'y a pas de solution sans regarder la structure des séries de fin.
5. Confondre "suivant plus grand en valeur" et "suivant en rotation de bits". Ici c'est l'**ordre des entiers**, pas une rotation.

**Comment le dire:**

1. Reformule: même popcount, plus grand le plus proche et plus petit le plus proche.
2. Dessine une chaîne de bits. Marque zéros de fin, puis uns, puis la position du flip.
3. Flip, efface à droite, retasse les uns.
4. Miroir pour prev.
5. Optionnel: montre que la forme arithmétique colle sur ton exemple.

---

## 7. Explique à un ami

Next Number (problème 5.4) demande: à partir d'un int positif, le suivant plus grand et le suivant plus petit avec le même nombre de bits `1`.

1. **Suivant plus grand:** compte les zéros de fin (`c0`) puis les uns (`c1`). Bascule le zéro en `p = c0 + c1`. Efface sous `p`. Mets `c1 - 1` uns tout à droite.
2. **Suivant plus petit:** compte les uns de fin (`c1`) puis les zéros (`c0`). Baisse le un en `p = c0 + c1` en effaçant de `p` à 0. Place `c1 + 1` uns décalés de `c0 - 1`.
3. **Arithmétique:** `n + (1<<c0) + (1<<(c1-1)) - 1` et `n - (1<<c1) - (1<<(c0-1)) + 1` une fois les comptes connus.
4. Sentinelle quand le motif n'a pas de place (pas de zéro non final pour next, pas de un non final pour prev).
5. Préfère les décalages non signés en parcourant les bits.

Si tu peux passer 13948 à 13967 à la main et expliquer pourquoi les uns se posent à droite après le flip, tu maîtrises le 5.4.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Flip Bit to Win](/blog/fr/ctci-5-3-flip-bit-to-win)
* Suivant: [Debugger](/blog/fr/ctci-5-5-debugger)