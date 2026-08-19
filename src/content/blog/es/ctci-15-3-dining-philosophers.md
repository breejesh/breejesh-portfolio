---
title: "Filósofos Comensales: Prevención de Deadlock y Orden de Recursos (CTCI 15.3)"
description: "Problema CTCI 15.3 en Java: resolver el clásico interbloqueo de los filósofos comensales mediante jerarquía estricta de adquisición de bloqueos."
date: "2026-03-31"
tags: [Algoritmos, Concurrencia]
coverImage: /assets/images/ctci-15-3-dining-philosophers.webp
previewImage: /assets/images/ctci-15-3-dining-philosophers.webp
---

> **TL;DR**
> * **El Problema:** Cinco filósofos sentados alrededor de una mesa con cinco palillos. Si todos toman el palillo izquierdo a la vez, el sistema entra en interbloqueo permanente.
> * **La Clave:** El deadlock requiere una condición de espera circular. Romper el ciclo ordenando los bloqueos por ID numérico garantiza que al menos un filósofo siempre pueda comer.
> * **Complejidad:** Sobrecarga de sincronización $O(1)$ por comida sin ningún interbloqueo.

---

## 1. Solución en Java Libre de Deadlock

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class DiningPhilosophers {
    public static class Chopstick {
        private final int id;
        private final Lock lock = new ReentrantLock();

        public Chopstick(int id) {
            this.id = id;
        }

        public int getId() {
            return id;
        }

        public void pickUp() {
            lock.lock();
        }

        public void putDown() {
            lock.unlock();
        }
    }

    public static class Philosopher extends Thread {
        private final int id;
        private final Chopstick lower;
        private final Chopstick higher;

        public Philosopher(int id, Chopstick left, Chopstick right) {
            this.id = id;
            if (left.getId() < right.getId()) {
                this.lower = left;
                this.higher = right;
            } else {
                this.lower = right;
                this.higher = left;
            }
        }

        public void eat() {
            lower.pickUp();
            try {
                higher.pickUp();
                try {
                    System.out.println("Philosopher " + id + " is eating.");
                } finally {
                    higher.putDown();
                }
            } finally {
                lower.putDown();
            }
        }

        @Override
        public void run() {
            for (int i = 0; i < 3; i++) {
                eat();
            }
        }
    }
}
```
