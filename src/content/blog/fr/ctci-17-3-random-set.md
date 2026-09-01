---
title: "Ensemble Aléatoire: Échantillonnage par Réservoir de M Éléments (CTCI 17.3)"
description: "Sélectionnez un sous-ensemble uniforme de M éléments dans un tableau de taille N grâce à l'échantillonnage par réservoir en temps O(N) et espace O(M)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-3-random-set.webp
previewImage: /assets/images/ctci-17-3-random-set.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une méthode générant aléatoirement un sous-ensemble de $m$ entiers à partir d'un tableau de taille $n$, avec une probabilité strictement identique ($m/n$) pour chaque élément.
> * **La Solution Optimale:** **Échantillonnage par Réservoir (Reservoir Sampling)** :
>   1. Copier les $m$ premiers éléments dans un tableau tampon `subset`.
>   2. Pour chaque indice $i$ de $m$ à $n - 1$ :
>      * Tirer un entier aléatoire uniforme $k \in [0, i]$.
>      * Si $k < m$, écraser `subset[k] = array[i]`.
>   3. **Démonstration** : À l'étape $i$, tout élément a une probabilité exactement égale à $\frac{m}{i+1}$ de figurer dans le réservoir.
>   4. S'exécute en **temps $O(N)$** et **espace $O(M)$**.
> * **Réalité en Production:** Échantillonnage de télémétrie réseau dans Envoy Proxy et statistiques `ANALYZE` dans PostgreSQL.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.3), l'énoncé est :

*"Tirez un sous-ensemble aleatoire de M entiers au sein d'une liste de dimension N avec equiprobabilite parfaite m/n."*

## 2. Récurrence par Réservoir

La probabilité de survie d'un élément déjà présent vaut $1 - \frac{1}{i+1} = \frac{i}{i+1}$, ce qui stabilise l'espérance mathématique à $\frac{m}{i+1}$.

## Implémentation de Production

```java
import java.util.Random;

public class RandomSet {

    private static final Random RNG = new Random();

    public static int[] pickMRecursively(int[] array, int m) {
        if (array == null || m <= 0 || m > array.length) {
            return new int[0];
        }

        int[] subset = new int[m];
        System.arraycopy(array, 0, subset, 0, m);

        for (int i = m; i < array.length; i++) {
            int k = RNG.nextInt(i + 1);
            if (k < m) {
                subset[k] = array[i];
            }
        }

        return subset;
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Une seule passe de lecture séquentielle. |
| Espace Mémoire | `O(M)` | Tampon de taille M alloué. |
| Flux Continu (Streaming) | `Support Natif` | Opère sans connaître la taille totale N du flux à l'avance. |

## Ingénierie des Systèmes en Production

### Architecture Système : Télémétrie et Optimisation de Requêtes

1. **Proxy Envoy :** Échantillonnage de paquets réseau pour capturer un quota fixe de requêtes représentatives par seconde sans écrouler les disques.
2. **PostgreSQL ANALYZE :** Génération de métriques de colonnes sur des tables volumineuses.

## Cas Limites et Robustesse

1. **$M > N$ ou $M \le 0$ :** Renvoie un tableau vide de manière sécurisée.
