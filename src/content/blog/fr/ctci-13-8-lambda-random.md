---
title: "Sous-Ensemble Aléatoire: Probabilité Uniforme avec Lambdas en Java (CTCI 13.8)"
description: "Générez un sous-ensemble aléatoire de distribution uniforme en Java via expressions Lambda, Streams et tirages de Bernoulli indépendants en temps O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-13-8-lambda-random.webp
previewImage: /assets/images/ctci-13-8-lambda-random.webp
---

> **TL;DR**
> * **Le Problème du Livre:** En utilisant des expressions lambda, écrivez une fonction `List<Integer> getRandomSubset(List<Integer> list)` renvoyant un sous-ensemble aléatoire où chaque configuration possible parmi les $2^N$ possède une probabilité rigoureusement identique d'être sélectionnée.
> * **Le Fondement Mathématique :** **Épreuves de Bernoulli Indépendantes ($p = 0{,}5$)** : (1) Pour une liste de taille $N$, il existe $2^N$ sous-ensembles ; (2) Pour une équiprobabilité totale ($1 / 2^N$), chaque élément doit avoir indépendamment $50\%$ de chances d'être inclus ; (3) Filtrer le flux via un prédicat booléen aléatoire : `filter(item -> ThreadLocalRandom.current().nextBoolean())` ; (4) Collecter les éléments dans une liste : `.collect(Collectors.toList())` ; (5) S'exécute en **temps $O(N)$**.
> * **Réalité en Production:** Échantillonnage aléatoire pour tests A/B, simulations de Monte Carlo et échantillonnage de réservoir.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 13.8), l'énoncé est :

*"Ecrivez une fonction en Java a l'aide d'expressions lambda pour extraire un sous-ensemble aleatoire selon une loi de probabilite uniforme."*

## 2. Démonstration de l'Équiprobabilité

Pour un ensemble $L$ de cardinal $N$, le nombre de sous-ensembles est $2^N$.

Pour tout sous-ensemble cible $S$ de taille $k$ :
$$P(S) = (0{,}5)^k \times (0{,}5)^{N - k} = (0{,}5)^N = \frac{1}{2^N}$$

Chaque sous-ensemble ayant la même probabilité de $1 / 2^N$, la distribution est parfaitement uniforme.

## Implémentation de Production

```java
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

public class RandomSubsetGenerator {

    public static List<Integer> getRandomSubset(List<Integer> list) {
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }

        return list.stream()
            .filter(item -> ThreadLocalRandom.current().nextBoolean())
            .collect(Collectors.toList());
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Un unique parcours du flux générant $N$ tirages booléens. |
| Taille Moyenne Attendue | $E[K] = N / 2$ | Espérance d'une loi binomiale avec $p = 0{,}5$. |
| Probabilité par Sous-Ensemble | $1 / 2^N$ | Distribution rigoureusement uniforme. |

## Ingénierie des Systèmes en Production

### Architecture Système : Générateurs Aléatoires Haute Performance

1. **`ThreadLocalRandom` vs `Random` :** `java.util.Random` utilise une graine atomique (`AtomicLong`) qui génère des conflits de cache processeur sous forte concurrence. `ThreadLocalRandom` isole l'état par thread sans verrou.
2. **Sécurité Cryptographique :** Pour les jetons sensibles, employer `SecureRandom`.

## Cas Limites et Robustesse

1. **Liste Nulle ou Vide :** Renvoie `Collections.emptyList()` sans lever d'exception.
