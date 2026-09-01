---
title: "Tour de Cirque: Plus Longue Sous-Suite Croissante 2D par Patience Sorting (CTCI 17.8)"
description: "Calculez la hauteur maximale d'une pyramide humaine où chaque personne est strictement plus petite et légère via un double tri et LIS en O(N log N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-8-circus-tower.webp
previewImage: /assets/images/ctci-17-8-circus-tower.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Un numéro de cirque consiste à former une tour humaine où chaque acrobate doit être strictement plus petit et plus léger que celui qui le soutient ($H_i < H_{i+1}$ et $W_i < W_{i+1}$). Trouvez le nombre maximal d'acrobates empilables.
> * **La Solution Optimale:** **Double Tri + Patience Sorting (LIS en 1D)** :
>   1. **Double Tri** : Trier par **Taille croissante** ($H \uparrow$). En cas d'égalité de taille, trier par **Poids décroissant** ($W \downarrow$).
>   2. **Gestion des Égalités** : Le tri pondéral inversé empêche d'inclure deux personnes de même taille dans la suite croissante de poids.
>   3. **LIS 1D par Recherche Binaire** : Appliquer le tri par patience sur les poids en temps $O(N \log N)$.
>   4. S'exécute en **temps $O(N \log N)$** et **espace $O(N)$**.
> * **Réalité en Production:** Emboîtement de poupées russes (LeetCode 354) et planification multi-ressources dans Kubernetes.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.8), l'énoncé est :

*"Identifiez la plus grande chaine d'individus empilables respectant une stricte hierarchie conjointe de taille et de poids."*

## 2. Réduction 2D vers 1D

Le tri inversé de la deuxième dimension neutralise les conflits d'égalité sur la première dimension, autorisant l'utilisation du LIS classique.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class CircusTower {

    public static class Person implements Comparable<Person> {
        public final int height;
        public final int weight;

        public Person(int height, int weight) {
            this.height = height;
            this.weight = weight;
        }

        @Override
        public int compareTo(Person other) {
            if (this.height != other.height) {
                return Integer.compare(this.height, other.height);
            }
            return Integer.compare(other.weight, this.weight); // Poids décroissant
        }
    }

    public static int maxTowerHeight(List<Person> people) {
        if (people == null || people.isEmpty()) return 0;

        Collections.sort(people);

        int[] tails = new int[people.size()];
        int size = 0;

        for (Person p : people) {
            int w = p.weight;
            int idx = Arrays.binarySearch(tails, 0, size, w);

            if (idx < 0) {
                idx = -(idx + 1);
            }

            tails[idx] = w;
            if (idx == size) {
                size++;
            }
        }

        return size;
    }
}
```

## Analyse de Complexité

| Approche | Complexité Temporelle | Espace Mémoire | Égalités |
|---|---|---|---|
| **Double Tri + LIS** | **$O(N \log N)$** | **$O(N)$** | **Exact (Poids Décroissant)** |
| **Programmation Dynamique 2D** | $O(N^2)$ | $O(N)$ | Correct mais quadratique |

## Ingénierie des Systèmes en Production

### Architecture Système : Ordonnancement Sous Contraintes

1. **Ordonnanceur Kubernetes :** Regroupement de pods avec contraintes jointes de CPU et mémoire selon les frontières de Pareto.
2. **Découpe Industrielle CAO :** Algorithmes d'imbrication de formes 2D sur des plaques métalliques.

## Cas Limites et Robustesse

1. **Tailles Identiques :** Le tri décroissant du poids garantit qu'au plus une personne de cette taille est sélectionnée.
