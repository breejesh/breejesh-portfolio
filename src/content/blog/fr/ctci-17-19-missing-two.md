---
title: "Deux Nombres Manquants: Équations de Somme Gaussienne et Somme des Carrés (CTCI 17.19)"
description: "Retrouvez deux nombres manquants dans un tableau de 1 à N en résolvant un système d'équations algébriques en temps O(N) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-19-missing-two.webp
previewImage: /assets/images/ctci-17-19-missing-two.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Un tableau contenant initialement les entiers de 1 à N a deux nombres supprimés. Retrouvez-les en temps $O(N)$ et espace $O(1)$.
> * **La Solution Optimale:** **Système d'Équations : Somme et Somme des Carrés**:
>   1. Calculer les déficits :
>      $$x + y = \frac{N(N+1)}{2} - \sum arr$$
>      $$x^2 + y^2 = \frac{N(N+1)(2N+1)}{6} - \sum arr_i^2$$
>   2. Dériver $xy = \frac{(x+y)^2 - (x^2+y^2)}{2}$ et résoudre l'équation du second degré.
>   3. S'exécute en **temps $O(N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Réconciliation de grands livres distribués et contrôle qualité de flux de capteurs IoT.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.19), l'énoncé est :

*"Un tableau contenant les entiers de 1 a N (au plus 32000) a perdu deux nombres. Retrouvez-les par un systeme d'equations algebriques."*

## 2. Dérivation Algébrique

En combinant les identités de Gauss (somme) et la formule des sommes de carrés, on obtient un système de deux équations à deux inconnues.

## Implémentation de Production

```java
public class MissingTwo {

    public static int[] missingTwo(int[] array) {
        int n = array.length + 2;

        long sumN = (long) n * (n + 1) / 2;
        long sumSqN = (long) n * (n + 1) * (2 * n + 1) / 6;

        long actualSum = 0;
        long actualSumSq = 0;
        for (int v : array) {
            actualSum += v;
            actualSumSq += (long) v * v;
        }

        long s1 = sumN - actualSum;
        long s2 = sumSqN - actualSumSq;
        long xy = (s1 * s1 - s2) / 2;

        long discriminant = s1 * s1 - 4 * xy;
        long sqrtD = (long) Math.round(Math.sqrt(discriminant));

        int x = (int) ((s1 + sqrtD) / 2);
        int y = (int) ((s1 - sqrtD) / 2);

        return new int[]{x, y};
    }
}
```

## Analyse de Complexité

| Approche | Complexité Temporelle | Espace | Risque de Dépassement |
|---|---|---|---|
| **Somme + Somme des Carrés** | **$O(N)$** | **$O(1)$** | Utiliser `long` pour N jusqu'à 32000. |
| Marquage BitSet | $O(N)$ | $O(N/8)$ | Aucun. |
| Tri | $O(N \log N)$ | $O(1)$ | Aucun. |

## Ingénierie des Systèmes en Production

1. **Réconciliation Comptable :** Vérification nocturne des numéros de séquence de transactions.
2. **Qualité des Capteurs IoT :** Détection des lectures manquantes dans les flux de mesures industriels.

## Cas Limites et Robustesse

1. **Dépassement Entier :** Utiliser `long` pour les sommes ; $\sum N^2 \approx 10^{10}$ reste dans le domaine `long`.
