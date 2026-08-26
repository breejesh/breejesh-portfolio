---
title: "Mistake: Debugging an Unsigned Loop Bug in C/Java (CTCI 11.1)"
description: "CTCI problem 11.1: find the flaw in an unsigned integer countdown loop causing an infinite execution bug."
date: "2025-12-20"
tags: [Algorithmes et Structures, Outils Développeur]
coverImage: /assets/images/ctci-11-1-mistake.webp
previewImage: /assets/images/ctci-11-1-mistake.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 11.1.
> * **L'Approche:** CTCI problem 11.1: find the flaw in an unsigned integer countdown loop causing an infinite execution bug.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **11.1**.

## 1. Contexte et Énoncé
CTCI problem 11.1: find the flaw in an unsigned integer countdown loop causing an infinite execution bug.

## 2. Code et Implémentation

```java
void printCountdown() {
    unsigned int i;
    for (i = 100; i >= 0; --i) {
        printf("%d\n", i); // Flaw: i >= 0 is always true for unsigned int!
    }
}
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.