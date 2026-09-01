---
title: "Caractères uniques: Vérifier l'unicité des caractères d'une chaîne (CTCI 1.1)"
description: "Algorithme déterminant si une chaîne contient des caractères distincts sans structure de données auxiliaire via un vecteur de bits."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-1-is-unique.webp
previewImage: /assets/images/ctci-1-1-is-unique.webp
---

> **TL;DR**
> * **Le Défi du Livre:** Déterminer si une chaîne contient uniquement des caractères uniques sans structure additionnelle.
> * **L'Approche:** Vecteur de bits sur un entier 32 bits en temps O(N) et mémoire O(1).
> * **En Production:** Interning de chaînes dans le moteur JavaScript V8.

## 1. Spécification du problème

Validation d'unicité avec application du principe des tiroirs de Dirichlet sur l'alphabet ASCII.

## 2. Optimisation par vecteur de bits

Suivi des occurrences dans un registre entier pour éliminer toute allocation sur le tas.

## Implémentation de production

```java
public static boolean isUniqueChars(String str) {
    if (str.length() > 128) return false;
    int checker = 0;
    for (int i = 0; i < str.length(); i++) {
        int val = str.charAt(i) - 'a';
        if ((checker & (1 << val)) > 0) return false;
        checker |= (1 << val);
    }
    return true;
}
```

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| Temps | `O(1)` | Borné par 128 itérations. |
| Espace | `O(1)` | Mémoire registre constante. |

## Analyse d'ingénierie système en production réelle

### Utilisation en Production: Moteur V8

Dédoublonnage des identifiants et indexation bitmap dans les bases de données analytiques.

## Cas limites et durcissement en production

1. Chaîne vide ou dépassant 128 caractères.
