---
title: "Maximum sans Comparateurs: Calcul sans Branchement et Protection d'Overflow (CTCI 16.7)"
description: "Déterminez le maximum de deux entiers sans structure if-else ni opérateurs de comparaison via l'extraction du bit de signe et la logique branchless."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-7-number-max.webp
previewImage: /assets/images/ctci-16-7-number-max.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une méthode retournant le maximum de deux nombres sans utiliser d'instructions `if-else` ni d'opérateurs de comparaison (`<`, `>`, `==`).
> * **La Solution Optimale:** **Multiplexage sans Branchement avec Sécurité d'Overflow** :
>   1. **Extraction de Signe** : `sign(x) = (x >>> 31) ^ 1` ($1$ si $x \ge 0$, et $0$ si $x < 0$).
>   2. **Le Piège de l'Overflow** : L'évaluation directe de $a - b$ provoque un dépassement de capacité si les signes sont opposés (ex. $a = \text{MAX\_INT}, b = -10$).
>   3. **Formule Unifiée** :
>      * Si les signes diffèrent (`sa ^ sb == 1`) : retenir $a$ si positif (`k = sa`).
>      * Si les signes sont identiques (`sa ^ sb == 0`) : utiliser `sc = sign(a - b)`.
>      * Coefficient : `k = (sa ^ sb) * sa + (1 ^ (sa ^ sb)) * sc`.
>   4. **Résultat** : `return a * k + b * (k ^ 1);`.
>   5. S'exécute en **temps $O(1)$** sans rupture de pipeline d'instructions processeur.
> * **Réalité en Production:** Cryptographie en temps constant et vectorisation SIMD.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.7), l'énoncé est :

*"Calculez le maximum de deux nombres entiers sans recourir aux structures de controle conditionnelles ni aux comparateurs relationnels."*

## 2. Extraction du Bit de Signe

L'isolation du bit de poids fort permet d'élaborer un masque binaire arithmétique pour sélectionner la valeur maximale.

## Implémentation de Production

```java
public class NumberMax {

    private static int sign(int a) {
        return (a >>> 31) ^ 1;
    }

    public static int getMax(int a, int b) {
        int sa = sign(a);
        int sb = sign(b);
        int sc = sign(a - b);

        int useSignA = sa ^ sb;
        int useSignC = useSignA ^ 1;

        int k = useSignA * sa + useSignC * sc;
        int q = k ^ 1;

        return a * k + b * q;
    }
}
```

## Analyse de Complexité

| Métrique | Valeur | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(1)` | Suite d'instructions logiques pures sans saut conditionnel. |
| Espace Mémoire | `O(1)` | Aucune allocation sur le tas. |
| Défauts de Prédiction | `0%` | Exécution strictement déterministe. |

## Ingénierie des Systèmes en Production

### Architecture Système : Cryptographie en Temps Constant

1. **Résistance aux Canaux Auxiliaires :** Les instructions de saut conditionnel fuient des informations temporelles exploitables lors d'attaques par canaux cachés. Les algorithmes sans branchement garantissent un temps de calcul invariant.
2. **Instructions SIMD :** Exploitation matérielle via `_mm256_max_epi32` (AVX2).

## Cas Limites et Robustesse

1. **Bornes Limites :** Traite sans erreur la combinaison `Integer.MAX_VALUE` et `Integer.MIN_VALUE`.
