---
title: "Mejor Línea: Máximo de Puntos Colineales mediante Hashing de Pendientes (CTCI 16.14)"
description: "Encuentra la recta 2D que cruza el maximo numero de puntos utilizando hashing de fracciones racionales simplificadas con MCD en tiempo O(N^2)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-16-14-best-line.webp
previewImage: /assets/images/ctci-16-14-best-line.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un plano 2D con un conjunto de puntos, encuentra la recta que pasa por la mayor cantidad de puntos.
> * **La Solución Óptima:** **Hashing de Pendientes Racionales Exactas**:
>   1. **El Riesgo del Punto Flotante**: Calcular la pendiente con `double` produce errores de redondeo IEEE 754 y colisiones de clave en tablas hash.
>   2. **Fracción Racional Simplificada**: Representar la pendiente como $\frac{\Delta y}{\Delta x}$ dividiendo ambos valores por su $\gcd(\Delta x, \Delta y)$ y normalizando el signo del denominador.
>   3. **Barrido por Ancla**: Para cada punto $P_i$, calcular las pendientes racionales hacia los demas puntos $P_j$ e indexarlas en un `HashMap<SlopeFraction, Integer>`.
>   4. Se ejecuta en **tiempo $O(N^2)$** y **espacio $O(N)$**.
> * **Realidad en Producción:** Transformada de Hough en OpenCV y ajuste RANSAC en nubes de puntos LiDAR.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 16.14), se nos plantea:

*"Identifica la recta que contiene el mayor numero de puntos colineales a partir de un conjunto de coordenadas bidimensionales."*

## 2. Hashing de Fracciones con MCD

Al simplificar $\frac{dy}{dx}$ mediante el maximo comun divisor, garantizamos que rectas colineales compartan exactamente la misma clave en la tabla hash.

## Implementación de Producción

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class BestLine {

    public static class Point {
        public final int x, y;
        public Point(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }

    public static class SlopeFraction {
        public final int dy, dx;

        public SlopeFraction(int dy, int dx) {
            if (dx == 0) {
                this.dy = 1; this.dx = 0;
            } else if (dy == 0) {
                this.dy = 0; this.dx = 1;
            } else {
                int g = gcd(Math.abs(dy), Math.abs(dx));
                int sign = (dx < 0) ? -1 : 1;
                this.dy = (dy / g) * sign;
                this.dx = (dx / g) * sign;
            }
        }

        private static int gcd(int a, int b) {
            while (b != 0) {
                int temp = b;
                b = a % b;
                a = temp;
            }
            return a;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SlopeFraction)) return false;
            SlopeFraction that = (SlopeFraction) o;
            return dy == that.dy && dx == that.dx;
        }

        @Override
        public int hashCode() {
            return Objects.hash(dy, dx);
        }
    }

    public static int findBestLine(Point[] points) {
        if (points == null || points.length == 0) return 0;
        if (points.length <= 2) return points.length;

        int maxCollinear = 0;

        for (int i = 0; i < points.length; i++) {
            Map<SlopeFraction, Integer> slopeCounts = new HashMap<>();
            int duplicates = 1;
            int localMax = 0;

            for (int j = i + 1; j < points.length; j++) {
                int dx = points[j].x - points[i].x;
                int dy = points[j].y - points[i].y;

                if (dx == 0 && dy == 0) {
                    duplicates++;
                    continue;
                }

                SlopeFraction slope = new SlopeFraction(dy, dx);
                int count = slopeCounts.getOrDefault(slope, 0) + 1;
                slopeCounts.put(slope, count);
                localMax = Math.max(localMax, count);
            }

            maxCollinear = Math.max(maxCollinear, localMax + duplicates);
        }

        return maxCollinear;
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N^2)` | $N(N-1)/2$ pares evaluados con calculo de MCD. |
| Espacio Auxiliar | `O(N)` | Mapa hash por cada iteracion de punto ancla. |
| Precision | `Exacta (100%)` | Fracciones enteras sin perdida de precision. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Visión Artificial y RANSAC

1. **Transformada de Hough:** OpenCV proyecta pixeles en el espacio de parametros $(\rho, \theta)$ para acumular votos de rectas en imagenes digitales.
2. **Algoritmo RANSAC:** En navegacion autonoma con millones de puntos LiDAR, RANSAC encuentra planos dominantes mediante muestreo aleatorio en tiempo sublineal.

## Casos Límite y Robustez en Producción

1. **Puntos Duplicados:** Contabilizados explicitamente en la variable `duplicates`.
