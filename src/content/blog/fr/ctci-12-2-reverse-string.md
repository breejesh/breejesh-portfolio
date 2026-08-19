---
title: "Reverse String: In-Place C-Style Null-Terminated String Reverse (CTCI 12.2)"
description: "CTCI problem 12.2 in C++: reverse a null-terminated C-style string in-place using pointer arithmetic."
date: "2025-08-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-2-reverse-string.webp
previewImage: /assets/images/ctci-12-2-reverse-string.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 12.2.
> * **L'Approche:** CTCI problem 12.2 in C++: reverse a null-terminated C-style string in-place using pointer arithmetic.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **12.2**.

## 1. Contexte et Énoncé
CTCI problem 12.2 in C++: reverse a null-terminated C-style string in-place using pointer arithmetic.

## 2. Code et Implémentation

```cpp
void reverse(char* str) {
    char* end = str;
    char tmp;
    if (str) {
        while (*end) { ++end; }
        --end;
        while (str < end) {
            tmp = *str;
            *str++ = *end;
            *end-- = tmp;
        }
    }
}
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.