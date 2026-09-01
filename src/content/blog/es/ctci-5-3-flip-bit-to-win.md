---
title: "Invertir Bit para Ganar: Secuencia Más Larga de 1s con un Solo Cambio de Bit (CTCI 5.3)"
description: "Encuentra la longitud de la secuencia mas larga de 1s que puedes crear invirtiendo exactamente un bit 0 a 1 en tiempo O(b) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
previewImage: /assets/images/ctci-5-3-flip-bit-to-win.webp
---

> **TL;DR**
> * **El Problema del Libro:** Tienes un entero y puedes invertir exactamente un bit de 0 a 1. Escribe codigo para encontrar la longitud de la secuencia mas larga de 1s que puedes crear.
> * **La Solución Óptima:** Conteo de Longitud de Racha en Un Pase: Manten `currentLength` y `previousLength`. Al encontrar un `0`, si el siguiente bit es `1`, `previousLength = currentLength`; si es `0`, `previousLength = 0`. Actualiza $\text{maxLength} = \max(\text{maxLength}, \text{previousLength} + \text{currentLength} + 1)$ en tiempo $O(b)$ y espacio $O(1)$.
> * **Realidad en Producción:** Asignadores de memoria basados en mapas de bits y deteccion de secuencias continuas en protocolos TCP.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 5.3), se nos plantea:

*"Tienes un entero y puedes invertir exactamente un bit de 0 a 1. Escribe codigo para encontrar la longitud de la secuencia mas larga de 1s que podrias crear."*

**Ejemplo:**
* Entrada: `1775` (binario `11011101111_2`)
* Salida: `8` (invirtiendo el 0 en el indice 4).

## 2. Mecánica Algorítmica

En lugar de crear un arreglo para almacenar todas las rachas de bits:
1. Mantener `currentLength = 0`, `previousLength = 0`, `maxLength = 1`.
2. Inspeccionar el bit menos significativo (`a & 1`):
   * Si es `1`: `currentLength++`.
   * Si es `0`:
     * Si el siguiente bit (`a & 2`) tambien es 0, `previousLength = 0`.
     * Si no, `previousLength = currentLength`.
     * `currentLength = 0`.
3. Actualizar `maxLength = Math.max(previousLength + currentLength + 1, maxLength)`.
4. Desplazar a la derecha con `a >>>= 1`.

## Implementación de Producción

```java
public class FlipBitToWin {
    /**
     * Encuentra la secuencia maxima de 1s con un solo cambio de bit.
     * Complejidad Temporal: O(b) donde b es el numero de bits (<= 32 para int).
     * Complejidad Espacial: O(1)
     */
    public static int flipBit(int a) {
        if (~a == 0) return Integer.BYTES * 8;

        int currentLength = 0;
        int previousLength = 0;
        int maxLength = 1;

        while (a != 0) {
            if ((a & 1) == 1) {
                currentLength++;
            } else if ((a & 1) == 0) {
                previousLength = ((a & 2) == 0) ? 0 : currentLength;
                currentLength = 0;
            }
            maxLength = Math.max(previousLength + currentLength + 1, maxLength);
            a >>>= 1;
        }

        return maxLength;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(b)` | Inspecciona a lo sumo 32 bits mediante operaciones de registro. |
| Espacio Auxiliar | `O(1)` | Utiliza variables locales de tipo entero sin asignaciones dinamicas. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Mapas de Bits en Sistemas Operativos

1. **Asignación de Páginas de Memoria (Kernel Allocator):** Escanea mapas de bits de marcos de pagina buscando bloques contiguos contiguos disponibles.
2. **Compresión de Datos (LZ4):** Identifica secuencias continuas de bytes para optimizar la codificacion de diccionarios.

## Casos Límite y Robustez en Producción

1. **Todos 1s (`-1` / `0xFFFFFFFF`):** Retorna 32.
2. **Todos 0s (`0`):** Retorna 1.
