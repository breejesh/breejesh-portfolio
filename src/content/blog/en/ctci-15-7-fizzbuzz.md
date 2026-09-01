---
title: "Multithreaded FizzBuzz: 4-Thread Synchronization and Monitor Conditions (CTCI 15.7)"
description: "Implement multithreaded FizzBuzz across 4 coordinated worker threads using Java intrinsic object monitors, wait/notifyAll barriers, and predicates."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-15-7-fizzbuzz.webp
previewImage: /assets/images/ctci-15-7-fizzbuzz.webp
---

> **TL;DR**
> * **The Book Problem:** Implement a multithreaded version of FizzBuzz with 4 threads: Thread A outputs "FizzBuzz" (divisible by 3 and 5), Thread B outputs "Fizz" (divisible by 3 only), Thread C outputs "Buzz" (divisible by 5 only), and Thread D outputs the raw number. The sequence $1..N$ must print in strict ascending order.
> * **The Optimal Solution:** **State Machine Loop with Synchronized Monitor and `wait()`/`notifyAll()`**:
>   1. Maintain a shared integer counter `current = 1` protected by an intrinsic lock object.
>   2. Each thread executes a loop until `current > n`. Inside the loop, it tests its respective divisibility predicate.
>   3. If its predicate is FALSE, the thread calls `lock.wait()` to release the lock and enter the wait set.
>   4. If its predicate is TRUE, the thread prints its respective token, increments `current++`, and calls `lock.notifyAll()` to wake the other 3 worker threads.
>   5. Runs in **$O(N)$ time** with strictly coordinated thread transitions.
> * **Production Reality:** Coordinated round-robin worker pools and message dispatching event loops in concurrent stream processors.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 15.7), we are asked:

*"Implement a multithreaded version of FizzBuzz using four dedicated threads that evaluate mathematical divisibility predicates and emit the sequence 1 to n in deterministic order."*

## 2. Multi-Threaded State Machine Transition

```
                ┌───────────────────────────────┐
                │        Shared State:          │
                │        current = 1..N         │
                └──────────────┬────────────────┘
                               │ lock.notifyAll()
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Thread 1 (Fizz)  │  │ Thread 2 (Buzz)  │  │ Thread 3 (FizzB) │
│ (curr % 3 == 0)  │  │ (curr % 5 == 0)  │  │ (curr % 15 == 0) │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ Thread 4 (Number)│
                      │ (Neither 3 nor 5)│
                      └──────────────────┘
```

## Production Java Implementation

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
                    lock.notifyAll(); // Wake all worker threads to re-evaluate predicates
                } else {
                    lock.wait(); // Yield lock and sleep until next number transition
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

    public static void main(String[] args) {
        int n = 15;
        FizzBuzzMultithreaded fb = new FizzBuzzMultithreaded(n);

        Thread t1 = new Thread(() -> {
            try { fb.fizz(() -> System.out.print("Fizz, ")); } catch (InterruptedException ignored) {}
        });

        Thread t2 = new Thread(() -> {
            try { fb.buzz(() -> System.out.print("Buzz, ")); } catch (InterruptedException ignored) {}
        });

        Thread t3 = new Thread(() -> {
            try { fb.fizzbuzz(() -> System.out.print("FizzBuzz, ")); } catch (InterruptedException ignored) {}
        });

        Thread t4 = new Thread(() -> {
            try { fb.number(i -> System.out.print(i + ", ")); } catch (InterruptedException ignored) {}
        });

        t1.start(); t2.start(); t3.start(); t4.start();
    }
}
```

## Complexity & Thread Synchronization Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Exactly $N$ successful iterations producing output tokens. |
| Memory Footprint | `O(1)` | Single shared integer counter and monitor wait queue. |
| Context Switch Count | $O(N)$ | Strictly bounded wake/sleep cycles per transition. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Work Stealing and Condition Variables

1. **Explicit `Lock` and `Condition`:** Replacing intrinsic object monitors with `ReentrantLock` and four distinct `Condition` variables (one per worker category) eliminates spurious wakeups and thundering-herd contention on `notifyAll()`.
2. **Actor Model (Akka / Erlang):** In distributed actors, sequential stream interleaving is coordinated via message mailboxes, removing lock primitives completely.

## Edge Cases & Production Hardening

1. **Loop Termination Latch:** When `current` exceeds $n$, `notifyAll()` ensures all 3 dormant waiting threads wake up, observe the termination condition `current <= n` as false, and exit gracefully without deadlock.
2. **Interrupted Exceptions:** Threads handle `InterruptedException` to cleanly terminate on system shutdown.
