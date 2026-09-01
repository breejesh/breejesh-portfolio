---
title: "Décompte des 2: Analyse Combinatoire par Rang Décimal (CTCI 17.6)"
description: "Dénombrez les apparitions du chiffre 2 dans l'intervalle [0, N] en évaluant la contribution mathématique de chaque puissance de dix en temps O(log10 N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-6-count-of-2s.webp
previewImage: /assets/images/ctci-17-6-count-of-2s.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une méthode dénombrant le nombre total d'occurrences du chiffre 2 parmi tous les entiers compris entre 0 et $n$ (inclus).
> * **La Solution Optimale:** **Décomposition Combinatoire par Puissances de 10** :
>   1. Pour chaque rang décimal ($d = 1, 10, 100, \dots \le n$), décomposer le nombre :
>      $$\text{superieur} = \lfloor n / (10d) \rfloor,\quad \text{chiffre} = \lfloor n/d \rfloor \pmod{10},\quad \text{inferieur} = n \pmod d$$
>   2. **Trois Configurations Possibles** :
>      * $\text{chiffre} < 2 \implies \text{total} += \text{superieur} \times d$
>      * $\text{chiffre} == 2 \implies \text{total} += (\text{superieur} \times d) + \text{inferieur} + 1$
>      * $\text{chiffre} > 2 \implies \text{total} += (\text{superieur} + 1) \times d$
>   3. S'exécute en **temps $O(\log_{10} n)$** (au plus 10 itérations pour 32 bits) et **espace $O(1)$**.
> * **Réalité en Production:** Audit de distribution d'identifiants dans les bases de données distribuées et Loi de Benford.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.6), l'énoncé est :

*"Evaluez la frequence cumulee d'apparition du chiffre 2 de 0 a n sans iterer sur l'integralite des n entiers."*

## 2. Découpage par Puissance Décimale

Le calcul indépendant des unités, dizaines et centaines remplace un balayage lourd par une formule arithmétique directe.

## Implémentation de Production

```java
public class CountOf2s {

    public static int count2sInRange(int n) {
        if (n < 2) return 0;

        int count = 0;
        int len = String.valueOf(n).length();

        for (int digit = 0; digit < len; digit++) {
            count += count2sAtDigit(n, digit);
        }

        return count;
    }

    private static int count2sAtDigit(int number, int d) {
        int powerOf10 = (int) Math.pow(10, d);
        int nextPowerOf10 = powerOf10 * 10;
        int right = number % powerOf10;

        int roundDown = number - (number % nextPowerOf10);
        int roundUp = roundDown + nextPowerOf10;

        int digit = (number / powerOf10) % 10;

        if (digit < 2) {
            return roundDown / 10;
        } else if (digit == 2) {
            return roundDown / 10 + right + 1;
        } else {
            return roundUp / 10;
        }
    }
}
```

## Analyse de Complexité

| Approche | Complexité Temporelle | Opérations pour $N = 10^9$ | Espace Mémoire |
|---|---|---|---|
| **Formule Combinatoire** | **$O(\log_{10} N)$** | **10 itérations** | **$O(1)$** |
| **Comptage Naïf** | $O(N \log_{10} N)$ | $9 \times 10^9$ opérations | $O(1)$ |

## Ingénierie des Systèmes en Production

### Architecture Système : Sharding de Bases de Données

1. **Bases de Données CockroachDB / Spanner :** Estimation de densité de clés sur les arbres B-Tree sans lecture de partitions disque.
2. **Détection de Fraude Financière :** Modélisation de distributions de chiffres réels selon la loi de Benford.

## Cas Limites et Robustesse

1. **$N < 2$ :** Renvoie 0 immédiatement.
2. **Entiers en Cas Limite ($N = 222$) :** Agrège correctement les fractions partielles des chiffres de poids inférieur.
