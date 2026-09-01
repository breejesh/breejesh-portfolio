---
title: "Volumen del Histograma: Trampa de Agua con Dos Punteros en O(N) (CTCI 17.21)"
description: "Calcula el volumen total de agua atrapada entre barras de un histograma usando un barrido in-situ de dos punteros en tiempo O(N) y espacio O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-21-volume-of-histogram.webp
previewImage: /assets/images/ctci-17-21-volume-of-histogram.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dado un histograma representado por alturas de barras, calcula el volumen total de agua que puede retener si llueve.
> * **La Solución Óptima:** **Trampa de Agua con Dos Punteros In-Place**:
>   1. Inicializar `left=0`, `right=n-1`, `leftMax=0`, `rightMax=0`, `water=0`.
>   2. Si `height[left] <= height[right]`, el agua en `left` es `leftMax - height[left]`, avanza `left`. Si no, el agua en `right` es `rightMax - height[right]`, retrocede `right`.
>   3. Se ejecuta en **tiempo $O(N)$** y **espacio $O(1)$**.
> * **Realidad en Producción:** Simulacion de inundaciones en modelos digitales de elevacion y calculo de mascaras de cobertura en GPU.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.21), se nos plantea:

*"Imagina un histograma. Diseña un algoritmo para calcular el volumen de agua que retendría si alguien vertiera agua por arriba."*

## 2. Por Qué Funcionan los Dos Punteros

La clave: el agua retenida en cualquier barra es `min(max_izquierda, max_derecha) - altura_barra`. Dos punteros permiten calcular esto sin almacenar arreglos de maximos.

## Implementación de Producción

```java
public class VolumeOfHistogram {

    public static int computeHistogramVolume(int[] heights) {
        if (heights == null || heights.length < 3) return 0;

        int left = 0, right = heights.length - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;

        while (left < right) {
            if (heights[left] <= heights[right]) {
                leftMax = Math.max(leftMax, heights[left]);
                water += leftMax - heights[left];
                left++;
            } else {
                rightMax = Math.max(rightMax, heights[right]);
                water += rightMax - heights[right];
                right--;
            }
        }

        return water;
    }
}
```

## Análisis de Complejidad

| Enfoque | Complejidad Temporal | Espacio | Observaciones |
|---|---|---|---|
| **Dos Punteros** | **$O(N)$** | **$O(1)$** | **Optimo; un solo paso.** |
| Arrays Max Izquierda/Derecha | $O(N)$ | $O(N)$ | Logica mas clara, requiere dos arreglos auxiliares. |
| Fuerza Bruta | $O(N^2)$ | $O(1)$ | Para cada barra, explorar izquierda y derecha. |

## Discusión de Ingeniería de Sistemas en Producción

1. **Modelos Digitales de Elevacion (DEM):** Simulaciones de inundacion en SIG calculan la retencion de agua en cuencas mediante el mismo argumento de frontera min-max.
2. **Rasterizacion GPU:** Calculo de mascaras de cobertura de pixels para anti-aliasing del buffer de profundidad.

## Casos Límite y Robustez

1. **Array Monotono:** Produce `0` correctamente (el agua se escurre por un lado).
2. **Todos Ceros / Barra Unica:** Retorna `0`.
