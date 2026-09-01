---
title: "Synchronized Methods: Java Object Monitor Locks and Thread Race Invariants (CTCI 15.6)"
description: "Deconstruct Java synchronized instance methods, intrinsic monitor locks (Mark Word), non-synchronized execution races, and class-level locks."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-15-6-synchronized-methods.webp
previewImage: /assets/images/ctci-15-6-synchronized-methods.webp
---

> **TL;DR**
> * **The Book Problem:** You are given a class with `synchronized` method A and normal method B. If you have two threads on one instance of the class, can they both execute A at the same time? Can they execute A and B at the same time?
> * **The Concurrency Rules:**
>   1. **Two Threads on Method A (Same Instance)**: **NO**. Entering an instance `synchronized` method acquires the intrinsic monitor lock on `this`. Thread 2 blocks in the JVM `BLOCKED` state until Thread 1 exits method A.
>   2. **One Thread on A, One Thread on B (Same Instance)**: **YES**. Method B is non-synchronized; it does not request the `this` monitor lock and executes concurrently without contention.
>   3. **If Method B is Also Synchronized**: **NO**. Both methods compete for the exact same `this` monitor lock.
>   4. **Across Different Instances (`obj1` vs `obj2`)**: **YES**. Each heap object possesses an independent monitor lock in its object header Mark Word.
>   5. **Static Synchronized**: Locks the `Class` object (`Foo.class`), independent of instance locks.
> * **Production Reality:** Thread safety hazards in Spring singleton services and lock contention profiling via Java Flight Recorder (JFR).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 15.6), we are asked:

```java
public class MyClass {
    public synchronized void methodA() { /* Critical Section */ }
    public void methodB() { /* Normal Execution */ }
}
```

*"If two threads have a reference to the same MyClass instance, can they both execute methodA() simultaneously? Can they execute methodA() and methodB() simultaneously?"*

## 2. JVM Monitor Lock Internals (Object Header Layout)

```
[Java Heap Object Header]
┌─────────────────────────────────────────────────────────────┐
│ Mark Word (64 bits)                                         │
│  - Lock State (01: Biased/Unlocked, 00: Lightweight, 10: Heavy Monitor)│
│  - Pointer to ObjectMonitor (owner thread, EntryList, WaitSet) │
├─────────────────────────────────────────────────────────────┤
│ Klass Word (Pointer to Class Metadata in Metaspace)          │
└─────────────────────────────────────────────────────────────┘
```

When a thread enters `synchronized methodA()`, the JVM emits bytecode instructions `monitorenter` and `monitorexit`. Method B lacks these instructions and bypasses the monitor entirely.

## 3. Concurrency Scenario Matrix

| Scenario | Threads Involved | Target Methods | Target Instances | Can Execute Concurrently? | Root Technical Reason |
|---|---|---|---|---|---|
| **Scenario 1** | $T_1$ and $T_2$ | `methodA()` and `methodA()` | Same `obj` | **NO** | Compete for single `this` monitor lock. |
| **Scenario 2** | $T_1$ and $T_2$ | `methodA()` and `methodB()` | Same `obj` | **YES** | `methodB()` never queries the monitor lock. |
| **Scenario 3** | $T_1$ and $T_2$ | `methodA()` and `methodB()` (both `sync`) | Same `obj` | **NO** | Both require `this` monitor lock. |
| **Scenario 4** | $T_1$ and $T_2$ | `methodA()` and `methodA()` | `obj1` and `obj2` | **YES** | Independent object headers in heap. |
| **Scenario 5** | $T_1$ and $T_2$ | `static sync` vs `instance sync` | Same `obj` | **YES** | Locks `Foo.class` vs `obj` (distinct monitors). |

## Production Java Demonstration

```java
public class SynchronizedDemo {
    private int sharedCounter = 0;

    // Synchronized: Acquires 'this' monitor
    public synchronized void methodA(String threadName) {
        System.out.println(threadName + " ENTERED methodA (holding monitor)");
        try {
            Thread.sleep(1000); // Simulate heavy computation
            sharedCounter += 10;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println(threadName + " EXITED methodA (released monitor)");
    }

    // Normal: Does NOT acquire any monitor
    public void methodB(String threadName) {
        System.out.println(threadName + " EXECUTING methodB concurrently! (sharedCounter=" + sharedCounter + ")");
    }

    public static void main(String[] args) {
        SynchronizedDemo instance = new SynchronizedDemo();

        // Thread 1 calls synchronized methodA
        new Thread(() -> instance.methodA("Thread-1")).start();

        // Thread 2 calls non-synchronized methodB at the exact same time
        new Thread(() -> {
            try { Thread.sleep(200); } catch (InterruptedException ignored) {}
            instance.methodB("Thread-2"); // Executes immediately!
        }).start();

        // Thread 3 attempts to call methodA on the same instance
        new Thread(() -> {
            try { Thread.sleep(300); } catch (InterruptedException ignored) {}
            instance.methodA("Thread-3"); // BLOCKED until Thread-1 finishes!
        }).start();
    }
}
```

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Data Races on Non-Synchronized Methods

1. **Unsynchronized Read Race:** If `methodB()` reads `sharedCounter` while `methodA()` is mutating it, the JVM Memory Model allows `methodB()` to see stale or partially written state due to CPU core store buffer caching (unless declared `volatile`).
2. **Lock Granularity Optimization:** Locking entire methods with `synchronized` causes severe throughput bottlenecks in web servers. Production systems use fine-grained `ReentrantReadWriteLock` or `StampedLock` to permit concurrent readers while isolating writers.

## Edge Cases & Production Hardening

1. **Deadlock via Lock Inversion:** If `obj1.A()` invokes `obj2.A()` while `obj2.A()` invokes `obj1.A()`, both threads lock each other out permanently.
2. **Virtual Threads (Project Loom):** In Java 21+, pinning virtual threads to carrier threads during `synchronized` blocks has been mitigated, but `ReentrantLock` remains preferred for long I/O operations.
