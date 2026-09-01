---
title: "Destructor Virtual en Clase Base: Prevención de Fugas de Memoria en C++ (CTCI 12.7)"
description: "Por que los destructores de clases base deben declararse como virtuales en C++ para evitar fugas de recursos y comportamiento indefinido en polimorfismo."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-7-virtual-base-class.webp
previewImage: /assets/images/ctci-12-7-virtual-base-class.webp
---

> **TL;DR**
> * **El Problema del Libro:** ¿Por que el destructor de una clase base debe declararse como virtual?
> * **La Solución Óptima:** **Destrucción Polimórfica mediante Vtable**: (1) Al destruir un objeto derivado mediante un puntero de clase base (`Base* ptr = new Derived(); delete ptr;`), el enlazado estatico invoca unicamente `Base::~Base()` si el destructor no es virtual; (2) El destructor derivado `Derived::~Derived()` nunca se ejecuta, perdiendo memoria en el heap, descriptores de archivos y mutexes; (3) El estandar de C++ califica la eliminacion mediante puntero base no virtual como **Comportamiento Indefinido (Undefined Behavior)**; (4) Declarar `virtual ~Base() = default;` canaliza la llamada por la `vtable`, ejecutando primero `Derived::~Derived()` y luego `Base::~Base()`.
> * **Realidad en Producción:** Jerarquias polimorficas en Qt (`QObject`) y nodos AST de LLVM.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 12.7), se nos plantea:

*"Explica por que es imprescindible que el destructor de una clase base sea virtual cuando se utiliza polimorfismo en C++."*

## 2. Orden de Destrucción y Fugas de Recursos

* **Sin Destructor Virtual:** El compilador utiliza enlace estatico basado en el tipo del puntero (`Base*`) y solo ejecuta el destructor base.
* **Con Destructor Virtual:** La llamada se resuelve mediante `vptr` apuntando a la tabla virtual de `Derived`, ejecutando la cadena completa de destructores de abajo hacia arriba.

## Implementación de Producción

```cpp
#include <iostream>

class BaseSegura {
public:
    BaseSegura() = default;
    virtual ~BaseSegura() {
        std::cout << "Destructor Base Seguro\n";
    }
};

class DerivadaSegura : public BaseSegura {
private:
    int* buffer;
public:
    DerivadaSegura() {
        buffer = new int[1000]; // Reserva de memoria
    }
    ~DerivadaSegura() override {
        delete[] buffer; // Liberacion garantizada
        std::cout << "Destructor Derivado: Memoria liberada!\n";
    }
};
```

## Comparativa de Escenarios

| Escenario | Llamada Ejecutada | ¿Corre el Destructor Derivado? | Resultado |
|---|---|---|---|
| Base No Virtual | `delete (Base*)ptr;` | **No** | Fuga de memoria en heap + Comportamiento indefinido. |
| Base Virtual | `delete (Base*)ptr;` | **Sí** | Liberación completa de recursos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Directrices de C++ (C.35)

1. **Regla de las Directrices de C++ (C.35):** El destructor de una clase base debe ser publico y virtual, o protegido y no virtual (evitando `delete` polimorfico en tiempo de compilacion).
2. **Clases de la STL:** Clases como `std::vector` no tienen destructores virtuales; heredarlas publicamente y destruirlas mediante punteros base genera fugas criticas.

## Casos Límite y Robustez en Producción

1. **Destructor Virtual Puro:** `virtual ~Base() = 0;` hace abstracta la clase, pero requiere obligatoriamente una definicion de cuerpo (`Base::~Base() {}`).
