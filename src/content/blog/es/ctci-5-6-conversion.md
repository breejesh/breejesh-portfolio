---
title: "Conversión: Cambios de Bits Necesarios para Convertir el Entero A en B (CTCI 5.6)"
description: "Determina el numero de inversiones de bits necesarias para convertir un entero A en B utilizando XOR y el algoritmo de Brian Kernighan en tiempo O(k)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-6-conversion.webp
previewImage: /assets/images/ctci-5-6-conversion.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe una funcion para determinar el numero de bits que necesitarias invertir para convertir el entero A en el entero B.
> * **La Solución Óptima:** Calcula $C = A \oplus B$ (XOR). Cada bit 1 en $C$ representa una posicion donde $A$ y $B$ difieren. Cuenta los bits 1 en $C$ mediante el **Algoritmo de Brian Kernighan** (`c = c & (c - 1)`), que itera exactamente $k$ veces (donde $k$ es la cantidad de bits diferentes, $k \le 32$) en tiempo $O(k)$ y espacio $O(1)$.
> * **Realidad en Producción:** Calculo de distancia de Hamming en memorias ECC y deteccion de documentos duplicados (SimHash).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 5.6), se nos plantea:

*"Escribe una funcion para determinar el numero de bits que necesitarias invertir para convertir el entero A en el entero B."*

**Ejemplo:**
* Entrada: `29` (`11101_2`), `15` (`01111_2`)
* Salida: `2` (los bits en las posiciones 1 y 4 deben invertirse).

## 2. XOR y Algoritmo de Brian Kernighan

1. La operacion XOR $A \oplus B$ marca con 1 exactamente aquellas posiciones donde $A$ y $B$ difieren.
2. En lugar de desplazar 32 veces, el algoritmo de Brian Kernighan ejecuta `c = c & (c - 1)`, lo que apaga el bit 1 menos significativo en cada paso. El bucle itera unicamente tantas veces como bits 1 existan ($k$ veces).

## Implementación de Producción

```java
public class BitConversion {
    /**
     * Determina el numero de bits a invertir para convertir a en b.
     * Complejidad Temporal: O(k) donde k es la cantidad de bits diferentes (k <= 32).
     * Complejidad Espacial: O(1)
     */
    public static int bitSwapRequired(int a, int b) {
        int count = 0;
        for (int c = a ^ b; c != 0; c = c & (c - 1)) {
            count++;
        }
        return count;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(k)` | Exactamente $k$ iteraciones donde $k$ es la distancia de Hamming ($k \le 32$). |
| Espacio Auxiliar | `O(1)` | Variable entera en registro. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Distancia de Hamming

1. **Memoria ECC (Error-Correcting Code):** Detecta y corrige corrupcion de bits en memoria fisica calculando distancias de Hamming.
2. **Deduplicación de Documentos (SimHash en Buscadores):** Compara huellas digitales de 64 bits para identificar contenido casi duplicado.

## Casos Límite y Robustez en Producción

1. **Enteros idénticos ($A == B$):** $A \oplus B = 0$, retorna `0` en 0 iteraciones.
2. **Enteros opuestos a nivel de bits ($A == \sim B$):** Retorna `32`.
