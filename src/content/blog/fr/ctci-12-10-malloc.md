---
title: "Malloc: Implement Aligned Malloc and Free in C (CTCI 12.10)"
description: "CTCI problem 12.10: implement aligned_malloc and aligned_free in C for memory alignment requirements."
date: "2026-03-16"
tags: [Algorithmes et Structures, Backend et Bases de Données]
coverImage: /assets/images/ctci-12-10-malloc.webp
previewImage: /assets/images/ctci-12-10-malloc.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 12.10.
> * **L'Approche:** CTCI problem 12.10: implement aligned_malloc and aligned_free in C for memory alignment requirements.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **12.10**.

## 1. Contexte et Énoncé
CTCI problem 12.10: implement aligned_malloc and aligned_free in C for memory alignment requirements.

## 2. Code et Implémentation

```cpp
void* aligned_malloc(size_t bytes, size_t alignment) {
    void* p1;
    void** p2;
    int offset = alignment - 1 + sizeof(void*);
    if ((p1 = (void*)malloc(bytes + offset)) == NULL) return NULL;
    p2 = (void**)(((size_t)(p1) + offset) & ~(alignment - 1));
    p2[-1] = p1;
    return p2;
}
void aligned_free(void* p) {
    free(((void**)p)[-1]);
}
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.