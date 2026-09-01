---
title: "Rango en Flujo: Árboles de Estadísticos de Orden para Clasificación Dinámica (CTCI 10.10)"
description: "Manten y consulta el rango de numeros en un flujo continuo de enteros mediante un Arbol Binario de Busqueda Aumentado (Order Statistic Tree) en O(log N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-10-10-rank-from-stream.webp
previewImage: /assets/images/ctci-10-10-rank-from-stream.webp
---

> **TL;DR**
> * **El Problema del Libro:** Imagina que estas leyendo un flujo de enteros. Periodicamente, deseas consultar el rango de un numero $x$ (cantidad de valores menores o iguales a $x$). Implementa `track(int x)` y `getRankOfNumber(int x)`.
> * **La Solución Óptima:** **Árbol Binario de Búsqueda Aumentado (Order Statistic Tree)**: (1) Cada nodo almacena su valor `data`, punteros a hijos y un contador `left_size` con el numero de nodos en su subarbol izquierdo; (2) `track(x)`: Al descender hacia la izquierda, incrementa `left_size++`; (3) `getRankOfNumber(x)`: Si $x == \text{data}$, retorna `left_size`; si $x < \text{data}$, desciende a la izquierda; si $x > \text{data}$, retorna `left_size + 1 + right.getRank(x)`; (4) Se ejecuta en **tiempo $O(\log N)$** para arboles balanceados y **espacio $O(N)$**.
> * **Realidad en Producción:** Calculo de percentiles en tiempo real (P95/P99 en Datadog/Prometheus) y emparejamiento MMR en videojuegos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 10.10), se nos plantea:

*"Implementa las operaciones track(x) y getRankOfNumber(x) para mantener el rango de enteros en un flujo continuo de datos."*

## 2. Invariante de Árbol Aumentado

Al aumentar un ABB con el campo `left_size`:
* Al consultar el rango para $x > \text{data}$, el rango se compone del nodo actual, todo su subárbol izquierdo y los elementos menores a $x$ en el subárbol derecho:
$$\text{Rank}(x) = \text{left\_size} + 1 + \text{right.getRank}(x)$$

## Implementación de Producción

```java
public class RankFromStream {
    public static class RankNode {
        public int left_size = 0;
        public RankNode left, right;
        public int data = 0;

        public RankNode(int d) {
            this.data = d;
        }

        public void insert(int d) {
            if (d <= data) {
                left_size++;
                if (left != null) {
                    left.insert(d);
                } else {
                    left = new RankNode(d);
                }
            } else {
                if (right != null) {
                    right.insert(d);
                } else {
                    right = new RankNode(d);
                }
            }
        }

        public int getRank(int d) {
            if (d == data) {
                return left_size;
            } else if (d < data) {
                if (left == null) return -1;
                return left.getRank(d);
            } else {
                int right_rank = (right == null) ? -1 : right.getRank(d);
                if (right_rank == -1) return -1;
                return left_size + 1 + right_rank;
            }
        }
    }

    private RankNode root = null;

    public void track(int number) {
        if (root == null) {
            root = new RankNode(number);
        } else {
            root.insert(number);
        }
    }

    public int getRankOfNumber(int number) {
        if (root == null) return -1;
        return root.getRank(number);
    }
}
```

## Análisis de Complejidad y Memoria

| Operación | Árbol Balanceado | Árbol Degenerado | Detalle Técnico |
|---|---|---|---|
| Ingestión (`track`) | `O(log N)` | `O(N)` | Inserción en ABB incrementando `left_size`. |
| Consulta de Rango | `O(log N)` | `O(N)` | Acumulación de pesos de subárboles. |
| Espacio Total | `O(N)` | `O(N)` | Un nodo por elemento del flujo. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Métricas de Percentiles

1. **Monitoreo APM (Datadog / Prometheus):** Estructuras como T-Digest aproximan percentiles sobre flujos masivos de eventos en tiempo sub-milisegundo.
2. **Tablas de Clasificación de Jugadores:** Mantenimiento de posiciones relativas en tiempo real.

## Casos Límite y Robustez en Producción

1. **Duplicados:** Se enrutan al subarbol izquierdo e incrementan `left_size` correctamente.
2. **Elemento No Registrado:** Retorna `-1`.
