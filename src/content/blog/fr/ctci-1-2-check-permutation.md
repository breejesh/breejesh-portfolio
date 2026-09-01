---
title: "Vérifier la permutation: Déterminer si deux chaînes sont des anagrammes (CTCI 1.2)"
description: "Déterminer si une chaîne est une permutation d'une autre en temps O(N) via un tableau de fréquences de caractères."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-2-check-permutation.webp
previewImage: /assets/images/ctci-1-2-check-permutation.webp
---

> **TL;DR**
> * **Le Défi du Livre:** Écrire une méthode déterminant si une chaîne est une permutation d'une autre.
> * **L'Approche:** Tableau de comptage des fréquences de caractères en O(N) temps et O(1) espace.
> * **En Production:** Analyse fréquentielle et recherche d'anagrammes dans les moteurs d'indexation.

## 1. Spécification du problème

Validation d'équivalence de composition de caractères sous contrainte de longueur identique.

## 2. Comptage de fréquences

Incrémentation pour la chaîne source et décrémentation pour la chaîne cible avec arrêt précoce si le compteur devient négatif.

## Implémentation de production

```java
public static boolean permutation(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] letters = new int[128];
    for (int i = 0; i < s.length(); i++) letters[s.charAt(i)]++;
    for (int i = 0; i < t.length(); i++) {
        if (--letters[t.charAt(i)] < 0) return false;
    }
    return true;
}
```

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| Temps | `O(N)` | Passage linéaire. |
| Espace | `O(1)` | Mémoire fixe 128 octets. |

## Analyse d'ingénierie système en production réelle

### Utilisation en Production: Cryptanalyse

Comparaison d'histogrammes de caractères pour le déchiffrement de textes brouillés.

## Cas limites et durcissement en production

1. Différence de longueur immédiate.
