---
title: "Aligned Malloc: Custom Byte-Aligned Memory Allocator in C (CTCI 12.10)"
description: "Implement aligned_malloc and aligned_free in C to satisfy hardware cache-line and SIMD alignment constraints with pointer header storage in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-12-10-malloc.webp
previewImage: /assets/images/ctci-12-10-malloc.webp
---

> **TL;DR**
> * **The Book Problem:** Write an `aligned_malloc` and `aligned_free` function that takes the number of bytes and an alignment (a power of 2) and returns a pointer to memory whose address is a multiple of the alignment.
> * **The Optimal Solution:** **Padded Allocation with Hidden Pointer Header**: (1) Allocate `total = bytes + alignment - 1 + sizeof(void*)` using standard `malloc()`; (2) Calculate the aligned address by shifting past the header slot and applying bitmask: `aligned = (raw + sizeof(void*) + alignment - 1) & ~(alignment - 1)`; (3) Store the original `raw` address in the hidden pointer slot immediately preceding the aligned address: `((void**)aligned)[-1] = raw`; (4) Return `aligned`; (5) `aligned_free(p)`: Retrieve `raw = ((void**)p)[-1]` and invoke `free(raw)`; (6) Executes in **$O(1)$ time** with minimal byte overhead.
> * **Production Reality:** POSIX `posix_memalign()`, C11 `aligned_alloc()`, and AVX-512 / GPU direct memory alignment.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 12.10), we are asked:

*"Write an aligned malloc and free function in C that takes the requested size and alignment boundary (power of 2) and returns an aligned pointer."*

**Example:**
`aligned_malloc(1000, 128)` must return an address $P$ such that $P \pmod{128} == 0$, pointing to at least 1,000 contiguous bytes.

## 2. Memory Layout: Header Offset & Bitmasking

To free the block later, we must retain the original pointer returned by `malloc()`. We store this pointer directly in front of the returned address:

```
[Raw Malloc Block]
┌──────────────┬───────────────────┬──────────────────────────────────────────┐
│ Unused Bytes │ Raw Pointer Slot  │ Aligned Data Payload (Address % A == 0) │
│              │ ((void**)addr)[-1]│ (Requested Bytes)                        │
└──────────────┴───────────────────┴──────────────────────────────────────────┘
▲                                  ▲
raw                                aligned (Returned to caller)
```

### Alignment Bitmask Formula:
For any power-of-2 alignment $A$:
$$\text{aligned} = (\text{raw} + \text{sizeof(void*)} + A - 1) \ \& \ \sim(A - 1)$$

## Production Implementation

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

/**
 * Allocates byte-aligned memory.
 * Time Complexity: O(1)
 * Space Overhead: O(alignment + sizeof(void*))
 */
void* aligned_malloc(size_t bytes, size_t alignment) {
    // Alignment must be a power of 2
    if (alignment == 0 || (alignment & (alignment - 1)) != 0) {
        return NULL;
    }

    size_t header_size = sizeof(void*);
    size_t total_bytes = bytes + alignment - 1 + header_size;

    void* raw = malloc(total_bytes);
    if (!raw) return NULL;

    // Compute aligned pointer address
    uintptr_t raw_addr = (uintptr_t)raw + header_size;
    uintptr_t aligned_addr = (raw_addr + alignment - 1) & ~(alignment - 1);
    void* aligned_ptr = (void*)aligned_addr;

    // Store raw pointer immediately preceding aligned_ptr
    ((void**)aligned_ptr)[-1] = raw;

    return aligned_ptr;
}

/**
 * Frees memory allocated with aligned_malloc.
 */
void aligned_free(void* p) {
    if (!p) return;

    // Retrieve original raw malloc pointer stored in the hidden header
    void* raw = ((void**)p)[-1];
    free(raw);
}
```

## Complexity & Overhead Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Allocation Time | `O(1)` | Constant-time arithmetic bitmask and pointer assignment. |
| Deallocation Time | `O(1)` | Single pointer lookup and standard `free()` call. |
| Memory Padding | $\le A + 7\text{ Bytes}$ | Bounded by the alignment size $A$ on 64-bit platforms. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: SIMD Vectorization & Cache Lines

1. **AVX-512 & Neon Alignment:** Vector SIMD load instructions (`_mm512_load_si512`) require 64-byte aligned pointers; unaligned access incurs significant hardware bus penalties or CPU trap faults (`#GP`).
2. **Direct I/O (`O_DIRECT`):** Linux Direct I/O operations bypass the page cache and require memory buffers aligned to the physical 4,096-byte disk sector boundary.

## Edge Cases & Production Hardening

1. **Non-Power-of-Two Alignment:** Caught by bitwise power-of-two check `(A & (A - 1)) != 0`.
2. **Freeing Null Pointer:** Handled safely with immediate return.
