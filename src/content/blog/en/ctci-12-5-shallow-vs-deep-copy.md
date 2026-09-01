---
title: "Shallow vs. Deep Copy: Memory Ownership and the Rule of Five in C++ (CTCI 12.5)"
description: "Differentiate shallow and deep copy semantics in C++, detailing pointer aliasing, double-free bugs, Rule of Three/Five, and RAII ownership."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
previewImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
---

> **TL;DR**
> * **The Book Problem:** What is the difference between deep copy and shallow copy? Explain how you would use each.
> * **The Optimal Solution:** **Pointer Aliasing vs Memory Cloning**: (1) **Shallow Copy**: Copies values byte-by-byte (memberwise copy). For raw pointers, copies the memory address only, causing multiple objects to share ownership of the same heap block (triggering corruption and double-free crashes upon destruction); (2) **Deep Copy**: Allocates a distinct new heap buffer and copies the underlying values, ensuring complete lifecycle independence; (3) **Rule of Three / Five**: Any C++ class managing raw heap resources must implement a custom Copy Constructor, Copy Assignment Operator, and Destructor (plus Move Constructor and Move Assignment).
> * **Production Reality:** Copy-On-Write (COW) string optimizations in OS virtual memory, DOM node cloning in browser rendering engines, and game object instantiation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 12.5), we are asked:

*"What is the difference between deep copy and shallow copy? Explain how you would use each, detailing memory ownership and resource safety."*

## 2. Memory Visualization: Shallow vs Deep Copy

```
[Shallow Copy]
Object A [ptr] ───┐
                  ▼
Object B [ptr] ───> [Heap Buffer: "Hello World"] (Shared pointer aliasing -> Double Free!)

[Deep Copy]
Object A [ptr] ───> [Heap Buffer 1: "Hello World"]
Object B [ptr] ───> [Heap Buffer 2: "Hello World"] (Distinct allocated memory)
```

## Production Implementation & Rule of Five

```cpp
#include <iostream>
#include <cstring>
#include <utility>

class DeepString {
private:
    char* data;
    size_t length;

public:
    // 1. Constructor
    DeepString(const char* str = "") {
        length = std::strlen(str);
        data = new char[length + 1];
        std::strcpy(data, str);
    }

    // 2. Destructor
    ~DeepString() {
        delete[] data;
    }

    // 3. Deep Copy Constructor
    DeepString(const DeepString& other) {
        length = other.length;
        data = new char[length + 1]; // Allocates distinct heap block
        std::strcpy(data, other.data);
    }

    // 4. Deep Copy Assignment Operator (Copy-and-Swap Idiom)
    DeepString& operator=(DeepString other) {
        swap(*this, other);
        return *this;
    }

    // 5. Move Constructor (C++11)
    DeepString(DeepString&& other) noexcept : data(nullptr), length(0) {
        swap(*this, other);
    }

    friend void swap(DeepString& first, DeepString& second) noexcept {
        using std::swap;
        swap(first.data, second.data);
        swap(first.length, second.length);
    }

    const char* c_str() const { return data; }
};
```

## Comparison Matrix & Use Cases

| Dimension | Shallow Copy | Deep Copy |
|---|---|---|
| **Mechanism** | Bitwise memory copy (`memcpy`). | Heap allocation + recursive value cloning. |
| **Speed** | Instantaneous ($O(1)$). | Proportional to buffer size ($O(N)$). |
| **Lifecycle Risk** | Dangling pointers & double-free crashes. | Completely isolated and safe. |
| **Best Used When** | Immutability, read-only views (`std::string_view`), reference counting (`std::shared_ptr`). | Classes managing exclusive resource ownership (`FILE*`, sockets, heap arrays). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Copy-On-Write (COW)

1. **Linux `fork()` Process Duplication:** The kernel performs an instantaneous shallow copy of page table entries marked read-only. A true deep copy is deferred until a process attempts to write to a page, triggering a page fault that duplicates that individual 4KB frame.
2. **Modern C++ Smart Pointers:** Using `std::unique_ptr` and `std::shared_ptr` eliminates raw manual deep copy bugs by enforcing RAII ownership rules.

## Edge Cases & Production Hardening

1. **Self-Assignment (`a = a`):** Naive copy assignment (`delete[] data; data = new char[...]`) deallocates source memory before copying. Handled safely via the Copy-and-Swap idiom.
2. **Exception Safety:** If `new char[...]` throws `std::bad_alloc`, state remains unmodified.
