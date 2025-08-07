---
title: "Return from Finally: Try-Catch-Finally Execution Order in Java (CTCI 13.2)"
description: "CTCI problem 13.2: how return statements in try, catch, and finally blocks interact in Java runtime execution."
date: "2025-08-07"
tags: [Algorithms]
coverImage: /assets/images/ctci-13-2-return-from-finally.webp
previewImage: /assets/images/ctci-13-2-return-from-finally.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 13.2.
> * **El Enfoque:** CTCI problem 13.2: how return statements in try, catch, and finally blocks interact in Java runtime execution.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **13.2**.

## 1. Contexto y Enunciado
CTCI problem 13.2: how return statements in try, catch, and finally blocks interact in Java runtime execution.

## 2. Código e Implementación

```java
public static int testFinally() {
    try {
        return 1;
    } finally {
        return 2; // Finally block overrides try return, returns 2!
    }
}
```

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.