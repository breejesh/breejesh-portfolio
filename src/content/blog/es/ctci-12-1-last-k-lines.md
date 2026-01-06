---
title: "Last K Lines: Print Last K Lines of File in C++ (CTCI 12.1)"
description: "CTCI problem 12.1 in C++: print the last K lines of a file using a circular array buffer for O(K) memory."
date: "2026-01-06"
tags: [Algorithms]
coverImage: /assets/images/ctci-12-1-last-k-lines.webp
previewImage: /assets/images/ctci-12-1-last-k-lines.webp
---


> **TL;DR**
> * **El Problema:** Mecánica técnica del problema CTCI 12.1.
> * **El Enfoque:** CTCI problem 12.1 in C++: print the last K lines of a file using a circular array buffer for O(K) memory.
> * **Complejidad:** Relación óptima de tiempo y memoria.

Este artículo explica claramente el problema CTCI **12.1**.

## 1. Contexto y Enunciado
CTCI problem 12.1 in C++: print the last K lines of a file using a circular array buffer for O(K) memory.

## 2. Código e Implementación

```java
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

## 3. Resumen y Casos Límite
Verifique siempre condiciones de borde y entradas nulas.