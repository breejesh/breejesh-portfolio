---
title: "La píldora pesada: Acertijos de pesaje y decodificación matemática (CTCI 6.1)"
description: "Cómo identificar cuál de 20 frascos contiene píldoras de 1.1g en lugar de 1.0g en una única pesada mediante ponderación lineal."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-1-the-heavy-pill.webp
previewImage: /assets/images/ctci-6-1-the-heavy-pill.webp
---

> **TL;DR**
> * **El Problema del Libro:** 20 frascos de píldoras. 19 contienen píldoras de 1.0g y 1 contiene píldoras de 1.1g. Identificar el frasco pesado con una sola pesada en báscula digital.
> * **La Solución:** Tomar $i$ píldoras del frasco $i$ ($1 + 2 + \dots + 20 = 210$ píldoras). El frasco pesado es $(\text{Peso} - 210) / 0.1$.
> * **En Producción:** Principio de decodificación de síndromes en memorias con corrección de errores (ECC).

## 1. Planteamiento del Problema

En *Cracking the Coding Interview* (Problema 6.1), se busca identificar el frasco anómalo en una única medición exacta.

## 2. Método de Progresión Aritmética

Tomar un número variable de píldoras por frasco codifica unívocamente el índice del frasco en el exceso de peso medido.

## Implementación en producción

```java
// Cálculo del frasco pesado en O(1)
int expectedPills = (totalBottles * (totalBottles + 1)) / 2;
double excessWeight = scaleWeight - (expectedPills * 1.0);
int heavyBottle = (int) Math.round(excessWeight / 0.1);
```

## Análisis de complejidad y memoria

| Métrica | Complejidad | Detalle técnico |
|---|---|---|
| Mediciones | `1 Pesada` | Medición única. |
| Tiempo | `O(1)` | Fórmula algebraica directa. |

## Discusión de ingeniería de sistemas en el mundo real

### Aplicación en Producción: Detección de Errores en Memoria ECC

Uso de matrices de paridad para identificar la posición exacta de un bit corrupto en memoria RAM.

## Casos límite y robustez en producción

1. Gestión de imprecisiones en aritmética de coma flotante.
