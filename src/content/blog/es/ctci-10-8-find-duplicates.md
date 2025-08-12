---
title: "Find Duplicates: Encontrar Duplicados con Memoria de 4 KB (CTCI 10.8)"
description: "Problema CTCI 10.8 en Java: imprime todos los números duplicados en un arreglo usando BitSet de 4 KB."
date: "2025-08-12"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-8-find-duplicates.webp
previewImage: /assets/images/ctci-10-8-find-duplicates.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.8 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.8 en Java: imprime todos los números duplicados en un arreglo usando BitSet de 4 KB.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.8**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.8 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.8:** Problema CTCI 10.8 en Java: imprime todos los números duplicados en un arreglo usando BitSet de 4 KB.

---

## 3. Enfoque óptimo e implementación

```java
public class FindDuplicates {
    static class BitSetCustom {
        int[] bitset;
        public BitSetCustom(int size) {
            bitset = new int[(size >> 5) + 1];
        }
        public boolean get(int pos) {
            int wordNumber = (pos >> 5);
            int bitNumber = (pos & 0x1F);
            return (bitset[wordNumber] & (1 << bitNumber)) != 0;
        }
        public void set(int pos) {
            int wordNumber = (pos >> 5);
            int bitNumber = (pos & 0x1F);
            bitset[wordNumber] |= (1 << bitNumber);
        }
    }

    public static void checkDuplicates(int[] array) {
        BitSetCustom bs = new BitSetCustom(32000);
        for (int num : array) {
            int num0 = num - 1;
            if (bs.get(num0)) {
                System.out.println(num);
            } else {
                bs.set(num0);
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