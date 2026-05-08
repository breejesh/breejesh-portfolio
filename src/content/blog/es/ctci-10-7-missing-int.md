---
title: "Missing Int: Encontrar Entero Faltante Entre 4 Mil Millones de Números (CTCI 10.7)"
description: "Problema CTCI 10.7 en Java: encuentra un entero no contenido en 4 mil millones de registros usando BitSet."
date: "2026-05-08"
tags: [Algorithms]
coverImage: /assets/images/ctci-10-7-missing-int.webp
previewImage: /assets/images/ctci-10-7-missing-int.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 10.7 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 10.7 en Java: encuentra un entero no contenido en 4 mil millones de registros usando BitSet.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **10.7**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 10.7 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 10.7:** Problema CTCI 10.7 en Java: encuentra un entero no contenido en 4 mil millones de registros usando BitSet.

---

## 3. Enfoque óptimo e implementación

```java
public class MissingInt {
    public static int findOpenNumber(Scanner scanner) {
        long numberOfInts = ((long) Integer.MAX_VALUE) + 1;
        byte[] bitfield = new byte[(int) (numberOfInts / 8)];

        while (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            bitfield[n / 8] |= 1 << (n % 8);
        }

        for (int i = 0; i < bitfield.length; i++) {
            for (int j = 0; j < 8; j++) {
                if ((bitfield[i] & (1 << j)) == 0) {
                    return i * 8 + j;
                }
            }
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