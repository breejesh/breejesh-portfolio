---
title: "Group Anagrams: Agrupar Anagramas en un Arreglo de Cadenas (CTCI 10.2)"
description: "Problema CTCI 10.2 en Java: ordena un arreglo de cadenas para colocar los anagramas juntos usando HashMap."
date: "2026-06-19"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-2-group-anagrams.webp
previewImage: /assets/images/ctci-10-2-group-anagrams.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.2 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.2 en Java: ordena un arreglo de cadenas para colocar los anagramas juntos usando HashMap.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.2**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.2 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.2:** Problema CTCI 10.2 en Java: ordena un arreglo de cadenas para colocar los anagramas juntos usando HashMap.

---

## 3. Enfoque óptimo e implementación

```java
public class GroupAnagrams {
    public static void sort(String[] array) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : array) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        int index = 0;
        for (List<String> list : map.values()) {
            for (String s : list) {
                array[index++] = s;
            }
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