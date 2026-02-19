---
title: "Conversion: combien de bits basculer pour passer de A à B (Java)"
description: "Problème style CTCI 5.6 pour débutants: compte les bits à basculer pour convertir l'entier A en B. XOR des deux, puis compte les uns. Boucle de Brian Kernighan et Integer.bitCount."
date: "2026-02-19"
tags: [Algorithmes]
coverImage: /assets/images/ctci-5-6-conversion.webp
previewImage: /assets/images/ctci-5-6-conversion.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 5.6 pour débutants: compte les bits à basculer pour convertir l'entier A en B. XOR des deux, puis compte les uns. Boucle de Brian Kernighan et Integer.bitCount.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as deux rangées d'ampoules, même nombre de positions. Combien d'ampoules diffèrent entre les deux rangées? Ce nombre est exactement le nombre de bascules nécessaires sur la première rangée pour coller à la seconde.

C'est **conversion** sur des entiers: la distance de Hamming entre A et B. Basculer un bit, c'est passer de 0 à 1 ou de 1 à 0. Tu comptes les positions où A et B ne sont pas d'accord.

Ce post est un enseignement original pour débutants en **Java**. Même famille de questions de comptage de bits en entretien, pas une copie de livre. Partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 5, manipulation de bits.

---

## 1. Analogie du quotidien

Écris deux courtes chaînes binaires, l'une sous l'autre:

```
A:  1 1 1 0 1
B:  0 1 1 1 1
    ^       ^
```

Les marques indiquent les colonnes qui ne collent pas. Deux écarts. Bascule ces deux bits dans A et tu obtiens B.

Tu n'as pas besoin de reconstruire le nombre depuis zéro. Tu ne touches que les positions en désaccord. La question: combien y en a-t-il?

---

## 2. Énoncé en mots simples

**Entrée:** deux entiers `a` et `b` (`int` Java suffit en entretien; la même idée marche pour `long`).

**Sortie:** le nombre de positions de bits où `a` et `b` diffèrent. C'est le nombre de bascules pour passer de `a` à `b`.

**Exemples:**

| A (décimal) | B (décimal) | A binaire (bits bas) | B binaire | Bascules |
| --- | --- | --- | --- | --- |
| 29 | 15 | `11101` | `01111` | 2 |
| 0 | 0 | `0` | `0` | 0 |
| 1 | 0 | `1` | `0` | 1 |
| 7 | 0 | `111` | `000` | 3 |
| -1 | 0 | tous des uns (32 bits) | tous des zéros | 32 |

**Clarifie avant de coder:**

* `int` signé en complément à deux? (Oui en Java. Les négatifs marchent encore avec XOR et le comptage de bits.)
* Seulement les bits bas utiles, ou les 32 bits de `int`? (Les 32 pour une réponse complète; les zéros de tête collent et ajoutent zéro bascule.)
* Liste des positions ou seulement le compte? (Compte seulement.)
* `long` (64 bits) ou juste `int`? (Demande. Le code ci-dessous utilise `int`.)

---

## 3. Réfléchis d'abord

### Ce qu'une bascule fait

Basculer le bit `i` de A change uniquement ce bit. Pour transformer A en B, tu dois basculer chaque bit où ils diffèrent, et ne pas toucher là où ils collent déjà. La réponse est exactement le nombre de bits différents. Pas de raccourci plus court dans ce modèle de coût.

### Repère les écarts avec XOR

XOR vaut 1 quand les bits diffèrent, 0 quand ils collent:

| Bit A | Bit B | A XOR B |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

Donc `a ^ b` est un masque avec des 1 seulement là où il faut une bascule. Le problème se réduit à: **compter les bits à 1 dans `a ^ b`**.

### Compter les uns

Trois façons courantes:

