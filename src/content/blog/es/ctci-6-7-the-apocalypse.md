---
title: "El Apocalipsis: Proporción de Género Bajo la Regla de Parada de Una Niña (CTCI 6.7)"
description: "Demostracion matematica y simulacion de Monte Carlo que explican por que la regla de parada de una nina mantiene una proporcion de genero exacta de 50:50."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-7-the-apocalypse.webp
previewImage: /assets/images/ctci-6-7-the-apocalypse.webp
---

> **TL;DR**
> * **El Problema del Libro:** En un mundo post-apocaliptico, la reina decreta que todas las familias deben seguir teniendo hijos hasta tener una nina, momento en el cual deben detenerse de inmediato. ¿Cual es la proporcion de genero de la nueva generacion?
> * **La Solución Óptima:** La proporcion se mantiene estrictamente en **50:50 (1:1)**. Cada nacimiento individual es un ensayo de Bernoulli independiente con $P(\text{nina}) = 0.5$. La regla de parada no altera la probabilidad de los nacimientos. El valor esperado de ninos por familia es $E[\text{ninos}] = \sum_{k=0}^{\infty} k(1/2)^{k+1} = 1.0$, igualando exactamente la nina por familia.
> * **Realidad en Producción:** Teorema de parada opcional en martingalas financieras y analisis de sesgos de parada en pruebas A/B.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 6.7), se nos plantea:

*"En un mundo post-apocaliptico, las familias deben seguir teniendo hijos hasta tener una nina y luego parar. ¿Cual sera la proporcion entre ninos y ninas en la nueva generacion?"*

## 2. Demostración Matemática

1. **Ensayos Independientes:** Cada bebe tiene una probabilidad independiente del 50% de ser nina. Decidir cuando una familia se detiene solo agrupa los nacimientos, no cambia la probabilidad individual de la moneda.
2. **Valor Esperado:**
   $$E[\text{ninos}] = 0 \cdot \frac{1}{2} + 1 \cdot \frac{1}{4} + 2 \cdot \frac{1}{8} + 3 \cdot \frac{1}{16} + \dots = 1.0$$
3. Como cada familia tiene exactamente 1 nina y un promedio esperado de 1 nino:
   $$\text{Proporción} = \frac{1}{1} = \mathbf{50\% \text{ Niñas}, 50\% \text{ Niños}}$$

## Implementación de Producción (Simulación Monte Carlo)

```java
import java.util.Random;

public class ApocalypseRatio {
    /**
     * Simula n familias para demostrar la convergencia al 50:50.
     * Complejidad Temporal: O(N)
     * Complejidad Espacial: O(1)
     */
    public static double runSimulation(int numFamilies) {
        int boys = 0;
        int girls = 0;
        Random random = new Random();

        for (int i = 0; i < numFamilies; i++) {
            while (true) {
                if (random.nextBoolean()) {
                    girls++;
                    break;
                } else {
                    boys++;
                }
            }
        }

        return (double) girls / (girls + boys);
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Tiempo de Análisis Teórico | `O(1)` | Proporcion constante 1:1. |
| Simulación Monte Carlo | `O(N)` | Lineal en funcion de las familias simuladas. |
| Espacio Auxiliar | `O(1)` | Variables acumuladoras en registros. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Teorema de Parada Opcional

1. **Modelos Cuantitativos Financieros:** El teorema de parada de martingalas demuestra que las estrategias de salida basadas en tiempo no alteran el valor esperado de procesos estocasticos justos.
2. **Pruebas A/B en Línea:** Explica por que detener una prueba A/B en cuanto alcanza significancia estadistica introduce sesgos si no se aplican correcciones secuenciales.

## Casos Límite y Robustez en Producción

1. **Variabilidad en Muestras Pequeñas:** Convergencia asintotica robusta conforme $N \ge 100,000$.
