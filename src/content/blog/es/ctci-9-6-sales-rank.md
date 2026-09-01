---
title: "Rango de Ventas: Motor de Clasificación de Más Vendidos en Tiempo Real (CTCI 9.6)"
description: "Disena un motor escalable de ranking y clasificacion de productos mas vendidos en e-commerce mediante conjuntos ordenados de Redis (ZSET) y ventanas deslizantes."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-9-6-sales-rank.webp
previewImage: /assets/images/ctci-9-6-sales-rank.webp
---

> **TL;DR**
> * **El Problema del Libro:** Una gran empresa de comercio electronico desea listar los productos mas vendidos a nivel general y por categoria en varios intervalos de tiempo (ultima hora, 24 horas, 7 dias, historico). Disena las estructuras de datos y la arquitectura para actualizar y consultar estos rangos en tiempo real.
> * **La Solución Óptima:** **Conjuntos Ordenados de Redis (ZSET) + Ventanas Deslizantes**: (1) Eventos de compra enviados a Apache Kafka; (2) Tablas de clasificacion en tiempo real gestionadas por Redis Sorted Sets (`ZSET` basado en Skip Lists) con operaciones `ZINCRBY` y `ZREVRANK` en $O(\log N)$; (3) Ventanas circulares de tiempo (60 cubos de 1 minuto para 1 hora); (4) Tareas por lotes (Apache Flink / Spark) para rangos historicos.
> * **Realidad en Producción:** Algoritmo Amazon Best Sellers Rank (BSR) y clasificaciones de la App Store.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 9.6), se nos plantea:

*"Disena la arquitectura de un motor de clasificacion de productos mas vendidos en e-commerce por categorias y ventanas temporales."*

## 2. Estructuras de Datos y Componentes

### Redis Sorted Sets (`ZSET`)
* Clave: `rank:categoria:ventana` (ej. `rank:deportes:24h`).
* Miembro: `product_id`.
* Puntuación (Score): Total de ventas acumuladas.
* `ZINCRBY`: Incrementa ventas en tiempo $O(\log N)$.
* `ZREVRANGE`: Obtiene el Top K en $O(\log N + K)$.
* `ZREVRANK`: Obtiene la posicion exacta de un producto en $O(\log N)$.

## Implementación de Producción

```java
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

public class SalesRankEngine {
    public static class ProductSales implements Comparable<ProductSales> {
        public final String productId;
        public int salesCount;

        public ProductSales(String id, int sales) {
            this.productId = id;
            this.salesCount = sales;
        }

        @Override
        public int compareTo(ProductSales other) {
            return Integer.compare(this.salesCount, other.salesCount);
        }
    }

    private final Map<String, Map<String, Integer>> categorySales = new HashMap<>();

    public synchronized void recordPurchase(String productId, String[] categories, int quantity) {
        for (String cat : categories) {
            categorySales.putIfAbsent(cat, new HashMap<>());
            Map<String, Integer> salesMap = categorySales.get(cat);
            salesMap.put(productId, salesMap.getOrDefault(productId, 0) + quantity);
        }
    }

    public synchronized PriorityQueue<ProductSales> getTopK(String category, int k) {
        Map<String, Integer> salesMap = categorySales.get(category);
        if (salesMap == null) return new PriorityQueue<>();

        PriorityQueue<ProductSales> minHeap = new PriorityQueue<>(k);

        for (Map.Entry<String, Integer> entry : salesMap.entrySet()) {
            ProductSales ps = new ProductSales(entry.getKey(), entry.getValue());
            if (minHeap.size() < k) {
                minHeap.add(ps);
            } else if (ps.salesCount > minHeap.peek().salesCount) {
                minHeap.poll();
                minHeap.add(ps);
            }
        }

        return minHeap;
    }
}
```

## Análisis de Complejidad y Rendimiento

| Operación | Complejidad | Detalle Técnico |
|---|---|---|
| Ingestión de Venta | `O(log N)` | Inserción/actualización en skip list de Redis. |
| Consulta de Top K | `O(log N + K)` | Escaneo de rango en cabecera del conjunto ordenado. |
| Posición de Producto | `O(log N)` | Búsqueda por clave en índice invertido. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Decaimiento Temporal en Amazon (BSR)

1. **Decaimiento Exponencial:** Las ventas recientes ponderan exponencialmente mas que las antiguas mediante formulas de semivida ($S = \sum \text{ventas} \cdot e^{-\lambda \Delta t}$).
2. **Caché en CDN del Top 100:** El 99% del trafico solo consulta el Top 100 de cada categoria. La pregeneracion estatica absorbe miles de millones de lecturas.

## Casos Límite y Robustez en Producción

1. **Propagación en Árbol de Categorías:** Una compra en "Calzado Deportivo" incrementa contadores en "Calzado", "Ropa" y "General".
