---
title: "Puntero Inteligente: Implementación de Conteo de Referencias en C++ (CTCI 12.9)"
description: "Implementa una clase plantilla de puntero inteligente (Smart Pointer) desde cero en C++ con gestion automatica de memoria y sobrecarga de operadores."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-9-smart-pointer.webp
previewImage: /assets/images/ctci-12-9-smart-pointer.webp
---

> **TL;DR**
> * **El Problema del Libro:** Escribe una clase de puntero inteligente (Smart Pointer) mediante plantillas que simule un puntero y gestione la recoleccion de basura automatica usando conteo de referencias.
> * **La Solución Óptima:** **Puntero Compartido con Contador en Heap**: (1) Mantiene dos punteros: el puntero al objeto `T* ref` y un contador compartido en memoria dinamica `unsigned* ref_count`; (2) **Constructor**: Inicializa el objeto y reserva el contador con valor 1; (3) **Constructor de Copia**: Comparte direccion e incrementa `(*ref_count)++`; (4) **Asignación**: Decrementa la referencia actual (liberando si llega a 0) y enlaza al nuevo objeto; (5) **Destructor**: Al llegar el contador a 0, libera el objeto y el contador; (6) Sobrecarga `operator*` y `operator->`.
> * **Realidad en Producción:** Estructura interna de `std::shared_ptr` y `boost::shared_ptr`.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 12.9), se nos plantea:

*"Implementa una clase plantilla de puntero inteligente con conteo de referencias y sobrecarga de operadores en C++."*

## 2. Gestión de Conteo de Referencias en Heap

Para que todas las copias compartan el mismo contador, el entero debe ubicarse en memoria dinamica compartida.

## Implementación de Producción

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
    explicit SmartPointer(T* ptr = nullptr) {
        ref = ptr;
        ref_count = new unsigned(1);
    }

    SmartPointer(const SmartPointer<T>& sptr) {
        ref = sptr.ref;
        ref_count = sptr.ref_count;
        if (ref_count) {
            (*ref_count)++;
        }
    }

    SmartPointer<T>& operator=(const SmartPointer<T>& sptr) {
        if (this == &sptr) {
            return *this;
        }

        remove();

        ref = sptr.ref;
        ref_count = sptr.ref_count;
        if (ref_count) {
            (*ref_count)++;
        }
        return *this;
    }

    ~SmartPointer() {
        remove();
    }

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

## Análisis de Complejidad y Memoria

| Operación | Complejidad | Detalle Técnico |
|---|---|---|
| Copia / Asignación | `O(1)` | Incremento/decremento de contador entero. |
| Desreferencia (`*` / `->`) | `O(1)` | Acceso directo a puntero crudo. |
| Sobrecoste de Memoria | 16 Bytes | Puntero al objeto + puntero al contador. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: `std::make_shared`

1. **Bloque de Control Único (`std::make_shared`):** En lugar de hacer dos llamadas a `new`, `std::make_shared` ubica el objeto y el contador en un unico bloque contiguo de memoria.
2. **Ciclos de Referencia:** Dos punteros compartidos apuntandose mutuamente evitan que el contador baje a 0, solucionado en produccion con `std::weak_ptr`.

## Casos Límite y Robustez en Producción

1. **Auto-Asignación (`ptr = ptr`):** Protegido por verificacion `this == &sptr`.
