---
title: "Volatile: Demystifying the C/C++ Volatile Keyword (CTCI 12.6)"
description: "CTCI problem 12.6: when and why to use volatile to prevent compiler optimizations on hardware registers and memory-mapped IO."
date: "2026-02-07"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-6-volatile.webp
previewImage: /assets/images/ctci-12-6-volatile.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 12.6.
> * **L'Approche:** CTCI problem 12.6: when and why to use volatile to prevent compiler optimizations on hardware registers and memory-mapped IO.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **12.6**.

## 1. Contexte et Énoncé
CTCI problem 12.6: when and why to use volatile to prevent compiler optimizations on hardware registers and memory-mapped IO.

## 2. Code et Implémentation

```java
volatile int* hardwareRegister = (int*) 0x40001000;
while (*hardwareRegister == 0) {
    // Compiler will not optimize away this loop read
}
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.