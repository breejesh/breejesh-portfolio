---
title: "Intercambio de Suma: Particionado Equilibrado y Búsqueda con HashSet (CTCI 16.21)"
description: "Encuentra un par de enteros en dos colecciones cuyo intercambio iguale las sumas de ambos arrays utilizando ecuaciones algebraicas y tablas hash en O(A + B)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-21-sum-swap.webp
previewImage: /assets/images/ctci-16-21-sum-swap.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dados dos arrays de enteros, encuentra un par de valores (uno en cada array) que puedas intercambiar para que ambas colecciones tengan la misma suma.
> * **La Deducción Matemática:**
>   1. Siendo $S_A = \sum A$ y $S_B = \sum B$:
>      $$S_A - a + b = S_B - b + a \implies 2(a - b) = S_A - S_B \implies a - b = \frac{S_A - S_B}{2}$$
>   2. **Comprobación de Paridad**: Si $S_A - S_B$ es impar, es imposible equilibrar mediante enteros; retorna `null`.
>   3. **Búsqueda**: El objetivo es encontrar $b = a - \frac{S_A - S_B}{2}$.
> * **Las Soluciones Óptimas:**
>   * **Búsqueda en HashSet**: Guardar $B$ en un conjunto y comprobar $b = a - \Delta$ en **tiempo $O(A + B)$** y **espacio $O(B)$**.
>   * **Dos Punteros sobre Arrays Ordenados**: En **tiempo $O(A \log A + B \log B)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Balanceo de carga de CPU en clusters y conciliacion bancaria de doble partida.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.21), se nos plantea:

*"Identifica si existe un elemento de A y un elemento de B cuyo intercambio iguale exactamente la suma total de ambos arrays."*

## 2. Invariante Algebraico

Al despejar la ecuacion, el valor requerido en $B$ para cada elemento $a \in A$ es estrictamente $b = a - \text{diferenciaObjetivo}$.

## Implementación de Producción

```java
import java.util.HashSet;
import java.util.Set;

public class SumSwap {

    public static int[] findSwapValuesHash(int[] a, int[] b) {
        if (a == null || b == null || a.length == 0 || b.length == 0) {
            return null;
        }

        long sumA = 0;
        for (int v : a) sumA += v;

        long sumB = 0;
        Set<Integer> setB = new HashSet<>();
        for (int v : b) {
            sumB += v;
            setB.add(v);
        }

        long diff = sumA - sumB;
        if (diff % 2 != 0) return null;

        long targetDelta = diff / 2;

        for (int valA : a) {
            long targetB = valA - targetDelta;
            if (targetB >= Integer.MIN_VALUE && targetB <= Integer.MAX_VALUE) {
                if (setB.contains((int) targetB)) {
                    return new int[] { valA, (int) targetB };
                }
            }
        }

        return null;
    }
}
```

## Análisis de Complejidad

| Estrategia | Complejidad Temporal | Espacio Auxiliar |
|---|---|---|
| **HashSet Complementario** | **$O(A + B)$** | **$O(B)$** |
| **Dos Punteros (Ordenado)** | $O(A \log A + B \log B)$ | $O(1)$ |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Balanceo de Carga

1. **Reequilibrio de Nodos en Kubernetes:** Los orquestadores transfieren tareas entre nodos calculando intercambios de carga para estabilizar el consumo de memoria sin reiniciar servicios.
2. **Conciliación Contable:** Localizacion de descuadres en libros de contabilidad.

## Casos Límite y Robustez en Producción

1. **Diferencia Impar:** Retorna `null` de forma inmediata sin evaluar elementos individuales.
