---
title: "Métodos Sincronizados: Monitores de Objetos y Condiciones de Carrera (CTCI 15.6)"
description: "Desgrana el comportamiento de metodos sincronizados en Java, el bloqueo del monitor intrinseco (Mark Word), metodos normales y bloqueos a nivel de clase."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-15-6-synchronized-methods.webp
previewImage: /assets/images/ctci-15-6-synchronized-methods.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una clase con un metodo `synchronized` A y un metodo normal B, ejecutados por dos hilos sobre una misma instancia: ¿pueden ambos ejecutar A simultaneamente? ¿pueden ejecutar A y B al mismo tiempo?
> * **Reglas de Concurrencia de la JVM:**
>   1. **Dos Hilos en el Método A (Misma Instancia)**: **NO**. El metodo adquiere el cerrojo del monitor intrinseco de `this`. El segundo hilo se bloquea hasta que el primero libera el monitor.
>   2. **Un Hilo en A y Otro en B (Misma Instancia)**: **SÍ**. El metodo B no es sincronizado; no solicita el monitor de `this` y se ejecuta concurrentemente sin contencion.
>   3. **Si Ambos son Sincronizados**: **NO**. Ambos compiten por el mismo monitor `this`.
>   4. **Instancias Distintas (`obj1` y `obj2`)**: **SÍ**. Cada objeto en el Heap posee su propio monitor en su cabecera (Mark Word).
>   5. **Métodos Estáticos Sincronizados**: Bloquean el objeto `Class` (`MiClase.class`), no la instancia.
> * **Realidad en Producción:** Riesgos de condiciones de carrera en servicios singleton de Spring.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 15.6), se nos plantea:

*"Analiza el comportamiento de la exclusion mutua cuando dos hilos interactuan con metodos sincronizados y no sincronizados de un objeto en Java."*

## 2. Estructura Interna del Monitor en la JVM

En la cabecera de cada objeto en Java (Mark Word), la JVM gestiona el estado de bloqueo (`monitorenter` y `monitorexit`). Los metodos no sincronizados ignoran este monitor.

## Implementación de Producción

```java
public class SynchronizedDemo {
    private int contador = 0;

    public synchronized void metodoA(String hilo) {
        System.out.println(hilo + " ENTRA a metodoA (retiene monitor)");
        try {
            Thread.sleep(1000);
            contador += 10;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println(hilo + " SALE de metodoA (libera monitor)");
    }

    public void metodoB(String hilo) {
        System.out.println(hilo + " EJECUTA metodoB concurrentemente! (contador=" + contador + ")");
    }

    public static void main(String[] args) {
        SynchronizedDemo instancia = new SynchronizedDemo();

        new Thread(() -> instancia.metodoA("Hilo-1")).start();

        new Thread(() -> {
            try { Thread.sleep(200); } catch (InterruptedException ignored) {}
            instancia.metodoB("Hilo-2"); // ¡Se ejecuta de inmediato!
        }).start();

        new Thread(() -> {
            try { Thread.sleep(300); } catch (InterruptedException ignored) {}
            instancia.metodoA("Hilo-3"); // ¡BLOQUEADO hasta que Hilo-1 termine!
        }).start();
    }
}
```

## Matriz de Escenarios de Concurrencia

| Escenario | Métodos | Instancias | ¿Ejecución Concurrente? | Causa Raíz |
|---|---|---|---|---|
| **Escenario 1** | `metodoA()` vs `metodoA()` | Misma | **NO** | Compiten por el monitor `this`. |
| **Escenario 2** | `metodoA()` vs `metodoB()` | Misma | **SÍ** | `metodoB()` no solicita el monitor. |
| **Escenario 3** | Ambos `synchronized` | Misma | **NO** | Mismo cerrojo de monitor. |
| **Escenario 4** | `metodoA()` vs `metodoA()` | Distintas | **SÍ** | Monitores independientes en heap. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Condiciones de Carrera

1. **Lecturas no Sincronizadas:** Si `metodoB()` lee variables mutadas por `metodoA()` sin sincronizacion ni `volatile`, puede observar valores obsoletos por la cache de registros de la CPU.
2. **Cerrojos de Lectura/Escritura:** Uso de `ReentrantReadWriteLock` para permitir multiples lectores simultaneos y exclusividad para escritores.

## Casos Límite y Robustez en Producción

1. **Deadlock por Inversión de Cerrojos:** Evitar que un metodo sincronizado de `obj1` invoque un metodo sincronizado de `obj2` si este hace lo inverso.
