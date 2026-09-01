---
title: "Le problème des œufs: Minimisation du pire cas avec 2 œufs (CTCI 6.8)"
description: "Trouver l'étage critique dans un bâtiment de 100 étages avec 2 œufs en minimisant le nombre maximal d'essais."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
previewImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
---

> **TL;DR**
> * **Le Défi du Livre:** Trouver l'étage de rupture d'un œuf dans un immeuble de 100 étages avec 2 œufs.
> * **L'Approche:** Intervalles décroissants $x + (x-1) + \dots + 1 \ge 100 \implies x = 14$ lancers au pire cas.

## 1. Spécification du problème

Problème d'optimisation sous contrainte de destruction partielle des sondes d'essai.

## 2. Équilibrage des charges d'essai

Réduction constante de la taille des segments pour compenser les lancers cumulés du premier œuf.

## Implémentation de production

```java
public static int findOptimalDrops(int totalFloors) {
    return (int) Math.ceil((-1.0 + Math.sqrt(1.0 + 8.0 * totalFloors)) / 2.0);
}
```

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| Lancers max | `14` | Bâtiment de 100 étages. |
| Ordre | `O(sqrt(N))` | Recherche quadratique inverse. |

## Analyse d'ingénierie système en production réelle

### Utilisation en Production: Sondage de charge réseau

Recherche du point de saturation d'un système sans provoquer de panne générale prolongée.

## Cas limites et durcissement en production

1. Bâtiment à un seul étage.
