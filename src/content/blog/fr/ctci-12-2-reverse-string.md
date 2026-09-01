---
title: "Inverser une Chaîne: Inversion en Place de Chaîne C avec Deux Pointeurs (CTCI 12.2)"
description: "Inversez une chaîne de caractères C terminée par un caractère nul en place via arithmétique de pointeurs en temps O(N) et espace O(1) sans tampon mémoire."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-2-reverse-string.webp
previewImage: /assets/images/ctci-12-2-reverse-string.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Implémentez une fonction `void reverse(char* str)` en C ou C++ qui inverse une chaîne de caractères terminée par un caractère nul (`'\0'`) en place.
> * **La Solution Optimale:** **Arithmétique à Deux Pointeurs** : (1) Vérifier la non-nullité du pointeur `str` ; (2) Incrémenter un pointeur `end` jusqu'à rencontrer `'\0'`, puis reculer d'un cran `end--` ; (3) Initialiser `start = str` ; (4) Tant que `start < end`, échanger `*start` et `*end`, avancer `start++` et reculer `end--` ; (5) S'exécute en **temps $O(N)$** et **espace $O(1)$**.
> * **Réalité en Production:** Inversion d'octets de paquets réseau et manipulation de tampons bas niveau en C.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 12.2), l'énoncé est :

*"Implementez une fonction en C/C++ inversant une chaine de caracteres terminee par un caractere nul en place."*

## 2. Mécanique de l'Inversion par Pointeurs

Une chaîne de caractères C est stockée sous forme de séquence d'octets contigus se terminant par `'\0'` :
```
['s', 'a', 'l', 'u', 't', '\0']
  ▲                   ▲
start                end
```

L'avancement de `end` jusqu'au terminateur nul suivi d'un rétrécissement symétrique inverse les octets sans mémoire additionnelle.

## Implémentation de Production

```c
#include <stdio.h>

void reverse(char* str) {
    if (!str) return;

    char* end = str;
    char temp;

    while (*end) {
        end++;
    }
    end--;

    char* start = str;
    while (start < end) {
        temp = *start;
        *start = *end;
        *end = temp;

        start++;
        end--;
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | $N$ pas pour localiser `\0` et $N / 2$ permutations d'octets. |
| Espace Auxiliaire | `O(1)` | Variables de registres scalaires. |

## Ingénierie des Systèmes en Production

### Architecture Système : Segments de Mémoire Read-Only

1. **Littéraux de Chaîne vs Tableaux :** Appeler `reverse("salut")` déclenche une violation d'accès (`SIGSEGV`) car les littéraux résident dans le segment mémoire en lecture seule `.rodata`. La chaîne doit être allouée dans un tableau mutable (`char str[] = "salut";`).
2. **Gestion de l'Endianness Réseau :** Inversion d'octets entre formats Big-Endian et Little-Endian.

## Cas Limites et Robustesse

1. **Pointeur Nul (`str == NULL`) :** Filtré par la clause de garde initiale.
2. **Chaîne Vide (`""`) :** `end--` place `end < start`, sautant la boucle d'échange.
