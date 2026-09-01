---
title: "Rotate Matrix: In-Place 90-Degree 2D Array Rotation (CTCI 1.7)"
description: "How to rotate an N x N image matrix by 90 degrees clockwise in-place in O(N^2) time and O(1) auxiliary space using layer-by-layer ring swapping."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-1-7-rotate-matrix.webp
previewImage: /assets/images/ctci-1-7-rotate-matrix.webp
---

> **TL;DR**
> * **The Book Problem:** Given an image represented by an N x N matrix, where each pixel is 4 bytes, write a method to rotate the image by 90 degrees clockwise in-place.
> * **The Core Breakthrough:** Layer-by-Layer 4-Way Swap: Iterate from outermost layer to innermost. For each index, perform a 4-way circular swap between Top, Right, Bottom, and Left edges in $O(1)$ extra space.
> * **Production Reality:** GPU framebuffer transformation matrices, image processing pipelines, and spatial raster GIS maps.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 1.7), we are asked:

*"Given an image represented by an N x N matrix, where each pixel in the image is 4 bytes, write a method to rotate the image by 90 degrees in-place."*

## 2. The Layer-by-Layer In-Place Swapping Mechanics

Rotating an $N \times N$ matrix in-place without allocating a second matrix requires operating on concentric square rings (layers $0$ to $N/2$):
* Save top: `int top = matrix[first][i]`
* Move left $\to$ top: `matrix[first][i] = matrix[last - offset][first]`
* Move bottom $\to$ left: `matrix[last - offset][first] = matrix[last][last - offset]`
* Move right $\to$ bottom: `matrix[last][last - offset] = matrix[i][last]`
* Move top $\to$ right: `matrix[i][last] = top`

## Implémentation de production

```java
public class RotateMatrix {
    public static boolean rotate(int[][] matrix) {
        if (matrix == null || matrix.length == 0 || matrix.length != matrix[0].length) return false;

        int n = matrix.length;
        for (int layer = 0; layer < n / 2; layer++) {
            int first = layer;
            int last = n - 1 - layer;

            for (int i = first; i < last; i++) {
                int offset = i - first;
                int top = matrix[first][i]; // Save top

                // left -> top
                matrix[first][i] = matrix[last - offset][first];

                // bottom -> left
                matrix[last - offset][first] = matrix[last][last - offset];

                // right -> bottom
                matrix[last][last - offset] = matrix[i][last];

                // top -> right
                matrix[i][last] = top;
            }
        }
        return true;
    }
}
```

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| Time Complexity | `O(N^2)` | Every pixel in the N x N matrix is visited and swapped exactly once. |
| Auxiliary Space | `O(1)` | Strictly in-place modifying existing 2D array. |

## Analyse d'ingénierie système en production réelle

Graphics drivers and OpenGL pipelines apply transpose-and-reflect matrix operations on GPU VRAM framebuffers to orient screen display orientations with zero auxiliary allocations.

## Cas limites et durcissement en production

1. 1x1 matrix: Untouched in O(1).
2. Non-square matrix: Returns false (in-place 90 deg rotation requires N x N).
