---
title: "Malloc Alineado: Asignador de Memoria con Alineación de Bytes en C (CTCI 12.10)"
description: "Implementa aligned_malloc y aligned_free en C para satisfacer restricciones de alineacion de hardware y SIMD con almacenamiento de cabecera en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-10-malloc.webp
previewImage: /assets/images/ctci-12-10-malloc.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe una funcion `aligned_malloc` y `aligned_free` que tome el numero de bytes y una alineacion (potencia de 2) y retorne un puntero a una direccion multiplo de dicha alineacion.
> * **La Solución Óptima:** **Asignación con Relleno y Cabecera de Puntero Oculta**: (1) Asigna `total = bytes + alineacion - 1 + sizeof(void*)` mediante `malloc()`; (2) Calcula la direccion alineada aplicando una mascara de bits: `aligned = (raw + sizeof(void*) + alineacion - 1) & ~(alineacion - 1)`; (3) Guarda la direccion `raw` original en el espacio anterior al puntero alineado: `((void**)aligned)[-1] = raw`; (4) Retorna `aligned`; (5) `aligned_free(p)`: Recupera `raw = ((void**)p)[-1]` y llama a `free(raw)`; (6) Se ejecuta en **tiempo $O(1)$**.
> * **Realidad en Producción:** `posix_memalign()`, `aligned_alloc()` de C11 e instrucciones vectoriales AVX-512.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 12.10), se nos plantea:

*"Implementa funciones en C para reservar y liberar memoria alineada a potencias de 2 (aligned_malloc y aligned_free)."*

## 2. Disposición en Memoria y Máscara de Bits

Para poder liberar la memoria posteriormente con `free()`, debemos registrar el puntero original inmediatamente antes de la direccion alineada:

$$\text{alineada} = (\text{raw} + \text{sizeof(void*)} + A - 1) \ \& \ \sim(A - 1)$$

## Implementación de Producción

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

void* aligned_malloc(size_t bytes, size_t alignment) {
    if (alignment == 0 || (alignment & (alignment - 1)) != 0) {
        return NULL;
    }

    size_t header_size = sizeof(void*);
    size_t total_bytes = bytes + alignment - 1 + header_size;

    void* raw = malloc(total_bytes);
    if (!raw) return NULL;

    uintptr_t raw_addr = (uintptr_t)raw + header_size;
    uintptr_t aligned_addr = (raw_addr + alignment - 1) & ~(alignment - 1);
    void* aligned_ptr = (void*)aligned_addr;

    ((void**)aligned_ptr)[-1] = raw;

    return aligned_ptr;
}

void aligned_free(void* p) {
    if (!p) return;
    void* raw = ((void**)p)[-1];
    free(raw);
}
```

## Análisis de Complejidad y Sobrecoste

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Tiempo de Asignación | `O(1)` | Operaciones de mascara de bits en tiempo constante. |
| Tiempo de Liberación | `O(1)` | Lectura del puntero crudo en cabecera y llamada a `free()`. |
| Sobrecoste de Memoria | $\le A + 7\text{ Bytes}$ | Limitado por la alineación requerida $A$. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Vectorización SIMD

1. **Instrucciones AVX-512:** Cargar registros vectoriales (`_mm512_load_si512`) requiere alineacion estricta a 64 bytes para evitar penalizaciones de bus de datos.
2. **Entrada/Salida Directa (Linux Direct I/O):** Búfers alineados a sectores de 4.096 bytes para omitir la cache de paginas.

## Casos Límite y Robustez en Producción

1. **Alineación Inválida:** Validada con `(alignment & (alignment - 1)) != 0`.
2. **Puntero Nulo:** Retorno inmediato sin fallo de segmentacion.
