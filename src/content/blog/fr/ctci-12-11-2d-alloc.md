---
title: "Allocation 2D: Matrice Contiguë avec un Unique Malloc en C (CTCI 12.11)"
description: "Allouez une matrice bidimensionnelle contiguë en C indexable via arr[i][j] à l'aide d'un unique appel à malloc pour éliminer la fragmentation mémoire."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-11-2d-alloc.webp
previewImage: /assets/images/ctci-12-11-2d-alloc.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une fonction en C appelée `my2DAlloc` qui alloue un tableau à deux dimensions. Minimisez le nombre d'appels à `malloc` et assurez-vous que la mémoire soit accessible avec la syntaxe `arr[i][j]`.
> * **La Solution Optimale:** **Matrice Contiguë à Allocation Unique** : (1) L'approche naïve requiert $R + 1$ allocations distinctes (fragmentant la mémoire et imposant une boucle de désallocation) ; (2) Allouer l'ensemble de la structure en **1 unique appel malloc** : `total = rows * sizeof(int*) + rows * cols * sizeof(int)` ; (3) Utiliser l'en-tête pour le tableau de pointeurs de lignes `int** row_ptrs` ; (4) Pointer chaque `row_ptrs[i]` vers son décalage de données : `(int*)(row_ptrs + rows) + i * cols` ; (5) Autorise l'indexation native `arr[i][j]` ; (6) Libération intégrale par un simple `free(arr)`.
> * **Réalité en Production:** Noyaux d'algèbre linéaire (BLAS/LAPACK) et tampons de traitement d'images.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 12.11), l'énoncé est :

*"Implementez la fonction my2DAlloc en C allouant un tableau bidimensionnel avec indexation arr[i][j] tout en minimisant les appels a malloc."*

## 2. Organisation Mémoire Contiguë

En combinant le vecteur de pointeurs de lignes et les données matricielles dans un unique bloc contigu :
$$\text{Taille Totale} = (\text{lignes} \times \text{sizeof(int*)}) + (\text{lignes} \times \text{colonnes} \times \text{sizeof(int)})$$

## Implémentation de Production

```c
#include <stdio.h>
#include <stdlib.h>

int** my2DAlloc(int rows, int cols) {
    if (rows <= 0 || cols <= 0) return NULL;

    size_t header_size = rows * sizeof(int*);
    size_t data_size = (size_t)rows * cols * sizeof(int);

    int** row_ptrs = (int**)malloc(header_size + data_size);
    if (!row_ptrs) return NULL;

    int* data_start = (int*)(row_ptrs + rows);

    for (int i = 0; i < rows; i++) {
        row_ptrs[i] = data_start + (i * cols);
    }

    return row_ptrs;
}

void my2DFree(int** arr) {
    free(arr); // Un seul appel libere l'integralite de la matrice
}
```

## Comparatif des Approches

| Critère | Multi-Malloc Naïf ($R + 1$ Appels) | Malloc Unique Optimal (1 Appel) |
|---|---|---|
| **Allocations sur le Tas** | $R + 1$ blocs disjoints | **Exactement 1 allocation** |
| **Localité Cache** | Dispersion sur le tas | **Bloc contigu avec préchargement L1/L2** |
| **Désallocation** | Boucle de $R$ appels `free()` | **Un unique appel `free(arr)`** |

## Ingénierie des Systèmes en Production

### Architecture Système : Transferts Directs DMA vers GPU

1. **Transfert VRAM Direct :** La contiguïté mémoire permet d'envoyer la matrice à un GPU via `cudaMemcpy2D` en une seule rafale DMA ultrarapide.
2. **Multiplication Matricielle :** Évite les défauts de cache lors des parcours séquentiels.

## Cas Limites et Robustesse

1. **Dimensions Négatives ou Nulles :** Retour immédiat de `NULL`.
