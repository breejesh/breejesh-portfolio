---
title: "La Masseuse: Programmation Dynamique Non Adjacente en Espace O(1) (CTCI 17.16)"
description: "Maximisez les minutes de rendez-vous acceptées sans séances consécutives grâce à la programmation dynamique de type House Robber en temps O(N) et espace O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-17-16-the-masseuse.webp
previewImage: /assets/images/ctci-17-16-the-masseuse.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Une masseuse reçoit des demandes de rendez-vous et doit prendre une pause entre chaque séance (elle ne peut pas accepter deux rendez-vous consécutifs). Trouvez le total maximal de minutes qu'elle peut planifier.
> * **La Solution Optimale:** **Programmation Dynamique Non Adjacente (House Robber)**:
>   1. **Récurrence**: Pour chaque rendez-vous $i$ de durée $M[i]$:
>      $$\text{Meilleur}[i] = \max(\text{Meilleur}[i-1],\, \text{Meilleur}[i-2] + M[i])$$
>   2. **Compression d'État**: Conserver uniquement deux entiers scalaires `oneAway` ($i-1$) et `twoAway` ($i-2$).
>   3. S'exécute en **temps $O(N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Cycles de travail et de repos dans les capteurs IoT et gestion thermique des serveurs HPC.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 17.16), l'énoncé est :

*"Determinez le sous-ensemble non contigu de durees de rendez-vous maximisant le temps de travail total en temps O(N) et memoire constante."*

## 2. Compression de l'État DP

Le calcul du meilleur résultat à l'étape $i$ ne dépend que de deux états précédents, autorisant une compression de la table entière en deux scalaires.

## Implémentation de Production

```java
public class MasseuseSchedule {

    /**
     * Maximise les minutes de rendez-vous en temps O(N) et espace O(1).
     */
    public static int maxMinutes(int[] massages) {
        if (massages == null || massages.length == 0) {
            return 0;
        }

        int oneAway = 0; // DP[i - 1]
        int twoAway = 0; // DP[i - 2]

        for (int m : massages) {
            int currentBest = Math.max(oneAway, twoAway + m);
            twoAway = oneAway;
            oneAway = currentBest;
        }

        return oneAway;
    }
}
```

## Analyse de Complexité

| Approche | Complexité Temporelle | Espace Mémoire | Allocation de Tableau |
|---|---|---|---|
| **DP Espace $O(1)$** | **$O(N)$** | **$O(1)$** | **0 tableau** |
| **DP Tabulé Complet** | $O(N)$ | $O(N)$ | Tableau de taille N |

## Ingénierie des Systèmes en Production

### Architecture Système : Cycles de Repos dans les Capteurs IoT

1. **Gestion d'Énergie Embarquée :** Les microcontrôleurs solaires maximisent le volume de transmissions en intercalant des états actifs et des fenêtres de recharge selon une règle de non-adjacence optimale.
2. **Refroidissement Thermique :** Les algorithmes d'ordonnancement interposent des phases de dissipation entre les tâches de calcul intensif.

## Cas Limites et Robustesse

1. **Tableau Vide :** Renvoie 0 immédiatement.
2. **Rendez-vous Unique :** Renvoie directement la durée en $O(1)$.
