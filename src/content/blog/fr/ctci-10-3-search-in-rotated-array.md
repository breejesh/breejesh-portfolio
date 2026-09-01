---
title: "Recherche dans un Tableau Pivoté: Recherche Binaire Adaptée aux Décalages (CTCI 10.3)"
description: "Trouvez un élément dans un tableau trié ayant subi une rotation inconnue par recherche binaire avec gestion des doublons en temps moyen O(log N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
previewImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit un tableau trié de $n$ entiers ayant été pivoté un nombre inconnu de fois. Écrivez un code pour localiser un élément donné dans ce tableau.
> * **La Solution Optimale:** Recherche Binaire avec Invariant de Moitié Triée : (1) Au moins l'une des deux moitiés ($[left, mid]$ ou $[mid, right]$) est obligatoirement ordonnée de façon monotone ; (2) Si $A[left] < A[mid]$, la moitié gauche est triée : si la cible $x \in [A[left], A[mid]]$, chercher à gauche, sinon à droite ; (3) Si $A[mid] < A[left]$, la moitié droite est triée ; (4) Si $A[left] == A[mid]$ (doublons), chercher des deux côtés si nécessaire ; (5) S'exécute en **temps moyen $O(\log N)$** et pire cas $O(N)$.
> * **Réalité en Production:** Recherche d'offset dans les tampons circulaires de messages (Apache Kafka).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.3), l'énoncé est :

*"Trouvez l'indice d'un element dans un tableau initialement trie ayant subi une rotation circulaire a un pivot inconnu."*

## 2. Invariant de la Moitié Ordonnée

À chaque division dichotomique :
* Si $A[left] < A[mid]$, la moitié gauche est strictement ordonnée.
* Si $A[mid] < A[left]$, la moitié droite est strictement ordonnée.
* Si $A[left] == A[mid]$, la présence de doublons impose une vérification de $A[right]$ ou une exploration bilatérale.

## Implémentation de Production

```java
public class SearchInRotatedArray {
    /**
     * Recherche x dans un tableau trie pivote.
     * Complexite Temporelle: O(log N) moyen, O(N) pire cas.
     * Complexite Spatiale: O(log N)
     */
    public static int search(int[] a, int left, int right, int x) {
        if (right < left) return -1;

        int mid = left + (right - left) / 2;
        if (a[mid] == x) {
            return mid;
        }

        // Cas 1: Moitie gauche normalement triee
        if (a[left] < a[mid]) {
            if (x >= a[left] && x < a[mid]) {
                return search(a, left, mid - 1, x);
            } else {
                return search(a, mid + 1, right, x);
            }
        }
        // Cas 2: Moitie droite normalement triee
        else if (a[mid] < a[left]) {
            if (x > a[mid] && x <= a[right]) {
                return search(a, mid + 1, right, x);
            } else {
                return search(a, left, mid - 1, x);
            }
        }
        // Cas 3: Doublons
        else {
            if (a[mid] != a[right]) {
                return search(a, mid + 1, right, x);
            } else {
                int result = search(a, left, mid - 1, x);
                if (result == -1) {
                    return search(a, mid + 1, right, x);
                }
                return result;
            }
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Cas | Complexité Temporelle | Espace Auxiliaire | Détail Technique |
|---|---|---|---|
| Entiers Distincts | `O(log N)` | `O(log N)` | Recherche dichotomique standard. |
| Avec Doublons (Pire Cas) | `O(N)` | `O(log N)` | Se produit quand toutes les valeurs sont identiques ($[2, 2, 2, 2]$). |

## Ingénierie des Systèmes en Production

### Architecture Système : Recherche dans les Buffers Circulaires

1. **Pilotes Réseau Haute Vitesse (DPDK) :** Les anneaux de paquets bouclent continuellement sur eux-mêmes ; la recherche binaire rotative permet de localiser des horodatages sans réalignement de mémoire.
2. **Partitions de Bases de Données :** Indexation de plages de clés sur des partitions tournantes.

## Cas Limites et Robustesse

1. **Élément Absent :** Renvoie `-1` sans erreur d'indice.
2. **Tableau sans Rotation :** Traitement identique à une dichotomie classique.
