---
title: "Shallow vs Deep Copy: C++ Copy Constructors & Memory Safety (CTCI 12.5)"
description: "CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes."
date: "2025-12-25"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
previewImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 12.5.
> * **L'Approche:** CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **12.5**.

## 1. Contexte et Énoncé
CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes.

## 2. Code et Implémentation

```java
class MyArray {
    int* data;
    int size;
public:
    MyArray(const MyArray& other) { // Deep copy
        size = other.size;
        data = new int[size];
        std::copy(other.data, other.data + size, data);
    }
};
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.