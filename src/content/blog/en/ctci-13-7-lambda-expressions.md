---
title: "Lambda Expressions: Functional Stream Aggregation Pipelines in Java 8+ (CTCI 13.7)"
description: "Compute aggregate metrics across collections using Java 8 Lambda expressions, Stream pipelines, Primitive IntStream specialization, and parallel reduction."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-13-7-lambda-expressions.webp
previewImage: /assets/images/ctci-13-7-lambda-expressions.webp
---

> **TL;DR**
> * **The Book Problem:** There is a class `Country` that has methods `getContinent()` and `getPopulation()`. Write a function `int getPopulation(List<Country> countries, String continent)` that computes the total population of a given continent using lambda expressions.
> * **The Optimal Solution:** **Functional Stream Pipeline with Primitive Specialization**: (1) If the input list or continent string is null, return 0; (2) Convert the collection into a stream via `countries.stream()`; (3) Apply predicate filter `filter(c -> continent.equals(c.getContinent()))`; (4) Map to a primitive integer stream using method reference `mapToInt(Country::getPopulation)` (eliminating `Integer` unboxing overhead); (5) Apply terminal reduction `.sum()`; (6) Runs in **$O(N)$ time** and **$O(1)$ auxiliary memory** through JVM stream fusing.
> * **Production Reality:** Big data analytics in Apache Spark / Flink, parallel processing with `parallelStream()`, and Kafka Stream microservice transforms.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 13.7), we are asked:

*"There is a class Country that has methods getContinent() and getPopulation(). Write a function int getPopulation(List<Country> countries, String continent) that computes the total population of a given continent, using lambda expressions."*

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

## 2. Stream Pipeline Architecture

A Java 8 Stream pipeline separates computation into three phases:

```
[Collection: List<Country>]
            │
            ▼ (Stream Source)
[Intermediate: filter(c -> continent.equals(c.getContinent()))]
            │
            ▼ (Primitive IntStream Mapping)
[Intermediate: mapToInt(Country::getPopulation)]
            │
            ▼ (Terminal Reduction)
[Terminal Operation: .sum()] ──> Returns int sum in single pass
```

## Production Implementation

```java
import java.util.List;
import java.util.Objects;

public class CountryPopulationAggregator {

    /**
     * Computes the total population for a specific continent.
     * Time Complexity: O(N)
     * Space Complexity: O(1)
     */
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

    /**
     * Parallel Stream Reduction for Massive Big-Data Datasets (ForkJoinPool)
     */
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

## Complexity & Memory Analysis

| Metric | Sequential Stream | Parallel Stream (`parallelStream()`) |
|---|---|---|
| Time Complexity | `O(N)` | `O(N / P)` across $P$ CPU cores |
| Auxiliary Space | `O(1)` | `O(P)` thread frame buffers |
| GC Allocations | Zero (Primitive `IntStream`) | Zero heap boxing |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Stream Fusion & JIT Compilation

1. **Lazy Evaluation & Loop Fusion:** Java Streams do not create intermediate lists. The HotSpot compiler fuses `filter` and `mapToInt` into a single tight machine-code `for` loop with branch prediction.
2. **`mapToInt` vs `map`:** Calling `.map(Country::getPopulation).reduce(0, Integer::sum)` causes $N$ auto-boxing and unboxing allocations on the heap. Using primitive `.mapToInt()` evaluates entirely within CPU registers.

## Edge Cases & Production Hardening

1. **Integer Overflow:** If total global population exceeds $2^{31} - 1$ ($\approx 2.14\text{ Billion}$), `int` overflows. Production systems use `.mapToLong()` and return a 64-bit `long`.
2. **Null Elements in List:** Defended by `.filter(Objects::nonNull)`.
