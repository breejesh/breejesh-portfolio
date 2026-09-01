---
title: "Cruches d'Eau: Mesurer 4 Quarts avec des Cruches de 5 et 3 Quarts (CTCI 6.5)"
description: "Résolvez l'énigme classique du transvasement pour mesurer exactement 4 quarts à l'aide de cruches de 5 et 3 quarts via les identités de Bézout."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-5-jugs-of-water.webp
previewImage: /assets/images/ctci-6-5-jugs-of-water.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Vous avez une cruche de 5 quarts, une de 3 quarts et une source d'eau infinie (sans graduation). Comment obtenir exactement 4 quarts d'eau ?
> * **La Solution Optimale:** Séquence de Transvasement : (1) Remplir la cruche de 5 qt ; (2) Verser de la cruche de 5 vers celle de 3 jusqu'à ras bord (il reste 2 qt dans celle de 5) ; (3) Vider la cruche de 3 qt ; (4) Verser les 2 qt dans celle de 3 ; (5) Remplir celle de 5 qt ; (6) Verser de 5 vers 3 jusqu'à ras bord (transfère 1 qt), laissant exactement **4 quarts** dans la cruche de 5 qt.
> * **Réalité en Production:** Identité de Bézout et algorithmes d'allocation discrète (Token Bucket).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 6.5), l'énoncé est :

*"Vous disposez d'une cruche de 5 quarts et d'une cruche de 3 quarts non graduées. Comment mesurer exactement 4 quarts d'eau ?"*

## 2. Fondement Mathématique : Identité de Bézout

Une quantité $d$ est mesurable avec des récipients de capacités $a$ et $b$ si et seulement si $d$ est un multiple de $\text{PGCD}(a, b)$ et $d \le \max(a, b)$.
* $\text{PGCD}(5, 3) = 1$. Comme 4 est multiple de 1, la mesure est garantie :
$$5(2) + 3(-2) = 10 - 6 = 4$$

## 3. Transitions d'États

| Étape | Action | Cruche 5 qt | Cruche 3 qt | Explication |
|---|---|---|---|---|
| 0 | Initial | 0 qt | 0 qt | Vides |
| 1 | Remplir 5 qt | 5 qt | 0 qt | Pleine |
| 2 | Verser 5 $\to$ 3 | 2 qt | 3 qt | Reste 2 qt |
| 3 | Vider 3 qt | 2 qt | 0 qt | Vidée |
| 4 | Transférer 5 $\to$ 3 | 0 qt | 2 qt | Déplace 2 qt |
| 5 | Remplir 5 qt | 5 qt | 2 qt | Pleine |
| 6 | Verser 5 $\to$ 3 | **4 qt** | 3 qt | Transfère 1 qt, reste **4 qt** |

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.List;

public class JugsOfWater {
    public static class State {
        public final int jug5;
        public final int jug3;
        public final String action;

        public State(int j5, int j3, String action) {
            this.jug5 = j5;
            this.jug3 = j3;
            this.action = action;
        }
    }

    public static List<State> measureFourQuarts() {
        List<State> steps = new ArrayList<>();
        steps.add(new State(0, 0, "Etat initial"));
        steps.add(new State(5, 0, "Remplir cruche de 5 quarts"));
        steps.add(new State(2, 3, "Verser 5 dans 3"));
        steps.add(new State(2, 0, "Vider cruche de 3"));
        steps.add(new State(0, 2, "Transferer 2 quarts dans cruche de 3"));
        steps.add(new State(5, 2, "Remplir cruche de 5"));
        steps.add(new State(4, 3, "Verser jusqu'a remplir 3 (reste 4 quarts)"));
        return steps;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité des Étapes | `O(1)` | Exactement 6 opérations discrètes. |
| Espace Auxiliaire | `O(1)` | Trace d'états de taille fixe. |

## Ingénierie des Systèmes en Production

### Architecture Système : Réservoirs à Jetons (Token Buckets)

1. **Limiteurs de Débit Réseau (Token Bucket) :** Gestion des rafales de trafic via transferts discrets de quotas.
2. **Allocateurs de Mémoire par Plaques (Slab Allocators) :** Découpage et fusion de blocs contigus de mémoire.

## Cas Limites et Robustesse

1. **Condition Générale :** Résoluble pour tout triplet $(A, B, C)$ si $C \pmod{\text{PGCD}(A, B)} == 0$.
