---
title: "El Error: Subdesbordamiento de Enteros Sin Signo y Bucles Infinitos (CTCI 11.1)"
description: "Diagnostica y soluciona errores criticos de subdesbordamiento (underflow) y condiciones de terminacion de bucle en programacion de sistemas C/C++."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-11-1-mistake.webp
previewImage: /assets/images/ctci-11-1-mistake.webp
---

> **TL;DR**
> * **El Problema del Libro:** Encuentra los errores en el siguiente codigo: `unsigned int i; for (i = 100; i >= 0; --i) printf("%d\n", i);`
> * **Los Errores y Causas Raíz:** (1) **Subdesbordamiento en tipo Unsigned**: Un `unsigned int` es estrictamente no negativo ($i \ge 0$ es una tautologia y siempre es `true`). Al llegar a $i = 0$, el decremento `--i` produce un subdesbordamiento modular hacia `UINT_MAX` ($4.294.967.295$), creando un bucle infinito; (2) **Especificador de formato incorrecto**: `%d` espera un entero con signo; debe emplearse `%u`.
> * **La Solución Óptima:** Declarar `int i` (entero con signo) o modificar la condicion de salida.
> * **Realidad en Producción:** Vulnerabilidades criticas CVE en el kernel de Linux y desbordamientos en sistemas aeronauticos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 11.1), se nos pide diagnosticar el siguiente codigo en C:

```c
unsigned int i;
for (i = 100; i >= 0; --i)
    printf("%d\n", i);
```

## 2. Aritmética Modular en Enteros Sin Signo

En C/C++, la aritmetica de tipos sin signo opera en modulo $2^W$:
$$\text{Resultado} = (\text{valor}) \pmod{2^W}$$

Cuando $i = 0$:
$$0 - 1 \equiv 4.294.967.295\ (\text{UINT\_MAX})$$

Como $4.294.967.295 \ge 0$, la condicion `i >= 0` jamas se vuelve falsa.

## Implementación de Producción

```c
#include <stdio.h>

void printNumbersSigned(void) {
    for (int i = 100; i >= 0; --i) {
        printf("%d\n", i);
    }
}

void printNumbersUnsigned(void) {
    for (unsigned int i = 100; i > 0; --i) {
        printf("%u\n", i);
    }
    printf("%u\n", 0);
}
```

## Matriz de Defectos y Análisis Estático

| Defecto | Severidad | Consecuencia | Advertencia de Compilador |
|---|---|---|---|
| `unsigned int i >= 0` | Crítica | Bucle Infinito / Bloqueo de proceso. | `-Wtype-limits` (GCC / Clang). |
| `%d` para `unsigned int` | Moderada | Comportamiento indefinido para enteros grandes. | `-Wformat` (GCC / Clang). |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Vulnerabilidades por Underflow

1. **Kernel de Linux (CVE-2016-0728):** Desbordamiento de contadores de referencia de 32 bits que permitia escalada de privilegios locales.
2. **Generadores Eléctricos de Boeing 787:** Un contador de 32 bits sin signo desbordaba tras 248 dias continuos, obligando al reinicio del bus electrico.

## Casos Límite y Robustez en Producción

1. **Optimización del Compilador (`-O3`):** El compilador puede eliminar la verificacion y generar un salto infinito incondicional.
2. **Buenas Prácticas:** Habilitar `-Wall -Wextra -Werror` en pipelines de integracion continua.
