---
title: "Poison: Identifier la Bouteille Empoisonnée en un Minimum de Jours (CTCI 6.10)"
description: "Concevez un protocole optimal avec 10 bandelettes de test et encodage binaire pour identifier 1 bouteille empoisonnée sur 1000 en 7 jours."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-10-poison.webp
previewImage: /assets/images/ctci-6-10-poison.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Vous avez 1000 bouteilles de soda dont une seule est empoisonnée, et 10 bandelettes de test. Une goutte de poison fait réagir la bandelette. Les résultats prennent 7 jours. Comment identifier la bouteille empoisonnée en un minimum de jours ?
> * **La Solution Optimale:** **Encodage Binaire (7 Jours / 1 Tour)** : Numérotez les bouteilles de 0 à 999. Comme $2^{10} = 1024 > 1000$, chaque bouteille correspond à un entier 10 bits ($b_9 \dots b_0$). Au Jour 0, déposez une goutte de la bouteille $k$ sur la bandelette $i$ si le bit $i$ de $k$ vaut `1`. Au Jour 7, les bandelettes positives forment directement le numéro binaire de la bouteille en **7 jours**.
> * **Réalité en Production:** Tests groupés (Dorfman pooling) en épidémiologie et diagnostic de liens réseau.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 6.10), la question posée est :

*"Vous avez 1000 bouteilles et 10 bandelettes de test qui réagissent en 7 jours. Comment identifier la bouteille empoisonnée le plus vite possible ?"*

## 2. Protocole par Encodage Binaire

1. **Capacité d'Information :** 10 bandelettes binaires permettent $2^{10} = 1024$ combinaisons distinctes.
2. **Jour 0 :** Pour chaque bouteille $k \in [0, 999]$, si son $i$-ème bit vaut 1, on dépose une goutte sur la bandelette $i$.
3. **Jour 7 :** Les bandelettes positives révèlent directement l'indice binaire de la bouteille empoisonnée.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.List;

public class PoisonDetection {
    public static class TestStrip {
        private final int id;
        private final List<Integer> drops = new ArrayList<>();

        public TestStrip(int id) { this.id = id; }
        public void addDrop(int bottleId) { drops.add(bottleId); }
        public boolean isPositive(int poisonedId) { return drops.contains(poisonedId); }
    }

    public static int findPoisonedBottle(int poisonedBottleId, int totalBottles, int totalStrips) {
        List<TestStrip> strips = new ArrayList<>();
        for (int i = 0; i < totalStrips; i++) {
            strips.add(new TestStrip(i));
        }

        // Jour 0: Deposer les gouttes selon les bits binaires
        for (int bottle = 0; bottle < totalBottles; bottle++) {
            for (int bit = 0; bit < totalStrips; bit++) {
                if (((bottle >> bit) & 1) == 1) {
                    strips.get(bit).addDrop(bottle);
                }
            }
        }

        // Jour 7: Decoder le numero binaire
        int resultBottleId = 0;
        for (int bit = 0; bit < totalStrips; bit++) {
            if (strips.get(bit).isPositive(poisonedBottleId)) {
                resultBottleId |= (1 << bit);
            }
        }

        return resultBottleId;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Délai Total | `7 Jours` | Un seul tour parallèle. |
| Espace Auxiliaire | `O(S)` | 10 résultats booléens en mémoire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Tests Groupés et Diagnostic

1. **Dorfman Pooling Médical :** Regroupement d'échantillons biologiques pour dépistage massif à coût logarithmique.
2. **Diagnostic de Commutateurs Réseau :** Isolement de lignes de communication défectueuses via paquets sondes multiplexés.

## Cas Limites et Robustesse

1. **Bouteille 0 (Tous les bits à 0) :** Aucune bandelette ne réagit, ce qui décode correctement l'indice 0.
