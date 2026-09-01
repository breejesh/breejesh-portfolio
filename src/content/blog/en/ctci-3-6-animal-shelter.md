---
title: "Animal Shelter: FIFO Multi-Category Adoption Queue (CTCI 3.6)"
description: "Implement an Animal Shelter FIFO adoption queue maintaining separate Dog and Cat queues with timestamped order tracking in O(1) time and O(N) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-3-6-animal-shelter.webp
previewImage: /assets/images/ctci-3-6-animal-shelter.webp
---

> **TL;DR**
> * **The Book Problem:** An animal shelter holds only dogs and cats and operates on a strictly FIFO basis. Adopters can choose the oldest animal overall (`dequeueAny`), or select specifically the oldest dog (`dequeueDog`) or oldest cat (`dequeueCat`). Implement the system using `LinkedList`.
> * **The Optimal Solution:** Maintain two separate queues `LinkedList<Dog> dogs` and `LinkedList<Cat> cats`. Assign an incrementing global `order` (timestamp) to each animal upon `enqueue`. `dequeueAny` inspects the head elements of both queues and dequeues the one with the smaller `order` in $O(1)$ time.
> * **Production Reality:** Multi-tenant prioritized job schedulers (Celery / BullMQ), airline multi-class boarding queues, and resource-specific dispatch pipelines.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 3.6), we are asked:

*"An animal shelter, which holds only dogs and cats, operates on a strictly 'first in, first out' basis. People must adopt either the 'oldest' (based on arrival time) of all animals at the shelter, or they can select whether they would prefer a dog or a cat (and will receive the oldest animal of that type). They cannot select specific animals. Create the data structures to maintain this system and implement operations such as enqueue, dequeueAny, dequeueDog, and dequeueCat. You may use the built-in LinkedList data structure."*

## 2. Why a Single Queue Fails

If we use a single `LinkedList<Animal>`:
* `dequeueAny()` runs in $O(1)$ time by popping the head.
* `dequeueDog()` or `dequeueCat()` requires scanning the entire list to find the first matching animal type, running in $O(N)$ time and requiring element unlinking.

## 3. Dual-Queue Design with Monotonic Order Timestamps

To achieve $O(1)$ across all operations:
1. Maintain separate `LinkedList<Dog> dogs` and `LinkedList<Cat> cats`.
2. Wrap animals in an abstract `Animal` class containing an integer `order`.
3. **`enqueue(animal)`:** Set `animal.setOrder(order++)` and append to the corresponding queue in $O(1)$.
4. **`dequeueDog()`:** Pop head of `dogs` in $O(1)$.
5. **`dequeueCat()`:** Pop head of `cats` in $O(1)$.
6. **`dequeueAny()`:** Peek at the heads of both `dogs` and `cats`. Return the animal with the smaller `order` value in $O(1)$.

## Production Implementation

```java
import java.util.LinkedList;

public class AnimalShelter {
    public static abstract class Animal {
        private int order;
        protected String name;

        public Animal(String n) { name = n; }
        public void setOrder(int ord) { order = ord; }
        public int getOrder() { return order; }
        public String getName() { return name; }

        public boolean isOlderThan(Animal a) {
            return this.order < a.getOrder();
        }
    }

    public static class Dog extends Animal {
        public Dog(String n) { super(n); }
    }

    public static class Cat extends Animal {
        public Cat(String n) { super(n); }
    }

    private final LinkedList<Dog> dogs = new LinkedList<>();
    private final LinkedList<Cat> cats = new LinkedList<>();
    private int order = 0; // Acts as timestamp

    public void enqueue(Animal a) {
        a.setOrder(order++);
        if (a instanceof Dog) {
            dogs.addLast((Dog) a);
        } else if (a instanceof Cat) {
            cats.addLast((Cat) a);
        }
    }

    public Animal dequeueAny() {
        if (dogs.isEmpty()) {
            return dequeueCat();
        } else if (cats.isEmpty()) {
            return dequeueDog();
        }

        Dog dog = dogs.peek();
        Cat cat = cats.peek();

        if (dog.isOlderThan(cat)) {
            return dequeueDog();
        } else {
            return dequeueCat();
        }
    }

    public Dog dequeueDog() {
        return dogs.poll();
    }

    public Cat dequeueCat() {
        return cats.poll();
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| enqueue Time | `O(1)` | Direct timestamp assignment + tail insert into linked list. |
| dequeueAny Time | `O(1)` | Compares head timestamps of both queues. |
| dequeueDog / dequeueCat Time | `O(1)` | Direct poll from specific linked list head. |
| Auxiliary Space | `O(N)` | Total memory proportional to number of animals in shelter. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Multi-Lane Dispatch Queues

1. **Job Scheduling (Celery, BullMQ, Sidekiq):** Background workers process high-priority vs standard-priority queues while maintaining global FIFO order across batches using sequence generators.
2. **Database Write-Ahead Logging (WAL):** Multi-table replication engines tag transaction records with monotonic Log Sequence Numbers (LSNs) to interleave concurrent commit streams.

## Edge Cases & Production Hardening

1. **Only dogs remaining:** `dequeueAny()` delegates cleanly to `dequeueDog()`.
2. **Only cats remaining:** `dequeueAny()` delegates cleanly to `dequeueCat()`.
3. **Empty shelter:** Returns `null` cleanly without exceptions.
