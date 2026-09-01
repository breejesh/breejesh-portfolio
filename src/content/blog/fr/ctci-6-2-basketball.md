---
title: "Basketball: Probabilités et Espérance pour Jeux de Tirs (CTCI 6.2)"
description: "Analysez les équations de probabilité entre un jeu à 1 tir et un jeu à 3 tirs pour choisir le jeu optimal en fonction de p en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-2-basketball.webp
previewImage: /assets/images/ctci-6-2-basketball.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Vous avez un panier de basket et vous pouvez jouer à l'un de deux jeux. Jeu 1 : vous avez 1 tir pour marquer. Jeu 2 : vous avez 3 tirs et devez en réussir au moins 2. Si $p$ est la probabilité de réussite d'un tir, pour quelles valeurs de $p$ devez-vous choisir l'un ou l'autre jeu ?
> * **La Solution Optimale:** Inégalité de Loi Binomiale : $P(\text{Jeu 1}) = p$. $P(\text{Jeu 2}) = 3p^2 - 2p^3$. En résolvant $3p^2 - 2p^3 > p \implies (2p - 1)(p - 1) < 0 \implies p > 0.5$. Choisissez le **Jeu 1 si $p < 0.5$**, le **Jeu 2 si $p > 0.5$**, et n'importe lequel si $p \in \{0, 0.5, 1\}$.
> * **Réalité en Production:** Quorum majoritaire dans les protocoles de consensus (Raft/Paxos) et seuils de basculement de charge.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 6.2), l'énoncé est :

*"Vous pouvez jouer à deux jeux de tirs. Jeu 1 : 1 tir pour marquer. Jeu 2 : 3 tirs avec obligation d'en réussir 2 sur 3. Pour quelles valeurs de probabilité p devez-vous choisir l'un ou l'autre ?"*

## 2. Dérivation Mathématique

1. **Jeu 1 :** $P(\text{Jeu 1}) = p$.
2. **Jeu 2 :** Réussir exactement 2 ou 3 tirs :
   $$P(\text{Jeu 2}) = 3p^2(1 - p) + p^3 = 3p^2 - 2p^3$$
3. **Comparaison :**
   $$3p^2 - 2p^3 > p \implies 2p^2 - 3p + 1 < 0 \implies (2p - 1)(p - 1) < 0$$
   Comme $p < 1$, le facteur $(p - 1)$ est négatif, imposant $(2p - 1) > 0 \implies p > 0.5$.

## Implémentation de Production

```java
public class BasketballGame {
    /**
     * Recommande le Jeu 1 ou Jeu 2 selon la probabilite p.
     * Complexite Temporelle: O(1)
     * Complexite Spatiale: O(1)
     */
    public static int pickGame(double p) {
        if (p < 0.0 || p > 1.0) {
            throw new IllegalArgumentException("La probabilite doit etre comprise entre 0 et 1");
        }

        if (p > 0.5 && p < 1.0) {
            return 2;
        } else if (p < 0.5 && p > 0.0) {
            return 1;
        } else {
            return 0; // Indifferent (p = 0, 0.5 ou 1.0)
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Temps d'Évaluation | `O(1)` | Comparaison directe de flottants. |
| Espace Auxiliaire | `O(1)` | Zéro allocation mémoire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Quorum et Redondance

1. **Consensus Distribué (Raft / Paxos) :** Si la disponibilité d'un nœud est $p > 0.5$, un groupe majoritaire ($2f + 1$) amplifie la robustesse globale. En deçà de 0.5, l'ajout de nœuds dégrade la fiabilité.
2. **Sondes d'État (Health Checks) :** Prise de décision sur échantillons multiples.

## Cas Limites et Robustesse

1. **$p = 0.5$ :** Les deux jeux offrent exactement 50% de chances de succès.
2. **Limites $p = 0$ et $p = 1$ :** 0% ou 100% dans les deux cas.
