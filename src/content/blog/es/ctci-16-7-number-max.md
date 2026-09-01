---
title: "Máximo sin Comparadores: Aritmética sin Bifurcaciones y Control de Desbordamiento (CTCI 16.7)"
description: "Calcula el maximo de dos numeros enteros sin estructuras if-else ni operadores de comparacion mediante extraccion del bit de signo y logica branchless."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-7-number-max.webp
previewImage: /assets/images/ctci-16-7-number-max.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un metodo que encuentre el maximo de dos numeros sin utilizar sentencias `if-else` ni ningun operador de comparacion (`<`, `>`, `==`).
> * **La Solución Óptima:** **Multiplexación sin Bifurcaciones con Protección de Desbordamiento**:
>   1. **Extracción de Signo**: `sign(x) = (x >>> 31) ^ 1` (devuelve $1$ si $x \ge 0$, y $0$ si $x < 0$).
>   2. **La Trampa del Desbordamiento**: Restar directamente $a - b$ desborda si $a$ y $b$ tienen signos opuestos (ej. $a = \text{MAX\_INT}, b = -10$).
>   3. **Fórmula Unificada**:
>      * Si los signos son distintos (`sa ^ sb == 1`): tomar $a$ si es positivo (`k = sa`).
>      * Si los signos coinciden (`sa ^ sb == 0`): usar `sc = sign(a - b)`.
>      * Coeficiente: `k = (sa ^ sb) * sa + (1 ^ (sa ^ sb)) * sc`.
>   4. **Resultado**: `return a * k + b * (k ^ 1);`.
>   5. Se ejecuta en **tiempo $O(1)$** sin penalizaciones por salto condicional.
> * **Realidad en Producción:** Criptografia en tiempo constante y operaciones vectoriales SIMD.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.7), se nos plantea:

*"Halla el maximo de dos enteros sin emplear sentencias condicionales ni operadores de comparacion relacional."*

## 2. Lógica a Nivel de Bits

Extraemos el bit de mayor peso (MSB) para generar una mascara multiplicadora $k \in \{0, 1\}$.

## Implementación de Producción

```java
public class NumberMax {

    private static int sign(int a) {
        return (a >>> 31) ^ 1;
    }

    public static int getMax(int a, int b) {
        int sa = sign(a);
        int sb = sign(b);
        int sc = sign(a - b);

        int useSignA = sa ^ sb;
        int useSignC = useSignA ^ 1;

        int k = useSignA * sa + useSignC * sc;
        int q = k ^ 1;

        return a * k + b * q;
    }
}
```

## Análisis de Complejidad

| Métrica | Valor | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(1)` | Flujo puro de instrucciones a nivel de bits sin saltos. |
| Espacio Auxiliar | `O(1)` | Sin memoria dinamica. |
| Fallos de Predicción | `0%` | Ejecución determinista en la CPU. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Criptografía en Tiempo Constante

1. **Prevención de Ataques de Canal Lateral:** Las comparaciones con `if` filtran informacion de tiempo en procesadores modernos a traves de la prediccion de saltos. El codigo sin bifurcaciones garantiza un tiempo de ejecucion identico para cualquier clave secreta.
2. **Instrucciones SIMD:** Compiladores modernos traducen estas operaciones a `_mm256_max_epi32` (AVX2).

## Casos Límite y Robustez en Producción

1. **Valores Extremos:** `Integer.MAX_VALUE` y `Integer.MIN_VALUE` se procesan con total seguridad sin desbordamiento.
