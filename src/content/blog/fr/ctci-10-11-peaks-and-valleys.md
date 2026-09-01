---
title: "Pics et Vallées: Tri de Sous-Séquence Alternée en Temps Linéaire (CTCI 10.11)"
description: "Réorganisez un tableau d'entiers en une séquence alternée de pics et de vallées par permutation gloutonne de maximums locaux en temps O(N) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
previewImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Dans un tableau d'entiers, un « pic » est un élément $\ge$ à ses voisins immédiats, et une « vallée » est un élément $\le$ à ses voisins. Triez le tableau sous forme de séquence alternée de pics et de vallées.
> * **La Solution Optimale:** **Permutation Gloutonne de Maximums Locaux** : (1) Au lieu de trier en $O(N \log N)$, itérer sur les indices impairs `for (int i = 1; i < array.length; i += 2)` en désignant chaque indice $i$ comme un pic ; (2) Examiner la fenêtre de 3 éléments $\{A[i-1], A[i], A[i+1]\}$ ; (3) Trouver la valeur maximale et la permuter en position $i$ ; (4) Cette permutation préserve strictement la validité du pic précédent $A[i-2]$ ; (5) S'exécute en **temps $O(N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Traitement de signaux audio/sismiques (DSP) et indicateurs financiers ZigZag.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.11), l'énoncé est :

*"Reorganisez un tableau d'entiers pour alterner successivement des pics et des vallees de maniere contigue."*

## 2. Invariant Glouton en Temps Linéaire

Trier en $O(N \log N)$ puis inverser les paires adjacentes est sous-optimal.

En observant la fenêtre locale $\{A[i-1], A[i], A[i+1]\}$ aux indices impairs :
* Déplacer le maximum en $A[i]$ assure $A[i] \ge A[i-1]$ et $A[i] \ge A[i+1]$.
* Comme la nouvelle valeur affectée à $A[i-1]$ est nécessairement inférieure ou égale à sa valeur d'origine, la relation $A[i-2] \ge A[i-1]$ demeure intacte.

## Implémentation de Production

```java
public class PeaksAndValleys {
    /**
     * Reorganise le tableau en pics et vallees alternes.
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(1)
     */
    public static void sortValleyPeak(int[] array) {
        for (int i = 1; i < array.length; i += 2) {
            int biggestIndex = maxIndex(array, i - 1, i, i + 1);
            if (i != biggestIndex) {
                swap(array, i, biggestIndex);
            }
        }
    }

    private static int maxIndex(int[] array, int a, int b, int c) {
        int len = array.length;
        int aValue = a >= 0 && a < len ? array[a] : Integer.MIN_VALUE;
        int bValue = b >= 0 && b < len ? array[b] : Integer.MIN_VALUE;
        int cValue = c >= 0 && c < len ? array[c] : Integer.MIN_VALUE;

        int max = Math.max(aValue, Math.max(bValue, cValue));
        if (aValue == max) return a;
        if (bValue == max) return b;
        return c;
    }

    private static void swap(int[] array, int left, int right) {
        int temp = array[left];
        array[left] = array[right];
        array[right] = temp;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | $N / 2$ évaluations locales et permutations en place. |
| Espace Auxiliaire | `O(1)` | Aucune allocation de mémoire dynamique supplémentaire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Traitement de Signaux Numériques

1. **Compression d'Ondes Sonores / Sismiques :** Extraction des extrema locaux pour compresser des signaux analogiques continus.
2. **Indicateurs Boursiers (ZigZag) :** Élimination du bruit haute fréquence dans les séries temporelles financières.

## Cas Limites et Robustesse

1. **Tableaux Courts ($N \le 2$) :** Pris en charge sans erreur d'indice.
2. **Éléments Identiques :** Aucun échange superflu n'est opéré.
