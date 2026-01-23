---
title: "Sparse Search: Búsqueda en Arreglo Esparcido de Cadenas (CTCI 10.5)"
description: "Problema CTCI 10.5 en Java: encuentra una cadena en un arreglo ordenado intercalado con cadenas vacías."
date: "2026-01-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-5-sparse-search.webp
previewImage: /assets/images/ctci-10-5-sparse-search.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.5 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.5 en Java: encuentra una cadena en un arreglo ordenado intercalado con cadenas vacías.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.5**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.5 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.5:** Problema CTCI 10.5 en Java: encuentra una cadena en un arreglo ordenado intercalado con cadenas vacías.

---

## 3. Enfoque óptimo e implementación

```java
public class SparseSearch {
    public static int search(String[] strings, String str) {
        if (strings == null || str == null || str.isEmpty()) return -1;
        return search(strings, str, 0, strings.length - 1);
    }

    private static int search(String[] strings, String str, int first, int last) {
        if (first > last) return -1;
        int mid = (first + last) / 2;

        if (strings[mid].isEmpty()) {
            int left = mid - 1, right = mid + 1;
            while (true) {
                if (left < first && right > last) return -1;
                if (right <= last && !strings[right].isEmpty()) { mid = right; break; }
                if (left >= first && !strings[left].isEmpty()) { mid = left; break; }
                right++; left--;
            }
        }

        if (strings[mid].equals(str)) return mid;
        else if (strings[mid].compareTo(str) < 0) return search(strings, str, mid + 1, last);
        else return search(strings, str, first, mid - 1);
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