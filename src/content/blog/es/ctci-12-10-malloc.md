---
title: "Malloc: Implement Aligned Malloc and Free in C (CTCI 12.10)"
description: "CTCI problem 12.10: implement aligned_malloc and aligned_free in C for memory alignment requirements."
date: "2026-03-16"
tags: [Algoritmos y Estructuras, Backend y Bases de Datos]
coverImage: /assets/images/ctci-12-10-malloc.webp
previewImage: /assets/images/ctci-12-10-malloc.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 12.10.
> * **El Enfoque:** CTCI problem 12.10: implement aligned_malloc and aligned_free in C for memory alignment requirements.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **12.10**.

## 1. Contexto y Enunciado
CTCI problem 12.10: implement aligned_malloc and aligned_free in C for memory alignment requirements.

## 2. Código e Implementación

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

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.