---
title: "Declaración de Objetos: Asignación y Paso por Valor Estricto en Java (CTCI 13.6)"
description: "Distingue la declaracion de la instanciacion de objetos en Java, demostrando la semantica estricta de paso por valor para primitivas y referencias."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-13-6-object-declaration.webp
previewImage: /assets/images/ctci-13-6-object-declaration.webp
---

> **TL;DR**
> * **El Problema del Libro:** Explica que es la declaracion de un objeto y la diferencia entre paso por valor y paso por referencia en Java.
> * **La Solución Óptima:** **Asignación en Pila y Paso por Valor Estricto**:
>   1. **Declaración vs Instanciación**: `Persona p;` (Declaración) crea una variable en la pila con valor `null` sin reservar memoria en el heap; `p = new Persona();` (Instanciación) reserva memoria en el heap, ejecuta el constructor y asigna la referencia resultante.
>   2. **Java es Estrictamente Paso por Valor (100% de los Casos)**:
>      * **Primitivas**: Se copia el valor binario literal directamente en la pila.
>      * **Referencias de Objetos**: Se copia por valor el *manejador de referencia* (la direccion de memoria).
>      * **Mutación vs Reasignación**: Modificar los atributos de un objeto (`p.setNombre("Bob")`) altera el objeto compartido en el heap; sin embargo, reasignar la variable (`p = new Persona("Eva")`) solo modifica la copia local en la pila sin afectar la variable del invocador.
> * **Realidad en Producción:** Analisis de escape en el compilador HotSpot C2 y tipos de valor de Project Valhalla.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 13.6), se nos plantea:

*"Explica la diferencia entre declarar e instanciar un objeto y demuestra por que Java utiliza evaluacion estricta de paso por valor."*

## 2. Memoria en Java: Pila vs Heap

* **Declaración (`Persona p;`):** Solo ocupa 4 u 8 bytes en la pila del hilo apuntando a `null`.
* **Instanciación (`new Persona()`):** Asigna el cuerpo del objeto en el heap y retorna su direccion.

## Demostración de Paso por Valor

```java
public class PassByValueProof {

    public static class Usuario {
        public String nombre;
        public Usuario(String n) { this.nombre = n; }
    }

    public static void intentarReasignar(Usuario u) {
        // Modifica unicamente la copia local de la referencia
        u = new Usuario("Carlos Reasignado");
    }

    public static void mutarObjeto(Usuario u) {
        // Altera el objeto compartido en heap
        u.nombre = "Bob Mutado";
    }

    public static void intentarModificarPrimitiva(int n) {
        n = 999;
    }

    public static void main(String[] args) {
        Usuario usuario = new Usuario("Alice");

        intentarReasignar(usuario);
        System.out.println("Tras reasignar: " + usuario.nombre); // "Alice" intacto

        mutarObjeto(usuario);
        System.out.println("Tras mutar: " + usuario.nombre);     // "Bob Mutado"

        int numero = 42;
        intentarModificarPrimitiva(numero);
        System.out.println("Primitiva: " + numero);              // 42 intacto
    }
}
```

## Comparativa entre Lenguajes

| Lenguaje | Mecanismo de Paso | ¿Puede la función reasignar el puntero del invocador? |
|---|---|---|
| **Java** | **Estrictamente Paso por Valor** | **No** (Solo altera la copia local en la pila). |
| **C** | **Estrictamente Paso por Valor** | **No** (Requiere punteros dobles `Type**`). |
| **C++** | **Paso por Valor O Referencia** (`Type&`) | **Sí** (Si se declara como referencia `&`). |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Análisis de Escape

1. **Reemplazo Escalar (HotSpot C2):** Si un objeto no escapa del metodo local, la JVM descompone sus campos en registros de CPU, eliminando por completo la reserva en heap.
2. **Copia Defensiva:** Si una clase contiene objetos mutables (`Date`, colecciones), los getters deben retornar copias defensivas para evitar alteraciones externas indeseadas.

## Casos Límite y Robustez en Producción

1. **Inmutabilidad:** Usar `final` en parametros (`void fn(final User u)`) previene errores accidentales de reasignacion de variables locales dentro del metodo.
