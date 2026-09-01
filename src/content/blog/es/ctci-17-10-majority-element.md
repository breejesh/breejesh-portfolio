---
title: "Elemento Mayoritario: Algoritmo de Votación de Boyer-Moore en Streaming (CTCI 17.10)"
description: "Halla el elemento mayoritario (> 50% de apariciones) en un array mediante el algoritmo de votacion en dos fases de Boyer-Moore en tiempo O(N) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-10-majority-element.webp
previewImage: /assets/images/ctci-17-10-majority-element.webp
---

> **TL;DR**
> * **El Problema del Libro:** Un elemento mayoritario es aquel que conforma estrictamente mas de la mitad ($> \lfloor N/2 \rfloor$) de los elementos de un array. Encuentra dicho elemento o retorna $-1$ en tiempo $O(N)$ y espacio $O(1)$.
> * **La Solución Óptima:** **Algoritmo de Votación de Boyer-Moore**:
>   1. **Fase 1 (Elección de Candidato)**:
>      * Mantener `candidate = 0` y `count = 0`.
>      * Para cada elemento $x$: si `count == 0`, asignar `candidate = x, count = 1`; si $x == \text{candidato}$, incrementar `count++`; de lo contrario, decrementar `count--`.
>   2. **Fase 2 (Verificación de Mayoría)**:
>      * Contar las apariciones reales del candidato en el array.
>      * Si $\text{frecuencia} > \lfloor N/2 \rfloor$, retornar `candidate`; de lo contrario, retornar $-1$.
>   3. Se ejecuta en **tiempo $O(N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Deteccion de IPs dominantes en enrutadores de red (Cisco NetFlow) y algoritmos de consenso tolerantes a fallos (Paxos / Raft).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.10), se nos plantea:

*"Identifica el elemento dominante que ocupa mas del 50% de un array en tiempo lineal y sin memoria adicional."*

## 2. Invariante de Cancelación por Pares

Cada vez que se emparejan dos elementos distintos, ambos se anulan mutuamente sin alterar el liderazgo del elemento mayoritario absoluto.

## Implementación de Producción

```java
public class MajorityElement {

    public static int findMajorityElement(int[] array) {
        if (array == null || array.length == 0) {
            return -1;
        }

        // Fase 1: Elección del candidato de Boyer-Moore
        int candidate = 0;
        int count = 0;

        for (int x : array) {
            if (count == 0) {
                candidate = x;
                count = 1;
            } else if (x == candidate) {
                count++;
            } else {
                count--;
            }
        }

        // Fase 2: Verificación obligatoria
        int actualCount = 0;
        for (int x : array) {
            if (x == candidate) {
                actualCount++;
            }
        }

        return (actualCount > array.length / 2) ? candidate : -1;
    }
}
```

## Análisis de Complejidad

| Estrategia | Complejidad Temporal | Espacio Auxiliar | Valida Ausencia de Mayoría |
|---|---|---|---|
| **Votación de Boyer-Moore** | **$O(N)$** | **$O(1)$** | **Sí (Fase 2)** |
| **Mapa Hash de Frecuencias** | $O(N)$ | $O(N)$ | Sí |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Enrutamiento y Consenso

1. **Detección de Ataques DDoS en Enrutadores:** Algoritmos como Misra-Gries identifican flujos pesados (*Heavy Hitters*) en paquetes de red en tiempo constante por paquete.
2. **Consenso Distribuido (Raft / Paxos):** Validación de quórums de mayoria absoluta ($> 50\%$) para transacciones distribuidas.

## Casos Límite y Robustez en Producción

1. **Sin Mayoría Real (`[1, 2, 3, 4]`):** La Fase 2 verifica el recuento real y retorna `-1`.
