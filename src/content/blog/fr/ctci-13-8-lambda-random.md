---
title: "Lambda Random: Random Subset Generation with Java Streams (CTCI 13.8)"
description: "CTCI problem 13.8: generating a random subset of a list using Java Streams and lambda expressions."
date: "2026-02-14"
tags: [Algorithms]
coverImage: /assets/images/ctci-13-8-lambda-random.webp
previewImage: /assets/images/ctci-13-8-lambda-random.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 13.8.
> * **L'Approche:** CTCI problem 13.8: generating a random subset of a list using Java Streams and lambda expressions.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **13.8**.

## 1. Contexte et Énoncé
CTCI problem 13.8: generating a random subset of a list using Java Streams and lambda expressions.

## 2. Code et Implémentation

```java
public List<Integer> getRandomSubset(List<Integer> list) {
    Random rand = new Random();
    return list.stream()
        .filter(item -> rand.nextBoolean())
        .collect(Collectors.toList());
}
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.