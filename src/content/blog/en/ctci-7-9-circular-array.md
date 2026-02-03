---
title: "Circular Array: O(1) Rotation with a Head Index (Java)"
description: "CTCI-style problem 7.9 for beginners: a generic CircularArray that rotates in O(1) by moving a head pointer, maps logical indices with modulo, and supports for-each via Iterable."
date: "2026-02-03"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-9-circular-array.webp
previewImage: /assets/images/ctci-7-9-circular-array.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 7.9 for beginners: a generic CircularArray that rotates in O(1) by moving a head pointer, maps logical indices with modulo, and supports for-each via Iterable.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You want an array you can **spin** without paying for a full copy. Rotate left or right, then walk the elements from the new front with a normal `for (T x : array)` loop. Shifting every cell on each rotate is the slow path. The interview answer keeps the items where they sit and moves a **head** index, then maps every logical index through that head with modulo.

This post is original teaching for beginners in **Java**. Same problem family as classic circular-buffer interview design, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7 (Object-Oriented Design) continues here with a small, sharp data structure.

---

## 1. Everyday analogy

Think of a **lazy Susan** on a dining table. Plates stay fixed on the tray. When someone rotates the tray, nobody lifts and reshuffles every plate. The tray turns; what faces you changes.

Your array is the tray. The plates are the elements. A single integer, `head`, remembers which physical slot is currently the **logical start**. `get(0)` always means "what faces the guest now," not "physical index 0."

When you rotate by `k`, you only update `head`. Iteration starts at that head and walks around the circle until every slot has been visited once.

---

## 2. Plain problem statement

**Goal:** implement a **CircularArray** that behaves like a fixed-size array with efficient rotation and standard for-each iteration.

**Requirements:**

* Store a fixed number of elements (capacity chosen at construction).
* `get(i)` / `set(i, value)` with **logical** indices `0 .. size-1` after the current rotation.
* `rotate(shiftRight)`: change the logical start without copying the whole array.
* Prefer a **generic** type `T` (Java template / type parameter).
* Support `for (T item : circularArray)` via `Iterable<T>`.

**Clarify before coding:**

* Fixed capacity or growable? Fixed is enough for this problem.
* What does `rotate(1)` mean? Logical index 0 becomes what used to be logical index 1 (head advances).
* Negative `rotate`? Useful; normalize with modulo so left and right both work.
* Empty size? Reject non-positive capacity in the constructor.
* Iterator `remove()`? Unsupported is fine unless asked.

**Tiny picture (`size = 4`, values A B C D):**

| head | Logical order via get(0)..get(3) | Physical array |
| --- | --- | --- |
| 0 | A B C D | `[A, B, C, D]` |
| 1 | B C D A | `[A, B, C, D]` (unchanged) |
| 2 | C D A B | still unchanged |
| 3 | D A B C | still unchanged |

Physical cells never move. Only the mapping moves.

---

## 3. Think first

### Bad idea: shift every element

```
rotate(1): copy items[1] into a temp buffer, or loop:
  for i in 0..n-2: items[i] = items[i+1]
  items[n-1] = first
```

That is **O(n)** per rotate. Fine for a one-off, painful if you rotate often or `n` is large. Interviewers expect you to call this out and discard it as the primary design.

### Good idea: head + index map

Keep:

* `items`: the raw array of length `n`
* `head`: physical index of the current logical start

**Convert logical index to physical:**

```
physical = (head + logical) mod n
```

Java's `%` is remainder, not mathematical mod: for negative values it can stay negative. So normalize before you index:

```
offset = logical % n
if offset < 0: offset += n
physical = (head + offset) % n
```

**Rotate by `k`:** set `head` to the physical index of what used to be logical `k`. That is exactly `head = convert(k)` if `convert` already folds in the current head. One assignment. **O(1)**.

### Iteration

A `for-each` needs `Iterable<T>`:

1. Class declares `implements Iterable<T>`.
2. `iterator()` returns an `Iterator<T>`.
3. Iterator tracks an offset `current` from the **rotated** head (`0, 1, 2, ...`), not a raw physical pointer alone.
4. `hasNext`: more offsets remain.
5. `next`: bump offset, return `items[convert(current)]`.

First call sequence in a for-each is `hasNext()` then `next()`. Start `current` at `-1` so the first `next()` lands on offset `0` (the logical front).

### Generics and arrays in Java

You cannot write `new T[size]`. Common pattern:

```java
items = (T[]) new Object[size];
```

Suppress the unchecked warning once at the constructor, or store `List<T>` instead. Array + cast is the usual CTCI-style answer; mention the warning so you sound deliberate.

---

## 4. Java solution

