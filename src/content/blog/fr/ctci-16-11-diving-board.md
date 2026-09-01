---
title: "Plongeoir: Génération Combinatoire de Longueurs en Temps Linéaire (CTCI 16.11)"
description: "Générez l'ensemble des longueurs uniques d'un plongeoir composé de K planches courtes et longues via une itération directe fermée en temps O(K)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-11-diving-board.webp
previewImage: /assets/images/ctci-16-11-diving-board.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Vous assemblez un plongeoir en plaçant bout à bout exactement $K$ planches de bois. Il existe deux types de planches : courtes ($s$) et longues ($l$). Écrivez une méthode générant toutes les longueurs possibles du plongeoir.
> * **La Solution Optimale:** **Formule Analytique Directe et Itération Linéaire** :
>   1. Toute configuration comprend $i$ planches courtes et $(K - i)$ planches longues ($0 \le i \le K$).
>   2. La formule de longueur totale est :
>      $$\text{Longueur}(i) = i \times s + (K - i) \times l$$
>   3. Si $s == l$, il n'existe qu'une unique longueur ($K \times s$).
>   4. Si $s \ne l$, faire varier $i$ de $0$ à $K$ engendre exactement **$K + 1$ longueurs distinctes**.
>   5. S'exécute en **temps $O(K)$** et **espace $O(K)$**.
> * **Réalité en Production:** Modélisation des tolérances d'usinage mécanique et calibration de blocs mémoire dans jemalloc.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.11), l'énoncé est :

*"Generez l'integralite des longueurs totales distinctes pouvant etre formees par l'assemblage de K planches courtes et longues."*

## 2. Propriété Combinatoire : $K + 1$ Valeurs Distinctes

L'addition étant commutative, l'ordre d'assemblage n'influe aucunement sur la longueur finale ; seul le décompte $i$ de planches courtes compte.

## Implémentation de Production

```java
public class DivingBoard {

    public static int[] allLengths(int k, int shorter, int longer) {
        if (k <= 0) return new int[0];
        if (shorter == longer) return new int[] { k * shorter };

        int[] lengths = new int[k + 1];

        for (int i = 0; i <= k; i++) {
            int nShorter = i;
            int nLonger = k - i;
            lengths[i] = nShorter * shorter + nLonger * longer;
        }

        return lengths;
    }
}
```

## Analyse de Complexité

| Approche | Complexité Temporelle | Espace Mémoire | Structures Requises |
|---|---|---|---|
| **Formule Directe** | **$O(K)$** | **$O(K)$** | **Tableau direct** |
| **DFS avec Mémoïsation** | $O(K^2)$ | $O(K^2)$ | HashSet + Pile récursive |

## Ingénierie des Systèmes en Production

### Architecture Système : Dimensionnement de Pages Mémoire

1. **Classes de Tailles jemalloc :** Les allocateurs mémoire génèrent les tailles de compartiments via des suites arithmétiques pour garantir une allocation déterministe.

## Cas Limites et Robustesse

1. **$K \le 0$ :** Renvoie un tableau vide.
2. **Planches Identiques ($s = l$) :** Renvoie un tableau à un élément ($K \times s$).
