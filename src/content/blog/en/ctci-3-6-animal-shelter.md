---
title: "Animal Shelter: FIFO Adoption with Dogs and Cats (Java)"
description: "CTCI-style problem 3.6 for beginners: an animal shelter holds only dogs and cats on a strict first-in first-out line. Build enqueue, dequeueAny, dequeueDog, and dequeueCat with two queues plus an arrival order."
date: "2025-09-28"
tags: [Algorithms]
coverImage: /assets/images/ctci-3-6-animal-shelter.webp
previewImage: /assets/images/ctci-3-6-animal-shelter.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 3.6 for beginners: an animal shelter holds only dogs and cats on a strict first-in first-out line. Build enqueue, dequeueAny, dequeueDog, and dequeueCat with two queues plus an arrival order.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A shelter runs a fair line. Animals arrive one by one. Adopters can take the animal that has waited the longest overall, or they can ask only for a dog or only for a cat and get the oldest of that type. Nobody gets to point at a specific pet by name. That rule is pure **FIFO**, with a type filter on top.

This post is original teaching for beginners in **Java**. Same problem family as classic interview queue design, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 3 ends here.

---

## 1. Shelter analogy

Picture two waiting rooms behind the front desk:

* Room D: dogs only, lined up by arrival time.
* Room C: cats only, lined up by arrival time.

Every animal gets a ticket number when it arrives: 0, 1, 2, 3, ... Smaller ticket means arrived earlier. The ticket is not a wall clock. It is an integer counter the shelter owns.

When someone says **"any animal"**, the clerk peeks at the front of both rooms and picks the animal with the smaller ticket. When someone says **"a dog"**, the clerk only looks at room D. Same idea for cats.

One shared queue of mixed animals would make "any" easy, but "dog only" would force walking past cats until the first dog. Two typed queues keep every operation at the front of a list.

---

## 2. Plain problem statement

**Goal:** data structures and methods for a shelter that holds only dogs and cats under strict FIFO.

**Operations:**

| Method | Meaning |
| --- | --- |
| `enqueue(animal)` | animal arrives; put it at the back of its type queue |
| `dequeueAny()` | adopt the oldest animal of either type |
| `dequeueDog()` | adopt the oldest dog |
| `dequeueCat()` | adopt the oldest cat |

**Rules:**

* Only dogs and cats.
* "Oldest" means earliest arrival, not biological age.
* Adopters cannot pick a specific animal by identity, only by type (or any).
* You may use a built-in linked list or queue.

**Clarify before coding:**

* What if the shelter is empty? (Return `null` or throw; pick one and stick to it.)
* What if they ask for a dog and no dogs remain? (Same contract.)
* Can the same name appear twice? (Yes. Identity is the object plus order, not the name string.)

---

## 3. Think first

### One mixed queue

Store every animal in a single `LinkedList<Animal>`.

* `dequeueAny` is `removeFirst`: O(1).
* `dequeueDog` walks from the front until the first dog: O(N) worst case.
* Same cost for cats.

Works, and interviews sometimes accept it. It is not the clean answer when you are allowed two lists.

### Two queues plus order (preferred)

Keep:

* `dogs`: queue of dogs
* `cats`: queue of cats
* `order`: integer that increments on every enqueue (a logical timestamp)

On enqueue:

1. Stamp the animal with the current `order`, then `order++`.
2. Push onto the dog queue or the cat queue based on type.

On `dequeueAny`:

1. If one side is empty, dequeue the other.
2. If both have animals, peek both fronts and dequeue the one with the smaller order (older arrival).
3. If both empty, return `null` (or your empty contract).

On `dequeueDog` / `dequeueCat`: poll that queue only.

Why inheritance? `dequeueAny` returns either a dog or a cat, so both types share a common `Animal` base. Order comparison lives on that base so the clerk never cares about the concrete class beyond "which room".

---

## 4. Java solution

