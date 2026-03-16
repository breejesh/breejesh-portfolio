---
title: "Malloc: Implement Aligned Malloc and Free in C (CTCI 12.10)"
description: "CTCI problem 12.10: implement aligned_malloc and aligned_free in C for memory alignment requirements."
date: "2026-03-16"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-10-malloc.webp
previewImage: /assets/images/ctci-12-10-malloc.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 12.10 technical mechanics.
> * **The Approach:** CTCI problem 12.10: implement aligned_malloc and aligned_free in C for memory alignment requirements.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **12.10**.

## 1. Context and Problem Statement
CTCI problem 12.10: implement aligned_malloc and aligned_free in C for memory alignment requirements.

## 2. Technical Code & Mechanics

```java
void* aligned_malloc(size_t bytes, size_t alignment) {
    void* p1;
    void** p2;
    int offset = alignment - 1 + sizeof(void*);
    if ((p1 = (void*)malloc(bytes + offset)) == NULL) return NULL;
    p2 = (void**)(((size_t)(p1) + offset) & ~(alignment - 1));
    p2[-1] = p1;
    return p2;
}
void aligned_free(void* p) {
    free(((void**)p)[-1]);
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.