---
title: "Cache: Caché en Memoria para Motor de Búsqueda (CTCI 9.5)"
description: "Problema CTCI 9.5: diseña un sistema de caché en memoria de múltiples niveles para un motor de búsqueda de alta frecuencia."
date: "2025-09-23"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-5-cache.webp
previewImage: /assets/images/ctci-9-5-cache.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 9.5 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 9.5: diseña un sistema de caché en memoria de múltiples niveles para un motor de búsqueda de alta frecuencia.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **9.5**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 9.5 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 9.5:** Problema CTCI 9.5: diseña un sistema de caché en memoria de múltiples niveles para un motor de búsqueda de alta frecuencia.

---

## 3. Enfoque óptimo e implementación

```java
public class LRUCache<K, V> {
    private final int capacity;
    private final Map<K, V> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > capacity;
            }
        };
    }

    public synchronized V get(K key) { return map.get(key); }
    public synchronized void put(K key, V value) { map.put(key, value); }
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