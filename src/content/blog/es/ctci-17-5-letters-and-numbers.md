---
title: "Letras y Números: Subarray Más Largo Equilibrado mediante Sumas Prefijas (CTCI 17.5)"
description: "Halla el subarray contiguo mas largo con igual cantidad de letras y numeros utilizando mapas hash de primera aparicion y deltas acumulados en tiempo lineal O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-5-letters-and-numbers.webp
previewImage: /assets/images/ctci-17-5-letters-and-numbers.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un array con letras y numeros, encuentra el subarray contiguo mas largo que contenga el mismo numero de letras que de numeros.
> * **La Solución Óptima:** **Deltas Acumulados y Mapa de Primera Aparición**:
>   1. Mapear letras a $+1$ y numeros a $-1$.
>   2. **Invariante**: Calcular la suma acumulada de deltas $D[i]$. Si $D[i] == D[j]$ ($i < j$), el subarray intermedio $[i+1 \dots j]$ tiene un balance neto exacto de 0.
>   3. Guardar el primer indice visto para cada valor de delta en `Map<Integer, Integer>` (con base $(0, -1)$).
>   4. Se ejecuta en **tiempo $O(N)$** y **espacio $O(N)$**.
> * **Realidad en Producción:** Analisis de desbalance de flujo de ordenes en mercados financieros y curvas de GC-Skew en genetica.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.5), se nos plantea:

*"Identifica el subarray continuo de extension maxima que posea un balance identico entre caracteres alfabeticos y digitos numericos."*

## 2. Invariante de Diferencias Prefijas

Cuando dos indices presentan la misma suma acumulada de diferencias, los cambios positivos y negativos intermedios se anulan mutuamente por completo.

## Implementación de Producción

```java
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class LettersAndNumbers {

    public static char[] findLongestSubarray(char[] array) {
        if (array == null || array.length < 2) {
            return new char[0];
        }

        Map<Integer, Integer> firstSeen = new HashMap<>();
        firstSeen.put(0, -1);

        int runningDelta = 0;
        int maxLen = 0;
        int bestStart = -1;

        for (int i = 0; i < array.length; i++) {
            if (Character.isLetter(array[i])) {
                runningDelta += 1;
            } else if (Character.isDigit(array[i])) {
                runningDelta -= 1;
            }

            if (firstSeen.containsKey(runningDelta)) {
                int prevIndex = firstSeen.get(runningDelta);
                int length = i - prevIndex;
                if (length > maxLen) {
                    maxLen = length;
                    bestStart = prevIndex + 1;
                }
            } else {
                firstSeen.put(runningDelta, i);
            }
        }

        if (maxLen == 0) return new char[0];

        return Arrays.copyOfRange(array, bestStart, bestStart + maxLen);
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Un unico recorrido lineal del array. |
| Espacio Auxiliar | `O(N)` | Mapa hash con a lo sumo $2N+1$ deltas distintos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Genómica y Finanzas

1. **Curvas de GC-Skew:** Identificacion de origenes de replicacion en cromosomas bacterianos mediante sumas prefijas de diferencias de nucleotidos.
2. **Order Flow Imbalance:** Algoritmos de trading cuantifican el equilibrio instantaneo de liquidez.

## Casos Límite y Robustez en Producción

1. **Sin Subarray Equilibrado:** Retorna array vacio de forma segura.
2. **Todo el Array Equilibrado:** Detectado correctamente gracias al punto de partida `(0, -1)`.
