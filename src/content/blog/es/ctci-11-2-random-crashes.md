---
title: "Caídas Aleatorias: Diagnóstico de Fallos No Deterministas Monohilo (CTCI 11.2)"
description: "Diagnostica y aisla fallos y caidas no deterministas en aplicaciones monohilo en C mediante sanitizadores de memoria (ASan), analisis de ASLR y seguimiento de punteros."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-11-2-random-crashes.webp
previewImage: /assets/images/ctci-11-2-random-crashes.webp
---

> **TL;DR**
> * **El Problema del Libro:** Se te entrega el codigo fuente de una aplicacion que falla al ejecutarse. Tras correrla diez veces en un depurador, descubres que nunca cae en el mismo punto. La aplicacion es monohilo y solo usa la biblioteca estandar de C. ¿Que errores de programacion podrian causar esta caida y como probarias cada uno?
> * **Las Causas Raíz:** En sistemas monohilo, los fallos no deterministas se originan por: (1) **Punteros No Inicializados**: Lectura de direcciones basura en la pila afectadas por la aleatorizacion de memoria (ASLR); (2) **Corrupción del Heap y Desbordamiento de Buffer**: Sobrescritura de cabeceras de `malloc`; (3) **Punteros Colgantes (Use-After-Free)**: Uso de memoria liberada que es reutilizada por otras funciones; (4) **Aplastamiento de Pila (Stack Smashing)**: Corrupcion de direcciones de retorno; (5) **Retornos Nulos de Memoria**: Fallos no capturados de `malloc()` ante presiones de memoria del sistema operativo.
> * **Metodología de Depuración:** Compilar con AddressSanitizer (`-fsanitize=address,undefined`) y Valgrind `memcheck`.
> * **Realidad en Producción:** Depuracion de volcados de memoria (core dumps) en Linux y controladores embebidos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 11.2), se nos plantea:

*"Identifica las causas por las que un programa C monohilo cae en ubicaciones aleatorias en cada ejecucion y disena una estrategia de pruebas."*

## 2. Taxonomía de Causas de No Determinismo

| Categoría | Mecanismo del Defecto | Razón de la Variabilidad |
|---|---|---|
| **Punteros No Inicializados** | Desreferencia de punteros con basura de pila. | ASLR y marcos de pila variables alteran las direcciones basura en cada ejecucion. |
| **Uso tras Liberación (Use-After-Free)** | Acceso a memoria ya entregada con `free()`. | La caida solo ocurre cuando otra rutina reasigna y modifica ese bloque. |
| **Corrupción del Heap** | Desbordamiento de buffer que corrompe metadatos de `malloc`. | El fallo se manifiesta despues, durante otra llamada a `malloc()` o `free()`. |

## Implementación de Diagnóstico

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void safeMemoryAudit(void) {
    char *ptr = NULL;

    ptr = (char *)malloc(64);
    if (!ptr) {
        perror("Error de asignacion");
        return;
    }

    strncpy(ptr, "Texto Seguro", 63);
    ptr[63] = '\0';

    free(ptr);
    ptr = NULL; // Evita punteros colgantes
}
```

## Protocolo Sistemático de Diagnóstico

1. **AddressSanitizer (ASan):**
   ```bash
   gcc -fsanitize=address,undefined -g app.c -o app
   ./app
   ```
2. **Valgrind Memcheck:**
   ```bash
   valgrind --leak-check=full --track-origins=yes ./app
   ```
3. **Desactivación de ASLR:** Ejecutar con `setarch $(uname -m) -R ./app` para obtener volcados deterministas.

## Casos Límite y Robustez en Producción

1. **Verificación de Punteros Nulos:** Comprobar siempre el retorno de `malloc()` y `fopen()`.
2. **Análisis Estático:** Integrar herramientas como Clang-Tidy y Coverity en pipelines de integracion continua.
