---
title: "Malloc Alignée: Allocateur de Mémoire avec Alignement d'Octets en C (CTCI 12.10)"
description: "Implémentez aligned_malloc et aligned_free en C pour répondre aux contraintes d'alignement matériel SIMD avec stockage d'en-tête en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-10-malloc.webp
previewImage: /assets/images/ctci-12-10-malloc.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Écrivez une fonction `aligned_malloc` et `aligned_free` prenant un nombre d'octets et un alignement (puissance de 2) et renvoyant un pointeur vers une adresse mémoire multiple de cet alignement.
> * **La Solution Optimale:** **Allocation avec Rembourrage et En-Tête Caché** : (1) Allouer `total = bytes + alignement - 1 + sizeof(void*)` via `malloc()` ; (2) Calculer l'adresse alignée par masque binaire : `aligned = (raw + sizeof(void*) + alignement - 1) & ~(alignement - 1)` ; (3) Stocker le pointeur brut d'origine dans l'emplacement mémoire situé immédiatement avant l'adresse alignée : `((void**)aligned)[-1] = raw` ; (4) Renvoyer `aligned` ; (5) `aligned_free(p)` : Récupérer `raw = ((void**)p)[-1]` et appeler `free(raw)` ; (6) S'exécute en **temps $O(1)$**.
> * **Réalité en Production:** Primitives POSIX `posix_memalign()`, C11 `aligned_alloc()` et vectorisation AVX-512.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 12.10), l'énoncé est :

*"Implementez les fonctions aligned_malloc et aligned_free en C permettant d'allouer de la memoire alignee sur une frontiere donnee."*

## 2. Organisation Mémoire et Masque Binaire

Pour libérer ultérieurement la mémoire allouée par `malloc()`, nous sauvegardons le pointeur initial juste avant l'adresse transmise à l'utilisateur :

$$\text{aligné} = (\text{raw} + \text{sizeof(void*)} + A - 1) \ \& \ \sim(A - 1)$$

## Implémentation de Production

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

void* aligned_malloc(size_t bytes, size_t alignment) {
    if (alignment == 0 || (alignment & (alignment - 1)) != 0) {
        return NULL;
    }

    size_t header_size = sizeof(void*);
    size_t total_bytes = bytes + alignment - 1 + header_size;

    void* raw = malloc(total_bytes);
    if (!raw) return NULL;

    uintptr_t raw_addr = (uintptr_t)raw + header_size;
    uintptr_t aligned_addr = (raw_addr + alignment - 1) & ~(alignment - 1);
    void* aligned_ptr = (void*)aligned_addr;

    ((void**)aligned_ptr)[-1] = raw;

    return aligned_ptr;
}

void aligned_free(void* p) {
    if (!p) return;
    void* raw = ((void**)p)[-1];
    free(raw);
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Temps d'Allocation | `O(1)` | Calculs arithmétiques binaires constants. |
| Temps de Libération | `O(1)` | Lecture du pointeur brut en en-tête et appel à `free()`. |
| Rembourrage Mémoire | $\le A + 7\text{ Octets}$ | Borne maximale liée à l'alignement $A$. |

## Ingénierie des Systèmes en Production

### Architecture Système : Optimisations SIMD

1. **Instructions AVX-512 :** Le chargement vectoriel (`_mm512_load_si512`) impose un alignement strict à 64 octets sous peine d'interruption matérielle (`#GP`).
2. **Entrées/Sorties Directes (Direct I/O) :** Tampons de lecture alignés sur les blocs de secteurs physiques de 4 096 octets.

## Cas Limites et Robustesse

1. **Alignement Non Puissance de Deux :** Bloqué par `(alignment & (alignment - 1)) != 0`.
2. **Pointeur Nul :** Sortie précoce sans déréférencement invalide.
