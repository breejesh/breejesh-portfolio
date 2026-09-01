---
title: "Paires de Somme Donnée: Compléments par HashMap et Deux Pointeurs (CTCI 16.24)"
description: "Identifiez toutes les paires d'entiers d'un tableau atteignant une somme cible grâce à une table de hachage de compléments en temps linéaire O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-24-pairs-with-sum.webp
previewImage: /assets/images/ctci-16-24-pairs-with-sum.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez un algorithme identifiant l'ensemble des paires d'entiers dans un tableau dont la somme est égale à une valeur cible donnée.
> * **Les Solutions Optimales :**
>   1. **Table de Hachage des Compléments en Une Seule Passe (Optimale en Temps)** :
>      * Pour chaque élément $x$, calculer son complément $\text{cible} = \text{somme} - x$.
>      * Si le complément existe dans la table avec une fréquence $> 0$, apparier $(x, \text{cible})$ et décrémenter le compteur.
>      * Sinon, enregistrer $x$ dans la table.
>      * S'exécute en **temps $O(N)$** et **espace $O(N)$**.
>   2. **Deux Pointeurs sur Tableau Trié (Optimale en Espace)** :
>      * Trier le tableau puis converger avec deux pointeurs en **temps $O(N \log N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Moteurs d'appariement d'ordres financiers (Matching Engines boursiers).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.24), l'énoncé est :

*"Isolez l'integralite des couples d'elements (a, b) au sein d'une liste d'entiers tels que a + b = cible."*

## 2. Détection par Complément Unique

Chaque valeur $x$ requiert obligatoirement son complément unique $y = \text{somme} - x$.

## Implémentation de Production

```java
import java.util.*;

public class PairsWithSum {

    public static class Pair {
        public final int first, second;
        public Pair(int first, int second) {
            this.first = first;
            this.second = second;
        }
    }

    public static List<Pair> findPairsHash(int[] array, int targetSum) {
        if (array == null || array.length < 2) return Collections.emptyList();

        List<Pair> result = new ArrayList<>();
        Map<Integer, Integer> unpaired = new HashMap<>();

        for (int x : array) {
            int comp = targetSum - x;
            int count = unpaired.getOrDefault(comp, 0);

            if (count > 0) {
                result.add(new Pair(x, comp));
                if (count == 1) {
                    unpaired.remove(comp);
                } else {
                    unpaired.put(comp, count - 1);
                }
            } else {
                unpaired.put(x, unpaired.getOrDefault(x, 0) + 1);
            }
        }

        return result;
    }

    public static List<Pair> findPairsSorted(int[] array, int targetSum) {
        if (array == null || array.length < 2) return Collections.emptyList();

        Arrays.sort(array);
        List<Pair> result = new ArrayList<>();
        int left = 0, right = array.length - 1;

        while (left < right) {
            int sum = array[left] + array[right];
            if (sum == targetSum) {
                result.add(new Pair(array[left], array[right]));
                left++;
                right--;
            } else if (sum < targetSum) {
                left++;
            } else {
                right--;
            }
        }

        return result;
    }
}
```

## Analyse de Complexité

| Approche | Complexité Temporelle | Espace Mémoire |
|---|---|---|
| **HashMap de Compléments** | **$O(N)$** | **$O(N)$** |
| **Deux Pointeurs (Trié)** | $O(N \log N)$ | $O(1)$ |

## Ingénierie des Systèmes en Production

### Architecture Système : Moteurs d'Appariement Boursier

1. **Carnets d'Ordres Financiers :** Les bourses électroniques (LMAX / Nasdaq) croisent les ordres d'achat et de vente dont les cours s'équilibrent à l'aide de tables de correspondances en mémoire vive.

## Cas Limites et Robustesse

1. **Doublons Exacts ($x = \text{complément}$) :** Suivis rigoureusement par décrémentation de compteur pour empêcher l'auto-appariement.
