---
title: "El problema de los huevos: Minimizar pruebas en el peor caso con 2 huevos (CTCI 6.8)"
description: "Cómo encontrar el piso más alto desde el que se puede dejar caer un huevo sin que se rompa en un edificio de 100 pisos con 2 huevos minimizando el peor caso."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
previewImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
---

> **TL;DR**
> * **El Problema del Libro:** Edificio de 100 pisos y 2 huevos. Hallar el piso crítico minimizando el peor caso de lanzamientos.
> * **La Solución:** Disminuir el intervalo en 1 en cada paso: $x + (x-1) + \dots + 1 \ge 100 \implies x = 14$ lanzamientos como máximo.
> * **En Producción:** Algoritmos de búsqueda adaptativa de límites de carga.

## 1. Planteamiento del Problema

En *Cracking the Coding Interview* (Problema 6.8), se busca balancear las pruebas del primer huevo con la búsqueda lineal del segundo.

## 2. Estrategia de Intervalos Decrecientes

Cada lanzamiento del primer huevo reduce en 1 el rango de búsqueda del segundo, igualando el peor caso a exactamente 14 lanzamientos.

## Implementación en producción

```java
// Cálculo del piso inicial x(x+1)/2 >= totalFloors
public static int findOptimalDrops(int totalFloors) {
    return (int) Math.ceil((-1.0 + Math.sqrt(1.0 + 8.0 * totalFloors)) / 2.0);
}
```

## Análisis de complejidad y memoria

| Métrica | Complejidad | Detalle técnico |
|---|---|---|
| Peor caso | `14 lanzamientos` | Para 100 pisos con 2 huevos. |
| Complejidad | `O(sqrt(N))` | Crecimiento sublineal. |

## Discusión de ingeniería de sistemas en el mundo real

### Aplicación en Producción: Búsqueda Adaptativa de Rendimiento

Ajuste no lineal de sondas de red para encontrar el límite de saturación de ancho de banda.

## Casos límite y robustez en producción

1. Edificio de 1 piso.
