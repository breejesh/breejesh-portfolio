---
title: "K-ième Multiple: Facteurs Premiers 3, 5 et 7 en Temps O(K) (CTCI 17.9)"
description: "Générez le k-ième entier dont les seuls facteurs premiers sont 3, 5 et 7 grâce à la programmation dynamique à trois pointeurs en temps linéaire O(K)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-9-kth-multiple.webp
previewImage: /assets/images/ctci-17-9-kth-multiple.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez un algorithme retournant le $k$-ième entier dont les uniques diviseurs premiers sont 3, 5 et 7 ($1, 3, 5, 7, 9, 15, 21, 25, 27, 35, \dots$).
> * **La Solution Optimale:** **Programmation Dynamique à Trois Pointeurs** :
>   1. Initialiser un tableau `dp` de dimension $k$ avec `dp[0] = 1`.
>   2. Maintenir trois pointeurs de flux : $p_3 = 0, p_5 = 0, p_7 = 0$.
>   3. À chaque étape $i \in [1, k-1]$ :
>      * Calculer les multiples candidats : $v_3 = 3 \cdot dp[p_3], v_5 = 5 \cdot dp[p_5], v_7 = 7 \cdot dp[p_7]$.
>      * Retenir le minimum : $dp[i] = \min(v_3, v_5, v_7)$.
>      * Incrémenter tous les pointeurs produisant ce minimum afin d'éliminer naturellement les doublons (ex. $15 = 3 \times 5 = 5 \times 3$).
>   4. S'exécute en **temps $O(K)$** et **espace $O(K)$**.
> * **Réalité en Production:** Nombres réguliers de Hamming en traitement du signal (FFT) et factorisation d'entiers lisses en cryptographie.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.9), l'énoncé est :

*"Identifiez le k-ieme entier strictement positif dont la decomposition en facteurs premiers ne contient que 3, 5 et 7."*

## 2. Fusion Monotone à Trois Pointeurs

La progression synchronisée des indices garantit une suite strictement ordonnée sans insertions redondantes.

## Implémentation de Production

```java
public class KthMultiple {

    public static long getKthMultiple(int k) {
        if (k <= 0) return 0;

        long[] dp = new long[k];
        dp[0] = 1;

        int p3 = 0, p5 = 0, p7 = 0;

        for (int i = 1; i < k; i++) {
            long next3 = dp[p3] * 3;
            long next5 = dp[p5] * 5;
            long next7 = dp[p7] * 7;

            long minVal = Math.min(next3, Math.min(next5, next7));
            dp[i] = minVal;

            if (minVal == next3) p3++;
            if (minVal == next5) p5++;
            if (minVal == next7) p7++;
        }

        return dp[k - 1];
    }
}
```

## Analyse de Complexité

| Approche | Complexité Temporelle | Espace Mémoire | Dédoublonnage |
|---|---|---|---|
| **Trois Pointeurs DP** | **$O(K)$** | **$O(K)$** | **Natif (Avancement Partagé)** |
| **Tas Min (PriorityQueue)** | $O(K \log K)$ | $O(K)$ | Requiert un HashSet auxiliaire |

## Ingénierie des Systèmes en Production

### Architecture Système : Nombres Lisses et FFT

1. **Transformée de Fourier Rapide (FFTW) :** Les algorithmes de Cooley-Tukey atteignent une efficacité maximale sur des tailles de tampons lisses (*smooth numbers*).
2. **Crible Quadratique :** Recherche de congruences de carrés en cryptanalyse RSA.

## Cas Limites et Robustesse

1. **Entiers 64 bits (`long`) :** Prévient les dépassements arithmétiques au-delà de $k > 1 000$.
2. **$k = 1$ :** Renvoie immédiatement la valeur neutre $1$.
