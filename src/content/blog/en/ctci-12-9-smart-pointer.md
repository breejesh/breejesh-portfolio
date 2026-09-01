---
title: "Smart Pointer: Reference-Counted Shared Ownership Implementation in C++ (CTCI 12.9)"
description: "Implement a reference-counting Smart Pointer template class from scratch in C++ managing automatic object destruction, copy semantics, and operator overloading."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-12-9-smart-pointer.webp
previewImage: /assets/images/ctci-12-9-smart-pointer.webp
---

> **TL;DR**
> * **The Book Problem:** Write a smart pointer class. A smart pointer is a data type, normally implemented with templates, that simulates a pointer while providing automatic garbage collection. It should maintain a reference count to determine whether or not to delete the object.
> * **The Optimal Solution:** **Template Reference-Counting Shared Pointer**: (1) Manage two pointers: raw pointer `T* ref` and a dynamically allocated shared counter `unsigned* ref_count`; (2) **Constructor**: Initialize `ref = ptr` and `ref_count = new unsigned(1)`; (3) **Copy Constructor**: Share pointer and counter addresses, incrementing `(*ref_count)++`; (4) **Copy Assignment**: Decrement existing reference counter (deallocating if count hits 0), then bind to the new object and increment its counter; (5) **Destructor**: Decrement `(*ref_count)--`; when it reaches 0, `delete ref` and `delete ref_count`; (6) Overload `operator*` and `operator->` for seamless raw pointer syntax.
> * **Production Reality:** Underlying mechanics of `std::shared_ptr` in C++11 and `boost::shared_ptr`.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 12.9), we are asked:

*"Write a reference-counting smart pointer class template in C++ providing automated memory reclamation and pointer operator overloading."*

## 2. Shared Reference Counting Architecture

Every clone of a `SmartPointer<T>` must share the exact same reference count integer. Therefore, the counter itself must reside on the heap:

```
SmartPointer A ──┐
                 ├──> [Heap Counter: ref_count = 2]
SmartPointer B ──┘
                 └──> [Managed Object: T (Heap Allocation)]
```

When either pointer is destroyed or reassigned, `*ref_count` decrements. When the last owner goes out of scope, both the managed object `T` and the counter integer are freed.

## Production Implementation

```cpp
#include <iostream>

template <typename T>
class SmartPointer {
private:
    T* ref;
    unsigned* ref_count;

    void remove() {
        if (!ref_count) return;

        (*ref_count)--;
        if (*ref_count == 0) {
            delete ref;
            delete ref_count;
            ref = nullptr;
            ref_count = nullptr;
        }
    }

public:
    // 1. Constructor from raw pointer
    explicit SmartPointer(T* ptr = nullptr) {
        ref = ptr;
        ref_count = new unsigned(1);
    }

    // 2. Copy Constructor
    SmartPointer(const SmartPointer<T>& sptr) {
        ref = sptr.ref;
        ref_count = sptr.ref_count;
        if (ref_count) {
            (*ref_count)++;
        }
    }

    // 3. Copy Assignment Operator
    SmartPointer<T>& operator=(const SmartPointer<T>& sptr) {
        if (this == &sptr) {
            return *this; // Self-assignment guard
        }

        // Decrement and clean up existing owned reference
        remove();

        ref = sptr.ref;
        ref_count = sptr.ref_count;
        if (ref_count) {
            (*ref_count)++;
        }
        return *this;
    }

    // 4. Destructor
    ~SmartPointer() {
        remove();
    }

    // 5. Operator Overloading for Pointer Semantics
    T& operator*() const {
        return *ref;
    }

    T* operator->() const {
        return ref;
    }

    T* get() const {
        return ref;
    }

    unsigned use_count() const {
        return ref_count ? *ref_count : 0;
    }
};
```

## Complexity & Memory Analysis

| Operation | Complexity | Technical Detail |
|---|---|---|
| Copy / Assignment | `O(1)` | Atomic counter increment / decrement. |
| Dereference (`*` / `->`) | `O(1)` | Direct raw pointer dereference with zero runtime penalty. |
| Memory Overhead | $2 \times \text{sizeof(void*)}$ | 16 bytes per smart pointer instance (raw pointer + counter pointer). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: `std::shared_ptr` and `std::make_shared`

1. **Combined Control Block (`std::make_shared`):** In `std::shared_ptr`, allocating the object and counter in two separate `new` calls causes memory fragmentation and two heap allocations. `std::make_shared<T>()` merges both into a single contiguous memory block.
2. **Circular Reference Memory Leaks:** Two `shared_ptr` instances pointing to each other prevent the reference count from ever reaching 0. Production code breaks cycles using `std::weak_ptr`.

## Edge Cases & Production Hardening

1. **Self-Assignment (`ptr = ptr`):** Handled safely by early `this == &sptr` reference check.
2. **Null Pointer Initialization:** Initializing with `nullptr` manages a valid counter of 1 without dereferencing faults.
