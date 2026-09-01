---
title: "Circular Array: Generic Rotating Data Structure with Iterator Support (CTCI 7.9)"
description: "Implement a CircularArray class in Java supporting generic types, array rotation, and the Iterable interface using index modulo offset mapping in O(1) time."
date: "2026-05-06"
tags: [Algorithmes et Structures, Design Système et Architecture]
coverImage: /assets/images/ctci-7-9-circular-array.webp
previewImage: /assets/images/ctci-7-9-circular-array.webp
---

> **TL;DR**
> * **The Book Problem:** Implement a CircularArray class that supports an array-like data structure which can be efficiently rotated. Support generics and iterating via standard for-each loops.
> * **The Core Breakthrough:** Modulo Head Offset Mapping: Instead of shifting array elements in $O(N)$ time on every rotate, maintain a single integer `head = (head + shift) % size` and map indices via `(head + i) % size` in $O(1)$ time.
> * **Production Reality:** Fixed-size metrics ring buffers and network packet latency sliding windows.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.9), we are asked to implement a generic `CircularArray<T>` supporting:
* `rotate(int shiftRight)`: Rotates the array in $O(1)$ time.
* `get(int index)` / `set(int index, T item)`: Accesses elements in $O(1)$ time.
* `implements Iterable<T>`: Allows clean `for (T item : circularArray)` iteration.

## 2. The Zero-Copy Modulo Pointer Mechanism

Shifting elements in an array on every rotate takes $O(N)$ operations.

*Optimal Design:* Store the items in a fixed array `T[] items` and maintain an integer `head` pointing to the logical index 0. To rotate the array right by `shift`, update `head = convert(shift)` in $O(1)$ time. Any access to logical index `i` is translated to internal index `(head + i) % items.length`.

## Implémentation de production

```java
import java.util.Iterator;

public class CircularArray<T> implements Iterable<T> {
    private T[] items;
    private int head = 0;

    @SuppressWarnings("unchecked")
    public CircularArray(int size) {
        items = (T[]) new Object[size];
    }

    private int convert(int index) {
        if (index < 0) index += items.length;
        return (head + index) % items.length;
    }

    public void rotate(int shiftRight) {
        head = convert(shiftRight);
    }

    public T get(int i) {
        if (i < 0 || i >= items.length) throw new IndexOutOfBoundsException();
        return items[convert(i)];
    }

    public void set(int i, T item) {
        items[convert(i)] = item;
    }

    @Override
    public Iterator<T> iterator() {
        return new CircularArrayIterator();
    }

    private class CircularArrayIterator implements Iterator<T> {
        private int current = -1;

        @Override
        public boolean hasNext() { return current < items.length - 1; }

        @Override
        public T next() {
            current++;
            return items[convert(current)];
        }
    }
}
```

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| rotate(shift) Time | `O(1)` | Single integer arithmetic update. |
| get(i) / set(i) Time | `O(1)` | Single modulo index translation. |
| Iteration Time | `O(N)` | Standard linear forward scan. |

## Analyse d'ingénierie système en production réelle

High-throughput messaging queues (LMAX Disruptor) and Linux network socket buffers use modulo ring index translation to pass packets between threads with zero memory copy overhead.

## Cas limites et durcissement en production

1. Negative rotation shifts (`rotate(-5)`): Handled cleanly with `index += items.length`.
2. Out of bounds access: Throws standard IndexOutOfBoundsException.
