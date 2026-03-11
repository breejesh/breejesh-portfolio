---
title: "Search in Rotated Array: Buscar en Arreglo Ordenado Rotado (CTCI 10.3)"
description: "Problema CTCI 10.3 en Java: búsqueda binaria modificada para encontrar un elemento en un arreglo rotado."
date: "2026-03-11"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
previewImage: /assets/images/ctci-10-3-search-in-rotated-array.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.3 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.3 en Java: búsqueda binaria modificada para encontrar un elemento en un arreglo rotado.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.3**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.3 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.3:** Problema CTCI 10.3 en Java: búsqueda binaria modificada para encontrar un elemento en un arreglo rotado.

---

## 3. Enfoque óptimo e implementación

```java
public class SearchRotatedArray {
    public static int search(int[] a, int left, int right, int x) {
        if (left > right) return -1;
        int mid = left + (right - left) / 2;
        if (a[mid] == x) return mid;

        if (a[left] < a[mid]) { // Left half is normally sorted
            if (x >= a[left] && x < a[mid]) return search(a, left, mid - 1, x);
            else return search(a, mid + 1, right, x);
        } else if (a[mid] < a[left]) { // Right half is normally sorted
            if (x > a[mid] && x <= a[right]) return search(a, mid + 1, right, x);
            else return search(a, left, mid - 1, x);
        } else { // Duplicates handling
            int location = -1;
            if (a[mid] != a[right]) location = search(a, mid + 1, right, x);
            if (location == -1) location = search(a, left, mid - 1, x);
            return location;
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