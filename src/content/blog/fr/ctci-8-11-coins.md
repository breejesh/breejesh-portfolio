---
title: "Pièces de Monnaie: Programmation Dynamique pour le Rendu de Monnaie (CTCI 8.11)"
description: "Calculez le nombre de façons de former n centimes avec des pièces illimitées de 25c, 10c, 5c et 1c par programmation dynamique en temps O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-11-coins.webp
previewImage: /assets/images/ctci-8-11-coins.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Étant donné un nombre infini de pièces de 25 cents (quarters), 10 cents (dimes), 5 cents (nickels) et 1 cent (pennies), écrivez un code pour calculer le nombre de façons de représenter $n$ cents.
> * **La Solution Optimale:** Programmation Dynamique 1D / Mémoïsation 2D : (1) Tableau des valeurs `[25, 10, 5, 1]` ; (2) Mémoïsation 2D `memo[montant][indice]` ; (3) Approche itérative ascendante 1D `ways[i] += ways[i - coin]` pour chaque pièce, s'exécutant en **temps $O(N)$** et **espace $O(N)$**.
> * **Réalité en Production:** Algorithmes de caisses enregistreuses et fragmentation de paquets réseau (MTU).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 8.11), l'énoncé est :

*"Calculez le nombre de combinaisons possibles pour former n centimes a l'aide de pieces de 25, 10, 5 et 1 cents disponibles en quantite illimitee."*

## 2. Formulations en Programmation Dynamique

1. **Approche Récursive avec Mémoïsation 2D :** À chaque niveau, choisir de prendre $0, 1, 2, \dots$ pièces de la valeur courante puis déléguer le reste aux dénominations suivantes.
2. **Programmation Dynamique 1D Ascendante :** Initialiser `ways[0] = 1`. Pour chaque pièce, accumuler les solutions : `ways[i] += ways[i - coin]`.

## Implémentation de Production

```java
public class CoinChange {
    /**
     * Approche Recursive avec Memoisation 2D.
     * Complexite Temporelle: O(N * D)
     * Complexite Spatiale: O(N * D)
     */
    public static int makeChange(int amount) {
        int[] denoms = {25, 10, 5, 1};
        int[][] map = new int[amount + 1][denoms.length];
        return makeChangeHelper(amount, denoms, 0, map);
    }

    private static int makeChangeHelper(int amount, int[] denoms, int index, int[][] map) {
        if (map[amount][index] > 0) return map[amount][index];
        if (index >= denoms.length - 1) return 1;

        int denomAmount = denoms[index];
        int ways = 0;
        for (int i = 0; i * denomAmount <= amount; i++) {
            int amountRemaining = amount - i * denomAmount;
            ways += makeChangeHelper(amountRemaining, denoms, index + 1, map);
        }

        map[amount][index] = ways;
        return ways;
    }

    /**
     * Programmation Dynamique 1D Ascendante.
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(N)
     */
    public static int makeChangeBottomUp(int n) {
        int[] denoms = {25, 10, 5, 1};
        int[] ways = new int[n + 1];
        ways[0] = 1;

        for (int coin : denoms) {
            for (int i = coin; i <= n; i++) {
                ways[i] += ways[i - coin];
            }
        }

        return ways[n];
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | 4 passages linéaires sur le tableau de taille $N + 1$. |
| Espace Auxiliaire | `O(N)` | Tableau 1D de programmation dynamique. |

## Ingénierie des Systèmes en Production

### Architecture Système : Découpage et Problème du Sac à Dos

1. **Distributeurs et Terminaux Point de Vente :** Algorithmes d'optimisation de rendu sous contrainte de stock monétaire.
2. **Fragmentation Réseau :** Découpage de buffers de transmission selon la MTU standard (1500 octets).

## Cas Limites et Robustesse

1. **$n = 0$ centime :** Renvoie 1 solution (0 pièce).
2. **Montants inférieurs à 5 :** Renvoie 1 (uniquement des pièces de 1 cent).
