---
title: "Dominós: Demostración del Tablero Mutilado con 31 Fichas (CTCI 6.3)"
description: "Demostracion matematica de la imposibilidad de cubrir un tablero de ajedrez de 8x8 sin esquinas opuestas con 31 fichas de domino mediante invariantes de color."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-3-dominos.webp
previewImage: /assets/images/ctci-6-3-dominos.webp
---

> **TL;DR**
> * **El Problema del Libro:** Hay un tablero de ajedrez de $8 \times 8$ en el que se han cortado dos esquinas diagonalmente opuestas. Tienes 31 fichas de domino, y una sola ficha cubre exactamente dos casillas adyacentes. ¿Puedes usar las 31 fichas para cubrir todo el tablero? Demuestra tu respuesta.
> * **La Solución Óptima:** **Demostración por Invariante Bipartito**: Un tablero completo tiene 32 casillas blancas y 32 negras. Las esquinas opuestas comparten el **mismo color** (ej. ambas blancas). Al quitarlas quedan 30 blancas y 32 negras. Como cada domino de $2 \times 1$ cubre obligatoriamente 1 casilla blanca y 1 negra, 31 fichas requieren 31 de cada color. Por tanto, es matematicamente **imposible**.
> * **Realidad en Producción:** Emparejamiento maximo en grafos bipartitos (Hopcroft-Karp) y pruebas de invariantes en distribucion de recursos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 6.3), se nos plantea:

*"Hay un tablero de 8x8 con dos esquinas opuestas eliminadas. Tienes 31 fichas de domino. ¿Es posible cubrir el tablero completo? Demuestra tu respuesta."*

## 2. Demostración por Invariante de Paridad

1. **Coloreado Bipartito:**
   * El tablero alterna casillas blancas y negras: 32 negras y 32 blancas.
2. **Paridad de las Esquinas Opuestas:**
   * La esquina $(0, 0)$ y la esquina $(7, 7)$ tienen la misma paridad $(r + c) \pmod 2$.
   * Cortar dos esquinas opuestas elimina **dos casillas del mismo color**.
3. **Casillas Restantes:** 30 de un color y 32 del otro.
4. **Propiedad del Dominó:** Cada ficha cubre exactamente 1 casilla blanca y 1 negra.
5. **Conclusión:** 31 fichas requieren 31 casillas blancas y 31 negras. Dado que $31 \ne 30$, cubrir el tablero es imposible.

## Implementación de Producción

```java
public class DominosChessboard {
    /**
     * Verifica si una configuracion de tablero con casillas eliminadas puede cubrirse con dominos.
     * Complejidad Temporal: O(1)
     * Complejidad Espacial: O(1)
     */
    public static boolean canTileMutilatedBoard(int rows, int cols, int removedR1, int removedC1,
                                                int removedR2, int removedC2) {
        int totalSquares = (rows * cols) - 2;
        if (totalSquares % 2 != 0) return false;

        int color1 = (removedR1 + removedC1) % 2;
        int color2 = (removedR2 + removedC2) % 2;

        return color1 != color2; // Posible si se quita 1 blanca y 1 negra
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Tiempo de Evaluación | `O(1)` | Comprobacion de paridad de coordenadas. |
| Espacio Auxiliar | `O(1)` | Sin uso de memoria dinamica. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Invariantes en Grafos Bipartitos

1. **Planificadores de Recursos (Kubernetes):** Utilizan invariantes de coloreado para verificar politicas de afinidad y detectar bloqueos de asignacion.
2. **Entrelazado de Bancos de Memoria DRAM:** Alterna lineas pares e impares para evitar cuellos de botella en el bus.

## Casos Límite y Robustez en Producción

1. **Eliminar 1 blanca y 1 negra:** El Teorema de Gomory demuestra que siempre existe un camino hamiltoniano que permite cubrir el tablero.
2. **Dimensiones impares ($7 \times 7$):** Total impar de casillas, imposible de cubrir.
