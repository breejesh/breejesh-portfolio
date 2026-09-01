---
title: "El Problema de los Filósofos: Prevención de Interbloqueos y Jerarquías de Bloqueo (CTCI 15.3)"
description: "Resuelve el dilema de concurrencia de los filosofos comensales de Dijkstra eliminando la espera circular mediante una jerarquia estricta de cerrojos en Java."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-15-3-dining-philosophers.webp
previewImage: /assets/images/ctci-15-3-dining-philosophers.webp
---

> **TL;DR**
> * **El Problema del Libro:** 5 filosofos comparten 5 palillos en una mesa circular. Cada uno necesita 2 palillos adyacentes para comer. Disena un algoritmo para que coman sin interbloqueos (deadlock) ni inanicion (starvation).
> * **La Trampa del Interbloqueo:** Si todos toman su palillo izquierdo a la vez, se produce una **espera circular** y todos quedan bloqueados indefinidamente.
> * **La Solución (Jerarquía de Recursos):** Numerar los palillos de $0$ a $4$. Cada filosofo debe adquirir siempre el palillo de **menor identificador primero** antes de solicitar el de mayor identificador.
> * **Realidad en Producción:** Ordenacion de bloqueos en PostgreSQL y bloqueo de inodos en el kernel de Linux.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 15.3), se nos plantea:

*"Resuelve el problema clasico de los filosofos comensales de Dijkstra garantizando la ausencia de interbloqueos mediante jerarquias de bloqueo concurrentes."*

## 2. Las 4 Condiciones de Coffman

1. **Exclusión Mutua:** Los recursos no se pueden compartir simultaneamente.
2. **Retención y Espera:** Un hilo retiene un recurso mientras espera otro.
3. **No Apropiación:** Los recursos no se pueden expropiar forzosamente.
4. **Espera Circular:** Se forma un ciclo cerrado de dependencias $P_0 \to P_1 \to \dots \to P_0$.

Al romper la simetria y obligar a adquirir el recurso menor primero, el filosofo 4 toma el palillo 0 (derecho) antes que el 4 (izquierdo), eliminando matematicamente la espera circular.

## Implementación de Producción

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class Philosopher extends Thread {
    private final int id;
    private final Lock lower;
    private final Lock higher;

    public Philosopher(int id, Lock left, Lock right) {
        this.id = id;
        if (System.identityHashCode(left) < System.identityHashCode(right)) {
            this.lower = left;
            this.higher = right;
        } else {
            this.lower = right;
            this.higher = left;
        }
    }

    private void eat() throws InterruptedException {
        lower.lock();
        try {
            higher.lock();
            try {
                System.out.println("Filosofo " + id + " esta comiendo.");
                Thread.sleep(10);
            } finally {
                higher.unlock();
            }
        } finally {
            lower.unlock();
        }
    }

    @Override
    public void run() {
        try {
            for (int i = 0; i < 100; i++) {
                Thread.sleep(5);
                eat();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## Análisis de Complejidad

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Sobrecarga de Bloqueo | `O(1)` | Exactamente 2 operaciones de cerrojo reentrante por comida. |
| Riesgo de Deadlock | `Cero` | Imposibilidad estructural de ciclos en el grafo de recursos. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Bloqueo de Filas en Motores de Bases de Datos

1. **Ordenación de Claves Primarias:** PostgreSQL y MySQL InnoDB ordenan los identificadores (`[42, 87]`) antes de adquirir bloqueos de fila en transacciones masivas para evitar interbloqueos entre transacciones concurrentes.
2. **Bloqueo de Inodos en Linux VFS:** Durante operaciones `rename()`, el kernel bloquea los inodos en orden numerico ascendente de direcciones de memoria.

## Casos Límite y Robustez en Producción

1. **Interrupción de Hilos:** Manejo estricto con `try-finally` anidados para asegurar la liberacion del primer cerrojo si el segundo falla.
