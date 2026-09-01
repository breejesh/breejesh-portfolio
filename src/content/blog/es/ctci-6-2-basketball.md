---
title: "Baloncesto: Análisis de Probabilidad y Valor Esperado para Juegos de Tiros (CTCI 6.2)"
description: "Analiza las probabilidades de un juego de 1 tiro vs 3 tiros para determinar la eleccion optima segun la probabilidad p en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-2-basketball.webp
previewImage: /assets/images/ctci-6-2-basketball.webp
---

> **TL;DR**
> * **El Problema del Libro:** Puedes jugar uno de dos juegos. Juego 1: Tienes un tiro para encestar. Juego 2: Tienes tres tiros y debes encestar al menos dos. Si $p$ es la probabilidad de encestar un tiro, ¿para que valores de $p$ deberias elegir uno u otro juego?
> * **La Solución Óptima:** Desigualdad de Probabilidad Binomial: $P(\text{Juego 1}) = p$. $P(\text{Juego 2}) = 3p^2 - 2p^3$. Al resolver $3p^2 - 2p^3 > p \implies (2p - 1)(p - 1) < 0 \implies p > 0.5$. Elige el **Juego 1 si $p < 0.5$**, el **Juego 2 si $p > 0.5$**, y cualquiera si $p \in \{0, 0.5, 1\}$.
> * **Realidad en Producción:** Umbrales de mayoria en quorums distribuidos (Raft/Paxos) y politicas de redundancia en salud de servicios.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 6.2), se nos plantea:

*"Tienes una canasta y alguien te propone dos juegos. Juego 1: Tienes 1 tiro para encestar. Juego 2: Tienes 3 tiros y debes encestar al menos 2. Si p es la probabilidad de acertar un tiro, ¿para que valores de p deberias elegir un juego u otro?"*

## 2. Derivación Matemática

1. **Juego 1:** $P(\text{Juego 1}) = p$.
2. **Juego 2:** Encestar 2 o 3 tiros:
   $$P(\text{Juego 2}) = 3p^2(1 - p) + p^3 = 3p^2 - 2p^3$$
3. **Comparación:**
   $$3p^2 - 2p^3 > p \implies 2p^2 - 3p + 1 < 0 \implies (2p - 1)(p - 1) < 0$$
   Dado que $p < 1$, el termino $(p - 1)$ es negativo, lo que exige que $(2p - 1) > 0 \implies p > 0.5$.

## Implementación de Producción

```java
public class BasketballGame {
    /**
     * Determina si elegir Juego 1 o Juego 2 segun p.
     * Complejidad Temporal: O(1)
     * Complejidad Espacial: O(1)
     */
    public static int pickGame(double p) {
        if (p < 0.0 || p > 1.0) {
            throw new IllegalArgumentException("La probabilidad debe estar entre 0 y 1");
        }

        if (p > 0.5 && p < 1.0) {
            return 2;
        } else if (p < 0.5 && p > 0.0) {
            return 1;
        } else {
            return 0; // Indiferente (p = 0, 0.5 o 1.0)
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Tiempo de Evaluación | `O(1)` | Comparacion condicional directa. |
| Espacio Auxiliar | `O(1)` | Sin uso de memoria dinamica. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Quórums en Sistemas Distribuidos

1. **Consenso Distribuido (Raft / Paxos):** Cuando la disponibilidad de un nodo individual es $p > 0.5$, un cluster con mayoria ($2f + 1$) amplifica la disponibilidad del sistema. Si cae por debajo de 0.5, agregar nodos empeora la fiabilidad.
2. **Health Checks y Circuit Breakers:** Evaluacion probabilistica de muestras continuas para conmutacion por error.

## Casos Límite y Robustez en Producción

1. **$p = 0.5$:** Ambos juegos tienen probabilidad exacta de victoria del 50%.
2. **Límites $p = 0$ y $p = 1$:** Probabilidad de victoria idéntica (0% o 100%).
