---
title: "Reverse String: In-Place C-Style Null-Terminated String Reverse (CTCI 12.2)"
description: "CTCI problem 12.2 in C++: reverse a null-terminated C-style string in-place using pointer arithmetic."
date: "2025-08-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-2-reverse-string.webp
previewImage: /assets/images/ctci-12-2-reverse-string.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 12.2 technical mechanics.
> * **The Approach:** CTCI problem 12.2 in C++: reverse a null-terminated C-style string in-place using pointer arithmetic.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **12.2**.

## 1. Context and Problem Statement
CTCI problem 12.2 in C++: reverse a null-terminated C-style string in-place using pointer arithmetic.

## 2. Technical Code & Mechanics

```java
void reverse(char* str) {
    char* end = str;
    char tmp;
    if (str) {
        while (*end) { ++end; }
        --end;
        while (str < end) {
            tmp = *str;
            *str++ = *end;
            *end-- = tmp;
        }
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.