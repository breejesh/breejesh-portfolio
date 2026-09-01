---
title: "Cambio de Contexto: Medición de Latencia del Planificador del Kernel (CTCI 15.2)"
description: "Formula una metodologia empirica para medir la latencia del cambio de contexto en el SO mediante tuberias de ping-pong y afinidad de nucleos de CPU."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-15-2-context-switch.webp
previewImage: /assets/images/ctci-15-2-context-switch.webp
---

> **TL;DR**
> * **El Problema del Libro:** ¿Como medirias el tiempo consumido en un cambio de contexto (Context Switch)?
> * **La Solución Óptima:** **Paso de Token por Tuberías con Afinidad Forzada de CPU**:
>   1. **Fijación de CPU**: Vincular dos procesos ($P_1, P_2$) al **mismo núcleo físico de CPU** mediante `sched_setaffinity()` para evitar ejecucion en paralelo multithread.
>   2. **Transferencia Bloqueante**: Conectar $P_1$ y $P_2$ con dos pipes. $P_1$ envia 1 byte y se bloquea esperando respuesta; $P_2$ se desbloquea, lee, responde y se bloquea.
>   3. **Cambio de Contexto Forzado**: Cada lectura bloqueante obliga al planificador del kernel a alternar entre procesos (2 cambios de contexto por ciclo completo).
>   4. **Fórmula**: $T_{\text{cambio}} = \frac{T_{\text{total}} - T_{\text{base}}}{2 \times N}$.
> * **Realidad en Producción:** Herramientas `perf stat -e context-switches`, sondas eBPF (`sched_switch`) y aislamiento de nucleos en sistemas de trading (`isolcpus`).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 15.2), se nos plantea:

*"Describe un experimento reproducible para cuantificar con precision la latencia de un cambio de contexto en un sistema operativo moderno."*

## 2. Metodología Experimental

1. Asignar ambos procesos a un unico nucleo de CPU (CPU Core 0).
2. Forzar al planificador del sistema operativo a alternar la ejecucion de forma sincronica mediante llamadas de lectura bloqueantes en tuberias IPC.

## Implementación de Producción

```c
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sched.h>
#include <time.h>
#include <sys/wait.h>

#define ITERACIONES 100000

static inline long long obtener_nanos(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (long long)ts.tv_sec * 1000000000LL + ts.tv_nsec;
}

int main() {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(0, &cpuset);
    sched_setaffinity(0, sizeof(cpu_set_t), &cpuset);

    int p1_to_p2[2], p2_to_p1[2];
    pipe(p1_to_p2);
    pipe(p2_to_p1);

    char token = 'x';
    pid_t pid = fork();

    if (pid == 0) {
        for (int i = 0; i < ITERACIONES; i++) {
            read(p1_to_p2[0], &token, 1);
            write(p2_to_p1[1], &token, 1);
        }
        _exit(0);
    } else {
        long long inicio = obtener_nanos();
        for (int i = 0; i < ITERACIONES; i++) {
            write(p1_to_p2[1], &token, 1);
            read(p2_to_p1[0], &token, 1);
        }
        long long total = obtener_nanos() - inicio;
        wait(NULL);

        double latencia_promedio = (double)total / (2.0 * ITERACIONES);
        printf("Latencia Promedio por Cambio de Contexto: %.2f ns\n", latencia_promedio);
    }
    return 0;
}
```

## Comparativa de Latencias Típicas

| Tipo de Cambio | Latencia Típica | Causa Principal de Sobrecoste |
|---|---|---|
| **Entre Hilos (Mismo Proceso)** | $\approx 300\text{--}800\text{ ns}$ | Guardar registros y puntero de pila (Stack). |
| **Entre Procesos (Distinta Memoria)** | $\approx 1,2\text{--}2,5\ \mu\text{s}$ | Invalidation de cache TLB y recarga de tablas de paginas. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: eBPF y Núcleos Aislados

1. **Sondas eBPF (`sched:sched_switch`):** Permiten medir el cambio de contexto en produccion sin alterar el codigo de aplicacion.
2. **Aislamiento de CPU (`isolcpus`):** En motores bursatiles, se asignan hilos exclusivos a nucleos dedicados, reduciendo los cambios de contexto a cero.

## Casos Límite y Robustez en Producción

1. **Sesgo Multinúcleo:** Sin fijar la afinidad de CPU, los procesos corren en paralelo en nucleos distintos, falseando la medicion.
