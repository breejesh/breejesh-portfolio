---
title: "Copia Superficial vs. Profunda: Propiedad de Memoria y la Regla de los Cinco en C++ (CTCI 12.5)"
description: "Distingue la semantica de copia superficial (shallow) y profunda (deep) en C++, detallando el aliasing de punteros, la doble liberacion y la Regla de los Cinco."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
previewImage: /assets/images/ctci-12-5-shallow-vs-deep-copy.webp
---

> **TL;DR**
> * **El Problema del Libro:** ¿Cual es la diferencia entre copia profunda (deep copy) y copia superficial (shallow copy)? Explica como usarias cada una.
> * **Diferencias Fundamentales:** (1) **Copia Superficial**: Copia los valores miembro a miembro; para punteros, copia unicamente la direccion de memoria, provocando que dos objetos compartan el mismo bloque en el heap (ocasionando corrupcion y errores de doble liberacion `double free`); (2) **Copia Profunda**: Reserva un bloque de memoria independiente en el heap y clona los datos apuntados, garantizando aislamiento total; (3) **Regla de los Cinco**: Toda clase en C++ que gestione memoria dinamica debe implementar Destructor, Constructor de Copia, Operador de Asignacion de Copia, Constructor de Movimiento y Asignacion de Movimiento.
> * **Realidad en Producción:** Optimizacion Copy-On-Write (COW) en `fork()` de Linux y gestion RAII con punteros inteligentes.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 12.5), se nos plantea:

*"Explica la diferencia entre copia superficial y copia profunda, describiendo sus casos de uso y gestion de recursos de memoria."*

## 2. Representación en Memoria

* **Copia Superficial:** Ambos objetos apuntan al mismo bloque en memoria dinamica. Al destruir el primero, el segundo queda con un puntero colgante y causara un fallo de doble liberacion al destruirse.
* **Copia Profunda:** Cada objeto posee su propio bloque en el heap.

## Implementación de Producción

```cpp
#include <iostream>
#include <cstring>
#include <utility>

class DeepString {
private:
    char* data;
    size_t length;

public:
    DeepString(const char* str = "") {
        length = std::strlen(str);
        data = new char[length + 1];
        std::strcpy(data, str);
    }

    ~DeepString() {
        delete[] data;
    }

    DeepString(const DeepString& other) {
        length = other.length;
        data = new char[length + 1];
        std::strcpy(data, other.data);
    }

    DeepString& operator=(DeepString other) {
        swap(*this, other);
        return *this;
    }

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

## Comparación y Casos de Uso

| Criterio | Copia Superficial | Copia Profunda |
|---|---|---|
| **Mecanismo** | Copia de bytes directos (`memcpy`). | Nueva asignacion en heap y duplicacion de datos. |
| **Velocidad** | Instantanea ($O(1)$). | Proporcional al tamano ($O(N)$). |
| **Riesgo** | Punteros colgantes y doble liberacion (`double free`). | Totalmente seguro e independiente. |
| **Uso Recomendado** | Tipos primitivos, vistas de solo lectura (`string_view`), conteo de referencias. | Clases que administran memoria dinamica o descriptores de archivos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Copy-On-Write (COW)

1. **Llamada al Sistema `fork()` en Linux:** Duplica la tabla de paginas como copia superficial de solo lectura. La copia profunda solo se ejecuta cuando un proceso escribe en una pagina fisica.
2. **Punteros Inteligentes:** `std::unique_ptr` prohibe la copia superficial para forzar semantica de movimiento exclusiva.

## Casos Límite y Robustez en Producción

1. **Auto-Asignación (`a = a`):** Resuelto de forma segura mediante el patron Copy-and-Swap.
