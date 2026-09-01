---
title: "Les K Plus Petits Éléments: Quickselect Linéaire vs Tas Max Borné (CTCI 17.14)"
description: "Trouvez les K plus petits éléments d'un tableau grâce au Quickselect de Hoare en temps linéaire espéré O(N) et aux tas bornés en temps O(N log K)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-14-smallest-k.webp
previewImage: /assets/images/ctci-17-14-smallest-k.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez un algorithme identifiant les $k$ plus petits nombres au sein d'un tableau non trié de dimension $n$.
> * **Les Solutions Optimales:**
>   1. **Quickselect (Algorithme de Sélection de Hoare)** :
>      * Partitionner le tableau autour d'un pivot.
>      * Si `pivotIndex == k`, les $k$ plus petits nombres sont regroupés dans `array[0..k-1]`.
>      * Si $k < \text{pivotIndex}$, récurser à gauche ; sinon récurser à droite.
>      * S'exécute en **temps moyen linéaire $O(N)$** et **espace $O(1)$**.
>   2. **Tas Max Borné (Max-Heap)** :
>      * Maintenir une file à priorité de taille $k$. Évincer la racine si le nouvel élément est plus petit.
>      * S'exécute en **temps $O(N \log K)$** et **espace $O(K)$** (adapté aux flux continus).
> * **Réalité en Production:** Requêtes `ORDER BY col LIMIT K` dans PostgreSQL et sélection des meilleurs résultats de recherche dans Elasticsearch.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.14), l'énoncé est :

*"Extrayez les k plus petites valeurs d'un tableau sans ordonner la totalite des elements."*

## 2. Partitionnement et Réduction Géométrique

L'élimination séquentielle d'une moitié du tableau assure une convergence en temps $O(N)$.

## Implémentation de Production

```java
import java.util.*;

public class SmallestK {

    public static int[] smallestKQuickselect(int[] array, int k) {
        if (array == null || k <= 0 || k > array.length) return new int[0];

        quickselect(array, 0, array.length - 1, k);

        int[] result = new int[k];
        System.arraycopy(array, 0, result, 0, k);
        return result;
    }

    private static void quickselect(int[] arr, int left, int right, int k) {
        if (left >= right) return;

        int pivotIndex = partition(arr, left, right);

        if (pivotIndex == k) {
            return;
        } else if (k < pivotIndex) {
            quickselect(arr, left, pivotIndex - 1, k);
        } else {
            quickselect(arr, pivotIndex + 1, right, k);
        }
    }

    private static int partition(int[] arr, int left, int right) {
        int pivot = arr[right];
        int i = left;

        for (int j = left; j < right; j++) {
            if (arr[j] <= pivot) {
                swap(arr, i, j);
                i++;
            }
        }
        swap(arr, i, right);
        return i;
    }

    private static void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    public static int[] smallestKHeap(int[] array, int k) {
        if (array == null || k <= 0 || k > array.length) return new int[0];

        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(k, Collections.reverseOrder());

        for (int x : array) {
            if (maxHeap.size() < k) {
                maxHeap.add(x);
            } else if (x < maxHeap.peek()) {
                maxHeap.poll();
                maxHeap.add(x);
            }
        }

        int[] result = new int[k];
        for (int i = 0; i < k; i++) {
            result[i] = maxHeap.poll();
        }
        return result;
    }
}
```

## Analyse de Complexité

| Approche | Complexité Temporelle | Espace Mémoire | Modification sur Place | Flux Continu |
|---|---|---|---|---|
| **Quickselect** | **Espéré $O(N)$** | **$O(1)$** | **Oui** | Non |
| **Tas Max Borné** | **$O(N \log K)$** | **$O(K)$** | **Non** | **Oui** |

## Ingénierie des Systèmes en Production

### Architecture Système : Optimisation Top-N dans les Moteurs SQL

1. **Top-N Heap Sort dans PostgreSQL :** Le planificateur de requêtes évite un tri complet des tables en maintenant un tas en mémoire RAM borné à K lignes.
2. **Elasticsearch TopDocs :** Agrégation distribuée des meilleurs scores de pertinence.

## Cas Limites et Robustesse

1. **$k \ge n$ :** Renvoie une copie intégrale en $O(N)$.
2. **$k \le 0$ :** Renvoie un tableau vide.
