---
title: "Cuadrado Negro Máximo: DP de Conteos Derecha y Abajo para el Mayor Cuadrado Todo Negro (CTCI 17.23)"
description: "Encuentra el mayor subcuadrado formado enteramente por pixeles negros usando tablas DP de conteos derecha-abajo precomputadas con escaneo O(N^3) y verificacion O(1) por celda."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-17-23-max-black-square.webp
previewImage: /assets/images/ctci-17-23-max-black-square.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una matriz $N \times N$ de celdas negras y blancas, encuentra el mayor subcuadrado cuyos cuatro bordes estén formados enteramente por pixeles negros.
> * **La Solución Óptima:** **DP de Conteos Derecha+Abajo con Escaneo Decreciente**:
>   1. **Precomputar**: Para cada celda `(r, c)`, calcular `right[r][c]` = celdas negras consecutivas a la derecha, `down[r][c]` = celdas negras consecutivas hacia abajo.
>   2. **Escanear**: Para cada celda y tamano de cuadrado decreciente, verificar las cuatro esquinas con los arrays precomputados.
>   3. Tiempo: **$O(N^3)$** en el peor caso. Espacio: **$O(N^2)$** para las tablas DP.
> * **Realidad en Producción:** Deteccion de ROI en imagenes medicas y validacion de tiles en kernels GPU.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 17.23), se nos plantea:

*"Imagina una matriz cuadrada donde cada celda es negra o blanca. Diseña un algoritmo para encontrar el mayor subcuadrado cuyos cuatro bordes sean enteramente negros."*

## 2. Precomputo DP y Validación de Esquinas

Los arrays `right` y `down` permiten validar las cuatro esquinas de cualquier candidato en $O(1)$ sin recorrer el borde entero.

## Implementación de Producción

```java
public class MaxBlackSquare {

    static final int BLACK = 1, WHITE = 0;

    public static int[] findSquare(int[][] matrix) {
        int n = matrix.length;
        int[][] right = new int[n][n];
        int[][] down  = new int[n][n];

        for (int r = n - 1; r >= 0; r--) {
            for (int c = n - 1; c >= 0; c--) {
                if (matrix[r][c] == BLACK) {
                    right[r][c] = (c + 1 < n) ? right[r][c + 1] + 1 : 1;
                    down[r][c]  = (r + 1 < n) ? down[r + 1][c]  + 1 : 1;
                }
            }
        }

        for (int sz = n; sz >= 1; sz--) {
            for (int r = 0; r <= n - sz; r++) {
                for (int c = 0; c <= n - sz; c++) {
                    if (right[r][c] >= sz && down[r][c] >= sz
                            && down[r][c + sz - 1] >= sz
                            && right[r + sz - 1][c] >= sz) {
                        return new int[]{r, c, sz};
                    }
                }
            }
        }
        return null;
    }
}
```

## Análisis de Complejidad

| Fase | Complejidad Temporal | Espacio |
|---|---|---|
| Precomputo DP (right + down) | $O(N^2)$ | $O(N^2)$ |
| Escaneo de Cuadrados | $O(N^3)$ peor caso | $O(1)$ por verificacion |
| **Total** | **$O(N^3)$** | **$O(N^2)$** |

## Discusión de Ingeniería de Sistemas en Producción

1. **Deteccion de ROI Medico:** Identificacion de regiones homogeneas oscuras en MRI para segmentacion automatizada de lesiones.
2. **Validacion de Tiles GPU:** Verificacion de que los limites de tiles de compute caen dentro de regiones validas antes de lanzar grids CUDA/Metal.

## Casos Límite y Robustez

1. **Toda Blanca:** Retorna `null`.
2. **Celda Negra Unica:** Retorna `{r, c, 1}`.
