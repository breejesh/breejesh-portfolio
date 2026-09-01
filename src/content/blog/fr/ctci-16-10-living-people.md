---
title: "Personnes Vivantes: Algorithme Sweep-Line et Tableau de Différences (CTCI 16.10)"
description: "Identifiez l'année de pic de population vivante à l'aide d'un tableau de différences d'événements et de sommes préfixes en temps linéaire O(P + Y)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-10-living-people.webp
previewImage: /assets/images/ctci-16-10-living-people.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une liste de personnes avec leurs années de naissance et de décès (toutes comprises entre 1900 et 2000 inclus), trouvez l'année comptant le plus grand nombre de personnes vivantes.
> * **La Solution Optimale:** **Tableau de Différences (Sweep-Line Delta Array)** :
>   1. **Événements Discrets** : Instancier un tableau de deltas de dimension $102$ pour couvrir les années $1900..2000$.
>   2. Pour chaque personne $(B, D)$ :
>      * Incrémenter l'année de naissance : `deltas[B - 1900] += 1;`
>      * Décrémenter l'année *suivant* le décès : `deltas[D - 1900 + 1] -= 1;`
>   3. **Somme Préfixe Continue** : Parcourir le tableau pour accumuler `currentlyAlive += deltas[i]` et enregistrer l'année maximale.
>   4. S'exécute en **temps $O(P + Y)$** et **espace $O(Y) = O(1)$**.
> * **Réalité en Production:** Analyse de saturation de connexions concurrentes sur répartiteurs de charge (Envoy / AWS ALB).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.10), l'énoncé est :

*"Calculez l'annee de population maximale a partir des annees de naissance et de mort d'un ensemble d'individus."*

## 2. Balayage par Tableau de Différences

Le principe de la ligne de balayage décompose chaque durée de vie en deux impulsions $+1$ et $-1$, permettant de calculer l'effectif instantané en une unique passe séquentielle.

## Implémentation de Production

```java
public class LivingPeople {

    public static class Person {
        public final int birth;
        public final int death;

        public Person(int birth, int death) {
            this.birth = birth;
            this.death = death;
        }
    }

    public static int maxAliveYear(Person[] people, int minYear, int maxYear) {
        if (people == null || people.length == 0) return minYear;

        int yearRange = maxYear - minYear + 1;
        int[] deltas = new int[yearRange + 2];

        for (Person person : people) {
            deltas[person.birth - minYear]++;
            deltas[person.death - minYear + 1]--;
        }

        int maxAlive = 0;
        int maxYear = minYear;
        int currentlyAlive = 0;

        for (int i = 0; i < yearRange; i++) {
            currentlyAlive += deltas[i];
            if (currentlyAlive > maxAlive) {
                maxAlive = currentlyAlive;
                maxYear = minYear + i;
            }
        }

        return maxYear;
    }
}
```

## Analyse de Complexité

| Stratégie | Complexité Temporelle | Espace Mémoire |
|---|---|---|
| **Tableau de Différences (Deltas)** | **$O(P + Y)$** | **$O(Y)$** (constant pour 101 ans) |
| **Double Tri d'Événements** | $O(P \log P)$ | $O(P)$ |

## Ingénierie des Systèmes en Production

### Architecture Système : Suivi des Pics de Concurrence

1. **Jauge de Connexions Actives :** Les répartiteurs de charge tracent les ouvertures (`SYN`) et fermetures (`FIN`) de sockets pour déterminer le dimensionnement des serveurs d'arrière-plan.
2. **Métriques Prometheus :** Agrégation de débits différentiels pour tracer l'évolution temporelle de la charge.

## Cas Limites et Robustesse

1. **Naissance et Décès la Même Année ($B = D$) :** Pris en compte grâce à la décrémentation différée à $D + 1$.
