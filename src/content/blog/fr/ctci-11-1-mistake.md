---
title: "L'Erreur: Sous-Dépassement d'Entiers Non Signés et Boucles Infinies (CTCI 11.1)"
description: "Identifiez et corrigez les anomalies critiques de sous-dépassement (underflow) et de boucle infinie en C/C++ via analyse statique et sécurité des types."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-11-1-mistake.webp
previewImage: /assets/images/ctci-11-1-mistake.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Trouvez la ou les erreurs dans le code suivant : `unsigned int i; for (i = 100; i >= 0; --i) printf("%d\n", i);`
> * **Les Anomalies et Causes Racines :** (1) **Sous-Dépassement Non Signé** : Un type `unsigned int` est strictement non négatif ($i \ge 0$ est une tautologie toujours vraie). À $i = 0$, la décrémentation `--i` provoque un rebouclage modulaire vers `UINT_MAX` ($4\,294\,967\,295$), créant une boucle infinie ; (2) **Spécificateur de Format Inadéquat** : `%d` attend un entier signé et doit être remplacé par `%u`.
> * **La Solution Optimale:** Déclarer un entier signé `int i` ou ajuster la condition de boucle.
> * **Réalité en Production:** Failles de sécurité CVE dans le noyau Linux et dépassements de registres en avionique.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 11.1), l'énoncé est :

*"Diagnostiquez les erreurs de programmation dans le fragment de code C suivant :"*

```c
unsigned int i;
for (i = 100; i >= 0; --i)
    printf("%d\n", i);
```

## 2. Arithmétique Modulaire des Types Non Signés

En C/C++, l'arithmétique non signée est définie modulo $2^W$ :
$$\text{Résultat} = (\text{valeur}) \pmod{2^W}$$

À $i = 0$ :
$$0 - 1 \equiv 4\,294\,967\,295\ (\text{UINT\_MAX})$$

Puisque $4\,294\,967\,295 \ge 0$, la condition `i >= 0` ne s'évalue jamais à faux.

## Implémentation de Production

```c
#include <stdio.h>

void printNumbersSigned(void) {
    for (int i = 100; i >= 0; --i) {
        printf("%d\n", i);
    }
}

void printNumbersUnsigned(void) {
    for (unsigned int i = 100; i > 0; --i) {
        printf("%u\n", i);
    }
    printf("%u\n", 0);
}
```

## Matrice des Défauts et Analyse Statique

| Défaut | Sévérité | Conséquence | Avertissement Compilateur |
|---|---|---|---|
| `unsigned int i >= 0` | Critique | Boucle Infinie / Gel du processus. | `-Wtype-limits` (GCC / Clang). |
| `%d` pour `unsigned int` | Modérée | Comportement indéfini sur grandes valeurs. | `-Wformat` (GCC / Clang). |

## Ingénierie des Systèmes en Production

### Architecture Système : Vulnérabilités par Sous-Dépassement

1. **Noyau Linux (CVE-2016-0728) :** Dépassement d'un compteur de références 32 bits non signé permettant l'élévation de privilèges root.
2. **Générateurs Électriques du Boeing 787 :** Arrêt forcé après 248 jours consécutifs suite au débordement d'un compteur 32 bits non signé.

## Cas Limites et Robustesse

1. **Optimisation Compilateur (`-O3`) :** Le compilateur peut supprimer la vérification et émettre un saut inconditionnel infini.
2. **Règle CI/CD :** Activer systématiquement `-Wall -Wextra -Werror` pour bloquer les comparaisons tautologiques.
