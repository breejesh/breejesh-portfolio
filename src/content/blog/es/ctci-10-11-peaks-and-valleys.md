---
title: "Peaks and Valleys: Ordenar Arreglo en Secuencia Alternada de Picos y Valles (CTCI 10.11)"
description: "Problema CTCI 10.11 en Java: reorganiza un arreglo de enteros en picos y valles alternados en O(N)."
date: "2026-06-06"
tags: [Algoritmos y Estructuras, Herramientas de Desarrollo]
coverImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
previewImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.11 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.11 en Java: reorganiza un arreglo de enteros en picos y valles alternados en O(N).
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.11**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.11 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.11:** Problema CTCI 10.11 en Java: reorganiza un arreglo de enteros en picos y valles alternados en O(N).

---

## 3. Enfoque óptimo e implementación

```java
public class PeaksAndValleys {
    public static void sortValleyPeak(int[] array) {
        for (int i = 1; i < array.length; i += 2) {
            int maxIndex = maxIndex(array, i - 1, i, i + 1);
            if (i != maxIndex) {
                swap(array, i, maxIndex);
            }
        }
    }

    private static int maxIndex(int[] array, int a, int b, int c) {
        int len = array.length;
        int aValue = (a >= 0 && a < len) ? array[a] : Integer.MIN_VALUE;
        int bValue = (b >= 0 && b < len) ? array[b] : Integer.MIN_VALUE;
        int cValue = (c >= 0 && c < len) ? array[c] : Integer.MIN_VALUE;
        int max = Math.max(aValue, Math.max(bValue, cValue));

        if (aValue == max) return a;
        else if (bValue == max) return b;
        else return c;
    }

    private static void swap(int[] array, int i, int j) {
        int temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
```

---

## 4. Complejidad Temporal y Espacial

| Métrica | Complejidad | Explicación |
| --- | --- | --- |
| Complejidad Temporal | O(N) / O(log N) | Recorrido óptimo de datos |
| Complejidad Espacial | O(1) / O(N) | Memoria acotada |

---

## 5. Casos Límite y Resumen

Verifica siempre condiciones de borde, valores nulos y límites de tamaño en entrevistas técnicas.