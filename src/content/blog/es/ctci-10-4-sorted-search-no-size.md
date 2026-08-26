---
title: "Sorted Search No Size: Búsqueda en Lista sin Método Size (CTCI 10.4)"
description: "Problema CTCI 10.4 en Java: encuentra un elemento en una estructura Listy sin tamaño conocido."
date: "2025-11-01"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
previewImage: /assets/images/ctci-10-4-sorted-search-no-size.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.4 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.4 en Java: encuentra un elemento en una estructura Listy sin tamaño conocido.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.4**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.4 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.4:** Problema CTCI 10.4 en Java: encuentra un elemento en una estructura Listy sin tamaño conocido.

---

## 3. Enfoque óptimo e implementación

```java
public class SortedSearchNoSize {
    static class Listy {
        private final int[] array;
        public Listy(int[] arr) { this.array = arr; }
        public int elementAt(int i) {
            return (i >= 0 && i < array.length) ? array[i] : -1;
        }
    }

    public static int search(Listy list, int value) {
        int index = 1;
        while (list.elementAt(index) != -1 && list.elementAt(index) < value) {
            index *= 2;
        }
        return binarySearch(list, value, index / 2, index);
    }

    private static int binarySearch(Listy list, int value, int low, int high) {
        while (low <= high) {
            int mid = low + (high - low) / 2;
            int middle = list.elementAt(mid);
            if (middle > value || middle == -1) high = mid - 1;
            else if (middle < value) low = mid + 1;
            else return mid;
        }
        return -1;
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