```java
import java.util.Iterator;
import java.util.NoSuchElementException;

/**
 * Fixed-capacity circular array.
 * rotate moves a head index; elements stay put.
 * Logical get/set and for-each all go through convert().
 */
public class CircularArray<T> implements Iterable<T> {
    private final T[] items;
    private int head = 0;

    @SuppressWarnings("unchecked")
    public CircularArray(int size) {
        if (size <= 0) {
            throw new IllegalArgumentException("size must be positive");
        }
        items = (T[]) new Object[size];
    }

    /** Map a logical index (and also raw shift amounts) into a physical slot. */
    private int convert(int index) {
        int n = items.length;
        int offset = index % n;
        if (offset < 0) {
            offset += n;
        }
        return (head + offset) % n;
    }

    /** New logical front is the old logical index shiftRight. O(1). */
    public void rotate(int shiftRight) {
        head = convert(shiftRight);
    }

    public T get(int i) {
        if (i < 0 || i >= items.length) {
            throw new IndexOutOfBoundsException("index " + i);
        }
        return items[convert(i)];
    }

    public void set(int i, T item) {
        if (i < 0 || i >= items.length) {
            throw new IndexOutOfBoundsException("index " + i);
        }
        items[convert(i)] = item;
    }

    public int size() {
        return items.length;
    }

    @Override
    public Iterator<T> iterator() {
        return new CircularArrayIterator();
    }

    /**
     * Walks logical offsets 0 .. n-1 from the current head.
     * Non-static inner class so convert() and items stay accessible.
     */
    private class CircularArrayIterator implements Iterator<T> {
        private int current = -1; // before first element

        @Override
        public boolean hasNext() {
            return current < items.length - 1;
        }

        @Override
        public T next() {
            if (!hasNext()) {
                throw new NoSuchElementException();
            }
            current++;
            return items[convert(current)];
        }

        @Override
        public void remove() {
            throw new UnsupportedOperationException("remove not supported");
        }
    }
}
```

Walkthrough: fill, rotate, read, iterate.

```java
CircularArray<String> ring = new CircularArray<>(4);
ring.set(0, "A");
ring.set(1, "B");
ring.set(2, "C");
ring.set(3, "D");
// logical: A B C D, head = 0

ring.rotate(1);
// head = 1; get(0)=B, get(1)=C, get(2)=D, get(3)=A

ring.rotate(2);
// from head=1, convert(2) -> head becomes 3
// logical: D A B C

for (String s : ring) {
    System.out.print(s + " "); // D A B C
}
```

| Step | Call | head | Logical view |
| --- | --- | --- | --- |
| start | sets A B C D | 0 | A B C D |
| 1 | `rotate(1)` | 1 | B C D A |
| 2 | `rotate(2)` | 3 | D A B C |
| 3 | for-each | 3 | D, then A, B, C |

Reuse `convert` everywhere: `get`, `set`, `rotate`, and the iterator. One place owns the modulo edge cases.

---

## 5. Complexity table

| Operation | Time | Extra space | Notes |
| --- | --- | --- | --- |
| `rotate(k)` | O(1) | O(1) | only updates `head` |
| `get` / `set` | O(1) | O(1) | one convert + array access |
| Full for-each | O(n) | O(1) iterator | visits each slot once |
| Naive rotate (shift elements) | O(n) | O(1) or O(n) | avoid as primary design |
| Construction | O(n) | O(n) for `items` | allocate fixed array |

Interviewers want the O(1) rotate story and a correct index map. Iterable is the second half of the grade.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **`rotate(0)`:** no-op; head stays.
* **`rotate(n)` or `rotate(multiple of n)`:** full turns; logical order unchanged. `% n` handles it.
* **Negative rotate:** `rotate(-1)` should move the head backward one logical step. Broken if you use raw `%` without fixing negatives.
* **`get` out of range:** throw on logical `i < 0` or `i >= n`. Do not silently wrap user indices unless you document wrap-around API.
* **Null elements:** allowed for reference types; do not special-case unless asked.
* **Iterator after rotate:** a new for-each uses the **current** head. An old iterator snapshot is a design choice; this simple version reads live `head` via `convert` (fine for single-threaded interview code).
* **Generic array creation:** cast from `Object[]`, or use `ArrayList`.
* **`size = 1`:** every rotate lands on the same element; still must not crash.

Common mistakes:

1. **Shifting the array in `rotate`.** Works, fails the efficiency ask.
2. **Forgetting negative modulo.** `-1 % 4` is `-1` in Java, not `3`.
3. **Iterator that walks physical indices from 0** without applying `head`. For-each then ignores rotation.
4. **Starting `current` at 0 and returning `items[convert(current)]` before incrementing wrong** so the first or last element is skipped or doubled. Trace `hasNext` / `next` once on paper.
5. **Using `head + i` without `% n`.** Out-of-bounds after rotate.
6. **Bounds-check after convert** using the physical index only. Logical bounds are `0 .. n-1`; convert is for storage, not for validating the caller's logical index.

Minimal smoke sketch:

```java
void demo() {
    CircularArray<Integer> a = new CircularArray<>(3);
    a.set(0, 10);
    a.set(1, 20);
    a.set(2, 30);
    a.rotate(1);
    assert a.get(0) == 20;
    assert a.get(1) == 30;
    assert a.get(2) == 10;
    a.rotate(-1); // back to original logical order
    assert a.get(0) == 10;

    int sum = 0;
    for (int v : a) {
        sum += v;
    }
    assert sum == 60;
}
```

---

## 7. Explain to a friend recap

Circular Array asks: can you rotate cheaply and still walk the elements in logical order?

1. Keep items fixed in an array. Store `head` as the physical index of logical position 0.
2. Map with `physical = (head + logical) mod n`, and fix Java's negative remainder.
3. `rotate(k)` only reassigns `head` through that same map. **O(1)**, not O(n).
4. `get` / `set` always convert first so callers only think in logical indices.
5. Implement `Iterable` with an iterator that yields offsets `0 .. n-1` from the rotated head so `for (T x : array)` works.
6. Use generics (`CircularArray<T>`). Cast `Object[]` to `T[]` or use a list.

If you can draw four boxes, move a head arrow, and write `convert` without off-by-one bugs, you own problem 7.9. Rotation is a pointer update; iteration is walking from that pointer around the ring.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Othello](/blog/en/ctci-7-8-othello)
* Next: [Minesweeper](/blog/en/ctci-7-10-minesweeper)