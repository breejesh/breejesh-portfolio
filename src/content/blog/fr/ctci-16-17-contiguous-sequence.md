---
title: "Séquence Contiguë: Somme Maximale de Sous-Tableaux via l'Algorithme de Kadane (CTCI 16.17)"
description: "Calculez la somme contiguë maximale dans un tableau d'entiers grâce à la programmation dynamique et à l'algorithme de Kadane en temps linéaire O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-17-contiguous-sequence.webp
previewImage: /assets/images/ctci-16-17-contiguous-sequence.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un tableau d'entiers (positifs et négatifs), trouvez la séquence contiguë dont la somme est maximale et renvoyez cette valeur (ex. `[2, -8, 3, -2, 4, -10]` $\to$ `5` issu de `[3, -2, 4]`).
> * **La Solution Optimale:** **Algorithme de Kadane (Programmation Dynamique)** :
>   1. Initialiser `maxSum = 0` et `runningSum = 0`.
>   2. Pour chaque élément $x$ :
>      * Accumuler `runningSum += x;`.
>      * Actualiser `maxSum = Math.max(maxSum, runningSum);`.
>      * Réinitialisation : Si `runningSum < 0`, remettre `runningSum = 0;` (un préfixe négatif dégrade tout sous-tableau ultérieur).
>   3. S'exécute en **temps $O(N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Analyse de gain maximal en trading haute fréquence et détection d'îlots denses en génomique.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.17), l'énoncé est :

*"Evaluez la somme contigue maximale possible au sein d'un tableau compose de valeurs positives et negatives."*

## 2. Équation de Récurrence de Kadane

$$DP[i] = \max(A[i], DP[i-1] + A[i])$$

Dès qu'un sous-ensemble accumulé devient négatif, il est immédiatement tronqué pour repartir d'une somme nulle.

## Implémentation de Production

```java
public class ContiguousSequence {

    public static int getMaxSum(int[] array) {
        if (array == null || array.length == 0) return 0;

        int maxSum = 0;
        int runningSum = 0;

        for (int x : array) {
            runningSum += x;
            if (runningSum > maxSum) {
                maxSum = runningSum;
            } else if (runningSum < 0) {
                runningSum = 0;
            }
        }

        return maxSum;
    }

    public static int getMaxSumNonEmpty(int[] array) {
        if (array == null || array.length == 0) {
            throw new IllegalArgumentException("Le tableau ne doit pas être vide");
        }

        int maxSoFar = array[0];
        int currentMax = array[0];

        for (int i = 1; i < array.length; i++) {
            currentMax = Math.max(array[i], currentMax + array[i]);
            maxSoFar = Math.max(maxSoFar, currentMax);
        }

        return maxSoFar;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Une seule passe séquentielle sur le tableau. |
| Espace Mémoire | `O(1)` | Deux registres scalaires constants. |

## Ingénierie des Systèmes en Production

### Architecture Système : Finance Quantitative

1. **Calcul de Gain Maximal :** En finance de marché, l'algorithme de Kadane traite en flux continu les variations de cours pour détecter les opportunités d'arbitrage.
2. **Génomique :** Identification de segments riches en GC dans les séquences d'ADN.

## Cas Limites et Robustesse

1. **Tableau Entièrement Négatif :** La version standard du livre renvoie `0` (sous-ensemble vide), tandis que la variante non vide renvoie le plus grand élément négatif.
