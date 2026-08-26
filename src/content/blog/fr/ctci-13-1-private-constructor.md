---
title: "Private Constructor: Inaccessible Constructors & Singleton Pattern in Java (CTCI 13.1)"
description: "CTCI problem 13.1: why and how private constructors are used in Java for Singleton pattern and utility classes."
date: "2025-10-08"
tags: [Backend et Bases de Données, Algorithmes et Structures]
coverImage: /assets/images/ctci-13-1-private-constructor.webp
previewImage: /assets/images/ctci-13-1-private-constructor.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 13.1.
> * **L'Approche:** CTCI problem 13.1: why and how private constructors are used in Java for Singleton pattern and utility classes.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **13.1**.

## 1. Contexte et Énoncé
CTCI problem 13.1: why and how private constructors are used in Java for Singleton pattern and utility classes.

## 2. Code et Implémentation

```java
public class Singleton {
    private static final Singleton INSTANCE = new Singleton();
    private Singleton() {} // Private constructor prevents instantiation
    public static Singleton getInstance() { return INSTANCE; }
}
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.