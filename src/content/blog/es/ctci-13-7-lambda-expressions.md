---
title: "Expresiones Lambda: Agregación Funcional con Streams en Java 8+ (CTCI 13.7)"
description: "Calcula metricas agregadas sobre colecciones en Java mediante expresiones Lambda, tuberias de Streams, especializacion primitiva y reduccion paralela."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-13-7-lambda-expressions.webp
previewImage: /assets/images/ctci-13-7-lambda-expressions.webp
---

> **TL;DR**
> * **El Problema del Libro:** Existe una clase `Country` con los metodos `getContinent()` y `getPopulation()`. Escribe una funcion `int getPopulation(List<Country> countries, String continent)` que compute la poblacion total de un continente dado utilizando expresiones lambda.
> * **La Solución Óptima:** **Tubería de Streams Funcional con Especialización Primitiva**: (1) Validar que la lista y el continente no sean nulos; (2) Convertir a flujo con `countries.stream()`; (3) Filtrar mediante predicado `filter(c -> continent.equals(c.getContinent()))`; (4) Mapear a flujo entero primitivo `mapToInt(Country::getPopulation)` (evitando el sobrecoste de boxing); (5) Ejecutar reduccion terminal `.sum()`; (6) Se ejecuta en **tiempo $O(N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Procesamiento de flujos en Apache Spark / Flink y transformaciones en microservicios con Kafka Streams.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 13.7), se nos plantea:

*"Implementa una funcion en Java que calcule la poblacion acumulada de un continente a partir de una lista de paises usando expresiones lambda y la API de Streams."*

```java
public class Country {
    private final String continent;
    private final int population;

    public Country(String continent, int population) {
        this.continent = continent;
        this.population = population;
    }

    public String getContinent() { return continent; }
    public int getPopulation() { return population; }
}
```

## 2. Arquitectura de la Tubería de Streams

1. **Fuente:** `countries.stream()`.
2. **Operaciones Intermedias:** `filter` (evaluacion perezosa) y `mapToInt` (flujo primitivo).
3. **Operación Terminal:** `sum()` (reduccion en una sola pasada).

## Implementación de Producción

```java
import java.util.List;
import java.util.Objects;

public class CountryPopulationAggregator {

    public static int getPopulation(List<Country> countries, String continent) {
        if (countries == null || continent == null) {
            return 0;
        }

        return countries.stream()
            .filter(Objects::nonNull)
            .filter(c -> continent.equalsIgnoreCase(c.getContinent()))
            .mapToInt(Country::getPopulation)
            .sum();
    }

    public static long getPopulationParallel(List<Country> countries, String continent) {
        if (countries == null || continent == null) {
            return 0L;
        }

        return countries.parallelStream()
            .filter(Objects::nonNull)
            .filter(c -> continent.equalsIgnoreCase(c.getContinent()))
            .mapToLong(Country::getPopulation)
            .sum();
    }
}
```

## Análisis de Complejidad

| Métrica | Flujo Secuencial | Flujo Paralelo (`parallelStream()`) |
|---|---|---|
| Complejidad Temporal | `O(N)` | `O(N / P)` distribuido en $P$ núcleos CPU |
| Espacio Auxiliar | `O(1)` | `O(P)` marcos de pila concurrentes |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Fusión de Bucles en el Compilador JIT

1. **Evaluación Perezosa:** La API de Streams no crea listas intermedias. El compilador JIT fusiona el filtro y el mapeo en un unico bucle nativo en ensamblador.
2. **Especialización Primitiva (`mapToInt`):** Evita crear millones de objetos envoltorio `Integer` en el heap.

## Casos Límite y Robustez en Producción

1. **Desbordamiento de Enteros:** Si la poblacion supera los 2.147 millones ($2^{31}-1$), se debe usar `mapToLong()` retornando un `long` de 64 bits.
