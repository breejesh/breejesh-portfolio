---
title: "Torres de Hanói: Movimiento Recursivo de Discos y Modelo de Pilas (CTCI 8.6)"
description: "Resuelve el rompecabezas de las Torres de Hanoi para N discos en 3 varillas usando pilas orientadas a objetos y recursion divide y venceras en tiempo O(2^N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
previewImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
---

> **TL;DR**
> * **El Problema del Libro:** En el problema clasico de las Torres de Hanoi, tienes 3 torres y $N$ discos de diferentes tamanos. Los discos estan ordenados de mayor a menor tamano. Solo puedes mover un disco a la vez y un disco mayor nunca puede colocarse sobre uno menor. Mueve todos los discos de la primera a la ultima torre.
> * **La Solución Óptima:** Descomposicion Recursiva de Torres: (1) Mover $n - 1$ discos del `Origen` al `Buffer` usando el `Destino` como auxiliar; (2) Mover el disco $n$ del `Origen` al `Destino`; (3) Mover los $n - 1$ discos del `Buffer` al `Destino` usando el `Origen` como auxiliar. Requiere exactamente $2^N - 1$ movimientos en tiempo $O(2^N)$ y espacio $O(N)$.
> * **Realidad en Producción:** Esquemas de rotacion de copias de seguridad jerarquicas (Grandfather-Father-Son).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 8.6), se nos plantea:

*"Mueve todos los discos de la primera torre a la ultima cumpliendo las reglas de Hanoi mediante estructuras de pilas orientadas a objetos."*

## 2. Descomposición Recursiva

Para mover $n$ discos de la Torre 1 a la Torre 3:
1. Mover los $n - 1$ discos superiores a la Torre 2.
2. Mover el disco $n$ a la Torre 3.
3. Mover los $n - 1$ discos de la Torre 2 a la Torre 3.

Recurrencia: $T(n) = 2T(n - 1) + 1 = 2^n - 1$.

## Implementación de Producción

```java
import java.util.Stack;

public class TowersOfHanoi {
    public static class Tower {
        private final Stack<Integer> disks = new Stack<>();
        private final int index;

        public Tower(int i) { this.index = i; }

        public void add(int d) {
            if (!disks.isEmpty() && disks.peek() <= d) {
                throw new IllegalStateException("Error al colocar disco " + d + " sobre " + disks.peek());
            }
            disks.push(d);
        }

        public void moveTopTo(Tower t) {
            int top = disks.pop();
            t.add(top);
        }

        public void moveDisks(int quantity, Tower destination, Tower buffer) {
            if (quantity <= 0) return;

            moveDisks(quantity - 1, buffer, destination);
            moveTopTo(destination);
            buffer.moveDisks(quantity - 1, destination, this);
        }

        public Stack<Integer> getDisks() { return disks; }
    }

    public static void solveHanoi(int n) {
        Tower[] towers = new Tower[3];
        for (int i = 0; i < 3; i++) {
            towers[i] = new Tower(i);
        }

        for (int i = n - 1; i >= 0; i--) {
            towers[0].add(i);
        }

        towers[0].moveDisks(n, towers[2], towers[1]);
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(2^N)` | Ejecuta exactamente $2^N - 1$ movimientos de disco. |
| Espacio Auxiliar | `O(N)` | Profundidad de llamadas y pilas acotadas a $N$ elementos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Rotación de Backups

1. **Rotación Jerárquica de Cintas (GFS):** La estrategia Abuelo-Padre-Hijo sigue exactamente los intervalos de las Torres de Hanoi para minimizar reescrituras de medios fisicos.
2. **Volcado de Registros en Compiladores:** Reordenamiento de pila para variables locales.

## Casos Límite y Robustez en Producción

1. **Validación de Invariante:** `Tower.add()` lanza excepcion si se intenta colocar un disco mayor sobre uno menor.
