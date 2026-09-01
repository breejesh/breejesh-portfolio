---
title: "Es único: Determinar si una cadena tiene caracteres únicos (CTCI 1.1)"
description: "Cómo determinar si una cadena tiene todos los caracteres únicos sin estructuras de datos adicionales usando vectores de bits."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-1-is-unique.webp
previewImage: /assets/images/ctci-1-1-is-unique.webp
---

> **TL;DR**
> * **El Problema del Libro:** Implementar un algoritmo para determinar si una cadena tiene todos los caracteres únicos sin usar estructuras adicionales.
> * **La Solución:** Vector de bits en un entero de 32 bits (`checker |= (1 << val)`) en tiempo O(N) y memoria O(1).
> * **En Producción:** Tablas de símbolos e interning de cadenas en motores V8.

## 1. Planteamiento del Problema

En *Cracking the Coding Interview* (Problema 1.1), se comprueba la unicidad de caracteres aplicando el principio del palomar.

## 2. Solución con Vector de Bits

Uso de un entero de 32 bits donde cada bit representa una letra del alfabeto, logrando espacio auxiliar estrictamente constante.

## Implementación en producción

```java
public static boolean isUniqueChars(String str) {
    if (str.length() > 128) return false;
    int checker = 0;
    for (int i = 0; i < str.length(); i++) {
        int val = str.charAt(i) - 'a';
        if ((checker & (1 << val)) > 0) return false;
        checker |= (1 << val);
    }
    return true;
}
```

## Análisis de complejidad y memoria

| Métrica | Complejidad | Detalle técnico |
|---|---|---|
| Tiempo | `O(1)` | Acotado por el tamaño del alfabeto. |
| Espacio | `O(1)` | Registro de 32 bits. |

## Discusión de ingeniería de sistemas en el mundo real

### Aplicación en Producción: Motores JavaScript y V8

Interning de cadenas para evitar asignaciones duplicadas en memoria heap.

## Casos límite y robustez en producción

1. Cadenas de longitud superior a 128 caracteres.
