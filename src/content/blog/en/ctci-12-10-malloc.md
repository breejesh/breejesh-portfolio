---
title: "Malloc: Implement Aligned Malloc and Free in C (CTCI 12.10)"
description: "CTCI problem 12.10 in C: implement aligned_malloc and aligned_free to meet hardware memory alignment constraints."
date: "2026-03-16"
tags: [Algorithms, Systems]
coverImage: /assets/images/ctci-12-10-malloc.webp
previewImage: /assets/images/ctci-12-10-malloc.webp
---

> **TL;DR**
> * **The Problem:** Allocate a block of memory whose starting address is an exact multiple of a given power of two, while retaining the ability to safely free the original block.
> * **The Insight:** Allocate extra padding plus pointer storage space, round the returned address up to the nearest alignment boundary, and store the original heap pointer immediately preceding the aligned address.
> * **Complexity:** $O(1)$ Time for allocation and release, minimal $O(	ext{alignment})$ constant memory padding.

Hardware architectures frequently require memory addresses to be aligned to cache line boundaries (e.g. 16, 32, or 64 bytes) for SIMD vector instructions and DMA transfers. A standard `malloc()` call guarantees natural alignment for primitive types, but not custom power-of-two alignments.

The tricky part of `aligned_malloc` is not computing the aligned address; it is saving the original unaligned pointer so `aligned_free` can pass it back to the standard C heap allocator.

---

## 1. Memory Layout Strategy

```
[ Unaligned Pointer p1 ] ... [ Stored p1 Pointer (p2[-1]) ] | [ Aligned Pointer p2 Returned to Caller ]
<------------------- Extra Offset Padding ----------------->
```

1. Request `bytes + alignment - 1 + sizeof(void*)` bytes from standard `malloc`.
2. Compute the aligned address `p2` by rounding up.
3. Store the original `p1` pointer at `p2[-1]`.
4. Return `p2` to the user.

---

## 2. Complete C Implementation

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

void* aligned_malloc(size_t bytes, size_t alignment) {
    // Alignment must be a power of two
    if (alignment == 0 || (alignment & (alignment - 1)) != 0) {
        return NULL;
    }

    void* p1; // Original pointer returned by system malloc
    void** p2; // Aligned pointer returned to caller
    size_t offset = alignment - 1 + sizeof(void*);

    if ((p1 = (void*)malloc(bytes + offset)) == NULL) {
        return NULL;
    }

    // Round up address and leave space for storing p1
    size_t raw_address = (size_t)p1 + sizeof(void*);
    size_t aligned_address = (raw_address + (alignment - 1)) & ~(alignment - 1);

    p2 = (void**)aligned_address;
    p2[-1] = p1; // Store original pointer immediately before aligned block

    return (void*)p2;
}

void aligned_free(void* p) {
    if (p == NULL) {
        return;
    }
    // Retrieve the original unaligned pointer stored just before the aligned address
    void* original_p1 = ((void**)p)[-1];
    free(original_p1);
}
```

---

## 3. Complexity & Boundary Analysis

| Metric | Measure | Details |
| --- | --- | --- |
| **Allocation Time** | $O(1)$ | Single `malloc` plus bitwise masking |
| **Free Time** | $O(1)$ | Single pointer indirection and `free` |
| **Memory Overhead** | $\le 	ext{alignment} + 	ext{sizeof(void*)}$ | Overhead strictly bounded by alignment size |
