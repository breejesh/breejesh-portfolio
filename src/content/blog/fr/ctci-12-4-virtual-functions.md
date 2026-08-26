---
title: "Virtual Functions: How vptr and vtable Work in C++ (CTCI 12.4)"
description: "CTCI problem 12.4: explaining dynamic dispatch, vtable, and vptr layout in C++ runtime polymorphism."
date: "2026-03-03"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-12-4-virtual-functions.webp
previewImage: /assets/images/ctci-12-4-virtual-functions.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 12.4.
> * **L'Approche:** CTCI problem 12.4: explaining dynamic dispatch, vtable, and vptr layout in C++ runtime polymorphism.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **12.4**.

## 1. Contexte et Énoncé
CTCI problem 12.4: explaining dynamic dispatch, vtable, and vptr layout in C++ runtime polymorphism.

## 2. Code et Implémentation

```cpp
class Shape {
public:
    virtual void draw() { std::cout << "Shape" << std::endl; }
};
class Circle : public Shape {
public:
    void draw() override { std::cout << "Circle" << std::endl; }
};
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.