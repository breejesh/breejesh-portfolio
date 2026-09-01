---
title: "Llamada en Orden: Sincronización y Secuenciación de Hilos en Java (CTCI 15.5)"
description: "Coordina el orden de ejecucion determinista entre multiples hilos concurrentes utilizando semaforos binarios y cierres de cuenta atras (CountDownLatch)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-15-5-call-in-order.webp
previewImage: /assets/images/ctci-15-5-call-in-order.webp
---

> **TL;DR**
> * **El Problema del Libro:** Dada una clase `Foo` con los metodos `first()`, `second()` y `third()`, ejecutados por tres hilos independientes sobre la misma instancia, garantiza que `first()` se ejecute antes de `second()`, y `second()` antes de `third()`.
> * **La Solución Óptima:** **Semáforos de Cero Permisos**:
>   1. Inicializar dos semaforos con cero permisos: `Semaphore sem1 = new Semaphore(0); Semaphore sem2 = new Semaphore(0);`.
>   2. En `first()`: Ejecutar la tarea y desbloquear al segundo hilo con `sem1.release()`.
>   3. En `second()`: Bloquear con `sem1.acquire()`, ejecutar la tarea y desbloquear al tercer hilo con `sem2.release()`.
>   4. En `third()`: Bloquear con `sem2.acquire()` y ejecutar la tarea final.
>   5. Se ejecuta en **tiempo $O(1)$** sin consumo de CPU.
> * **Realidad en Producción:** Inicializacion secuencial de componentes en microservicios y pipelines reactivos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 15.5), se nos plantea:

*"Coordina tres hilos independientes que ejecutan metodos distintos en un objeto compartido para asegurar un orden estricto de ejecucion."*

## 2. Mecánica de Sincronización con Semáforos

Al inicializar los semaforos con 0 permisos, cualquier llamada a `acquire()` bloquea el hilo inmediatamente en el kernel del sistema operativo hasta que el paso anterior emite `release()`.

## Implementación de Producción

```java
import java.util.concurrent.Semaphore;

public class Foo {
    private final Semaphore sem1 = new Semaphore(0);
    private final Semaphore sem2 = new Semaphore(0);

    public void first(Runnable printFirst) {
        printFirst.run();
        sem1.release(); // Libera el paso a second()
    }

    public void second(Runnable printSecond) throws InterruptedException {
        sem1.acquire(); // Espera a que first() termine
        printSecond.run();
        sem2.release(); // Libera el paso a third()
    }

    public void third(Runnable printThird) throws InterruptedException {
        sem2.acquire(); // Espera a que second() termine
        printThird.run();
    }
}
```

## Comparativa de Primitivas de Concurrencia

| Mecanismo | Sobrecarga de CPU | Reutilizable | Manejo de Interrupciones |
|---|---|---|---|
| **`Semaphore(0)`** | **$0\%$ (Hilo suspendido)** | Sí | Lanza `InterruptedException` de forma limpia. |
| **`CountDownLatch`** | **$0\%$ (Hilo suspendido)** | No (un solo uso) | Lanza `InterruptedException`. |
| **Bucle `volatile`** | $100\%$ CPU (espera activa) | Sí | Requiere comprobaciones manuales. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Pipelines Asíncronos

1. **Netty y Flujos Reactivos:** En motores de red de alto rendimiento, los eventos fluyen a traves de manejadores en cadena garantizando el orden de transformacion.
2. **Arranque de Microservicios:** Secuenciacion de tareas criticas durante el arranque (Migracion de base de datos $\to$ Carga de caches $\to$ Apertura del puerto HTTP).

## Casos Límite y Robustez en Producción

1. **Manejo de Excepciones:** Encapsular la ejecucion en bloques `try-finally` para evitar bloquear indefinidamente a los hilos receptores si ocurre una excepcion.
