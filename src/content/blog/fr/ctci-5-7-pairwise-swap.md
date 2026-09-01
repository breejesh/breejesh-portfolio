---
title: "Échange par Paires: Permuter les Bits Pairs et Impairs avec un Minimum d'Instructions (CTCI 5.7)"
description: "Écrivez un programme pour échanger les bits pairs et impairs dans un entier 32 bits en un minimum d'instructions via des masques binaires en O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-7-pairwise-swap.webp
previewImage: /assets/images/ctci-5-7-pairwise-swap.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez un programme pour échanger les bits pairs et impairs d'un entier avec le moins d'instructions possible (par exemple le bit 0 avec le bit 1, le bit 2 avec le bit 3, etc.).
> * **La Solution Optimale:** Masquage et Décalage : (1) Extraire les bits pairs avec le masque `0xAAAAAAAA` et les décaler à droite avec `>>> 1` ; (2) Extraire les bits impairs avec le masque `0x55555555` et les décaler à gauche avec `<< 1` ; (3) Combiner via un OU logique bit-à-bit : `((x & 0xAAAAAAAA) >>> 1) | ((x & 0x55555555) << 1)` en temps $O(1)$ et espace $O(1)$.
> * **Réalité en Production:** Codes de Morton (courbes de remplissage d'espace d'ordre Z) et transposition de matrices de bits en registres SIMD.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 5.7), la question posée est :

*"Écrivez un programme pour échanger les bits pairs et impairs d'un entier avec le moins d'instructions possible."*

## 2. Mécanique des Masques Binaires

Sur un entier 32 bits :
* **Bits pairs** ($30, 28, \dots, 0$) : Masque hexadécimal `0xAAAAAAAA` ($10101010\dots_2$).
* **Bits impairs** ($31, 29, \dots, 1$) : Masque hexadécimal `0x55555555` ($01010101\dots_2$).

Opérations :
1. Isoler les bits pairs et décaler à droite : `(x & 0xaaaaaaaa) >>> 1`.
2. Isoler les bits impairs et décaler à gauche : `(x & 0x55555555) << 1`.
3. Fusionner avec l'opérateur OU (`|`).

## Implémentation de Production

```java
public class PairwiseSwap {
    /**
     * Echange les bits pairs et impairs dans un entier 32 bits.
     * Complexite Temporelle: O(1)
     * Complexite Spatiale: O(1)
     */
    public static int swapOddEvenBits(int x) {
        int evenShifted = (x & 0xaaaaaaaa) >>> 1;
        int oddShifted = (x & 0x55555555) << 1;
        return evenShifted | oddShifted;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(1)` | Exactement 3 instructions machine (ET, Décalage, OU). |
| Espace Auxiliaire | `O(1)` | Registres CPU uniquement. |

## Ingénierie des Systèmes en Production

### Architecture Système : Codes de Morton et Graphismes 3D

1. **Courbes d'Ordre Z (Codes de Morton) :** Entrelacement des coordonnées X et Y pour organiser les textures en mémoire avec une localité de cache maximale.
2. **Cryptographie Haute Performance (AES) :** Permutation parallèle de bits dans les registres vectoriels SIMD.

## Cas Limites et Robustesse

1. **Décalage Logique vs Arithmétique :** L'usage de `>>>` évite toute extension de signe sur le bit de poids fort.
2. **Entrée nulle ou valant -1 :** Traitée de manière cohérente.
