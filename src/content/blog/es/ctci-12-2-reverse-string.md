---
title: "Reverse String: In-Place C-Style Null-Terminated String Reverse (CTCI 12.2)"
description: "CTCI problem 12.2 in C++: reverse a null-terminated C-style string in-place using pointer arithmetic."
date: "2025-08-20"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-2-reverse-string.webp
previewImage: /assets/images/ctci-12-2-reverse-string.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 12.2.
> * **El Enfoque:** CTCI problem 12.2 in C++: reverse a null-terminated C-style string in-place using pointer arithmetic.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **12.2**.

## 1. Contexto y Enunciado
CTCI problem 12.2 in C++: reverse a null-terminated C-style string in-place using pointer arithmetic.

## 2. Código e Implementación

```cpp
void reverse(char* str) {
    char* end = str;
    char tmp;
    if (str) {
        while (*end) { ++end; }
        --end;
        while (str < end) {
            tmp = *str;
            *str++ = *end;
            *end-- = tmp;
        }
    }
}
```

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.