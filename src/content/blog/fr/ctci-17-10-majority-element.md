---
title: "Élément Majoritaire: Algorithme de Vote en Flux de Boyer-Moore (CTCI 17.10)"
description: "Identifiez l'élément strictement majoritaire (> 50% des occurrences) d'un tableau à l'aide de l'algorithme de Boyer-Moore en temps O(N) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-10-majority-element.webp
previewImage: /assets/images/ctci-17-10-majority-element.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Un élément majoritaire est présent dans strictement plus de la moitié ($> \lfloor N/2 \rfloor$) des positions d'un tableau. Trouvez cet élément ou renvoyez $-1$ en temps $O(N)$ et espace $O(1)$.
> * **La Solution Optimale:** **Algorithme de Vote de Boyer-Moore en Deux Phases** :
>   1. **Phase 1 (Élection du Candidat)** :
>      * Initialiser `candidate = 0` et `count = 0`.
>      * Pour chaque élément $x$ : si `count == 0`, fixer `candidate = x, count = 1` ; si $x == \text{candidat}$, incrémenter `count++` ; sinon décrémenter `count--`.
>   2. **Phase 2 (Validation)** :
>      * Dénombrer la présence réelle du candidat dans le tableau.
>      * Si $\text{effectif} > \lfloor N/2 \rfloor$, renvoyer `candidate`, sinon $-1$.
>   3. S'exécute en **temps $O(N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Détection de flux dominants dans les routeurs réseau (Cisco NetFlow) et consensus distribué (Raft / Paxos).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.10), l'énoncé est :

*"Isolez l'element occupant plus de la moitie d'un tableau d'entiers en temps lineaire et sans allocation memoire."*

## 2. Principe d'Élimination par Paires

Deux éléments distincts s'annulent mutuellement sans altérer la dominance de l'élément ultra-majoritaire.

## Implémentation de Production

```java
public class MajorityElement {

    public static int findMajorityElement(int[] array) {
        if (array == null || array.length == 0) {
            return -1;
        }

        int candidate = 0;
        int count = 0;

        for (int x : array) {
            if (count == 0) {
                candidate = x;
                count = 1;
            } else if (x == candidate) {
                count++;
            } else {
                count--;
            }
        }

        int actualCount = 0;
        for (int x : array) {
            if (x == candidate) {
                actualCount++;
            }
        }

        return (actualCount > array.length / 2) ? candidate : -1;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Deux parcours linéaires complets. |
| Espace Mémoire | `O(1)` | Deux registres scalaires constants. |

## Ingénierie des Systèmes en Production

### Architecture Système : Détection de Flux Réseau et Consensus

1. **Top-K Heavy Hitters (Misra-Gries) :** Les processeurs réseau utilisent cette technique pour isoler les adresses IP d'attaques DDoS en temps constant par paquet.
2. **Consensus BFT :** Vérification de majorités qualifiées dans les protocoles distribués.

## Cas Limites et Robustesse

1. **Aucun Élément Majoritaire :** La phase 2 détecte l'insuffisance de fréquence et renvoie fidèlement `-1`.
