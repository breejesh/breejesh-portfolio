---
title: "Call in Order: Thread Synchronization and Execution Sequencing in Java (CTCI 15.5)"
description: "Coordinate deterministic multi-threaded execution order across concurrent threads using counting semaphores, countdown latches, and monitor condition variables."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-15-5-call-in-order.webp
previewImage: /assets/images/ctci-15-5-call-in-order.webp
---

> **TL;DR**
> * **The Book Problem:** Suppose we have a class `Foo` with methods `first()`, `second()`, and `third()`. Three different threads call these methods concurrently on the same `Foo` instance. Design a synchronization mechanism to guarantee that `first()` executes before `second()`, and `second()` executes before `third()`.
> * **The Optimal Solution:** **Dual Zero-Permit Semaphores**:
>   1. Initialize two binary semaphores with zero permits: `Semaphore sem1 = new Semaphore(0); Semaphore sem2 = new Semaphore(0);`.
>   2. In `first()`: Execute work, then signal the next stage via `sem1.release()`.
>   3. In `second()`: Block until signaled via `sem1.acquire()`, execute work, then signal the next stage via `sem2.release()`.
>   4. In `third()`: Block until signaled via `sem2.acquire()`, then execute work.
>   5. Runs in **$O(1)$ time** with zero CPU busy-waiting.
> * **Production Reality:** Staged asynchronous pipeline execution in Netty, Reactor, and multi-phase batch initialization workflows.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 15.5), we are given the template:

```java
public class Foo {
    public void first() { /* print "first" */ }
    public void second() { /* print "second" */ }
    public void third() { /* print "third" */ }
}
```

*"Ensure that regardless of the operating system thread scheduling order, first() finishes before second() begins, and second() finishes before third() begins."*

## 2. Synchronization Mechanics

```
[Thread A: first()]  ──> [Execute Task 1] ──> sem1.release() ──┐
                                                               │
[Thread B: second()] ──> sem1.acquire() <──────────────────────┘
                           │
                           ▼
                         [Execute Task 2] ──> sem2.release() ──┐
                                                               │
[Thread C: third()]  ──> sem2.acquire() <──────────────────────┘
                           │
                           ▼
                         [Execute Task 3]
```

## Production Java Implementations

### Approach 1: Zero-Permit Semaphores (Canonical & Clean)

```java
import java.util.concurrent.Semaphore;

public class Foo {
    private final Semaphore sem1;
    private final Semaphore sem2;

    public Foo() {
        // Initialized with 0 permits: acquire() calls will block immediately
        this.sem1 = new Semaphore(0);
        this.sem2 = new Semaphore(0);
    }

    public void first(Runnable printFirst) {
        // Step 1: Execute first task
        printFirst.run();
        // Signal Thread B
        sem1.release();
    }

    public void second(Runnable printSecond) throws InterruptedException {
        // Block until first() signals
        sem1.acquire();
        // Step 2: Execute second task
        printSecond.run();
        // Signal Thread C
        sem2.release();
    }

    public void third(Runnable printThird) throws InterruptedException {
        // Block until second() signals
        sem2.acquire();
        // Step 3: Execute third task
        printThird.run();
    }
}
```

### Approach 2: CountDownLatch (Single-Shot Coordination)

```java
import java.util.concurrent.CountDownLatch;

public class FooLatch {
    private final CountDownLatch latch1 = new CountDownLatch(1);
    private final CountDownLatch latch2 = new CountDownLatch(1);

    public void first(Runnable printFirst) {
        printFirst.run();
        latch1.countDown();
    }

    public void second(Runnable printSecond) throws InterruptedException {
        latch1.await();
        printSecond.run();
        latch2.countDown();
    }

    public void third(Runnable printThird) throws InterruptedException {
        latch2.await();
        printThird.run();
    }
}
```

## Comparison of Synchronization Primitives

| Mechanism | CPU Overhead | Reusability | Interruption Handling |
|---|---|---|---|
| **`Semaphore(0)`** | **$0\%$ (Kernel parked)** | Reusable across cycles | Throws `InterruptedException` cleanly |
| **`CountDownLatch`** | **$0\%$ (Kernel parked)** | One-shot only (Cannot reset) | Throws `InterruptedException` cleanly |
| **`volatile` Spin-Lock** | $100\%$ CPU core saturation | Reusable | Requires manual cancellation checks |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Asynchronous Staged Pipelines

1. **Reactive Streams & Netty Pipelines:** In high-throughput network engines, staged channel handlers guarantee strict message processing order (Decode $\to$ Authenticate $\to$ Route) using Promise chains and event loop queues without blocking OS threads.
2. **Database Migration Initialization:** During microservice startup, healthcheck probes await sequential completion of Schema Migrations $\to$ Cache Pre-Warming $\to$ HTTP Port Binding.

## Edge Cases & Production Hardening

1. **Thread Interruption:** If a thread waiting on `acquire()` or `await()` is interrupted, restore the thread interrupt flag with `Thread.currentThread().interrupt()`.
2. **Exception in Prior Stage:** Wrap step executions in `try-finally` blocks to guarantee downstream latches are released or set to an error state if an uncaught exception occurs.
