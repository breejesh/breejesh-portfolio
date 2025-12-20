---
title: "Mistake: Debugging an Unsigned Loop Bug in C/Java (CTCI 11.1)"
description: "CTCI problem 11.1: find the flaw in an unsigned integer countdown loop causing an infinite execution bug."
date: "2025-12-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-11-1-mistake.webp
previewImage: /assets/images/ctci-11-1-mistake.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 11.1.
> * **El Enfoque:** CTCI problem 11.1: find the flaw in an unsigned integer countdown loop causing an infinite execution bug.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **11.1**.

## 1. Contexto y Enunciado
CTCI problem 11.1: find the flaw in an unsigned integer countdown loop causing an infinite execution bug.

## 2. Código e Implementación

```java
void printCountdown() {
    unsigned int i;
    for (i = 100; i >= 0; --i) {
        printf("%d\n", i); // Flaw: i >= 0 is always true for unsigned int!
    }
}
```

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.