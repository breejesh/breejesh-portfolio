---
title: "Master Mind: Emparejamiento de Aciertos y Pseudo-Aciertos en Dos Pasadas (CTCI 16.15)"
description: "Calcula los aciertos exactos (Hits) y aciertos parciales (Pseudo-Hits) en el juego Master Mind mediante histogramas de frecuencias de colores en O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-15-master-mind.webp
previewImage: /assets/images/ctci-16-15-master-mind.webp
---

> **TL;DR**
> * **El Problema del Libro:** En Master Mind, la computadora oculta 4 bolas de colores: Rojo (`R`), Amarillo (`Y`), Verde (`G`) y Azul (`B`). Un "acierto" (hit) ocurre al acertar color y posicion. Un "pseudo-acierto" (pseudo-hit) ocurre cuando el color existe pero en una posicion no emparejada. Calcula los aciertos y pseudo-aciertos.
> * **La Solución Óptima:** **Histograma de Frecuencias en Dos Pasadas**:
>   1. **Pasada 1 (Aciertos)**: Recorrer las 4 posiciones. Si `guess[i] == solution[i]`, incrementar `hits++`. Si no coinciden, registrar las frecuencias de colores restantes.
>   2. **Pasada 2 (Pseudo-Aciertos)**: Para cada color $c$, sumar $\min(\text{frecuenciaSolucion}[c], \text{frecuenciaIntento}[c])$.
>   3. Se ejecuta en **tiempo $O(1)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Motores de juegos de palabras (Wordle) y alineamiento de secuencias de ADN.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.15), se nos plantea:

*"Calcula con precision la cantidad de aciertos totales y parciales para una jugada de Master Mind evitando duplicidades."*

## 2. Aislamiento en Dos Pasadas

La primera pasada procesa los aciertos exactos para evitar que una posicion ya resuelta compute falsamente como acierto parcial en la segunda pasada.

## Implementación de Producción

```java
public class MasterMind {

    public static class Result {
        public final int hits;
        public final int pseudoHits;

        public Result(int hits, int pseudoHits) {
            this.hits = hits;
            this.pseudoHits = pseudoHits;
        }
    }

    private static int code(char c) {
        switch (c) {
            case 'R': case 'r': return 0;
            case 'G': case 'g': return 1;
            case 'B': case 'b': return 2;
            case 'Y': case 'y': return 3;
            default: return -1;
        }
    }

    public static Result estimate(String guess, String solution) {
        if (guess == null || solution == null || guess.length() != solution.length()) {
            return new Result(0, 0);
        }

        int hits = 0;
        int[] solFreq = new int[4];
        int[] guessFreq = new int[4];

        for (int i = 0; i < guess.length(); i++) {
            char g = guess.charAt(i);
            char s = solution.charAt(i);

            if (g == s) {
                hits++;
            } else {
                int cg = code(g);
                int cs = code(s);
                if (cg >= 0) guessFreq[cg]++;
                if (cs >= 0) solFreq[cs]++;
            }
        }

        int pseudoHits = 0;
        for (int c = 0; c < 4; c++) {
            pseudoHits += Math.min(guessFreq[c], solFreq[c]);
        }

        return new Result(hits, pseudoHits);
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(1)` | Recorrido fijo de 4 posiciones. |
| Espacio Auxiliar | `O(1)` | Histogramas de 4 enteros. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores de Wordle

1. **Evaluación de Letras en Wordle:** Wordle resuelve las letras verdes (aciertos directos) antes que las amarillas (letras presentes pero descolocadas) utilizando exactamente este algoritmo de dos pasadas.
2. **Bioinformática:** Comparacion de nucleotidos en cadenas geneticas.

## Casos Límite y Robustez en Producción

1. **Letras Repetidas en el Intento:** Si la solucion es `"RGBY"` y el intento es `"RRRR"`, el resultado es `1 Hit, 0 Pseudo-Hits` sin contar de mas.
