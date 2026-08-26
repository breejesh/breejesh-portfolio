---
title: "Sorted Merge: Mezclar Arreglo B en Arreglo A Ordenado in-place (CTCI 10.1)"
description: "Problema CTCI 10.1 en Java: fusiona dos arreglos ordenados A y B dentro de A trabajando hacia atrás."
date: "2026-02-18"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-1-sorted-merge.webp
previewImage: /assets/images/ctci-10-1-sorted-merge.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.1 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.1 en Java: fusiona dos arreglos ordenados A y B dentro de A trabajando hacia atrás.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.1**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.1 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.1:** Problema CTCI 10.1 en Java: fusiona dos arreglos ordenados A y B dentro de A trabajando hacia atrás.

---

## 3. Enfoque óptimo e implementación

```java
public class SortedMerge {
    public static void merge(int[] a, int[] b, int lastA, int lastB) {
        int indexA = lastA - 1;
        int indexB = lastB - 1;
        int indexMerged = lastA + lastB - 1;

        while (indexB >= 0) {
            if (indexA >= 0 && a[indexA] > b[indexB]) {
                a[indexMerged] = a[indexA];
                indexA--;
            } else {
                a[indexMerged] = b[indexB];
                indexB--;
            }
            indexMerged--;
        }
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