---
title: "2D Alloc: Single-Malloc Contiguous Matrix Allocation in C (CTCI 12.11)"
description: "Allocate a contiguous two-dimensional array in C supporting arr[i][j] indexing using a single malloc call to minimize heap fragmentation in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-12-11-2d-alloc.webp
previewImage: /assets/images/ctci-12-11-2d-alloc.webp
---

> **TL;DR**
> * **The Book Problem:** Write a function in C called `my2DAlloc` which allocates a two-dimensional array. Minimize the number of calls to `malloc` and make sure that the memory is accessible by the notation `arr[i][j]`.
> * **The Optimal Solution:** **Single-Allocation Contiguous 2D Matrix**: (1) Naive allocation requires $R + 1$ separate `malloc()` calls (fragmenting memory and requiring looping deallocations); (2) Allocate the entire structure in **1 single malloc call**: `total = rows * sizeof(int*) + rows * cols * sizeof(int)`; (3) Cast the head of the buffer to an array of row pointers `int** row_ptrs`; (4) Point each row pointer `row_ptrs[i]` to its contiguous payload offset: `(int*)(row_ptrs + rows) + i * cols`; (5) Enables native `arr[i][j]` array indexing; (6) Deallocates cleanly via a single `free(arr)` call.
> * **Production Reality:** High-performance BLAS/LAPACK matrix buffers, 2D game rendering framebuffers, and image processing kernels.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 12.11), we are asked:

*"Write a function in C called my2DAlloc which allocates a two-dimensional array. Minimize the number of calls to malloc and make sure that the memory is accessible by the notation arr[i][j]."*

## 2. Memory Layout: Header Pointers + Contiguous Payload

```
[Single Contiguous Malloc Block]
┌─────────────────────────────┬───────────────────────────────────────────────┐
│ Row Pointer Array           │ Contiguous 2D Matrix Data Payload             │
│ row_ptrs[0] ──> Offset 0    │ Row 0 Data: [0,0] [0,1] ... [0, cols-1]       │
│ row_ptrs[1] ──> Offset cols │ Row 1 Data: [1,0] [1,1] ... [1, cols-1]       │
│ ...                         │ ...                                           │
│ row_ptrs[R-1]               │ Row R-1 Data: [R-1, 0] ... [R-1, cols-1]      │
└─────────────────────────────┴───────────────────────────────────────────────┘
```

## Production Implementation

```c
#include <stdio.h>
#include <stdlib.h>

/**
 * Allocates a 2D integer matrix in a single contiguous malloc call.
 * Time Complexity: O(rows) initialization
 * Space Complexity: O(rows * cols)
 */
int** my2DAlloc(int rows, int cols) {
    if (rows <= 0 || cols <= 0) return NULL;

    size_t header_size = rows * sizeof(int*);
    size_t data_size = (size_t)rows * cols * sizeof(int);

    // Single malloc allocating both row pointer array and data payload
    int** row_ptrs = (int**)malloc(header_size + data_size);
    if (!row_ptrs) return NULL;

    // Data payload begins immediately after the row pointer array
    int* data_start = (int*)(row_ptrs + rows);

    // Initialize row pointers to their respective offsets
    for (int i = 0; i < rows; i++) {
        row_ptrs[i] = data_start + (i * cols);
    }

    return row_ptrs;
}

/**
 * Frees the entire 2D matrix in a single call.
 */
void my2DFree(int** arr) {
    // Because memory was allocated in a single malloc, one free cleans all
    free(arr);
}
```

## Structural Comparison: Naive ($R+1$ calls) vs Single Malloc

| Factor | Naive Multi-Malloc ($R + 1$ Calls) | Optimal Single Malloc (1 Call) |
|---|---|---|
| **Heap Allocations** | $R + 1$ discrete allocations | **Exactly 1 allocation** |
| **Heap Overhead** | $R + 1$ malloc headers ($16\text{B} \times (R+1)$) | **1 malloc header (16B)** |
| **Memory Locality** | Random heap fragments (Cache misses) | **Contiguous L1/L2 cache prefetching** |
| **Deallocation** | Loop over $R$ rows calling `free()`, then `free(arr)` | **Single `free(arr)`** |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Cache-Friendly Matrix Operations

1. **Hardware Cache Line Prefetching:** Because all rows reside in a single contiguous memory strip, sequential matrix multiplication ($C_{ij} = \sum A_{ik} B_{kj}$) avoids CPU cache thrashing.
2. **GPU Direct Memory Access (DMA):** Contiguous 2D buffers can be transferred to GPU VRAM via `cudaMemcpy2D` in a single high-speed DMA burst without staging buffers.

## Edge Cases & Production Hardening

1. **Integer Overflow on `rows * cols`:** Use `size_t` multiplication with overflow bounds checking to prevent integer wrap security vulnerabilities.
2. **Zero or Negative Dimensions:** Guard clause returns `NULL` cleanly.
