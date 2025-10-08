---
title: "Private Constructor: Inaccessible Constructors & Singleton Pattern in Java (CTCI 13.1)"
description: "CTCI problem 13.1: why and how private constructors are used in Java for Singleton pattern and utility classes."
date: "2025-10-08"
tags: [Algorithms]
coverImage: /assets/images/ctci-13-1-private-constructor.webp
previewImage: /assets/images/ctci-13-1-private-constructor.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 13.1.
> * **El Enfoque:** CTCI problem 13.1: why and how private constructors are used in Java for Singleton pattern and utility classes.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **13.1**.

## 1. Contexto y Enunciado
CTCI problem 13.1: why and how private constructors are used in Java for Singleton pattern and utility classes.

## 2. Código e Implementación

```java
public class Singleton {
    private static final Singleton INSTANCE = new Singleton();
    private Singleton() {} // Private constructor prevents instantiation
    public static Singleton getInstance() { return INSTANCE; }
}
```

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.