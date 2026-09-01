---
title: "Isla de Ojos Azules: Conocimiento Común y Razonamiento Inductivo (CTCI 6.6)"
description: "Resuelve el acertijo logico de la Isla de Ojos Azules mediante induccion matematica, logica epistemica y conocimiento comun en O(c) dias."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-6-blue-eyed-island.webp
previewImage: /assets/images/ctci-6-6-blue-eyed-island.webp
---

> **TL;DR**
> * **El Problema del Libro:** Un visitante anuncia en una isla: "Al menos una persona tiene ojos azules. Quien deduzca su color de ojos debe marcharse en el vuelo de las 8:00 PM". Todos ven los ojos de los demas pero no los propios. Si hay $c$ personas de ojos azules y todos son estrictamente logicos, ¿cuantos dias tardaran en irse?
> * **La Solución Óptima:** **Inducción Matemática**: (1) Si $c = 1$, la persona ve 0 ojos azules y se marcha el Dia 1; (2) Si $c = 2$, cada uno ve 1 persona y espera que se vaya el Dia 1. Al no irse nadie, ambos deducen que $c = 2$ y se van el Dia 2; (3) Por induccion, todas las $c$ personas de ojos azules se marchan el **Día $c$**.
> * **Realidad en Producción:** Protocolos de consenso bizantino (BFT) y conocimiento comun en criptografia multiparte.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 6.6), se nos plantea:

*"Un grupo de personas vive en una isla. Un visitante anuncia que al menos una persona tiene ojos azules. ¿Cuantos dias tardaran en marcharse las c personas de ojos azules si cada dia hay un vuelo a las 8:00 PM?"*

## 2. Lógica Epistémica: Conocimiento Mutuo vs. Conocimiento Común

El anuncio del visitante crea **conocimiento común** ("todos saben que todos saben que todos saben que hay ojos azules"), lo que permite que la cadena de deduccion inductiva comience.

## 3. Demostración por Inducción

1. **Caso Base $c = 1$:** La persona no ve ningun ojo azul en los demas $\implies$ deduce que es ella y se va el **Día 1**.
2. **Caso Base $c = 2$ ($A$ y $B$):** $A$ ve a $B$ con ojos azules. Si $A$ no fuera de ojos azules, $B$ se habria ido el Dia 1. Al ver que $B$ no se fue, $A$ concluye que el tambien tiene ojos azules. Ambos se van el **Día 2**.
3. **Paso Inductivo:** Para $c$ personas, todas deducen su condicion al ver que nadie se fue en el Dia $c - 1$, marchandose juntas en el **Día $c$**.

## Implementación de Producción

```java
public class BlueEyedIsland {
    /**
     * Calcula los dias hasta la partida de c personas de ojos azules.
     * Complejidad Temporal: O(1)
     * Complejidad Espacial: O(1)
     */
    public static int daysUntilDeparture(int blueEyedCount) {
        if (blueEyedCount <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0.");
        }
        return blueEyedCount;
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Tiempo de Deducción | `O(c)` | Requiere exactamente $c$ rondas de observacion sincronas. |
| Espacio Auxiliar | `O(1)` | Sin uso de memoria dinamica. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Consenso Epistémico

1. **Tolerancia a Fallas Bizantinas (BFT):** Los nodos requieren $f + 1$ rondas de intercambio de mensajes para convertir conocimiento local en estado global inmutable.
2. **Invalidación Síncrona de Caché:** Sincronizacion por epocas en clusters distribuidos.

## Casos Límite y Robustez en Producción

1. **$c = 1$:** Partida inmediata el primer dia.
2. **Población restante:** El resto de la poblacion deduce posteriormente su condicion tras la partida del grupo.
