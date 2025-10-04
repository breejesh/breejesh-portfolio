---
title: "TreeMap vs HashMap vs LinkedHashMap: Java Map Selection Guide (CTCI 13.5)"
description: "CTCI problem 13.5: comparing HashMap O(1), TreeMap O(log N) sorted, and LinkedHashMap insertion-ordered maps in Java."
date: "2025-10-04"
tags: [Algorithms]
coverImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
previewImage: /assets/images/ctci-13-5-treemap-hashmap-linkedhashmap.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 13.5.
> * **El Enfoque:** CTCI problem 13.5: comparing HashMap O(1), TreeMap O(log N) sorted, and LinkedHashMap insertion-ordered maps in Java.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **13.5**.

## 1. Contexto y Enunciado
CTCI problem 13.5: comparing HashMap O(1), TreeMap O(log N) sorted, and LinkedHashMap insertion-ordered maps in Java.

## 2. Código e Implementación

```java
Map<String, Integer> hashMap = new HashMap<>(); // O(1)
Map<String, Integer> treeMap = new TreeMap<>(); // Sorted by keys O(log N)
Map<String, Integer> linkedMap = new LinkedHashMap<>(); // Insertion order
```

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.