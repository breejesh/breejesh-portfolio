---
title: "Nombre Manquant: Partitionnement par Parité Binaire en Temps Linéaire (CTCI 17.4)"
description: "Identifiez le nombre manquant entre 0 et N avec accès au bit par bit grâce à l'élimination récursive de parité de colonnes en temps géométrique O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-4-missing-number.webp
previewImage: /assets/images/ctci-17-4-missing-number.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Un tableau contient tous les entiers de $0$ à $n$, sauf un qui est manquant. Vous ne pouvez lire que le $j$-ième bit de $A[i]$ via `fetch(i, j)`. Trouvez le nombre manquant en temps $O(n)$.
> * **La Solution Optimale:** **Élimination Récursive par Parité de Colonne** :
>   1. Sur l'ensemble $0..n$, le nombre de zéros sur le bit de poids faible (LSB) est toujours supérieur ou égal au nombre de uns ($\text{zéros} \ge \text{uns}$).
>   2. Dénombrer les bits LSB :
>      * Si $\text{zéros} \le \text{uns}$, le nombre retiré possédait un **0** sur ce bit. Filtrer pour ne conserver que les nombres avec LSB = 0 et récurser sur la colonne 1.
>      * Si $\text{zéros} > \text{uns}$, le nombre retiré possédait un **1** sur ce bit. Filtrer pour ne conserver que les nombres avec LSB = 1 et récurser sur la colonne 1.
>   3. **Reconstruction** : $\text{manquant} = (\text{récursion} \ll 1) \mid \text{bit}$.
>   4. **Série Géométrique** : $T(n) = n + \frac{n}{2} + \frac{n}{4} + \cdots = 2n = O(n)$.
> * **Réalité en Production:** Mémoire ECC avec détection d'inversion de bits et bases de données en colonnes (Apache Parquet).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.4), l'énoncé est :

*"Retrouvez l'entier manquant de 0 a n en temps O(n) en interrogeant exclusivement les bits individuels des nombres."*

## 2. Réduction par Parité Binaire

La division par deux de la taille du tableau à chaque colonne de bit assure une complexité temporelle totale linéaire bornée par $2N$.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.List;

public class MissingNumberFinder {

    public interface BitInteger {
        int fetch(int column);
    }

    public static int findMissing(List<BitInteger> array) {
        return findMissingHelper(array, 0);
    }

    private static int findMissingHelper(List<BitInteger> input, int column) {
        if (column >= 32 || input.isEmpty()) return 0;

        List<BitInteger> zeros = new ArrayList<>(input.size() / 2);
        List<BitInteger> ones = new ArrayList<>(input.size() / 2);

        for (BitInteger num : input) {
            if (num.fetch(column) == 0) {
                zeros.add(num);
            } else {
                ones.add(num);
            }
        }

        if (zeros.size() <= ones.size()) {
            int v = findMissingHelper(zeros, column + 1);
            return (v << 1) | 0;
        } else {
            int v = findMissingHelper(ones, column + 1);
            return (v << 1) | 1;
        }
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Somme géométrique : $N + N/2 + N/4 + \dots = 2N$. |
| Espace Mémoire | `O(N)` | Listes intermédiaires allouées à chaque niveau de récursion. |

## Ingénierie des Systèmes en Production

### Architecture Système : Formats en Colonnes et Mémoire ECC

1. **Parquet / ClickHouse :** Évaluation des requêtes analytiques directement sur des vecteurs de bits compressés.
2. **Mémoire ECC :** Les contrôleurs mémoire isolent les défaillances de cellules DRAM via des codes de Hamming.

## Cas Limites et Robustesse

1. **Zéro Manquant :** Reconstruit fidèlement grâce à l'égalité stricte des longueurs de sous-listes.
