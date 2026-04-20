---
title: "Smart Pointer: Building a Custom Reference Counting Pointer in C++ (CTCI 12.9)"
description: "CTCI problem 12.9: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation."
date: "2026-04-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-9-smart-pointer.webp
previewImage: /assets/images/ctci-12-9-smart-pointer.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 12.9.
> * **L'Approche:** CTCI problem 12.9: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **12.9**.

## 1. Contexte et Énoncé
CTCI problem 12.9: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation.

## 2. Code et Implémentation

```java
template <typename T>
class SmartPointer {
    T* ref;
    unsigned* ref_count;
public:
    SmartPointer(T* ptr) : ref(ptr), ref_count(new unsigned(1)) {}
    ~SmartPointer() {
        if (--(*ref_count) == 0) {
            delete ref;
            delete ref_count;
        }
    }
};
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.