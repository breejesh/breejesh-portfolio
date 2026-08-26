---
title: "Sales Rank: Sistema de Ranking de Ventas en Tiempo Real (CTCI 9.6)"
description: "Problema CTCI 9.6: diseña un sistema de ranking de comercio electrónico que rastrea los productos más vendidos por categoría."
date: "2026-04-11"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-6-sales-rank.webp
previewImage: /assets/images/ctci-9-6-sales-rank.webp
---


> **TL;DR**
> * **El Problema:** Dominar el problema CTCI 9.6 con eficiencia de nivel de producción.
> * **El Enfoque:** Problema CTCI 9.6: diseña un sistema de ranking de comercio electrónico que rastrea los productos más vendidos por categoría.
> * **Complejidad:** Relación óptima entre tiempo y espacio.

Este artículo ofrece una guía clara y detallada del problema CTCI **9.6**. Examinamos el enunciado, comparamos la fuerza bruta con la solución óptima y escribimos código en Java.

---

## 1. Analogía del mundo real

Piensa en el problema CTCI 9.6 como organizar elementos de forma eficiente. La elección de la estructura de datos adecuada elimina iteraciones innecesarias.

---

## 2. Enunciado claro del problema

**Problema 9.6:** Problema CTCI 9.6: diseña un sistema de ranking de comercio electrónico que rastrea los productos más vendidos por categoría.

---

## 3. Enfoque óptimo e implementación

```java
public class CategorySalesRank {
    private final Map<String, Integer> productSales = new ConcurrentHashMap<>();

    public void recordSale(String productId, int quantity) {
        productSales.merge(productId, quantity, Integer::sum);
    }

    public List<Map.Entry<String, Integer>> getTopK(int k) {
        PriorityQueue<Map.Entry<String, Integer>> pq = new PriorityQueue<>(
            Map.Entry.comparingByValue()
        );
        for (Map.Entry<String, Integer> entry : productSales.entrySet()) {
            pq.offer(entry);
            if (pq.size() > k) pq.poll();
        }
        List<Map.Entry<String, Integer>> result = new ArrayList<>(pq);
        result.sort(Map.Entry.<String, Integer>comparingByValue().reversed());
        return result;
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