1. **Boucle avec shift:** regarde le bit bas, décale à droite, répète 32 fois (ou jusqu'à 0 si tu ne regardes que les bits bas non négatifs; avec des négatifs en Java le shift arithmétique garde le signe, donc préfère 32 pas fixes ou un style non signé).
2. **Brian Kernighan:** `c = c & (c - 1)` éteint le bit à 1 le plus bas. Boucle jusqu'à `c == 0`. Le nombre d'itérations égale le nombre de uns, pas la largeur du type.
3. **Bibliothèque:** `Integer.bitCount(c)` en Java. Souvent mappé sur l'instruction POPCNT. Bien en prod; en entretien on te demande parfois la boucle à la main.

Les interviewers aiment entendre "XOR puis popcount" d'un trait.

---

## 4. Solutions Java

### (a) XOR + Brian Kernighan (classique d'entretien)

```java
int bitFlipCount(int a, int b) {
    int c = a ^ b;
    int count = 0;
    while (c != 0) {
        // Éteint le bit à 1 le plus bas
        c = c & (c - 1);
        count++;
    }
    return count;
}
```

Parcours avec `a = 29`, `b = 15`:

```
29 = 11101
15 = 01111
XOR  = 10010   // deux uns

c = 10010
c & (c-1) = 10000   // count 1
c & (c-1) = 00000   // count 2
return 2
```

### (b) XOR + Integer.bitCount

```java
int bitFlipCountLib(int a, int b) {
    return Integer.bitCount(a ^ b);
}
```

Même réponse. Plus court. Cite les deux: le one-liner en vrai code, Kernighan quand on demande comment bitCount pourrait marcher.

### (c) Shift et masque (parcours explicite sur 32 bits)

```java
int bitFlipCountShift(int a, int b) {
    int c = a ^ b;
    int count = 0;
    for (int i = 0; i < 32; i++) {
        count += (c & 1);
        c >>>= 1; // shift non signé, marche aussi sur les ints négatifs
    }
    return count;
}
```

Toujours 32 itérations. Clair si tu veux examiner chaque position. Un peu plus lent que Kernighan quand peu de bits sont à 1; même big-O.

### Petite démo complète

```java
public class Conversion {
    static int bitFlipCount(int a, int b) {
        int c = a ^ b;
        int count = 0;
        while (c != 0) {
            c &= (c - 1);
            count++;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(bitFlipCount(29, 15)); // 2
        System.out.println(bitFlipCount(0, 0));   // 0
        System.out.println(bitFlipCount(1, 0));   // 1
        System.out.println(bitFlipCount(7, 0));   // 3
        System.out.println(bitFlipCount(-1, 0));  // 32
    }
}
```

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| XOR + Kernighan | O(k) | O(1) | k = nombre de uns du XOR |
| XOR + 32 shifts | O(1) pour int | O(1) | 32 itérations fixes |
| `Integer.bitCount` | O(1) typique | O(1) | Souvent une instruction CPU |

Tout est constant pour des entiers à largeur fixe. L'idée compte (XOR puis compter), pas la croissance asymptotique.

---

## 6. Cas limites

* **`a == b`** → 0 bascules. XOR vaut 0.
* **L'un vaut 0** → la réponse est le nombre de uns de l'autre.
* **Négatifs** → Java utilise le complément à deux. XOR et Kernighan marchent encore. `-1 ^ 0` a 32 uns.
* **`Integer.MIN_VALUE`** → toujours ok. Tu ne divises pas et tu n'utilises pas un shift qui dépend de la magnitude si tu prends Kernighan ou `>>>`.
* **Ordre** → `flip(a, b) == flip(b, a)`. La distance est symétrique.
* **N'utilise pas `Math.abs` ni une conversion en chaîne binaire.** Plus lent, plus sale, et à côté de l'esprit du chapitre bits.
* **Version `long`** → même code avec `long c = a ^ b` et 64 pas si tu shifts, ou `Long.bitCount`.

Contrôles minimaux:

```java
assert bitFlipCount(29, 15) == 2;
assert bitFlipCount(0, 0) == 0;
assert bitFlipCount(-1, 0) == 32;
assert bitFlipCount(7, 1) == 2; // 111 vs 001
```

---

## 7. Résumé pour un ami

Conversion demande: combien de bascules de bits pour transformer A en B?

1. Les bits déjà égaux ne bougent pas. Chaque bit différent coûte une bascule.
2. `a ^ b` allume exactement les positions différentes.
3. Compte les 1 de ce XOR. Ce compte est la réponse.
4. Brian Kernighan éteint un bit à 1 par tour: `c = c & (c - 1)`.
5. Ou appelle `Integer.bitCount(a ^ b)` si les helpers de bibliothèque sont autorisés.

Si tu peux dérouler l'exemple 29 vs 15 au tableau, écrire le XOR, cercler les deux uns, et coder Kernighan sans te figer, tu maîtrises le 5.6.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Debugger](/blog/fr/ctci-5-5-debugger)
* Suivant: [Pairwise Swap](/blog/fr/ctci-5-7-pairwise-swap)