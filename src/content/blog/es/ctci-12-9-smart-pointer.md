---
title: "Smart Pointer: Building a Custom Reference Counting Pointer in C++ (CTCI 12.9)"
description: "CTCI problem 12.9: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation."
date: "2026-04-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-9-smart-pointer.webp
previewImage: /assets/images/ctci-12-9-smart-pointer.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 12.9.
> * **El Enfoque:** CTCI problem 12.9: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **12.9**.

## 1. Contexto y Enunciado
CTCI problem 12.9: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation.

## 2. Código e Implementación

```java
template <typename T>
class SmartPointer {
    T* ref;
    unsigned* ref_count;
public:
    SmartPointer(T* ptr) : ref(ptr), ref_count(new unsigned(1)) {}
    ~SmartPointer() {
        if (--(*ref_count) == 0) {
            delete ref;
            delete ref_count;
        }
    }
};
```

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.