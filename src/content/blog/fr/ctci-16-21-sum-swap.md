---
title: "Échange de Sommes: Partition Équilibrée et Compléments par HashSet (CTCI 16.21)"
description: "Trouvez une paire d'entiers dans deux tableaux dont l'échange équilibre parfaitement la somme des deux collections en temps linéaire O(A + B)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-21-sum-swap.webp
previewImage: /assets/images/ctci-16-21-sum-swap.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit deux tableaux d'entiers, trouvez une paire d'éléments (un dans chaque tableau) à échanger pour que la somme totale des deux tableaux devienne identique.
> * **La Dérivation Algébrique :**
>   1. Soit $S_A = \sum A$ et $S_B = \sum B$ :
>      $$S_A - a + b = S_B - b + a \implies 2(a - b) = S_A - S_B \implies a - b = \frac{S_A - S_B}{2}$$
>   2. **Test de Parité** : Si $S_A - S_B$ est impair, aucun échange d'entiers n'est possible ; renvoyer `null`.
>   3. **Recherche de Cible** : Rechercher l'élément $b = a - \frac{S_A - S_B}{2}$.
> * **Les Solutions Optimales :**
>   * **Recherche par HashSet** : Insérer $B$ dans un ensemble et tester $b = a - \Delta$ en **temps $O(A + B)$** et **espace $O(B)$**.
>   * **Deux Pointeurs sur Tableaux Triés** : En **temps $O(A \log A + B \log B)$** et **espace $O(1)$**.
> * **Réalité en Production:** Rééquilibrage de charge de processeurs dans des clusters et réconciliation de livres comptables.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.21), l'énoncé est :

*"Identifiez le couple d'elements dont la permutation entre deux listes aboutit a l'egalite parfaite des sommes cumulees."*

## 2. Équation d'Équilibre

La résolution de l'équation différentielle ramène le problème à une recherche de complément ensembliste classique.

## Implémentation de Production

```java
import java.util.HashSet;
import java.util.Set;

public class SumSwap {

    public static int[] findSwapValuesHash(int[] a, int[] b) {
        if (a == null || b == null || a.length == 0 || b.length == 0) {
            return null;
        }

        long sumA = 0;
        for (int v : a) sumA += v;

        long sumB = 0;
        Set<Integer> setB = new HashSet<>();
        for (int v : b) {
            sumB += v;
            setB.add(v);
        }

        long diff = sumA - sumB;
        if (diff % 2 != 0) return null;

        long targetDelta = diff / 2;

        for (int valA : a) {
            long targetB = valA - targetDelta;
            if (targetB >= Integer.MIN_VALUE && targetB <= Integer.MAX_VALUE) {
                if (setB.contains((int) targetB)) {
                    return new int[] { valA, (int) targetB };
                }
            }
        }

        return null;
    }
}
```

## Analyse de Complexité

| Approche | Complexité Temporelle | Espace Mémoire |
|---|---|---|
| **Complément HashSet** | **$O(A + B)$** | **$O(B)$** |
| **Deux Pointeurs (Trié)** | $O(A \log A + B \log B)$ | $O(1)$ |

## Ingénierie des Systèmes en Production

### Architecture Système : Équilibrage de Charge Distribué

1. **Ordonnancement Kubernetes :** Déplacement de charges de calcul entre nœuds pour uniformiser l'utilisation de la RAM.
2. **Audit Comptable :** Réconciliation des écritures en partie double.

## Cas Limites et Robustesse

1. **Différence Impaire :** Interception immédiate par le modulo pour éviter tout traitement inutile.
