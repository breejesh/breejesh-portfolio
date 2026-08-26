---
title: "FizzBuzz Multithreaded: Concurrency Synchronization in Java (CTCI 15.7)"
description: "CTCI problem 15.7 in Java: implement a multithreaded FizzBuzz using synchronized state coordination across four worker threads."
date: "2026-04-03"
tags: [Algorithms & Data Structures, Backend & Databases]
coverImage: /assets/images/ctci-15-7-fizzbuzz.webp
previewImage: /assets/images/ctci-15-7-fizzbuzz.webp
---

> **TL;DR**
> * **The Problem:** Print the standard FizzBuzz sequence up to $N$ using four dedicated concurrent threads: `Fizz`, `Buzz`, `FizzBuzz`, and `Number`.
> * **The Insight:** Use a shared lock and condition variables (or synchronized counter blocks) where each thread tests its mathematical divisibility condition and signals the next step.
> * **Complexity:** $O(N)$ Time with strictly ordered output across all four threads.

Four threads run concurrently:
- Thread A prints `fizz` for multiples of 3.
- Thread B prints `buzz` for multiples of 5.
- Thread C prints `fizzbuzz` for multiples of 15.
- Thread D prints numbers not divisible by 3 or 5.

---

## 1. Complete Java Multithreaded Implementation

```java
import java.util.function.IntConsumer;

public class FizzBuzzMultithreaded {
    private final int n;
    private int current = 1;
    private final Object lock = new Object();

    public FizzBuzzMultithreaded(int n) {
        this.n = n;
    }

    public void fizz(Runnable printFizz) throws InterruptedException {
        while (true) {
            synchronized (lock) {
                while (current <= n && (current % 3 != 0 || current % 5 == 0)) {
                    lock.wait();
                }
                if (current > n) return;
                printFizz.run();
                current++;
                lock.notifyAll();
            }
        }
    }

    public void buzz(Runnable printBuzz) throws InterruptedException {
        while (true) {
            synchronized (lock) {
                while (current <= n && (current % 5 != 0 || current % 3 == 0)) {
                    lock.wait();
                }
                if (current > n) return;
                printBuzz.run();
                current++;
                lock.notifyAll();
            }
        }
    }

    public void fizzbuzz(Runnable printFizzBuzz) throws InterruptedException {
        while (true) {
            synchronized (lock) {
                while (current <= n && (current % 15 != 0)) {
                    lock.wait();
                }
                if (current > n) return;
                printFizzBuzz.run();
                current++;
                lock.notifyAll();
            }
        }
    }

    public void number(IntConsumer printNumber) throws InterruptedException {
        while (true) {
            synchronized (lock) {
                while (current <= n && (current % 3 == 0 || current % 5 == 0)) {
                    lock.wait();
                }
                if (current > n) return;
                printNumber.accept(current);
                current++;
                lock.notifyAll();
            }
        }
    }
}
```

---

## 2. Complexity & Key Takeaways

| Metric | Value | Explanation |
| --- | --- | --- |
| **Total Time** | $O(N)$ | Exactly $N$ printed values in deterministic sequence |
| **Synchronization** | Monitor Pattern | Condition loop prevents spurious wakeups |
| **Deadlock Risk** | Zero | Single shared monitor with `notifyAll()` broadcast |
