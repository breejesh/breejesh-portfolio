---
title: "Dining Philosophers: Deadlock Prevention and Resource Ordering Hierarchies (CTCI 15.3)"
description: "How to resolve Dijkstra's classic Dining Philosophers concurrency dilemma by breaking circular wait conditions using strict lock hierarchies in Java."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-15-3-dining-philosophers.webp
previewImage: /assets/images/ctci-15-3-dining-philosophers.webp
---

> **TL;DR**
> * **The Book Problem:** 5 philosophers sit around a circular table with 5 chopsticks. Each philosopher needs 2 adjacent chopsticks to eat. Design an algorithm so philosophers eat without deadlocking or starving.
> * **The Deadlock Trap:** If all 5 philosophers simultaneously pick up their left chopstick first, all 5 chopsticks are locked, creating a fatal **Circular Wait** deadlock.
> * **The Solution (Resource Hierarchy):** Number chopsticks $0..4$. Every philosopher must acquire their **lower-numbered chopstick first** before requesting their higher-numbered chopstick.
> * **Production Reality:** Powers database lock ordering (preventing deadlocks in PostgreSQL row locks) and Linux VFS inode rename ordering.

## 1. Problem Statement & The Concurrency Model

In *Cracking the Coding Interview* (Problem 15.3), Dijkstra's classic Dining Philosophers problem explores resource contention among concurrent threads:
* 5 philosophers alternate between thinking and eating.
* Each philosopher requires two shared mutex locks (left chopstick and right chopstick) to execute their critical section.
* The system must guarantee freedom from **Deadlock** (threads permanently blocked waiting on each other) and **Livelock/Starvation** (threads continuously yielding without progress).

## 2. The Deadlock Conditions & Why Circular Wait Fails

Coffman's four conditions for deadlock are:
1. **Mutual Exclusion:** Chopsticks cannot be shared.
2. **Hold and Wait:** Philosophers hold one chopstick while waiting for another.
3. **No Preemption:** Chopsticks cannot be forcibly revoked.
4. **Circular Wait:** Philosopher $P_0$ waits for $P_1$, $P_1$ waits for $P_2$, ..., $P_4$ waits for $P_0$.

If all philosophers execute `left.lock(); right.lock();`, an interleaved thread schedule causes all 5 threads to acquire their left lock, halting the entire application forever.

## 3. The Algorithmic Breakthrough: Strict Lock Hierarchy

To eliminate circular wait, we establish a global total order on all mutex locks:
* Assign each chopstick an integer ID: $0, 1, 2, 3, 4$.
* Each philosopher identifies their two chopsticks: `lower = min(left, right)` and `higher = max(left, right)`.
* Every philosopher **always locks `lower` first, then locks `higher`**.

Philosophers 0 through 3 (having chopsticks (0,1), (1,2), (2,3), (3,4)) pick up left first. But Philosopher 4 (having chopsticks 4 and 0) **picks up chopstick 0 first (right) before chopstick 4 (left)**. This symmetry break guarantees that a circular wait cycle can never form in the resource allocation graph.

## Production Implementation

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class Philosopher extends Thread {
    private final int id;
    private final Lock lower;
    private final Lock higher;

    public Philosopher(int id, Lock left, Lock right) {
        this.id = id;
        // Enforce strict global lock ordering hierarchy
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
                System.out.println("Philosopher " + id + " is eating.");
                Thread.sleep(10); // Simulate eating
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
                // Think
                Thread.sleep(5);
                // Eat
                eat();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Lock Acquisition Overhead | `O(1)` | Exactly 2 reentrant mutex lock operations per critical section. |
| Deadlock Risk | `Zero` | Mathematically impossible for a cycle to form in directed lock acquisition graph. |
| Fairness & Starvation | `Bounded` | JVM `ReentrantLock(true)` fair queuing guarantees bounded wait times. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: PostgreSQL Deadlock Detection & Database Row Locks

1. **Relational Database Multi-Row Locking:** When two concurrent SQL transactions update multiple rows (e.g. `UPDATE accounts SET balance = balance - 100 WHERE id IN (42, 87)`), database engines (PostgreSQL, MySQL InnoDB) sort the primary keys ascending (`[42, 87]`) before acquiring row-level locks. This ensures all transactions lock rows in identical order, preventing database-level deadlocks.
2. **Linux Kernel VFS Inode Locking:** When renaming or moving files across directories (`rename(src, dst)`), the Linux Virtual File System locks directory inodes in order of their memory addresses to prevent kernel-level deadlocks.

## Edge Cases & Production Hardening

1. **Hash Collisions:** In production, assign unique sequential integer IDs to lock objects rather than relying on identity hash codes.
2. **Thread Interruption:** Wrapped in nested `try-finally` blocks to guarantee immediate release of the lower lock if acquiring the higher lock throws `InterruptedException`.
