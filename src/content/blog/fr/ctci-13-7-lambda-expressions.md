---
title: "Expressions Lambda: Pipelines d'Agrégation Fonctionnels en Java 8+ (CTCI 13.7)"
description: "Calculez des métriques agrégées sur des collections en Java via expressions Lambda, pipelines de flux Streams, primitives spécialisées et calcul parallèle."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-13-7-lambda-expressions.webp
previewImage: /assets/images/ctci-13-7-lambda-expressions.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Soit une classe `Country` exposant les méthodes `getContinent()` et `getPopulation()`. Écrivez une fonction `int getPopulation(List<Country> countries, String continent)` calculant la population cumulée d'un continent à l'aide d'expressions lambda.
> * **La Solution Optimale:** **Pipeline Fonctionnel de Streams avec Primitives Spécialisées** : (1) Valider la non-nullité des entrées ; (2) Convertir la collection en flux `countries.stream()` ; (3) Appliquer le filtre prédicat `filter(c -> continent.equals(c.getContinent()))` ; (4) Transformer en flux d'entiers natifs `mapToInt(Country::getPopulation)` (éliminant le surcoût d'autoboxing) ; (5) Exécuter la réduction finale `.sum()` ; (6) S'exécute en **temps $O(N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Traitement distribué avec Apache Spark / Flink et microservices réactifs avec Kafka Streams.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 13.7), l'énoncé est :

*"Ecrivez une methode en Java calculant la population totale d'un continent donne a partir d'une liste de pays en utilisant les flux Streams et expressions lambda."*

```java
public class Country {
    private final String continent;
    private final int population;

    public Country(String continent, int population) {
        this.continent = continent;
        this.population = population;
    }

    public String getContinent() { return continent; }
    public int getPopulation() { return population; }
}
```

## 2. Architecture du Pipeline Fonctionnel

1. **Source :** Flux `countries.stream()`.
2. **Opérations Intermédiaires :** Filtrage paresseux et projection vers un flux primitif `IntStream`.
3. **Opération Terminale :** Somme scalaire en une passe linéaire.

## Implémentation de Production

```java
import java.util.List;
import java.util.Objects;

public class CountryPopulationAggregator {

    public static int getPopulation(List<Country> countries, String continent) {
        if (countries == null || continent == null) {
            return 0;
        }

        return countries.stream()
            .filter(Objects::nonNull)
            .filter(c -> continent.equalsIgnoreCase(c.getContinent()))
            .mapToInt(Country::getPopulation)
            .sum();
    }

    public static long getPopulationParallel(List<Country> countries, String continent) {
        if (countries == null || continent == null) {
            return 0L;
        }

        return countries.parallelStream()
            .filter(Objects::nonNull)
            .filter(c -> continent.equalsIgnoreCase(c.getContinent()))
            .mapToLong(Country::getPopulation)
            .sum();
    }
}
```

## Analyse de Complexité

| Métrique | Flux Séquentiel | Flux Parallèle (`parallelStream()`) |
|---|---|---|
| Complexité Temporelle | `O(N)` | `O(N / P)` réparti sur $P$ cœurs processeur |
| Espace Auxiliaire | `O(1)` | `O(P)` cadres de threads |

## Ingénierie des Systèmes en Production

### Architecture Système : Fusion de Boucles dans le Compilateur JIT

1. **Évaluation Paresseuse :** L'API Stream ne matérialise aucune liste intermédiaire. Le compilateur JIT fusionne les filtres en une boucle native optimisée.
2. **Évitement du Boxing :** `mapToInt` manipule des registres processeurs 32/64 bits directs sans instanciation d'objets `Integer` sur le tas.

## Cas Limites et Robustesse

1. **Débordement d'Entier :** Si la population dépasse 2,1 milliards d'individus, employer `mapToLong()` et renvoyer un entier 64 bits `long`.
