---
title: "L'Île aux Yeux Bleus: Connaissance Commune et Raisonnement Inductif (CTCI 6.6)"
description: "Résolvez l'énigme logique de l'Île aux Yeux Bleus par récurrence mathématique, logique épistémique et connaissance commune en O(c) jours."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-6-blue-eyed-island.webp
previewImage: /assets/images/ctci-6-6-blue-eyed-island.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Un visiteur annonce sur une île : « Au moins une personne a les yeux bleus. Quiconque déduit la couleur de ses propres yeux doit quitter l'île par le vol de 20h00 ». Tout le monde voit les yeux des autres mais pas les siens. Si $c$ personnes ont les yeux bleus et que tous sont parfaitement logiques, en combien de jours partiront-elles ?
> * **La Solution Optimale:** **Preuve par Récurrence** : (1) Si $c = 1$, la personne ne voit aucun œil bleu et part le Jour 1 ; (2) Si $c = 2$, chacun en voit 1 et attend qu'il parte le Jour 1. Constatant que personne n'est parti, ils déduisent que $c = 2$ et partent le Jour 2 ; (3) Par récurrence, les $c$ personnes aux yeux bleus partent toutes au **Jour $c$**.
> * **Réalité en Production:** Consensus byzantin (BFT) et synchronisation de connaissances en cryptographie distribuée.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 6.6), l'énoncé est :

*"Un groupe vit sur une île. Un visiteur annonce qu'au moins une personne a les yeux bleus. Combien de jours faudra-t-il pour que toutes les c personnes aux yeux bleus quittent l'île ?"*

## 2. Logique Épistémique : Connaissance Commune

L'annonce du visiteur transforme une information partagée en **connaissance commune** (« tout le monde sait que tout le monde sait... »), permettant à la chaîne inductive de s'enclencher.

## 3. Preuve par Récurrence

1. **Cas $c = 1$ :** La personne ne voit aucun œil bleu $\implies$ elle comprend immédiatement qu'elle est concernée et part au **Jour 1**.
2. **Cas $c = 2$ :** Chacun voit 1 personne aux yeux bleus. Si elle était seule, elle serait partie au Jour 1. N'étant pas partie, les deux déduisent qu'il y a 2 personnes aux yeux bleus et partent au **Jour 2**.
3. **Étape de Récurrence :** Pour $c$ personnes, personne ne partant au Jour $c - 1$, tous déduisent leur état et partent au **Jour $c$**.

## Implémentation de Production

```java
public class BlueEyedIsland {
    /**
     * Calcule le nombre de jours jusqu'au depart de c personnes aux yeux bleus.
     * Complexite Temporelle: O(1)
     * Complexite Spatiale: O(1)
     */
    public static int daysUntilDeparture(int blueEyedCount) {
        if (blueEyedCount <= 0) {
            throw new IllegalArgumentException("Le nombre doit etre strictement positif.");
        }
        return blueEyedCount;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Temps de Résolution | `O(c)` | Nécessite exactement $c$ cycles de synchronisation journaliers. |
| Espace Auxiliaire | `O(1)` | Zéro allocation mémoire. |

## Ingénierie des Systèmes en Production

### Architecture Système : Consensus et Connaissance Distribuée

1. **Tolérance aux Pannes Byzantines (BFT) :** Les nœuds effectuent $f + 1$ rondes d'échanges pour convertir les observations locales en vérité collective.
2. **Invalidation de Cache Distribué :** Synchronisation par époques temporelles d'arborescence.

## Cas Limites et Robustesse

1. **$c = 1$ :** Départ immédiat le soir même.
2. **Population restante :** Déduit le caractère non-bleu de ses yeux après le départ du groupe.
