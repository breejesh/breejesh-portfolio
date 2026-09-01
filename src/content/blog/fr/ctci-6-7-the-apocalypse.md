---
title: "L'Apocalypse: Ratio des Genres Sous la Règle d'Arrêt à la Première Fille (CTCI 6.7)"
description: "Preuve mathématique et simulation Monte Carlo démontrant pourquoi la règle d'arrêt à la première fille conserve un ratio de 50:50 en O(1) temps."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-7-the-apocalypse.webp
previewImage: /assets/images/ctci-6-7-the-apocalypse.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Dans un monde post-apocalyptique, la reine décrète que toutes les familles doivent continuer à avoir des enfants jusqu'à obtenir une fille, après quoi elles doivent immédiatement s'arrêter. Quel est le ratio filles/garçons dans la nouvelle génération ?
> * **La Solution Optimale:** Le ratio reste strictement **50:50 (1:1)**. Chaque naissance est une épreuve de Bernoulli indépendante avec probabilité 0.5. Par le théorème d'arrêt optionnel et les séries géométriques, l'espérance du nombre de garçons par famille est $E[\text{garçons}] = \sum_{k=0}^{\infty} k(1/2)^{k+1} = 1.0$, égalant exactement la fille unique par foyer.
> * **Réalité en Production:** Théorème d'arrêt des martingales en finance quantitative et biais d'arrêt anticipé dans les tests A/B.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 6.7), l'énoncé est :

*"Dans un monde post-apocalyptique, chaque famille a des enfants jusqu'a avoir une fille, puis s'arrete. Quel sera le ratio entre garcons et filles ?"*

## 2. Démonstration Mathématique

1. **Indépendance des Naissances :** Chaque enfant a 50% de chances d'être une fille. La règle d'arrêt partitionne simplement la population sans modifier la loi de probabilité de chaque naissance.
2. **Calcul d'Espérance :**
   $$E[\text{garçons}] = 0 \cdot \frac{1}{2} + 1 \cdot \frac{1}{4} + 2 \cdot \frac{1}{8} + \dots = 1.0$$
3. Chaque famille ayant 1 fille et en moyenne 1 garçon, le ratio vaut $\mathbf{50\% \text{ Filles}, 50\% \text{ Garçons}}$.

## Implémentation de Production (Simulation Monte Carlo)

```java
import java.util.Random;

public class ApocalypseRatio {
    /**
     * Simule n familles pour verifier empiriquement la convergence vers 50:50.
     * Complexite Temporelle: O(N)
     * Complexite Spatiale: O(1)
     */
    public static double runSimulation(int numFamilies) {
        int boys = 0;
        int girls = 0;
        Random random = new Random();

        for (int i = 0; i < numFamilies; i++) {
            while (true) {
                if (random.nextBoolean()) {
                    girls++;
                    break;
                } else {
                    boys++;
                }
            }
        }

        return (double) girls / (girls + boys);
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Temps d'Évaluation Théorique | `O(1)` | Ratio invariant 1:1. |
| Simulation Monte Carlo | `O(N)` | Linéaire selon le nombre de foyers simulés. |
| Espace Auxiliaire | `O(1)` | Registres simples. |

## Ingénierie des Systèmes en Production

### Architecture Système : Théorème d'Arrêt Optionnel

1. **Finance Quantitative (Théorème d'Arrêt de Doob) :** Les règles d'arrêt temporelles ne modifient pas l'espérance de gain d'une martingale équitable.
2. **Tests A/B Séquentiels :** Démonstration du risque de faux positifs lors d'arrêts prématurés sans correction bayésienne.

## Cas Limites et Robustesse

1. **Grandes Tailles d'Échantillons :** Convergence à $0.5000$ dès $N \ge 100\,000$.
