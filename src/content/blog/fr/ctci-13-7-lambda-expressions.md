---
title: "Lambda Expressions: Functional Interfaces & Streams in Java (CTCI 13.7)"
description: "CTCI problem 13.7: using Java 8+ Lambda expressions and Streams to filter, map, and reduce collections cleanly."
date: "2026-04-04"
tags: [Algorithms]
coverImage: /assets/images/ctci-13-7-lambda-expressions.webp
previewImage: /assets/images/ctci-13-7-lambda-expressions.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 13.7.
> * **L'Approche:** CTCI problem 13.7: using Java 8+ Lambda expressions and Streams to filter, map, and reduce collections cleanly.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **13.7**.

## 1. Contexte et Énoncé
CTCI problem 13.7: using Java 8+ Lambda expressions and Streams to filter, map, and reduce collections cleanly.

## 2. Code et Implémentation

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
List<Integer> evens = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.