---
title: "Fusion Triée: Fusion en Place de Tableaux par Deux Pointeurs Inverses (CTCI 10.1)"
description: "Fusionnez le tableau trié B dans le tableau trié A disposant d'un espace final suffisant en place par parcours inverse en temps O(A + B) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-10-1-sorted-merge.webp
previewImage: /assets/images/ctci-10-1-sorted-merge.webp
---

> **TL;DR**
> * **Le Problème du Livre:** On vous donne deux tableaux triés, $A$ et $B$, où $A$ dispose d'un espace tampon suffisant à sa fin pour accueillir $B$. Écrivez une méthode pour fusionner $B$ dans $A$ dans l'ordre croissant.
> * **La Solution Optimale:** Fusion Inverse en Place à Trois Pointeurs : (1) Initialiser `indexA = lastA - 1`, `indexB = lastB - 1` et `indexMerged = lastA + lastB - 1` ; (2) Comparer depuis la fin et copier la valeur maximale à l'index d'écriture ; (3) Transférer les éventuels éléments restants de $B$ ; (4) S'exécute en **temps optimal $O(A + B)$** et **espace $O(1)$** sans décalage de tableau ni mémoire auxiliaire.
> * **Réalité en Production:** Compactage de tables SSTable dans les arbres LSM (RocksDB).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 10.1), l'énoncé est :

*"Fusionnez le tableau trie B dans le tableau trie A en place, sachant que A dispose d'une zone tampon suffisante a son extremite."*

## 2. Démarche de Fusion Inverse

Fusionner depuis le début obligerait à décaler tous les éléments de $A$ vers la droite ($O(N^2)$).

En insérant depuis l'extrémité droite du tampon libre :
$$\text{indexMerged} = \text{lastA} + \text{lastB} - 1$$
Les plus grands éléments sont stockés dans l'espace vide sans jamais écraser les éléments non encore lus dans $A$.

## Implémentation de Production

```java
public class SortedMerge {
    /**
     * Fusionne le tableau B dans le tableau A en place.
     * Complexite Temporelle: O(A + B)
     * Complexite Spatiale: O(1)
     */
    public static void merge(int[] a, int[] b, int lastA, int lastB) {
        int indexA = lastA - 1;
        int indexB = lastB - 1;
        int indexMerged = lastB + lastA - 1;

        while (indexB >= 0) {
            if (indexA >= 0 && a[indexA] > b[indexB]) {
                a[indexMerged] = a[indexA];
                indexA--;
            } else {
                a[indexMerged] = b[indexB];
                indexB--;
            }
            indexMerged--;
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(A + B)` | Exactement $lastA + lastB$ comparaisons d'entiers. |
| Espace Auxiliaire | `O(1)` | Trois variables de registres scalaires. |

## Ingénierie des Systèmes en Production

### Architecture Système : Compactage Arborescent LSM

1. **Fusion de Segments SSTable :** Les moteurs de bases de données NoSQL (RocksDB, Cassandra) fusionnent les flux ordonnés de clés avec zéro surcoût mémoire.
2. **Protection d'Écrasement :** L'adressage inverse préserve l'intégrité des données dans les zones tampons contiguës.

## Cas Limites et Robustesse

1. **Tableau B Vide ($lastB = 0$) :** Sortie immédiate de la boucle ; $A$ reste intact.
2. **Tableau A Vide ($lastA = 0$) :** Copie directe de l'ensemble des éléments de $B$ dans $A$.
