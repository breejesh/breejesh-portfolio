---
title: "Funciones Virtuales: Mecánica de Vtable y Vptr en C++ (CTCI 12.4)"
description: "Explora la mecanica interna del compilador en funciones virtuales de C++, detallando la tabla de metodos virtuales (vtable), el puntero vptr y el despacho dinamico."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-12-4-virtual-functions.webp
previewImage: /assets/images/ctci-12-4-virtual-functions.webp
---

> **TL;DR**
> * **El Problema del Libro:** ¿Como funcionan las funciones virtuales en C++?
> * **La Solución Óptima:** **Despacho Dinámico en Tiempo de Ejecución (Vtable y Vptr)**: (1) **La Tabla Virtual (`vtable`)**: Arreglo estatico de punteros a funciones generado por el compilador para cada clase con funciones virtuales, almacenado en `.rodata`; (2) **El Puntero Virtual (`vptr`)**: Puntero oculto insertado en el desplazamiento 0 de cada instancia de objeto que apunta a la `vtable` de su clase; (3) **Resolución de Llamada**: Al invocar `p->foo()`, la CPU ejecuta `(p->vptr[indice_foo])(p)` en tiempo $O(1)$ con un solo nivel de indireccion; (4) **Costos**: 8 bytes por objeto en 64 bits y perdida de inlining del compilador.
> * **Realidad en Producción:** Motores de videojuegos (Unreal Engine) e interfaces COM / DirectX.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 12.4), se nos plantea:

*"Explica el funcionamiento interno de las funciones virtuales en C++, describiendo las estructuras del compilador y el mecanismo de despacho dinamico."*

## 2. Disposición en Memoria: Vptr y Vtable

Cuando una clase declara metodos virtuales:
1. El compilador crea una `vtable` estatica para esa clase.
2. Cada instancia del objeto almacena un puntero `vptr` oculto al inicio de su bloque de memoria.

Al invocar un metodo virtual mediante un puntero de clase base:
$$\text{Llamada} = (\text{objeto}->\text{vptr}[\text{indice}])(\text{objeto})$$

## Implementación de Producción

```cpp
#include <iostream>

class Shape {
public:
    int id;

    void printId() const {
        std::cout << "Shape ID: " << id << "\n";
    }

    virtual void draw() const {
        std::cout << "Drawing generic Shape\n";
    }

    virtual ~Shape() = default;
};

class Circle : public Shape {
public:
    double radius;

    void draw() const override {
        std::cout << "Drawing Circle with radius " << radius << "\n";
    }
};

void renderShape(const Shape* s) {
    s->draw(); // Despacho dinamico mediante vtable
}
```

## Análisis de Costos y Rendimiento

| Factor | Impacto | Detalle Técnico |
|---|---|---|
| **Memoria por Instancia** | $+8\text{ Bytes}$ | Puntero `vptr` de 64 bits en la cabecera del objeto. |
| **Memoria de Clase** | $8\text{ Bytes} \times N_{\text{metodos}}$ | `vtable` estática única en `.rodata`. |
| **Latencia de Despacho** | $\approx 2\text{ ns}$ | 1 salto indirecto de memoria; impide el inlining del compilador. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Polimorfismo Estático (CRTP)

1. **Patrón de Plantilla Curiosamente Recurrente (CRTP):** En sistemas de alta frecuencia y motores graficos, se utiliza polimorfismo en tiempo de compilacion mediante plantillas para evitar el costo de la `vtable`.
2. **Object Slicing:** Al pasar un objeto derivado por valor (`void fn(Shape s)`), los miembros derivados se truncan y el `vptr` apunta a la clase base. Siempre debe pasarse por puntero o referencia.

## Casos Límite y Robustez en Producción

1. **Llamadas Virtuales en Constructores/Destructores:** No invocan metodos derivados porque el objeto hijo aun no existe o ya ha sido destruido.
