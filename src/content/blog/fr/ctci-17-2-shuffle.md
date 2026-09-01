---
title: "Mélange de Cartes: Permutation Uniforme par l'Algorithme de Fisher-Yates (CTCI 17.2)"
description: "Générez une permutation strictement uniforme d'un jeu de 52 cartes avec une probabilité de 1/52! grâce à l'algorithme de Fisher-Yates (Knuth) en O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-2-shuffle.webp
previewImage: /assets/images/ctci-17-2-shuffle.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une méthode pour mélanger un jeu de 52 cartes de manière à ce que chacune des $52!$ permutations possibles soit rigoureusement équiprobable.
> * **La Solution Optimale:** **Algorithme de Fisher-Yates (Knuth) sur Place** :
>   1. Parcourir le tableau de droite à gauche, de $i = N - 1$ jusqu'à $1$.
>   2. À chaque étape, générer un index aléatoire uniforme $k \in [0, i]$.
>   3. Échanger `cartes[i]` avec `cartes[k]`.
>   4. **Le Piège Naïf** : Tirer $k \in [0, N-1]$ à chaque étape engendre $N^N$ issues possibles. Comme $N^N$ n'est jamais divisible par $N!$, la distribution obtenue est mathématiquement biaisée.
>   5. S'exécute en **temps $O(N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Mélange de données dans les chargeurs PyTorch (`DataLoader`) et moteurs de jeux en ligne certifiés.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.2), l'énoncé est :

*"Melangez un tableau de cartes de sorte que chaque permutation parmi les N! possibles possede exactement une probabilite de 1/N!."*

## 2. Preuve d'Équiprobabilité

À chaque étape $i$, la probabilité cumulée pour un élément d'être assigné à l'emplacement $i$ est exactement $\frac{1}{N}$. Le produit sur l'ensemble du tableau donne $\prod_{i=1}^N \frac{1}{i} = \frac{1}{N!}$.

## Implémentation de Production

```java
import java.util.Random;

public class DeckShuffler {

    private static final Random RNG = new Random();

    public static void shuffleArray(int[] cards) {
        if (cards == null || cards.length <= 1) return;

        for (int i = cards.length - 1; i > 0; i--) {
            int k = RNG.nextInt(i + 1); // Intervalle [0, i]
            int temp = cards[i];
            cards[i] = cards[k];
            cards[k] = temp;
        }
    }
}
```

## Analyse de Complexité

| Algorithme | Complexité Temporelle | Espace Mémoire | Équiprobabilité |
|---|---|---|---|
| **Fisher-Yates** | **$O(N)$** | **$O(1)$** | **Exacte $1/N!$ (Parfaite)** |
| **Permutation Naïve ($k \in [0, N-1]$)** | $O(N)$ | $O(1)$ | **Biaisée ($N^N \nmid N!$)** |

## Ingénierie des Systèmes en Production

### Architecture Système : Apprentissage Profond et Jeux en Ligne

1. **PyTorch DataLoader :** Avant chaque époque d'entraînement, les tenseurs sont mélangés par Fisher-Yates pour éviter tout biais d'ordre dans la descente de gradient stochastique.
2. **Cryptographie :** Utilisation de générateurs `SecureRandom` pour interdire la rétro-ingénierie des graines.

## Cas Limites et Robustesse

1. **Tableau de Taille $\le 1$ :** Retourne immédiatement sans exécution de boucle.
