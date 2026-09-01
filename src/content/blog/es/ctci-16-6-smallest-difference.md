---
title: "Mínima Diferencia: Optimización con Dos Punteros sobre Arrays Ordenados (CTCI 16.6)"
description: "Calcula la diferencia minima no negativa entre dos listas de enteros mediante ordenacion dual y recorrido convergente con dos punteros en O(A log A + B log B)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-6-smallest-difference.webp
previewImage: /assets/images/ctci-16-6-smallest-difference.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dados dos arrays de enteros, calcula el par de valores (uno en cada array) con la menor diferencia no negativa y devuelve dicha diferencia.
> * **La Solución Óptima:** **Ordenación Dual y Convergencia de Dos Punteros**:
>   1. Ordenar ambos arrays en orden ascendente: `Arrays.sort(a); Arrays.sort(b);`.
>   2. Inicializar dos punteros $i = 0$ y $j = 0$.
>   3. En cada paso, calcular `diff = Math.abs((long)a[i] - (long)b[j])` y actualizar la minima diferencia.
>   4. Si la diferencia es 0, retornar 0 de inmediato.
>   5. Avanzar el puntero que senale al valor menor ($a[i] < b[j] \implies i++$; de lo contrario $j++$).
>   6. Realizar la resta en tipo `long` de 64 bits para prevenir desbordamientos de enteros de 32 bits.
>   7. Se ejecuta en **tiempo $O(A \log A + B \log B)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Alineacion de marcas de tiempo en registros distribuidos y sincronizacion de senales de audio.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.6), se nos plantea:

*"Halla el par de elementos (uno de cada coleccion) cuya diferencia absoluta sea minima y retorna el valor de dicha diferencia."*

## 2. Mecánica de los Dos Punteros

Al ordenar ambos arrays, avanzar el puntero del valor menor aproxima la busqueda hacia valores mas cercanos, garantizando un recorrido lineal $O(A + B)$ tras la ordenacion.

## Implementación de Producción

```java
import java.util.Arrays;

public class SmallestDifference {

    public static long findSmallestDifference(int[] a, int[] b) {
        if (a == null || b == null || a.length == 0 || b.length == 0) {
            return -1;
        }

        Arrays.sort(a);
        Arrays.sort(b);

        int i = 0;
        int j = 0;
        long minDifference = Long.MAX_VALUE;

        while (i < a.length && j < b.length) {
            long diff = Math.abs((long) a[i] - (long) b[j]);
            minDifference = Math.min(minDifference, diff);

            if (minDifference == 0) return 0;

            if (a[i] < b[j]) {
                i++;
            } else {
                j++;
            }
        }

        return minDifference;
    }
}
```

## Análisis de Complejidad

| Etapa | Complejidad Temporal | Espacio Auxiliar |
|---|---|---|
| Ordenación Dual | $O(A \log A + B \log B)$ | $O(\log A + \log B)$ pila de recursion |
| Recorrido Dos Punteros | $O(A + B)$ | $O(1)$ |
| **Total** | **$O(A \log A + B \log B)$** | **$O(1)$ auxiliar** |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Trazabilidad Distribuida

1. **Alineación de Logs:** En sistemas de telemetria (OpenTelemetry / Jaeger), correlacionar eventos de microservicios con relojes ligeramente desfasados requiere buscar pares de eventos con la menor diferencia temporal mediante algoritmos de dos punteros.
2. **Sincronización Multimedia:** Emparejamiento de pistas de audio y video.

## Casos Límite y Robustez en Producción

1. **Desbordamiento de Enteros:** `(long) a[i] - (long) b[j]` protege contra valores extremos como `Integer.MIN_VALUE`.
