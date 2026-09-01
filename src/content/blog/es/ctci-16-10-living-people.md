---
title: "Personas Vivas: Algoritmo Sweep-Line y Array de Diferencias (CTCI 16.10)"
description: "Determina el ano con mayor poblacion viva utilizando un array de diferencias (delta array) y sumas prefijas en tiempo lineal O(P + Y)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-10-living-people.webp
previewImage: /assets/images/ctci-16-10-living-people.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una lista de personas con sus anos de nacimiento y fallecimiento (todos entre 1900 y 2000 inclusive), encuentra el ano con el mayor numero de personas vivas.
> * **La Solución Óptima:** **Array de Diferencias (Sweep-Line Delta Array)**:
>   1. **Registro de Eventos**: Crear un array de deltas de tamano $102$ para el rango de anos $1900..2000$.
>   2. Para cada persona $(B, D)$:
>      * Incrementar la entrada de nacimiento: `deltas[B - 1900] += 1;`
>      * Decrementar en el ano posterior al fallecimiento: `deltas[D - 1900 + 1] -= 1;`
>   3. **Suma Prefija Acumulada**: Recorrer el array acumulando `currentlyAlive += deltas[i]` y registrando el ano con el maximo poblacional.
>   4. Se ejecuta en **tiempo $O(P + Y)$** y **espacio $O(Y) = O(1)$**.
> * **Realidad en Producción:** Monitorizacion de concurrencia maxima de conexiones en balanceadores de carga (Nginx, AWS ALB).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.10), se nos plantea:

*"Determina el ano con la maxima cantidad de personas vivas simultaneamente a partir de una coleccion de fechas de nacimiento y muerte."*

## 2. Funcionamiento del Array de Diferencias

El algoritmo de barrido lineal (Sweep-Line) transforma los intervalos $[B, D]$ en dos eventos puntuales ($+1$ en $B$ y $-1$ en $D+1$), reduciendo el calculo a una suma acumulada en una sola pasada.

## Implementación de Producción

```java
public class LivingPeople {

    public static class Person {
        public final int birth;
        public final int death;

        public Person(int birth, int death) {
            this.birth = birth;
            this.death = death;
        }
    }

    public static int maxAliveYear(Person[] people, int minYear, int maxYear) {
        if (people == null || people.length == 0) return minYear;

        int yearRange = maxYear - minYear + 1;
        int[] deltas = new int[yearRange + 2];

        for (Person person : people) {
            deltas[person.birth - minYear]++;
            deltas[person.death - minYear + 1]--;
        }

        int maxAlive = 0;
        int maxYear = minYear;
        int currentlyAlive = 0;

        for (int i = 0; i < yearRange; i++) {
            currentlyAlive += deltas[i];
            if (currentlyAlive > maxAlive) {
                maxAlive = currentlyAlive;
                maxYear = minYear + i;
            }
        }

        return maxYear;
    }
}
```

## Análisis de Complejidad

| Estrategia | Complejidad Temporal | Espacio Auxiliar |
|---|---|---|
| **Array de Diferencias (Deltas)** | **$O(P + Y)$** | **$O(Y)$** (constante para 101 anos) |
| **Doble Ordenación de Fechas** | $O(P \log P)$ | $O(P)$ |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Monitorización de Capacidad Concurrente

1. **Picos de Tráfico:** Los balanceadores de carga registran aperturas (`SYN`) y cierres (`FIN`) de sockets para calcular la concurrencia maxima instantanea de peticiones HTTP.
2. **Consultas en Series Temporales:** Prometheus utiliza deltas acumulados para calcular graficas de concurrencia en tiempo real.

## Casos Límite y Robustez en Producción

1. **Nacimiento y Muerte en el Mismo Año ($B = D$):** Se suma $+1$ en $B$ y se resta $-1$ en $B+1$, contabilizando correctamente a la persona durante ese ano.
