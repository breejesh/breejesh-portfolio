---
title: "FizzBuzz Multihilo: Sincronización de 4 Hilos y Monitores (CTCI 15.7)"
description: "Implementa FizzBuzz multihilo coordinando 4 hilos de ejecucion mediante monitores de objetos en Java, bloques synchronized y patrones wait/notifyAll."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-15-7-fizzbuzz.webp
previewImage: /assets/images/ctci-15-7-fizzbuzz.webp
---

> **TL;DR**
> * **El Problema del Libro:** Implementa una version multihilo de FizzBuzz con 4 hilos: el Hilo A imprime "FizzBuzz" (divisible por 3 y 5), el Hilo B imprime "Fizz" (solo por 3), el Hilo C imprime "Buzz" (solo por 5) y el Hilo D imprime el numero. Deben imprimirse los numeros del 1 al $N$ en orden ascendente estricto.
> * **La Solución Óptima:** **Bucle de Estado con Monitor Synchronized y `wait()`/`notifyAll()`**:
>   1. Mantener un contador compartido `current = 1` protegido por un cerrojo monitor.
>   2. Cada hilo ejecuta un bucle mientras `current <= n`, evaluando su predicado de divisibilidad.
>   3. Si el predicado es FALSO, el hilo invoca `lock.wait()` y cede el monitor.
>   4. Si es VERDADERO, imprime su token, incrementa `current++` y emite `lock.notifyAll()` para despertar a los demas hilos.
>   5. Se ejecuta en **tiempo $O(N)$**.
> * **Realidad en Producción:** Coordinacion de grupos de trabajadores por turnos (round-robin) en procesadores de flujos de datos.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 15.7), se nos plantea:

*"Coordina 4 hilos independientes para imprimir de forma ordenada la secuencia FizzBuzz desde 1 hasta n evaluando predicados de divisibilidad."*

## 2. Máquina de Estados Multihilo

Cada incremento de `current` actua como una transicion de estado que notifica a todos los hilos en espera para que evalúen sus predicados.

## Implementación de Producción

```java
import java.util.function.IntConsumer;
import java.util.function.Predicate;

public class FizzBuzzMultithreaded {
    private final int n;
    private int current = 1;
    private final Object lock = new Object();

    public FizzBuzzMultithreaded(int n) {
        this.n = n;
    }

    private void printLoop(Predicate<Integer> predicate, ConsumerTask printer) throws InterruptedException {
        synchronized (lock) {
            while (current <= n) {
                if (predicate.test(current)) {
                    printer.accept(current);
                    current++;
                    lock.notifyAll(); // Despierta a todos los hilos para reevaluar
                } else {
                    lock.wait(); // Cede el cerrojo y se suspende
                }
            }
        }
    }

    public void fizz(Runnable printFizz) throws InterruptedException {
        printLoop(i -> i % 3 == 0 && i % 5 != 0, i -> printFizz.run());
    }

    public void buzz(Runnable printBuzz) throws InterruptedException {
        printLoop(i -> i % 5 == 0 && i % 3 != 0, i -> printBuzz.run());
    }

    public void fizzbuzz(Runnable printFizzBuzz) throws InterruptedException {
        printLoop(i -> i % 15 == 0, i -> printFizzBuzz.run());
    }

    public void number(IntConsumer printNumber) throws InterruptedException {
        printLoop(i -> i % 3 != 0 && i % 5 != 0, printNumber::accept);
    }

    @FunctionalInterface
    private interface ConsumerTask {
        void accept(int val);
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Complejidad Temporal | `O(N)` | Exactamente $N$ transiciones de estado e impresiones. |
| Espacio Auxiliar | `O(1)` | Unico contador compartido y cola de espera del monitor. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Variables de Condición

1. **`Lock` y `Condition` Explícitas:** Usar `ReentrantLock` con 4 variables `Condition` dedicadas evita despertar innecesariamente a hilos que no cumplen la condicion.
2. **Modelo de Actores:** En sistemas distribuidos (Akka / Erlang), la coordinacion se logra enviando mensajes a colas sin bloqueos explicitos.

## Casos Límite y Robustez en Producción

1. **Terminación Limpia del Bucle:** Cuando `current > n`, la llamada final a `notifyAll()` asegura que todos los hilos dormidos despierten, detecten el fin del bucle y finalicen sin bloquearse.
