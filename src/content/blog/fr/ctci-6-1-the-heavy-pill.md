---
title: "La pilule lourde: Énigme de pesée et décodage mathématique discret (CTCI 6.1)"
description: "Identifier le flacon contenant les pilules de 1,1g parmi 20 en une seule pesée grâce à une progression arithmétique."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-1-the-heavy-pill.webp
previewImage: /assets/images/ctci-6-1-the-heavy-pill.webp
---

> **TL;DR**
> * **Le Défi du Livre:** 20 flacons de pilules. 19 contiennent des pilules de 1,0g et 1 contient des pilules de 1,1g. Trouver le flacon lourd en 1 seule pesée.
> * **L'Approche:** Prélever $i$ pilules du flacon $i$ (210 pilules au total). Le numéro du flacon correspond exactement à $(\text{Poids} - 210) / 0,1$.
> * **En Production:** Décodage de syndrome dans les codes correcteurs d'erreurs (ECC).

## 1. Spécification du problème

Énigme classique évaluant la capacité à encoder de l'information discrète dans une mesure continue unique.

## 2. Pondération par progression arithmétique

Chaque flacon contribue proportionnellement à son index, permettant une extraction algébrique directe.

## Implémentation de production

```java
int expectedPills = (totalBottles * (totalBottles + 1)) / 2;
double excessWeight = scaleWeight - (expectedPills * 1.0);
int heavyBottle = (int) Math.round(excessWeight / 0.1);
```

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| Pesées | `1` | Mesure unique. |
| Temps | `O(1)` | Calcul direct. |

## Analyse d'ingénierie système en production réelle

### Utilisation en Production: Codes de Hamming

Localisation d'erreurs binaires dans les contrôleurs de mémoire vive sans balayage exhaustif.

## Cas limites et durcissement en production

1. Arrondi numérique sur les fractions flottantes.
