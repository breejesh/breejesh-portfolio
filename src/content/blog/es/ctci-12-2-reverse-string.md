---
title: "Invertir Cadena: Inversión In-Place de Cadenas C con Dos Punteros (CTCI 12.2)"
description: "Invierte una cadena de caracteres terminada en nulo in-place en C/C++ usando aritmetica de punteros en tiempo O(N) y espacio O(1) sin reservar memoria."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-2-reverse-string.webp
previewImage: /assets/images/ctci-12-2-reverse-string.webp
---

> **TL;DR**
> * **El Problema del Libro:** Implementa una funcion `void reverse(char* str)` en C o C++ que invierta una cadena de texto terminada en nulo in-place.
> * **La Solución Óptima:** **Aritmética de Dos Punteros**: (1) Verificar puntero `NULL`; (2) Avanzar el puntero `end` hasta el terminador nulo `'\0'`, y retroceder una posicion `end--`; (3) Inicializar `start = str`; (4) Mientras `start < end`, intercambiar `*start` con `*end`, avanzar `start++` y retroceder `end--`; (5) Se ejecuta en **tiempo $O(N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Manipulacion de paquetes de red y conversion de endianness.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 12.2), se nos plantea:

*"Implementa una funcion en C/C++ para invertir una cadena de caracteres terminada en nulo in-place."*

## 2. Aritmética de Punteros In-Place

Una cadena en C se almacena en memoria contigua finalizada por `'\0'`:
```
['h', 'o', 'l', 'a', '\0']
  ▲             ▲
start          end
```

Alcanzar `\0`, retroceder un byte e intercambiar los caracteres hacia el centro invierte la cadena sin buffers auxiliares.

## Implementación de Producción

```c
#include <stdio.h>

void reverse(char* str) {
    if (!str) return;

    char* end = str;
    char temp;

    while (*end) {
        end++;
    }
    end--;

    char* start = str;
    while (start < end) {
        temp = *start;
        *start = *end;
        *end = temp;

        start++;
        end--;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | $N$ pasos para hallar `\0` mas $N / 2$ intercambios de bytes. |
| Espacio Auxiliar | `O(1)` | Punteros de registro en memoria fija. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Memoria Solo de Lectura

1. **Literales de Cadena vs Arreglos:** Llamar a `reverse("hola")` causa un fallo de segmentacion (`SIGSEGV`) debido a que los literales residen en el segmento `.rodata`. La cadena debe ser mutable (`char str[] = "hola";`).
2. **Reversión de Bytes de Red:** Reordenamiento de tramas de red entre arquitecturas Little-Endian y Big-Endian.

## Casos Límite y Robustez en Producción

1. **Puntero Nulo (`str == NULL`):** Protegido por clausula de guardia.
2. **Cadena Vacía (`""`):** `end--` hace que `end < start`, sin ejecucion del bucle.
