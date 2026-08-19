---
title: "Dining Philosophers: Deadlock Prevention and Resource Ordering (CTCI 15.3)"
description: "CTCI problem 15.3 in Java: solving Dijkstra's classic Dining Philosophers concurrency deadlock using strict resource hierarchy and lock ordering."
date: "2026-03-31"
tags: [Algorithms, Concurrency]
coverImage: /assets/images/ctci-15-3-dining-philosophers.webp
previewImage: /assets/images/ctci-15-3-dining-philosophers.webp
---

> **TL;DR**
> * **The Problem:** Five philosophers sit around a table with five chopsticks. Each needs two chopsticks to eat. If everyone grabs their left chopstick simultaneously, the system deadlocks forever.
> * **The Insight:** Deadlock requires a circular wait condition. Breaking the cycle by enforcing a global lock acquisition hierarchy guarantees that at least one philosopher can always eat.
> * **Complexity:** $O(1)$ synchronization overhead per meal cycle with zero deadlocks.

Five thinkers sit at a round table. Between each pair of plates lies a single chopstick. To eat a bowl of noodles, a philosopher must pick up both the left and right chopsticks.

If every philosopher sits down at the same moment and grabs their left chopstick, every right chopstick is taken. Everyone waits for their neighbor to finish. Nobody can eat. Nobody puts down their chopstick. That is the classic **Dining Philosophers** deadlock.

---

## 1. The Four Coffman Deadlock Conditions

To eliminate deadlock, you must break at least one of these four conditions:

| Condition | In Dining Philosophers | How We Break It |
| --- | --- | --- |
| **Mutual Exclusion** | Only one person holds a chopstick | Not breakable (hardware/resource limit) |
| **Hold and Wait** | Holding left while waiting for right | Release chopstick if right is unavailable |
| **No Preemption** | Cannot forcibly snatch a chopstick | Respect ownership boundaries |
| **Circular Wait** | 1 waits for 2, 2 for 3... 5 for 1 | **Break the cycle with strict lock ordering** |

---

## 2. Complete Deadlock-Free Java Solution

By assigning a global ID to each chopstick and always requiring every philosopher to pick up the lower-numbered chopstick first, circular wait becomes mathematically impossible.

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
            // Enforce strict lock ordering: always grab lower ID first
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
                    // Eating noodles safely
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

---

## 3. Complexity & Verification

| Metric | Value | Technical Reality |
| --- | --- | --- |
| **Time per Acquisition** | $O(1)$ | Direct lock acquisition without busy-waiting |
| **Space Overhead** | $O(N)$ | $N$ lock objects for $N$ resources |
| **Deadlock Freedom** | $100\%$ Guaranteed | Resource hierarchy prevents directed cycles in the wait graph |
