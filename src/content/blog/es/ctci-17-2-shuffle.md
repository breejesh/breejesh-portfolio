---
title: "Barajado de Cartas: Permutación Uniforme con el Algoritmo Fisher-Yates (CTCI 17.2)"
description: "Genera una permutacion perfectamente uniforme de una baraja de 52 cartas con probabilidad 1/52! mediante el algoritmo Fisher-Yates (Knuth) en tiempo O(N)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-2-shuffle.webp
previewImage: /assets/images/ctci-17-2-shuffle.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe un metodo para barajar un mazo de 52 cartas garantizando que cada una de las $52!$ permutaciones tenga exactamente la misma probabilidad.
> * **La Solución Óptima:** **Algoritmo de Fisher-Yates (Knuth)**:
>   1. Recorrer el array en orden inverso desde $i = N - 1$ hasta $1$.
>   2. En cada iteracion, generar un indice aleatorio uniforme $k \in [0, i]$.
>   3. Intercambiar `cartas[i]` con `cartas[k]`.
>   4. **El Error Clásico**: Elegir $k \in [0, N-1]$ en cada paso genera $N^N$ resultados. Como $N^N$ no es divisible por $N!$, introduce un fuerte sesgo estadistico.
>   5. Se ejecuta en **tiempo $O(N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Barajado de minilotes en PyTorch (`DataLoader`) y generadores aleatorios en plataformas de juego en linea.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.2), se nos plantea:

*"Baraja un array de elementos de forma que todas las N! permutaciones sean equiprobables con probabilidad exacta 1/N!."*

## 2. Demostración de Uniformidad

En cada paso $i$, la probabilidad acumulada de que cualquier elemento termine en la posicion $i$ es estrictamente $\frac{1}{N}$, resultando en $\prod_{i=1}^N \frac{1}{i} = \frac{1}{N!}$.

## Implementación de Producción

```java
import java.util.Random;

public class DeckShuffler {

    private static final Random RNG = new Random();

    public static void shuffleArray(int[] cards) {
        if (cards == null || cards.length <= 1) return;

        for (int i = cards.length - 1; i > 0; i--) {
            int k = RNG.nextInt(i + 1); // Rango [0, i]
            int temp = cards[i];
            cards[i] = cards[k];
            cards[k] = temp;
        }
    }
}
```

## Análisis de Complejidad

| Algoritmo | Complejidad Temporal | Espacio Auxiliar | Uniformidad Estadística |
|---|---|---|---|
| **Fisher-Yates** | **$O(N)$** | **$O(1)$** | **Exacta $1/N!$ (Perfecta)** |
| **Swap Ingenuo ($k \in [0, N-1]$)** | $O(N)$ | $O(1)$ | **Sesgada ($N^N \nmid N!$)** |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Aprendizaje Profundo y Casinos en Línea

1. **PyTorch DataLoader:** Las redes neuronales barajan los conjuntos de entrenamiento al inicio de cada epoca mediante Fisher-Yates para evitar sesgos en el descenso de gradiente.
2. **Seguridad Criptográfica:** Empleo de `SecureRandom` en plataformas de juego para impedir la prediccion de cartas.

## Casos Límite y Robustez en Producción

1. **Arrays de Longitud $\le 1$:** Retorna inmediatamente sin modificaciones.
