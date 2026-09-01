---
title: "La Masajista: Programación Dinámica No Adyacente con Memoria O(1) (CTCI 17.16)"
description: "Maximiza los minutos de citas aceptadas sin atender solicitudes consecutivas mediante programacion dinamica en tiempo lineal O(N) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-16-the-masseuse.webp
previewImage: /assets/images/ctci-17-16-the-masseuse.webp
---

> **TL;DR**
> * **El Problema del Libro:** Una masajista recibe una secuencia de solicitudes de citas y no puede aceptar dos citas consecutivas porque requiere descansos. Encuentra el maximo numero de minutos reservables.
> * **La Solución Óptima:** **Programación Dinámica No Adyacente (House Robber)**:
>   1. **Recurrencia**: Para cada cita $i$ con duracion $M[i]$:
>      $$\text{Mejor}[i] = \max(\text{Mejor}[i-1],\, \text{Mejor}[i-2] + M[i])$$
>   2. **Compresión de Estado**: Mantener solo dos variables enteras: `oneAway` ($i-1$) y `twoAway` ($i-2$).
>   3. Se ejecuta en **tiempo $O(N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Ciclos de trabajo y descanso en sensores IoT y gestion termica en servidores.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.16), se nos plantea:

*"Determina el conjunto no contiguo de citas que maximice el tiempo total de trabajo en tiempo O(N) y espacio constante."*

## 2. Reducción de Estado de Programación Dinámica

Dado que el calculo del optimo actual solo depende de los dos estados inmediatamente anteriores, el array de dimension $N$ se comprime en dos escalares.

## Implementación de Producción

```java
public class MasseuseSchedule {

    public static int maxMinutes(int[] massages) {
        if (massages == null || massages.length == 0) {
            return 0;
        }

        int oneAway = 0;
        int twoAway = 0;

        for (int m : massages) {
            int currentBest = Math.max(oneAway, twoAway + m);
            twoAway = oneAway;
            oneAway = currentBest;
        }

        return oneAway;
    }
}
```

## Análisis de Complejidad

| Estrategia | Complejidad Temporal | Espacio Auxiliar | Asignación de Arrays |
|---|---|---|---|
| **DP con Memoria $O(1)$** | **$O(N)$** | **$O(1)$** | **0 arrays** |
| **DP con Tabla Completa** | $O(N)$ | $O(N)$ | Array de longitud N |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Ciclos de Trabajo en Sensores IoT

1. **Gestión de Energía en Microcontroladores:** Los sensores ambientales deben intercalar transmisiones de radio con estados de reposo obligatorio.
2. **Enfriamiento de Servidores:** Algoritmos termicos programan tareas pesadas alternandolas con pausas de disipacion de calor.

## Casos Límite y Robustez en Producción

1. **Array Vacío:** Retorna 0 de forma segura.
2. **Una Sola Cita:** Retorna la duracion de dicha cita en $O(1)$.
