---
title: "Mediana Continua: Mantenimiento de Mediana en Flujo con Doble Heap (CTCI 17.20)"
description: "Mantén la mediana acumulada de un flujo de datos en tiempo O(log N) por insercion y O(1) por consulta usando un max-heap para la mitad inferior y un min-heap para la superior."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-20-continuous-median.webp
previewImage: /assets/images/ctci-17-20-continuous-median.webp
---

> **TL;DR**
> * **El Problema del Libro:** Recibes un flujo de numeros. Despues de cada numero, calcula la mediana de todos los vistos hasta ahora.
> * **La Solución Óptima:** **Doble Heap (Max-Heap Inferior + Min-Heap Superior)**:
>   1. Mantener dos montículos: `lower` (Max-Heap para la mitad menor) y `upper` (Min-Heap para la mitad mayor).
>   2. **Invariante de Tamaño**: `lower.size() == upper.size()` o `lower.size() == upper.size() + 1`.
>   3. **Insercion**: Dirigir el nuevo numero al montículo correcto y rebalancear si las diferencias de tamano superan 1.
>   4. **Consulta**: Si cantidad par, mediana = `(lower.top() + upper.top()) / 2.0`. Si impar, mediana = `lower.top()`.
>   5. **$O(\log N)$ insercion**, **$O(1)$ consulta**.
> * **Realidad en Producción:** Seguimiento de latencia P50 en Prometheus/Grafana y precios de mercado en tiempo real.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.20), se nos plantea:

*"Los numeros se generan aleatoriamente y se pasan a un metodo. Escribe un programa para encontrar y mantener la mediana a medida que llegan nuevos valores."*

## 2. Invariante de Partición con Doble Montículo

Al dividir el flujo en dos mitades complementarias, se puede leer la mediana en $O(1)$ tiempo de consulta sin ordenar el flujo completo.

## Implementación de Producción

```java
import java.util.*;

public class ContinuousMedian {

    private final PriorityQueue<Integer> lower = new PriorityQueue<>(Collections.reverseOrder());
    private final PriorityQueue<Integer> upper = new PriorityQueue<>();

    public void addNumber(int num) {
        if (lower.isEmpty() || num <= lower.peek()) {
            lower.add(num);
        } else {
            upper.add(num);
        }
        rebalance();
    }

    private void rebalance() {
        if (lower.size() > upper.size() + 1) {
            upper.add(lower.poll());
        } else if (upper.size() > lower.size()) {
            lower.add(upper.poll());
        }
    }

    public double getMedian() {
        if (lower.isEmpty()) throw new IllegalStateException("Sin numeros aun.");
        if (lower.size() == upper.size()) {
            return (lower.peek() + upper.peek()) / 2.0;
        }
        return lower.peek();
    }
}
```

## Análisis de Complejidad

| Operación | Complejidad | Detalle |
|---|---|---|
| `addNumber()` | $O(\log N)$ | Insercion en heap y rebalanceo. |
| `getMedian()` | $O(1)$ | Lectura de la cima de los heaps. |
| Espacio | $O(N)$ | Ambos heaps almacenan N elementos. |

## Discusión de Ingeniería de Sistemas en Producción

1. **Prometheus/Grafana P50:** Calculo de mediana de latencias para paneles de SLO en tiempo real.
2. **Analítica de Mercado Financiero:** Calculo en tiempo real del precio mediano del libro de ordenes.

## Casos Límite y Robustez

1. **Flujo Vacío:** Lanzar `IllegalStateException` antes de la primera consulta.
2. **Valores Duplicados:** Ambos heaps manejan duplicados de forma natural.
