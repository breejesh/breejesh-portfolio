---
title: "Número Faltante: Particionado por Paridad de Bits en Tiempo Lineal (CTCI 17.4)"
description: "Encuentra el unico entero faltante de 0 a N con acceso a nivel de bits utilizando eliminacion recursiva de paridad de columnas en tiempo geometrico O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-4-missing-number.webp
previewImage: /assets/images/ctci-17-4-missing-number.webp
---

> **TL;DR**
> * **El Problema del Libro:** Un array contiene todos los enteros de $0$ a $n$, excepto uno que falta. Solo puedes consultar el bit $j$-esimo de $A[i]$ mediante `fetch(i, j)`. Encuentra el entero faltante en tiempo $O(n)$.
> * **La Solución Óptima:** **Reducción Recursiva por Paridad de Bits**:
>   1. En una secuencia completa de $0..n$, la cantidad de ceros en el bit menos significativo (LSB) es siempre mayor o igual que la de unos ($\text{ceros} \ge \text{unos}$).
>   2. Contar los bits LSB del array:
>      * Si $\text{ceros} \le \text{unos}$, el numero faltante tenia un **0** en ese bit. Filtrar para conservar solo los numeros con LSB = 0 y avanzar a la columna 1.
>      * Si $\text{ceros} > \text{unos}$, el numero faltante tenia un **1** en ese bit. Filtrar para conservar solo los numeros con LSB = 1 y avanzar a la columna 1.
>   3. Reconstruccion: $\text{faltante} = (\text{recursivo} \ll 1) \mid \text{bit}$.
>   4. **Serie Geométrica**: $T(n) = n + \frac{n}{2} + \frac{n}{4} + \cdots = 2n = O(n)$.
> * **Realidad en Producción:** Memoria ECC para deteccion de errores y bases de datos columnares (Apache Parquet).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.4), se nos plantea:

*"Halla el entero extraviado en el rango de 0 a n en tiempo O(n) utilizando unicamente lecturas de bits individuales."*

## 2. Invariante de Paridad de Bits

Al descartar la mitad de los elementos en cada columna de bits, el tiempo total converge gracias a la suma de la serie geometrica.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.List;

public class MissingNumberFinder {

    public interface BitInteger {
        int fetch(int column);
    }

    public static int findMissing(List<BitInteger> array) {
        return findMissingHelper(array, 0);
    }

    private static int findMissingHelper(List<BitInteger> input, int column) {
        if (column >= 32 || input.isEmpty()) return 0;

        List<BitInteger> zeros = new ArrayList<>(input.size() / 2);
        List<BitInteger> ones = new ArrayList<>(input.size() / 2);

        for (BitInteger num : input) {
            if (num.fetch(column) == 0) {
                zeros.add(num);
            } else {
                ones.add(num);
            }
        }

        if (zeros.size() <= ones.size()) {
            int v = findMissingHelper(zeros, column + 1);
            return (v << 1) | 0;
        } else {
            int v = findMissingHelper(ones, column + 1);
            return (v << 1) | 1;
        }
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Serie geometrica convergente: $N + N/2 + N/4 + \dots = 2N$. |
| Espacio Auxiliar | `O(N)` | Listas intermedias filtradas en la recursion. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Bases de Datos Columnares

1. **Parquet / ClickHouse:** Los motores analiticos procesan vectores de bits comprimidos directamente en memoria sin materializar registros completos.
2. **Memorias ECC:** Deteccion y correccion de inversiones de bits mediante matrices de paridad de Hamming.

## Casos Límite y Robustez en Producción

1. **Falta el Cero:** Resuelto de forma natural asignando 0 en todas las columnas.
