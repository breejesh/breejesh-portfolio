---
title: "Monedas: Programación Dinámica para Combinaciones Infinitas de Cambio (CTCI 8.11)"
description: "Calcula el numero de formas de representar n centavos usando monedas ilimitadas de 25, 10, 5 y 1 centavos mediante programacion dinamica en tiempo O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-11-coins.webp
previewImage: /assets/images/ctci-8-11-coins.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un numero infinito de monedas de 25 centavos (quarters), 10 centavos (dimes), 5 centavos (nickels) y 1 centavo (pennies), escribe codigo para calcular el numero de formas de representar $n$ centavos.
> * **La Solución Óptima:** Programación Dinámica 1D / Memoización 2D: (1) Arreglo de denominaciones `[25, 10, 5, 1]`; (2) Enfoque recursivo con tabla `memo[monto][indice]`; (3) Enfoque iterativo 1D bottom-up `ways[i] += ways[i - coin]` para cada moneda en **tiempo $O(N)$** y **espacio $O(N)$**.
> * **Realidad en Producción:** Algoritmos de cambio en cajas registradoras (POS) y particion de paquetes en redes (MTU).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.11), se nos plantea:

*"Calcula de cuantas formas se pueden reunir n centavos utilizando monedas de 25, 10, 5 y 1 centavos en cantidades ilimitadas."*

## 2. Formulaciones de Programación Dinámica

1. **Recursión con Memoización 2D:**
   En cada paso se eligen $0, 1, 2, \dots$ monedas de la denominacion actual y se recurre con el monto restante y la siguiente moneda.
2. **Programación Dinámica 1D Bottom-Up:**
   Se inicializa `ways[0] = 1`. Para cada denominacion, se acumulan las formas `ways[i] += ways[i - coin]`.

## Implementación de Producción

```java
public class CoinChange {
    /**
     * Solucion Recursiva con Memoizacion 2D.
     * Complejidad Temporal: O(N * D)
     * Complejidad Espacial: O(N * D)
     */
    public static int makeChange(int amount) {
        int[] denoms = {25, 10, 5, 1};
        int[][] map = new int[amount + 1][denoms.length];
        return makeChangeHelper(amount, denoms, 0, map);
    }

    private static int makeChangeHelper(int amount, int[] denoms, int index, int[][] map) {
        if (map[amount][index] > 0) return map[amount][index];
        if (index >= denoms.length - 1) return 1;

        int denomAmount = denoms[index];
        int ways = 0;
        for (int i = 0; i * denomAmount <= amount; i++) {
            int amountRemaining = amount - i * denomAmount;
            ways += makeChangeHelper(amountRemaining, denoms, index + 1, map);
        }

        map[amount][index] = ways;
        return ways;
    }

    /**
     * Programacion Dinamica 1D Bottom-Up.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(N)
     */
    public static int makeChangeBottomUp(int n) {
        int[] denoms = {25, 10, 5, 1};
        int[] ways = new int[n + 1];
        ways[0] = 1;

        for (int coin : denoms) {
            for (int i = coin; i <= n; i++) {
                ways[i] += ways[i - coin];
            }
        }

        return ways[n];
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | 4 pasadas lineales sobre el arreglo de tamaño $N + 1$. |
| Espacio Auxiliar | `O(N)` | Arreglo de programación dinámica 1D. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Problema de la Mochila

1. **Terminales Punto de Venta (POS):** Dispensacion automatizada de cambio monetario bajo restricciones de inventario fisico.
2. **Segmentación de Paquetes en Redes:** Division de datos en fragmentos de tamano estandar (MTU de 1500 bytes).

## Casos Límite y Robustez en Producción

1. **$n = 0$ centavos:** Retorna 1 forma.
2. **$n < 5$ centavos:** Retorna 1 (solo pennies de 1 centavo).
