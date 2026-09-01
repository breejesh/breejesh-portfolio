---
title: "Número Siguiente: Encontrar el Menor y Mayor Número con Mismo Peso de Hamming (CTCI 5.4)"
description: "Dado un entero positivo, calcula el siguiente mayor y menor numero con la misma cantidad exacta de 1s en su representacion binaria en tiempo O(b)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-4-next-number.webp
previewImage: /assets/images/ctci-5-4-next-number.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un entero positivo, imprime el siguiente numero menor y el siguiente mayor que tengan la misma cantidad de 1s en su representacion binaria.
> * **La Solución Óptima:** (1) **Get Next:** Encuentra el primer cero no final en la posicion $p$. Invierte el bit $p$ de `0` a `1`, limpia los bits a la derecha y coloca $c_1 - 1$ unos en los bits menos significativos; (2) **Get Prev:** Encuentra el primer uno no final en la posicion $p$. Invierte el bit $p$ a `0` y coloca $c_1 + 1$ unos pegados a la derecha de $p$ en tiempo $O(b)$ y espacio $O(1)$.
> * **Realidad en Producción:** Truco de Gosper para generacion de subconjuntos de tamano fijo y motores de ajedrez con bitboards.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 5.4), se nos plantea:

*"Dado un entero positivo, imprime el siguiente menor y el siguiente mayor numero que tengan exactamente la misma cantidad de 1s en su representacion binaria."*

## 2. Mecánica Algorítmica

### Algoritmo para el Siguiente Mayor (`getNext`)
1. Contar ceros finales ($c_0$) y unos consecutivos inmediatos ($c_1$).
2. La posicion del primer cero no final es $p = c_0 + c_1$.
3. Invertir el bit $p$ a 1: `n |= (1 << p)`.
4. Limpiar los bits a la derecha de $p$: `n &= ~((1 << p) - 1)`.
5. Insertar $c_1 - 1$ unos en la derecha: `n |= (1 << (c_1 - 1)) - 1`.

### Algoritmo para el Siguiente Menor (`getPrev`)
1. Contar unos finales ($c_1$) y ceros consecutivos inmediatos ($c_0$).
2. Posicion $p = c_0 + c_1$.
3. Limpiar desde $p$: `n &= ((~0) << (p + 1))`.
4. Insertar $c_1 + 1$ unos a la derecha de $p$: `int mask = (1 << (c_1 + 1)) - 1; n |= mask << (c_0 - 1)`.

## Implementación de Producción

```java
public class NextNumber {
    /**
     * Calcula el siguiente mayor numero con igual conteo de bits.
     * Complejidad Temporal: O(b)
     * Complejidad Espacial: O(1)
     */
    public static int getNext(int n) {
        int c = n;
        int c0 = 0;
        int c1 = 0;

        while (((c & 1) == 0) && (c != 0)) {
            c0++;
            c >>= 1;
        }

        while ((c & 1) == 1) {
            c1++;
            c >>= 1;
        }

        if (c0 + c1 == 31 || c0 + c1 == 0) {
            return -1;
        }

        int p = c0 + c1;

        n |= (1 << p);
        n &= ~((1 << p) - 1);
        n |= (1 << (c1 - 1)) - 1;

        return n;
    }

    /**
     * Calcula el siguiente menor numero con igual conteo de bits.
     * Complejidad Temporal: O(b)
     * Complejidad Espacial: O(1)
     */
    public static int getPrev(int n) {
        int temp = n;
        int c0 = 0;
        int c1 = 0;

        while ((temp & 1) == 1) {
            c1++;
            temp >>= 1;
        }

        if (temp == 0) return -1;

        while (((temp & 1) == 0) && (temp != 0)) {
            c0++;
            temp >>= 1;
        }

        int p = c0 + c1;
        n &= ((~0) << (p + 1));

        int mask = (1 << (c1 + 1)) - 1;
        n |= mask << (c0 - 1);

        return n;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(b)` | Evalua hasta 32 bits con desplazamientos de bits. |
| Espacio Auxiliar | `O(1)` | Variables locales en registros. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Truco de Gosper y Bitboards

1. **Motores de Ajedrez (Bitboards):** Generan posiciones de piezas con el mismo peso de Hamming para evaluar jugadas legales.
2. **Truco de Gosper (Gosper's Hack):** Itera sobre combinaciones de $\binom{N}{K}$ elementos en tiempo constante por elemento.

## Casos Límite y Robustez en Producción

1. **Números sin equivalente representable:** Retorna `-1`.
2. **Potencias de 2 ($n = 4 \to 0100$):** `getNext` retorna $8$, `getPrev` retorna $2$.
