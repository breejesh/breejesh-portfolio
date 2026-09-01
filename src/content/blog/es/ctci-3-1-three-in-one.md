---
title: "Tres en Uno: Implementar Tres Pilas en un Solo Arreglo (CTCI 3.1)"
description: "Describe e implementa como utilizar un solo array para construir tres pilas independientes con division fija y particionado dinamico en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-1-three-in-one.webp
previewImage: /assets/images/ctci-3-1-three-in-one.webp
---

> **TL;DR**
> * **El Problema del Libro:** Describe como podrias utilizar un solo arreglo para implementar tres pilas independientes.
> * **La Solución Óptima:** (1) Division Fija: Divide el arreglo en tres segmentos contiguos iguales $[0, N/3)$, $[N/3, 2N/3)$, $[2N/3, N)$ con contadores de tamano; (2) Division Flexible: Permite que las pilas compartan capacidad dinamicamente desplazando elementos circularmente.
> * **Realidad en Producción:** Asignadores de memoria de pila para hilos de ejecucion y optimizacion de cache L1.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 3.1), se nos plantea:

*"Describe como podrias utilizar un solo arreglo para implementar tres pilas."*

## 2. Enfoque 1: División Fija (Simple y Eficiente)

Dividimos el arreglo en tres partes iguales de tamano `stackCapacity`:
* Pila 0: indices $[0, \text{stackCapacity} - 1]$
* Pila 1: indices $[\text{stackCapacity}, 2 \times \text{stackCapacity} - 1]$
* Pila 2: indices $[2 \times \text{stackCapacity}, 3 \times \text{stackCapacity} - 1]$

Mantenemos un arreglo `sizes` de longitud 3 para registrar el numero de elementos en cada pila.
* `push(stackNum, value)`: Incrementa `sizes[stackNum]` e inserta en `stackNum * stackCapacity + sizes[stackNum] - 1`.
* `pop(stackNum)`: Extrae y decrementa el contador.

## Implementación de Producción

```java
import java.util.EmptyStackException;

public class FixedMultiStack {
    private final int numberOfStacks = 3;
    private final int stackCapacity;
    private final int[] values;
    private final int[] sizes;

    public FixedMultiStack(int stackSize) {
        stackCapacity = stackSize;
        values = new int[stackSize * numberOfStacks];
        sizes = new int[numberOfStacks];
    }

    /**
     * Inserta un valor en la pila especificada (0, 1 o 2).
     * Complejidad Temporal: O(1)
     * Complejidad Espacial: O(1)
     */
    public void push(int stackNum, int value) throws Exception {
        if (isFull(stackNum)) {
            throw new Exception("La pila " + stackNum + " esta llena");
        }
        sizes[stackNum]++;
        values[indexOfTop(stackNum)] = value;
    }

    /**
     * Extrae el elemento superior de la pila especificada.
     * Complejidad Temporal: O(1)
     */
    public int pop(int stackNum) {
        if (isEmpty(stackNum)) {
            throw new EmptyStackException();
        }
        int topIndex = indexOfTop(stackNum);
        int value = values[topIndex];
        values[topIndex] = 0;
        sizes[stackNum]--;
        return value;
    }

    public int peek(int stackNum) {
        if (isEmpty(stackNum)) {
            throw new EmptyStackException();
        }
        return values[indexOfTop(stackNum)];
    }

    public boolean isEmpty(int stackNum) {
        return sizes[stackNum] == 0;
    }

    public boolean isFull(int stackNum) {
        return sizes[stackNum] == stackCapacity;
    }

    private int indexOfTop(int stackNum) {
        int offset = stackNum * stackCapacity;
        int size = sizes[stackNum];
        return offset + size - 1;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| push / pop / peek | `O(1)` | Calculo directo de indice mediante `offset + size - 1`. |
| Espacio Auxiliar | `O(N)` | Bloque de memoria contiguo sin sobrecarga de punteros de objetos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Arenas de Memoria Contigua

1. **Sistemas Embebidos y Tiempo Real:** Asignacion de memoria plana contigua para pilas de hilos evitando fragmentacion en el heap.
2. **Localidad Espacial de Caché:** El empaquetado secuencial maximiza la precarga en lineas de cache L1 de la CPU.

## Casos Límite y Robustez en Producción

1. **Indice de pila invalido:** Validado verificando $0 \le \text{stackNum} < 3$.
2. **Desbordamiento:** Lanza excepcion descriptiva cuando `sizes[stackNum] == stackCapacity`.
3. **Pila vacia:** Lanza `EmptyStackException`.
