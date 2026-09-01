---
title: "Comprobar permutación: Decidir si una cadena es permutación de otra (CTCI 1.2)"
description: "Cómo comprobar si dos cadenas son permutaciones entre sí en tiempo lineal O(N) mediante recuento de frecuencias de caracteres."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-2-check-permutation.webp
previewImage: /assets/images/ctci-1-2-check-permutation.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dadas dos cadenas, escribir un método para decidir si una es una permutación de la otra.
> * **La Solución:** Array de frecuencias de caracteres en tiempo O(N) e incremento/decremento directo.
> * **En Producción:** Análisis de frecuencia en criptoanálisis y normalización de consultas de búsqueda.

## 1. Planteamiento del Problema

En *Cracking the Coding Interview* (Problema 1.2), dos cadenas son permutaciones si tienen exactamente los mismos caracteres con las mismas frecuencias.

## 2. Recuento de Frecuencia

Incrementar contadores con la primera cadena y decrementar con la segunda detecta desajustes en una sola pasada.

## Implementación en producción

```java
public static boolean permutation(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] letters = new int[128];
    for (int i = 0; i < s.length(); i++) letters[s.charAt(i)]++;
    for (int i = 0; i < t.length(); i++) {
        if (--letters[t.charAt(i)] < 0) return false;
    }
    return true;
}
```

## Análisis de complejidad y memoria

| Métrica | Complejidad | Detalle técnico |
|---|---|---|
| Tiempo | `O(N)` | Recorrido lineal único. |
| Espacio | `O(1)` | Array de 128 enteros. |

## Discusión de ingeniería de sistemas en el mundo real

### Aplicación en Producción: Motores de Búsqueda

Comparación de bolsas de palabras (Bag-of-Words) para emparejamiento semántico rápido.

## Casos límite y robustez en producción

1. Cadenas de longitudes distintas.
