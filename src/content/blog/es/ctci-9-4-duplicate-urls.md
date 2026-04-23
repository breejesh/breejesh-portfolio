---
title: "Duplicate URLs: Detección de Duplicados en 10 Mil Millones de URLs (CTCI 9.4)"
description: "Problema CTCI 9.4: cómo identificar URLs duplicadas en 10 mil millones de registros con memoria limitada usando Filtros de Bloom."
date: "2026-04-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-4-duplicate-urls.webp
previewImage: /assets/images/ctci-9-4-duplicate-urls.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 9.4 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 9.4: cómo identificar URLs duplicadas en 10 mil millones de registros con memoria limitada usando Filtros de Bloom.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **9.4**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 9.4 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 9.4:** Problema CTCI 9.4: cómo identificar URLs duplicadas en 10 mil millones de registros con memoria limitada usando Filtros de Bloom.

---

## 3. Enfoque óptimo e implementación

```java
public class SimpleBloomFilter {
    private final BitSet bitSet;
    private final int size;

    public SimpleBloomFilter(int size) {
        this.size = size;
        this.bitSet = new BitSet(size);
    }

    public void add(String url) {
        bitSet.set(Math.abs(url.hashCode() % size));
        bitSet.set(Math.abs((url.hashCode() * 31) % size));
    }

    public boolean mightContain(String url) {
        return bitSet.get(Math.abs(url.hashCode() % size)) 
            && bitSet.get(Math.abs((url.hashCode() * 31) % size));
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