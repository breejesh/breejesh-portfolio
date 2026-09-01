---
title: "100 Casilleros: Pares de Factores y Casilleros de Cuadrados Perfectos (CTCI 6.9)"
description: "Demostracion matematica que explica por que exactamente 10 casilleros (los cuadrados perfectos) quedan abiertos tras 100 pasadas en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-9-100-lockers.webp
previewImage: /assets/images/ctci-6-9-100-lockers.webp
---

> **TL;DR**
> * **El Problema del Libro:** Hay 100 casilleros cerrados en un pasillo. Un hombre abre todos en la pasada 1. En la pasada 2, cambia de estado cada 2 casilleros. En la pasada 3, cada 3... En la pasada 100, solo el casillero 100. ¿Cuantos casilleros quedan abiertos al final?
> * **La Solución Óptima:** **Paridad de Factores / Cuadrados Perfectos**: Un casillero $k$ se conmuta tantas veces como divisores tenga. Dado que los divisores vienen en pares $(a, b)$ con $a \times b = k$, el conteo de factores es siempre **par**, excepto cuando $a = b \implies k = a^2$ (cuadrados perfectos). Solo los **cuadrados perfectos** tienen un numero impar de divisores y quedan **abiertos**. En $1 \dots 100$ hay $\lfloor \sqrt{100} \rfloor = \mathbf{10}$ casilleros abiertos ($1, 4, 9, 16, 25, 36, 49, 64, 81, 100$).
> * **Realidad en Producción:** Criba de Eratostenes y analisis de simetria de divisores.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 6.9), se nos plantea:

*"Hay 100 casilleros cerrados. En la pasada i se cambia el estado de los casilleros multiplos de i. Tras 100 pasadas, ¿cuantos casilleros quedan abiertos?"*

## 2. Demostración por Emparejamiento de Divisores

1. **Regla de Conmutación:** El casillero $k$ se altera en la pasada $i$ si y solo si $i$ divide a $k$.
2. **Pares de Divisores:** Para cualquier numero $k$, sus factores se emparejan: si $a$ es factor, $b = k / a$ tambien lo es.
   * Ejemplo ($k = 12$): $(1, 12), (2, 6), (3, 4) \implies 6$ factores (par $\implies$ CERRADO).
3. **Excepción de Cuadrados Perfectos:** Si $a = b \implies k = a^2$, el factor se cuenta una sola vez.
   * Ejemplo ($k = 16$): $(1, 16), (2, 8), (4, 4) \implies \{1, 2, 4, 8, 16\}$ (5 factores, impar $\implies$ ABIERTO).
4. **Conteo:** Los cuadrados perfectos hasta 100 son $\{1, 4, 9, 16, 25, 36, 49, 64, 81, 100\} \implies \lfloor \sqrt{100} \rfloor = \mathbf{10}$.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.List;

public class LockersProblem {
    /**
     * Calcula la cantidad de casilleros abiertos en O(1).
     */
    public static int countOpenLockers(int n) {
        if (n <= 0) return 0;
        return (int) Math.sqrt(n);
    }

    /**
     * Retorna la lista de numeros de casilleros abiertos.
     */
    public static List<Integer> getOpenLockers(int n) {
        List<Integer> openLockers = new ArrayList<>();
        for (int i = 1; i * i <= n; i++) {
            openLockers.add(i * i);
        }
        return openLockers;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Tiempo Directo | `O(1)` | Calculo directo de raiz cuadrada `Math.sqrt(n)`. |
| Generación de Lista | `O(sqrt(N))` | Itera hasta $\sqrt{N}$. |
| Espacio Auxiliar | `O(1)` | Sin estructuras adicionales para el conteo. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Simetría de Factores

1. **Criba de Eratóstenes:** Aplica la propiedad de que los factores no compuestos superan $\sqrt{N}$ para optimizar la busqueda de numeros primos.
2. **Conflictos en Caché Asociativa:** Patrones de acceso con saltos que generan colisiones de etiquetas en lineas de cache.

## Casos Límite y Robustez en Producción

1. **$n = 1$:** Retorna 1.
2. **$n \le 0$:** Retorna 0.
