---
title: "Lambda Random: Random Subset Generation with Java Streams (CTCI 13.8)"
description: "CTCI problem 13.8: generating a random subset of a list using Java Streams and lambda expressions."
date: "2026-02-14"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-13-8-lambda-random.webp
previewImage: /assets/images/ctci-13-8-lambda-random.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 13.8.
> * **El Enfoque:** CTCI problem 13.8: generating a random subset of a list using Java Streams and lambda expressions.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **13.8**.

## 1. Contexto y Enunciado
CTCI problem 13.8: generating a random subset of a list using Java Streams and lambda expressions.

## 2. Código e Implementación

```java
public List<Integer> getRandomSubset(List<Integer> list) {
    Random rand = new Random();
    return list.stream()
        .filter(item -> rand.nextBoolean())
        .collect(Collectors.toList());
}
```

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.