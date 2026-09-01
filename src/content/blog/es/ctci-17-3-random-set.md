---
title: "Conjunto Aleatorio: Muestreo de Reservorio de M Elementos en Arrays (CTCI 17.3)"
description: "Selecciona un subconjunto uniforme de M elementos de un array de tamano N mediante Muestreo de Reservorio (Reservoir Sampling) en tiempo O(N) y espacio O(M)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-3-random-set.webp
previewImage: /assets/images/ctci-17-3-random-set.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un metodo para generar aleatoriamente un conjunto de $m$ enteros a partir de un array de tamano $n$, asegurando que cada elemento tenga exactamente la misma probabilidad de ser seleccionado ($m/n$).
> * **La Solución Óptima:** **Muestreo de Reservorio (Reservoir Sampling)**:
>   1. Inicializar un array `subset` con los primeros $m$ elementos.
>   2. Para $i = m$ hasta $n - 1$:
>      * Generar un entero aleatorio $k \in [0, i]$.
>      * Si $k < m$, reemplazar `subset[k] = array[i]`.
>   3. **Demostración**: En cualquier paso $i$, la probabilidad acumulada de que cualquier elemento pertenezca al subconjunto es exactamente $\frac{m}{i+1}$.
>   4. Se ejecuta en **tiempo $O(N)$** y **espacio $O(M)$**.
> * **Realidad en Producción:** Muestreo de trazas de telemetria en Envoy y generacion de estadisticas en PostgreSQL `ANALYZE`.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.3), se nos plantea:

*"Extrae un subconjunto de M elementos a partir de un array de N elementos con estricta equiprobabilidad m/n."*

## 2. Inducción Matemática del Reservorio

Cualquier elemento previamente seleccionado sobrevive a la iteracion $i$ con probabilidad $1 - \frac{1}{i+1} = \frac{i}{i+1}$, resultando en $\frac{m}{i} \times \frac{i}{i+1} = \frac{m}{i+1}$.

## Implementación de Producción

```java
import java.util.Random;

public class RandomSet {

    private static final Random RNG = new Random();

    public static int[] pickMRecursively(int[] array, int m) {
        if (array == null || m <= 0 || m > array.length) {
            return new int[0];
        }

        int[] subset = new int[m];
        System.arraycopy(array, 0, subset, 0, m);

        for (int i = m; i < array.length; i++) {
            int k = RNG.nextInt(i + 1);
            if (k < m) {
                subset[k] = array[i];
            }
        }

        return subset;
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Una sola pasada lineal sobre el array. |
| Espacio Auxiliar | `O(M)` | Buffer del reservorio de tamano M. |
| Procesamiento Streaming | `Flujos Infinitos` | Funciona sin conocer la longitud total del flujo por adelantado. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Telemetría y Motores de Bases de Datos

1. **Muestreo en Envoy Proxy:** Los balanceadores de carga aplican muestreo de reservorio para almacenar 1.000 trazas representativas por minuto sin saturar los discos de registro.
2. **Optimizadores de Consultas en PostgreSQL:** Construccion de histogramas de distribucion en tablas de petabytes.

## Casos Límite y Robustez en Producción

1. **$M > N$ o $M \le 0$:** Retorna un array vacio de forma segura.
