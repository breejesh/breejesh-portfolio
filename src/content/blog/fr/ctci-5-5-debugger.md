---
title: "Débogueur: Comprendre ((n & (n - 1)) == 0) et la Détection des Puissances de Deux (CTCI 5.5)"
description: "Expliquez le fonctionnement bit-à-bit de l'expression ((n & (n - 1)) == 0) et comment elle identifie les puissances de deux en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-5-5-debugger.webp
previewImage: /assets/images/ctci-5-5-debugger.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Expliquez ce que fait le code suivant : `((n & (n - 1)) == 0)`.
> * **L'Explication Optimale:** Soustraire 1 à $n$ inverse le bit 1 le plus bas à `0` et tous les zéros qui le suivent à `1`. Si $n$ ne possède qu'un seul bit 1 (c'est-à-dire que $n$ est une puissance de deux), $n$ et $n - 1$ ne partagent aucun bit 1 en commun, donc $n \ \& \ (n - 1)$ vaut `0`. Ainsi, `((n & (n - 1)) == 0)` vérifie si $n$ est une **puissance de deux** (ou 0) en temps $O(1)$ et espace $O(1)$.
> * **Réalité en Production:** Calcul d'indices dans les tampons circulaires (Ring Buffers) et masquage d'alvéoles de tables de hachage.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 5.5), la question posée est :

*"Expliquez ce que fait le code suivant : `((n & (n - 1)) == 0)`"*

## 2. Démonstration Bit-à-Bit

Lors de la soustraction de 1 à un entier $n$ :
1. **$n$ se termine par 1 :**
   * $n = \text{abc}1$
   * $n - 1 = \text{abc}0$
   * $n \ \& \ (n - 1) = \text{abc}0$ (efface le bit 1 le plus bas).
2. **$n$ se termine par des zéros :**
   * $n = \text{abc}1000$
   * $n - 1 = \text{abc}0111$
   * $n \ \& \ (n - 1) = \text{abc}0000$.

L'opération $n \ \& \ (n - 1)$ **efface systématiquement le bit 1 de poids le plus faible**.

### Condition d'Égalité à Zéro
Le résultat est `0` si et seulement s'il n'existe aucun autre bit 1 supérieur ($\text{abc} = 0$), ce qui signifie que $n$ possède **au plus un seul bit 1** :
* Si $n = 0$ : $0 \ \& \ -1 = 0 \implies \text{true}$.
* Si $n = 2^k$ (puissance de deux) : le seul bit 1 est effacé $\implies \text{true}$.
* Si $n$ a 2 bits 1 ou plus : $\text{false}$.

Conclusion :
$$\text{estPuissanceDeDeux}(n) \iff n > 0 \text{ et } ((n \ \& \ (n - 1)) == 0)$$

## Implémentation de Production

```java
public class Debugger {
    /**
     * Verifie si un entier positif est une puissance exacte de deux.
     * Complexite Temporelle: O(1)
     * Complexite Spatiale: O(1)
     */
    public static boolean isPowerOfTwo(int n) {
        return n > 0 && ((n & (n - 1)) == 0);
    }

    /**
     * Efface le bit 1 le plus bas (algorithme de Brian Kernighan).
     */
    public static int clearLowestSetBit(int n) {
        return n & (n - 1);
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(1)` | Soustraction et opération ET logique (1 cycle processeur). |
| Espace Auxiliaire | `O(1)` | Zéro allocation mémoire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Optimisation par Puissances de Deux

1. **Tampons Circulaires (Disruptor / Netty) :** Avec une capacité $C = 2^k$, le modulo `index % C` est remplacé par le masque binaire `index & (C - 1)`.
2. **Tables de Hachage (Java `HashMap`) :** Tailles forcées en puissances de deux pour un calcul de bucket instantané.

## Cas Limites et Robustesse

1. **$n = 0$ :** Donne `true`. En production, ajouter la garde `n > 0`.
2. **Nombres négatifs :** `Integer.MIN_VALUE` ne contient qu'un seul bit 1 ; la vérification `n > 0` évite les faux positifs.
