---
title: "2D Alloc: Allocate 2D Array in C with Single Malloc (CTCI 12.11)"
description: "CTCI problem 12.11 in C: allocate a 2D array dynamically using a single malloc call to guarantee memory contiguity."
date: "2025-09-30"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-11-2d-alloc.webp
previewImage: /assets/images/ctci-12-11-2d-alloc.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 12.11.
> * **L'Approche:** CTCI problem 12.11 in C: allocate a 2D array dynamically using a single malloc call to guarantee memory contiguity.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **12.11**.

## 1. Contexte et Énoncé
CTCI problem 12.11 in C: allocate a 2D array dynamically using a single malloc call to guarantee memory contiguity.

## 2. Code et Implémentation

```cpp
int** my2DAlloc(int rows, int cols) {
    int header = rows * sizeof(int*);
    int data = rows * cols * sizeof(int);
    int** rowptr = (int**)malloc(header + data);
    int* buf = (int*)(rowptr + rows);
    for (int i = 0; i < rows; i++) {
        rowptr[i] = buf + i * cols;
    }
    return rowptr;
}
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.