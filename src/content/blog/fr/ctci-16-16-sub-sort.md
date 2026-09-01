---
title: "Sous-Tri: Fenêtre Minimale Non-Triée en Temps Linéaire (CTCI 16.16)"
description: "Identifiez les indices optimaux [m, n] dont le tri ordonne le tableau entier grâce à deux balayages linéaires d'extrema en temps O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-16-sub-sort.webp
previewImage: /assets/images/ctci-16-16-sub-sort.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un tableau d'entiers, trouvez les indices $m$ et $n$ tels que le tri des éléments situés entre $m$ et $n$ rende le tableau entièrement trié. Minimisez la distance $n - m$.
> * **La Solution Optimale:** **Double Balayage des Extrema (Maximum et Minimum Cumulés)** :
>   1. **Borne Droite ($n$)** : Parcourir de gauche à droite ($0 \to N-1$) en maintenant `maxVu`. Le dernier élément vérifiant $A[i] < \text{maxVu}$ donne $n$.
>   2. **Borne Gauche ($m$)** : Parcourir de droite à gauche ($N-1 \to 0$) en maintenant `minVu`. Le premier élément vérifiant $A[j] > \text{minVu}$ donne $m$.
>   3. En l'absence d'inversion, le tableau est déjà ordonné ($[-1, -1]$).
>   4. S'exécute en **temps $O(N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Compactage de tables SSTable dans RocksDB et réalignement de trames réseau désordonnées.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.16), l'énoncé est :

*"Isolez la plus petite sequence contigue [m, n] dont le tri garantit le tri absolu du tableau."*

## 2. Partitionnement en Trois Segments

Le tableau est segmenté en :
`[Préfixe Trié] | [Fenêtre Désordonnée [m, n]] | [Suffixe Trié]`

## Implémentation de Production

```java
public class SubSort {

    public static class Range {
        public final int start, end;
        public Range(int start, int end) {
            this.start = start;
            this.end = end;
        }
    }

    public static Range findUnsortedSequence(int[] array) {
        if (array == null || array.length <= 1) {
            return new Range(-1, -1);
        }

        int n = array.length;
        int rightIndex = -1;
        int maxSeen = array[0];

        for (int i = 1; i < n; i++) {
            if (array[i] < maxSeen) {
                rightIndex = i;
            } else {
                maxSeen = array[i];
            }
        }

        if (rightIndex == -1) return new Range(-1, -1);

        int leftIndex = -1;
        int minSeen = array[n - 1];

        for (int j = n - 2; j >= 0; j--) {
            if (array[j] > minSeen) {
                leftIndex = j;
            } else {
                minSeen = array[j];
            }
        }

        return new Range(leftIndex, rightIndex);
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Deux parcours linéaires complets. |
| Espace Mémoire | `O(1)` | Suivi scalaire des bornes extrêmes. |

## Ingénierie des Systèmes en Production

### Architecture Système : Compactage dans les Moteurs LSM

1. **RocksDB / Cassandra :** Les moteurs LSM-Tree évitent de fusionner l'intégralité des fichiers disque en limitant les réorganisations aux clés contenues dans la fenêtre minimale désordonnée $[m, n]$.
2. **Assemblage TCP SACK :** Détection de paquets désordonnés dans les tampons de réception.

## Cas Limites et Robustesse

1. **Tableau Déjà Trié :** Renvoie `[-1, -1]`.
2. **Tableau Strictement Décroissant :** Renvoie `[0, N-1]`.
