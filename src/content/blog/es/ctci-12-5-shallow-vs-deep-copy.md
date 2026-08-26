---
title: "Shallow vs Deep Copy: C++ Copy Constructors & Memory Safety (CTCI 12.5)"
description: "CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes."
date: "2025-12-25"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
previewImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 12.5.
> * **El Enfoque:** CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **12.5**.

## 1. Contexto y Enunciado
CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes.

## 2. Código e Implementación

```cpp
class MyArray {
    int* data;
    int size;
public:
    MyArray(const MyArray& other) { // Deep copy
        size = other.size;
        data = new int[size];
        std::copy(other.data, other.data + size, data);
    }
};
```

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.