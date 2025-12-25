---
title: "Shallow vs Deep Copy: C++ Copy Constructors & Memory Safety (CTCI 12.5)"
description: "CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes."
date: "2025-12-25"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
previewImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 12.5 technical mechanics.
> * **The Approach:** CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes.
> * **Complexity:** Optimal Time and Memory bounds.

This article provides a clear breakdown of CTCI problem **12.5**.

## 1. Context and Problem Statement
CTCI problem 12.5: comparing pointer assignment vs memory allocation in copy constructors to prevent double-free crashes.

## 2. Technical Code & Mechanics

```java
class MyArray {
    int* data;
    int size;
public:
    MyArray(const MyArray& other) { // Deep copy
        size = other.size;
        data = new int[size];
        std::copy(other.data, other.data + size, data);
    }
};
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.