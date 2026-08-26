---
title: "Last K Lines: Print Last K Lines of File in C++ (CTCI 12.1)"
description: "CTCI problem 12.1 in C++: print the last K lines of a file using a circular array buffer for O(K) memory."
date: "2026-01-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-12-1-last-k-lines.webp
previewImage: /assets/images/ctci-12-1-last-k-lines.webp
---


> **TL;DR**
> * **The Problem:** CTCI problem 12.1 technical mechanics.
> * **The Approach:** CTCI problem 12.1 in C++: print the last K lines of a file using a circular array buffer for O(K) memory.
> * **Complexity:** Optimal Time and Memory bounds.

You walk into an interview and get handed problem **12.1**: print the last K lines of a file using a circular array buffer for O(K) memory. The naive solution is obvious, but production constraints demand optimal time and space. Here is the exact mental model, the code that works, and the traps that catch candidates off guard.

## 1. Context and Problem Statement
CTCI problem 12.1 in C++: print the last K lines of a file using a circular array buffer for O(K) memory.

## 2. Technical Code & Mechanics

```cpp
#include <iostream>
#include <fstream>
#include <string>

void printLastKLines(const char* fileName, int K) {
    std::ifstream file(fileName);
    std::string L[K];
    int size = 0;
    std::string line;
    while (std::getline(file, line)) {
        L[size % K] = line;
        size++;
    }
    int start = size > K ? (size % K) : 0;
    int count = std::min(K, size);
    for (int i = 0; i < count; i++) {
        std::cout << L[(start + i) % K] << std::endl;
    }
}
```

## 3. Key Takeaways and Edge Cases
Always test boundary conditions and invalid input states.