---
title: "Fourmis sur un Triangle: Probabilité de Collision sur les Sommets d'un Polygone (CTCI 6.4)"
description: "Calculez la probabilité de collision de n fourmis marchant aléatoirement sur les côtés d'un polygone régulier à n sommets en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
previewImage: /assets/images/ctci-6-4-ants-on-a-triangle.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Trois fourmis se trouvent sur les trois sommets d'un triangle. Quelle est la probabilité qu'elles entrent en collision si elles commencent à marcher le long des côtés dans une direction choisie au hasard ? Généralisez pour $n$ fourmis sur un polygone régulier à $n$ sommets.
> * **La Solution Optimale:** **Probabilité Complémentaire** : Il n'y a pas de collision si et seulement si toutes les fourmis choisissent le même sens (toutes dans le sens horaire ou toutes dans le sens antihoraire). Il y a $2^n$ configurations possibles au total et exactement 2 sans collision. $P(\text{pas de collision}) = 2 / 2^n = (1/2)^{n-1}$. D'où **$P(\text{collision}) = 1 - (1/2)^{n-1}$**. Pour un triangle ($n=3$), la probabilité vaut $1 - 1/4 = 3/4 = \mathbf{75\%}$.
> * **Réalité en Production:** Détection de collisions CSMA/CD sur les réseaux Ethernet partagés et anneaux logiques (Token Ring).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 6.4), l'énoncé est :

*"Trois fourmis sont sur les sommets d'un triangle. Quelle est la probabilite de collision si elles avancent a vitesse egale dans une direction aleatoire ? Generalisez a n fourmis sur un polygone a n sommets."*

## 2. Dérivation Mathématique

1. **Nombre total de combinaisons :** $2^n$.
2. **Configurations sans collision :**
   * Toutes dans le sens des aiguilles d'une montre : $(1/2)^n$.
   * Toutes dans le sens inverse : $(1/2)^n$.
   * $P(\text{sans collision}) = 2 \cdot (1/2)^n = (1/2)^{n-1}$.
3. **Probabilité de collision :**
   $$P(\text{collision}) = 1 - \left(\frac{1}{2}\right)^{n-1}$$
4. Pour $n = 3$ : $1 - (1/2)^2 = 1 - 0.25 = \mathbf{75\%}$.

## Implémentation de Production

```java
public class AntsOnPolygon {
    /**
     * Calcule la probabilite de collision pour n fourmis sur un polygone.
     * Complexite Temporelle: O(1)
     * Complexite Spatiale: O(1)
     */
    public static double collisionProbability(int n) {
        if (n < 3) {
            throw new IllegalArgumentException("Un polygone doit avoir au moins 3 sommets.");
        }
        return 1.0 - Math.pow(0.5, n - 1);
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Temps d'Évaluation | `O(1)` | Calcul exponentiel direct. |
| Espace Auxiliaire | `O(1)` | Zéro allocation mémoire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Modèles de Contention Réseau

1. **Protocoles CSMA/CD (Ethernet) :** Modélisation probabiliste des conflits de trames sur un bus partagé.
2. **Anneaux à Jeton (Token Ring) :** Élimination structurelle des collisions via routage unidirectionnel.

## Cas Limites et Robustesse

1. **$n = 3$ (Triangle) :** Renvoie $0.75$.
2. **$n$ très grand :** Converge vers $1.0$.
