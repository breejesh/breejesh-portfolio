---
title: "Asignación 2D: Asignación Continua de Matrices con un Solo Malloc en C (CTCI 12.11)"
description: "Reserva una matriz bidimensional contigua en C indexable mediante arr[i][j] usando una unica llamada a malloc para minimizar la fragmentacion del heap."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-11-2d-alloc.webp
previewImage: /assets/images/ctci-12-11-2d-alloc.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe una funcion en C llamada `my2DAlloc` que reserve un arreglo bidimensional. Minimiza el numero de llamadas a `malloc` y asegurate de que la memoria sea accesible mediante la notacion `arr[i][j]`.
> * **La Solución Óptima:** **Matriz Contigua con una Sola Asignación**: (1) La forma ingenua requiere $R + 1$ llamadas a `malloc()` (fragmentando la memoria y exigiendo un bucle para liberarla); (2) Reservamos toda la estructura en **1 sola llamada a malloc**: `total = rows * sizeof(int*) + rows * cols * sizeof(int)`; (3) Tratamos el inicio del bloque como el arreglo de punteros de fila `int** row_ptrs`; (4) Hacemos que cada puntero `row_ptrs[i]` apunte al desplazamiento de datos correspondiente: `(int*)(row_ptrs + rows) + i * cols`; (5) Permite la sintaxis clasica `arr[i][j]`; (6) Se libera con un unico `free(arr)`.
> * **Realidad en Producción:** Motores de procesamiento de imagenes, buffers de graficos y bibliotecas de algebra lineal (BLAS).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 12.11), se nos plantea:

*"Implementa una funcion en C para asignar una matriz 2D con sintaxis arr[i][j] minimizando las llamadas a malloc."*

## 2. Disposición Contigua en Memoria

Al combinar el arreglo de punteros de fila y el contenido de datos en un solo bloque continuo:
$$\text{Tamaño Total} = (\text{filas} \times \text{sizeof(int*)}) + (\text{filas} \times \text{columnas} \times \text{sizeof(int)})$$

## Implementación de Producción

```c
#include <stdio.h>
#include <stdlib.h>

int** my2DAlloc(int rows, int cols) {
    if (rows <= 0 || cols <= 0) return NULL;

    size_t header_size = rows * sizeof(int*);
    size_t data_size = (size_t)rows * cols * sizeof(int);

    int** row_ptrs = (int**)malloc(header_size + data_size);
    if (!row_ptrs) return NULL;

    int* data_start = (int*)(row_ptrs + rows);

    for (int i = 0; i < rows; i++) {
        row_ptrs[i] = data_start + (i * cols);
    }

    return row_ptrs;
}

void my2DFree(int** arr) {
    free(arr); // Una sola llamada libera toda la matriz
}
```

## Comparación Estructural

| Métrica | Multi-Malloc Ingenuo ($R + 1$ Llamadas) | Malloc Único Óptimo (1 Llamada) |
|---|---|---|
| **Llamadas a Heap** | $R + 1$ asignaciones | **Exactamente 1 asignación** |
| **Localidad de Caché** | Fragmentos dispersos en heap | **Bloque continuo L1/L2 prefetching** |
| **Liberación** | Bucle de $R$ llamadas a `free()` | **Un solo `free(arr)`** |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Optimización para GPU (DMA)

1. **Transferencias Directas DMA:** Al ser un bloque de memoria contiguo, la matriz se transfiere a memoria de video VRAM con una sola llamada de alta velocidad (`cudaMemcpy2D`).
2. **Multiplicación de Matrices (BLAS):** Evita fallos de linea de cache en algoritmos de algebra lineal.

## Casos Límite y Robustez en Producción

1. **Dimensiones Inválidas:** Retorna `NULL` de inmediato ante valores $\le 0$.
