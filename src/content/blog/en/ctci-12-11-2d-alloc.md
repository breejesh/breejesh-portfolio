---
title: "2D Alloc: Dynamic 2D Array Allocation in C (CTCI 12.11)"
description: "CTCI problem 12.11 in C: allocate and free a 2D array dynamically with contiguous memory to optimize cache locality."
date: "2026-03-17"
tags: [Algorithms, Systems]
coverImage: /assets/images/ctci-12-11-2d-alloc.webp
previewImage: /assets/images/ctci-12-11-2d-alloc.webp
---

> **TL;DR**
> * **The Problem:** Allocate a dynamic 2D array in C that supports `array[row][col]` syntax with minimal memory fragmentation.
> * **The Insight:** Allocate both the row pointer array and the data buffer in a single contiguous block, pointing row pointers into consecutive row offsets.
> * **Complexity:** $O(1)$ Allocation and Deallocation calls with optimal $O(1)$ cache locality.

Allocating a 2D matrix in C using a loop of `malloc()` calls fragments memory across the heap. Each row ends up at an arbitrary heap address, destroying CPU cache spatial locality.

---

## 1. Fragmented vs Contiguous 2D Allocation

```c
// Method A: Fragmented (N+1 malloc calls, poor cache locality)
int** my2DAllocFragmented(int rows, int cols) {
    int** rowptr = (int**)malloc(rows * sizeof(int*));
    for (int i = 0; i < rows; i++) {
        rowptr[i] = (int*)malloc(cols * sizeof(int));
    }
    return rowptr;
}
```

```c
// Method B: Contiguous (1 malloc call, perfect cache locality)
int** my2DAllocContiguous(int rows, int cols) {
    int header = rows * sizeof(int*);
    int data = rows * cols * sizeof(int);
    int** rowptr = (int**)malloc(header + data);
    if (rowptr == NULL) return NULL;

    int* buf = (int*)(rowptr + rows);
    for (int i = 0; i < rows; i++) {
        rowptr[i] = buf + (i * cols);
    }
    return rowptr;
}

void my2DFree(int** rowptr) {
    free(rowptr); // Single free call handles the entire matrix
}
```

---

## 2. Comparison Table

| Metric | Fragmented Allocation | Contiguous Allocation |
| --- | --- | --- |
| **`malloc` Calls** | $N + 1$ | **1** |
| **`free` Calls** | $N + 1$ | **1** |
| **Cache Locality** | Random row addresses | Sequential linear buffer |
| **Memory Overhead** | Heap header for every row | Single heap block header |
