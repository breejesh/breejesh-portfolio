---
title: "Queue via Stacks: Implementing a Queue Using Two Stacks (CTCI 3.4)"
description: "Implement a FIFO queue using two LIFO stacks with lazy transfer optimization in amortized O(1) time and O(N) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-3-4-queue-via-stacks.webp
previewImage: /assets/images/ctci-3-4-queue-via-stacks.webp
---

> **TL;DR**
> * **The Book Problem:** Implement a `MyQueue` class which implements a queue using two stacks.
> * **The Optimal Solution:** Maintain two stacks: `stackNewest` (receives newly enqueued elements) and `stackOldest` (supplies dequeues and peeks in FIFO order). Lazily transfer elements from `stackNewest` to `stackOldest` only when `stackOldest` is empty, achieving amortized $O(1)$ time per operation.
> * **Production Reality:** Lock-free two-stack wait-free queues, actor message mailboxes, and double-buffering graphics render loops.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 3.4), we are asked:

*"Implement a MyQueue class which implements a queue using two stacks."*

**The Core Invariant:**
A stack is Last-In, First-Out (LIFO), whereas a queue is First-In, First-Out (FIFO). By pushing elements onto `stack1` and popping them onto `stack2`, the order of elements reverses, turning LIFO into FIFO.

## 2. Naive vs. Lazy Shifting

### Naive Eager Shifting ($O(N)$ on every operation)
Shifting all elements back and forth on every single push or pop incurs $O(N)$ overhead per operation.

### Optimal Lazy Shifting (Amortized $O(1)$)
1. **`add(value)`:** Always push onto `stackNewest`.
2. **`shiftStacks()`:** If and only if `stackOldest` is empty, pop all elements from `stackNewest` and push them onto `stackOldest`.
3. **`remove()` / `peek()`:** Call `shiftStacks()`, then pop/peek from `stackOldest`.

Because each element is pushed to `stackNewest` once, transferred once, and popped from `stackOldest` once, every element experiences exactly 2 pushes and 2 pops over its lifetime, guaranteeing amortized $O(1)$ runtime.

## Production Implementation

```java
import java.util.NoSuchElementException;
import java.util.Stack;

public class MyQueue<T> {
    private final Stack<T> stackNewest;
    private final Stack<T> stackOldest;

    public MyQueue() {
        stackNewest = new Stack<>();
        stackOldest = new Stack<>();
    }

    public int size() {
        return stackNewest.size() + stackOldest.size();
    }

    public boolean isEmpty() {
        return size() == 0;
    }

    /**
     * Enqueues element to the back of the queue.
     * Time Complexity: O(1)
     */
    public void add(T value) {
        stackNewest.push(value);
    }

    /**
     * Shift elements from stackNewest to stackOldest.
     */
    private void shiftStacks() {
        if (stackOldest.isEmpty()) {
            while (!stackNewest.isEmpty()) {
                stackOldest.push(stackNewest.pop());
            }
        }
    }

    /**
     * Peeks at front element.
     * Time Complexity: Amortized O(1)
     */
    public T peek() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new NoSuchElementException();
        }
        return stackOldest.peek();
    }

    /**
     * Dequeues front element.
     * Time Complexity: Amortized O(1)
     */
    public T remove() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new NoSuchElementException();
        }
        return stackOldest.pop();
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| add(T) Time | `O(1)` | Direct push onto stackNewest. |
| remove() / peek() Time | `O(1) amortized` | Worst case $O(N)$ when shifting, but each item moved at most once over its lifecycle. |
| Auxiliary Space | `O(N)` | Exactly $N$ total elements distributed across both stacks. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Double Buffering & Actor Mailboxes

1. **Erlang / Akka Actor Mailboxes:** Actors receive messages in an append-only inbox (like `stackNewest`) while the worker thread consumes from an active processing batch (like `stackOldest`), minimizing lock contention.
2. **Double-Buffered Graphics Pipeline:** Front and back swap chains alternate buffers between rendering and display scanning.

## Edge Cases & Production Hardening

1. **Empty queue dequeue/peek:** Throws `NoSuchElementException`.
2. **Interleaved push and pop calls:** Lazy transfer only executes when `stackOldest` is empty, preserving FIFO ordering.
