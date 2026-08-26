---
title: "Return from Finally: Try-Catch-Finally Execution Order in Java (CTCI 13.2)"
description: "CTCI problem 13.2: how return statements in try, catch, and finally blocks interact in Java runtime execution."
date: "2025-08-07"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-13-2-return-from-finally.webp
previewImage: /assets/images/ctci-13-2-return-from-finally.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 13.2.
> * **L'Approche:** CTCI problem 13.2: how return statements in try, catch, and finally blocks interact in Java runtime execution.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **13.2**.

## 1. Contexte et Énoncé
CTCI problem 13.2: how return statements in try, catch, and finally blocks interact in Java runtime execution.

## 2. Code et Implémentation

```java
public static int testFinally() {
    try {
        return 1;
    } finally {
        return 2; // Finally block overrides try return, returns 2!
    }
}
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.