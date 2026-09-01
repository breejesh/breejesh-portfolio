---
title: "Torre de Circo: Subsecuencia Creciente 2D mediante Patience Sorting (CTCI 17.8)"
description: "Calcula la altura maxima de una torre humana donde cada persona es estrictamente mas baja y ligera mediante ordenacion dual y LIS en tiempo O(N log N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-8-circus-tower.webp
previewImage: /assets/images/ctci-17-8-circus-tower.webp
---

> **TL;DR**
> * **El Problema del Libro:** Una rutina circense requiere construir una torre humana donde cada persona debe ser estrictamente mas baja y ligera que la persona sobre la que se apoya ($H_i < H_{i+1}$ y $W_i < W_{i+1}$). Calcula la mayor cantidad de personas apilables.
> * **La Solución Óptima:** **Ordenación Dual y Subsecuencia Creciente más Larga (LIS)**:
>   1. **Ordenación Dual**: Ordenar por **Altura ascendente** ($H \uparrow$). En caso de empate en altura, ordenar por **Peso descendente** ($W \downarrow$).
>   2. **El Truco del Desempate**: Ordenar el peso en orden inverso evita que dos personas de la misma altura se encadenen indebidamente.
>   3. **LIS en 1D con Búsqueda Binaria**: Aplicar *Patience Sorting* sobre el array de pesos resultante en tiempo $O(N \log N)$.
>   4. Se ejecuta en **tiempo $O(N \log N)$** y **espacio $O(N)$**.
> * **Realidad en Producción:** Anidamiento de rectangulos 2D (Russian Dolls) y orquestacion de tareas con restricciones multidimensionales en Kubernetes.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.8), se nos plantea:

*"Determina la mayor cadena de personas apilables respetando una estricta desigualdad en altura y peso de forma simultanea."*

## 2. Reducción de 2D a 1D

Al ordenar la primera dimension de forma creciente y desempatar la segunda de forma decreciente, el problema 2D se transforma exactamente en el clasico LIS en 1D.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class CircusTower {

    public static class Person implements Comparable<Person> {
        public final int height;
        public final int weight;

        public Person(int height, int weight) {
            this.height = height;
            this.weight = weight;
        }

        @Override
        public int compareTo(Person other) {
            if (this.height != other.height) {
                return Integer.compare(this.height, other.height);
            }
            return Integer.compare(other.weight, this.weight); // Peso descendente
        }
    }

    public static int maxTowerHeight(List<Person> people) {
        if (people == null || people.isEmpty()) return 0;

        Collections.sort(people);

        int[] tails = new int[people.size()];
        int size = 0;

        for (Person p : people) {
            int w = p.weight;
            int idx = Arrays.binarySearch(tails, 0, size, w);

            if (idx < 0) {
                idx = -(idx + 1);
            }

            tails[idx] = w;
            if (idx == size) {
                size++;
            }
        }

        return size;
    }
}
```

## Análisis de Complejidad

| Algoritmo | Complejidad Temporal | Espacio Auxiliar | Manejo de Empates |
|---|---|---|---|
| **Ordenación Dual + LIS** | **$O(N \log N)$** | **$O(N)$** | **Exacto (Peso Descendente)** |
| **Programación Dinámica 2D** | $O(N^2)$ | $O(N)$ | Correcto pero lento |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Empaquetado Multidimensional

1. **Kubernetes Resource Scheduling:** Agrupamiento de contenedores con requisitos minimos de CPU y memoria utilizando cadenas de Pareto.
2. **Manufactura CAD:** Anidamiento de piezas sobre laminas de corte para maximizar el aprovechamiento de material.

## Casos Límite y Robustez en Producción

1. **Alturas Idénticas con Pesos Distintos:** El peso decreciente garantiza que solo una persona de esa altura pueda ser seleccionada.
