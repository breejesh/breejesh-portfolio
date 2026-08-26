---
title: "Smart Pointer: Building a Custom Reference Counting Pointer in C++ (CTCI 12.9)"
description: "CTCI problem 12.9: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation."
date: "2026-04-20"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-12-9-smart-pointer.webp
previewImage: /assets/images/ctci-12-9-smart-pointer.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 12.9 technical mechanics.
> * **The Approach:** CTCI problem 12.9: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **12.9**: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 12.9: implementing a custom SmartPointer class with ref count incrementing and automatic memory deallocation.

## 2. Technical Code & Mechanics

```cpp
template <typename T>
class SmartPointer {
    T* ref;
    unsigned* ref_count;
public:
    SmartPointer(T* ptr) : ref(ptr), ref_count(new unsigned(1)) {}
    ~SmartPointer() {
        if (--(*ref_count) == 0) {
            delete ref;
            delete ref_count;
        }
    }
};
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.