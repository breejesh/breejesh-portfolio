---
title: "2D Alloc: Allocate 2D Array in C with Single Malloc (CTCI 12.11)"
description: "CTCI problem 12.11 in C: allocate a 2D array dynamically using a single malloc call to guarantee memory contiguity."
date: "2025-09-30"
tags: [Algoritmos y Estructuras, Backend y Bases de Datos, Herramientas y Políticas Tech]
coverImage: /assets/images/ctci-12-11-2d-alloc.webp
previewImage: /assets/images/ctci-12-11-2d-alloc.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 12.11.
> * **El Enfoque:** CTCI problem 12.11 in C: allocate a 2D array dynamically using a single malloc call to guarantee memory contiguity.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **12.11**.

## 1. Contexto y Enunciado
CTCI problem 12.11 in C: allocate a 2D array dynamically using a single malloc call to guarantee memory contiguity.

## 2. Código e Implementación

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

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.