---
title: "TreeMap vs HashMap vs LinkedHashMap: Java Map Selection Guide (CTCI 13.5)"
description: "CTCI problem 13.5: comparing HashMap O(1), TreeMap O(log N) sorted, and LinkedHashMap insertion-ordered maps in Java."
date: "2025-10-04"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
previewImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
---


> **TL;DR**
> * **Le Problème:** Mécanique technique du problème CTCI 13.5.
> * **L'Approche:** CTCI problem 13.5: comparing HashMap O(1), TreeMap O(log N) sorted, and LinkedHashMap insertion-ordered maps in Java.
> * **Complexité:** Empreinte mémoire et temps optimaux.

Cet article explique clairement le problème CTCI **13.5**.

## 1. Contexte et Énoncé
CTCI problem 13.5: comparing HashMap O(1), TreeMap O(log N) sorted, and LinkedHashMap insertion-ordered maps in Java.

## 2. Code et Implémentation

```java
Map<String, Integer> hashMap = new HashMap<>(); // O(1)
Map<String, Integer> treeMap = new TreeMap<>(); // Sorted by keys O(log N)
Map<String, Integer> linkedMap = new LinkedHashMap<>(); // Insertion order
```

## 3. Résumé et Cas Limites
Toujours vérifier les conditions aux limites et les valeurs nulles.