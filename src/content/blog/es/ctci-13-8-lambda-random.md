---
title: "Subconjunto Aleatorio con Lambda: Probabilidad Uniforme en Java (CTCI 13.8)"
description: "Genera un subconjunto aleatorio con distribucion uniforme en Java usando expresiones Lambda, API de Streams y ensayos de Bernoulli en tiempo O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-13-8-lambda-random.webp
previewImage: /assets/images/ctci-13-8-lambda-random.webp
---

> **TL;DR**
> * **El Problema del Libro:** Utilizando expresiones lambda, escribe una funcion `List<Integer> getRandomSubset(List<Integer> list)` que retorne un subconjunto aleatorio de tamano arbitrario donde todos los posibles subconjuntos tengan la misma probabilidad de ser elegidos.
> * **El Principio Matemático:** **Ensayos de Bernoulli Independientes ($p = 0,5$)**: (1) Para una lista de tamano $N$, existen exactamente $2^N$ subconjuntos posibles; (2) Para que cada subconjunto tenga probabilidad uniforme de $1 / 2^N$, cada elemento debe tener independientemente un $50\%$ de probabilidad de ser incluido; (3) Filtramos el flujo con un predicado booleano aleatorio: `filter(item -> ThreadLocalRandom.current().nextBoolean())`; (4) Recolectamos el resultado en una lista: `.collect(Collectors.toList())`; (5) Se ejecuta en **tiempo $O(N)$**.
> * **Realidad en Producción:** Asignacion aleatoria en pruebas A/B, simulaciones de Monte Carlo y algoritmos de muestreo de reservorio.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 13.8), se nos plantea:

*"Escribe una funcion en Java usando expresiones lambda para generar un subconjunto aleatorio uniforme a partir de una lista."*

## 2. Demostración Matemática de Probabilidad Uniforme

Para un conjunto $L$ de tamano $N$, existen $2^N$ subconjuntos.

Para cualquier subconjunto $S$ de tamano $k$:
$$P(S) = (0,5)^k \times (0,5)^{N - k} = (0,5)^N = \frac{1}{2^N}$$

Dado que todo subconjunto tiene exactamente una probabilidad de $1 / 2^N$, la distribucion es estrictamente uniforme.

## Implementación de Producción

```java
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

public class RandomSubsetGenerator {

    public static List<Integer> getRandomSubset(List<Integer> list) {
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }

        return list.stream()
            .filter(item -> ThreadLocalRandom.current().nextBoolean())
            .collect(Collectors.toList());
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Un unico recorrido de flujo evaluando $N$ booleanos aleatorios. |
| Tamaño Esperado | $E[K] = N / 2$ | Media de distribucion binomial con $p = 0,5$. |
| Probabilidad por Subconjunto | $1 / 2^N$ | Distribucion perfectamente equiprobable. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Rendimiento en Generación de Números Aleatorios

1. **`ThreadLocalRandom` vs `java.util.Random`:** `java.util.Random` comparte una semilla global atomica (`AtomicLong`) que produce contencion de hilos y cache bouncing. `ThreadLocalRandom` aisla la semilla por hilo sin sobrecoste de sincronizacion.
2. **Aleatoriedad Criptográfica:** Para tokens de seguridad, usar `SecureRandom`.

## Casos Límite y Robustez en Producción

1. **Lista Vacía o Nula:** Retorna `Collections.emptyList()` de inmediato sin excepciones.
