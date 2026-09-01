---
title: "Échange de Nombres: Permutation sur Place par XOR et Arithmétique (CTCI 16.1)"
description: "Permutez deux variables sans mémoire temporaire à l'aide d'opérations XOR bit à bit et de différences arithmétiques en temps constant O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-1-number-swapper.webp
previewImage: /assets/images/ctci-16-1-number-swapper.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une fonction permettant d'échanger deux nombres sur place (in-place), sans utiliser de variable temporaire.
> * **Les Solutions Optimales :**
>   1. **XOR Bit à Bit (Insensible au Dépassement)** :
>      * `a = a ^ b;`
>      * `b = a ^ b;` (vaut `(a ^ b) ^ b = a`)
>      * `a = a ^ b;` (vaut `(a ^ b) ^ a = b`)
>   2. **Différence Arithmétique (Risque d'Overflow Signé)** :
>      * `a = a - b;`
>      * `b = a + b;` (vaut `a`)
>      * `a = b - a;` (vaut `b`)
>   3. S'exécute en **temps $O(1)$** et **espace $O(1)$**.
> * **Réalité en Production:** Instruction assembleur matérielle `XCHG` sur processeurs x86.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.1), l'énoncé est :

*"Echangez les valeurs de deux variables entieres sans allouer aucune memoire auxiliaire."*

## 2. Démonstration Mathématique avec XOR

L'opérateur XOR est commutatif, associatif et auto-inverse ($x \oplus x = 0$).
1. $a_1 = a \oplus b$
2. $b_1 = a_1 \oplus b = (a \oplus b) \oplus b = a$
3. $a_2 = a_1 \oplus b_1 = (a \oplus b) \oplus a = b$

## Implémentation de Production

```java
public class NumberSwapper {

    public static void swapXor(int[] pair) {
        if (pair == null || pair.length < 2) return;
        pair[0] = pair[0] ^ pair[1];
        pair[1] = pair[0] ^ pair[1];
        pair[0] = pair[0] ^ pair[1];
    }
}
```

```c
void swap_xor(int *a, int *b) {
    if (a != b) { // Garde d'aliasing : évite d'écraser la mémoire à zéro
        *a ^= *b;
        *b ^= *a;
        *a ^= *b;
    }
}
```

## Analyse de Complexité et Robustesse

| Méthode | Complexité Temporelle | Espace Mémoire | Risque de Dépassement (Overflow) |
|---|---|---|---|
| **XOR Bit à Bit** | `O(1)` | `O(1)` | **Nul** (Opération logique) |
| **Différence Arithmétique** | `O(1)` | `O(1)` | **Élevé** (Comportement indéfini en C sur entiers signés) |

## Ingénierie des Systèmes en Production

### Architecture Système : Le Piège de l'Aliasing de Pointeurs

1. **Adresses Identiques :** Si `swap_xor(&x, &x)` est invoqué sur la même case mémoire, `*x ^= *x` évalue à 0, détruisant la donnée.
2. **Optimisations Compilateur :** Les compilateurs modernes traduisent la permutation avec variable temporaire directement en instruction assembleur `XCHG`.

## Cas Limites et Robustesse

1. **Adresses Mémoire Confondues :** Vérification `if (a != b)` obligatoire.
