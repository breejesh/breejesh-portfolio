---
title: "Object Reflection: How Java Reflection Works (CTCI 13.4)"
description: "CTCI problem 13.4: how Java Reflection API allows inspecting classes, invoking methods, and instantiating objects at runtime."
date: "2026-01-07"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-13-4-object-reflection.webp
previewImage: /assets/images/ctci-13-4-object-reflection.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 13.4.
> * **L'Approche:** CTCI problem 13.4: how Java Reflection API allows inspecting classes, invoking methods, and instantiating objects at runtime.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **13.4**.

## 1. Contexte et Énoncé
CTCI problem 13.4: how Java Reflection API allows inspecting classes, invoking methods, and instantiating objects at runtime.

## 2. Code et Implémentation

```java
Class<?> clazz = Class.forName("com.example.MyClass");
Method method = clazz.getMethod("doSomething");
method.invoke(clazz.getDeclaredConstructor().newInstance());
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.