```java
import java.util.LinkedList;

abstract class Animal {
    private int order;
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public int getOrder() {
        return order;
    }

    /** True if this animal arrived before the other. */
    public boolean isOlderThan(Animal other) {
        return this.order < other.getOrder();
    }

    public String getName() {
        return name;
    }
}

class Dog extends Animal {
    public Dog(String name) {
        super(name);
    }
}

class Cat extends Animal {
    public Cat(String name) {
        super(name);
    }
}

class AnimalQueue {
    private LinkedList<Dog> dogs = new LinkedList<>();
    private LinkedList<Cat> cats = new LinkedList<>();
    private int order = 0; // arrival counter, not wall-clock time

    public void enqueue(Animal a) {
        a.setOrder(order);
        order++;

        if (a instanceof Dog) {
            dogs.addLast((Dog) a);
        } else if (a instanceof Cat) {
            cats.addLast((Cat) a);
        } else {
            throw new IllegalArgumentException("Only dogs and cats");
        }
    }

    public Animal dequeueAny() {
        if (dogs.isEmpty() && cats.isEmpty()) {
            return null;
        }
        if (dogs.isEmpty()) {
            return dequeueCat();
        }
        if (cats.isEmpty()) {
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
        return dogs.isEmpty() ? null : dogs.poll();
    }

    public Cat dequeueCat() {
        return cats.isEmpty() ? null : cats.poll();
    }
}
```

Walkthrough:

| Step | Action | dogs front | cats front | notes |
| --- | --- | --- | --- | --- |
| 1 | enqueue Dog("Rex") order 0 | Rex | - | |
| 2 | enqueue Cat("Mimi") order 1 | Rex | Mimi | |
| 3 | enqueue Dog("Buddy") order 2 | Rex | Mimi | Buddy behind Rex |
| 4 | dequeueAny | Buddy | Mimi | Rex leaves (order 0 wins over 1) |
| 5 | dequeueCat | Buddy | - | Mimi leaves; only cat available |
| 6 | dequeueAny | - | - | Buddy leaves |

Equal orders should not happen if you only assign through `enqueue`. If you ever used real timestamps and two animals tied, either animal is fine under the problem rules.

You could store order as a long wall-clock millis instead of an int counter. The counter is simpler in interviews: no clock skew, no "same millisecond" debate, and comparison is a plain integer less-than.

---

## 5. Complexity table

| Operation | Time | Extra space notes |
| --- | --- | --- |
| `enqueue` | O(1) | one stamp + addLast on a linked list |
| `dequeueDog` / `dequeueCat` | O(1) | poll front of that queue |
| `dequeueAny` | O(1) | two peeks + one poll |
| Single mixed queue + scan for type | O(N) dequeue by type | simpler structure, worse typed adopt |

Space is O(N) for N animals still in the shelter. The order field is O(1) per animal.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty shelter** on any dequeue → return `null` (or throw). Do not peek without checking.
* **Only dogs** (or only cats) on `dequeueAny` → take from the non-empty side without comparing.
* **One dog, many cats** → typed dequeues never steal from the wrong queue; order still decides `dequeueAny`.
* **Unknown Animal subclass** → reject on enqueue if you only support dog and cat.
* **Name collisions** → "Max" the dog and "Max" the cat are different objects with different orders.

Common mistakes:

1. **One list and linear scan for every typed adopt.** Fine as a first sketch. Call out the O(N) cost and move to two queues.
2. **Forgetting the order stamp.** Then you cannot compare the fronts of the two queues fairly.
3. **Comparing names or hash codes instead of arrival order.** Arrival order is the only fair key.
4. **Using `remove` on a random index.** Always take from the front of the type queue.
5. **Mutating order after enqueue.** The ticket is fixed at arrival.
6. **Returning from the wrong queue when orders are close.** Always peek both when both are non-empty; do not alternate dog/cat by habit.

Minimal usage sketch:

```java
AnimalQueue shelter = new AnimalQueue();
shelter.enqueue(new Dog("Rex"));
shelter.enqueue(new Cat("Mimi"));
Animal any = shelter.dequeueAny(); // Rex
Dog dog = shelter.dequeueDog();    // null if no dogs left
Cat cat = shelter.dequeueCat();    // Mimi if still present
```

---

## 7. Explain to a friend recap

Animal Shelter is a queue design problem with a type filter:

1. Hold dogs in one queue, cats in another. Both stay FIFO.
2. Stamp every arrival with an increasing order number.
3. `dequeueDog` / `dequeueCat` poll that queue only.
4. `dequeueAny` peeks both fronts and takes the smaller order (older animal). If one side is empty, take the other.
5. Dogs and cats share an `Animal` base so `dequeueAny` can return either type.

If you can draw two lines, explain the ticket number, and run `dequeueAny` when both rooms have a front animal, you own problem 3.6. Chapter 3 closes with a data structure that is mostly two queues and one comparison.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Sort Stack](/blog/en/ctci-3-5-sort-stack)
* Next: [Route Between Nodes](/blog/en/ctci-4-1-route-between-nodes)