---
title: "Queue via Stacks: Build a FIFO Queue with Two LIFO Stacks (Java)"
description: "CTCI-style problem 3.4 for beginners: implement MyQueue with stackNewest and stackOldest. Push to one, shift only when dequeue or peek needs data. Amortized O(1) in plain Java."
date: "2025-10-24"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-3-4-queue-via-stacks.webp
previewImage: /assets/images/ctci-3-4-queue-via-stacks.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 3.4 for beginners: implement MyQueue with stackNewest and stackOldest. Push to one, shift only when dequeue or peek needs data. Amortized O(1) in plain Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You run a tiny café with two trays. New cups land on the **in tray**. You always drop a cup on top of that pile. When a customer wants a drink, you serve from the **out tray**, which also only lets you take from the top. When the out tray is empty, you flip every cup from the in tray onto the out tray, one by one. The first cup that went in is now sitting on top of the out tray, ready to go. That is a **queue built from two stacks**.

This post is original teaching for absolute beginners in **Java**. Same problem family as classic interview "queue with stacks" questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 3, problem 3.4.

---

## 1. Everyday analogy

Two trays, both behave like stacks (last in, first out on each tray alone):

* **In tray (`stackNewest`)** holds brand-new arrivals. Enqueue always means push here. Newest cup sits on top.
* **Out tray (`stackOldest`)** holds cups ready to serve in FIFO order. Dequeue and peek always mean pop or peek here, once the tray has been filled by a shift.
* **Shift:** only when the out tray is empty and you need to serve. Pop everything from the in tray and push it onto the out tray. Order reverses twice effectively for the waiting items: first cup in becomes first cup out.

You never shift if the out tray still has cups. That lazy move is why average cost stays cheap.

---

## 2. Plain problem statement

**Goal:** implement a queue that supports enqueue (add), dequeue (remove), and peek, using only two stacks as storage. Do not wrap a real `Queue` library.

**Queue contract:** first in, first out. If you add `1`, then `2`, then `3`, the first remove returns `1`.

**Stack contract you may use:** push, pop, peek, isEmpty (or size). Java's `Stack` or `Deque` used only as a stack is fine.

**Operations we implement on `MyQueue`:**

| Method | Meaning |
| --- | --- |
| `add(x)` / `enqueue(x)` | put `x` at the back of the queue |
| `remove()` / `dequeue()` | take the front element and return it |
| `peek()` | look at the front without removing |
| `isEmpty()` / `size()` | emptiness or count (optional but handy) |

**Examples:**

| Sequence | Result |
| --- | --- |
| add(1), add(2), add(3), remove() | returns `1`; queue left is `2, 3` |
| then peek() | returns `2` |
| then remove(), remove() | returns `2`, then `3` |
| remove() on empty | undefined / throw (pick a policy and say it) |

**Clarify before coding:**

* What if dequeue on empty? Throw, or return a sentinel? Interviews usually accept either if you state it.
* Integer only, or generic? Start with `int` for clarity; generics are a small wrap later.
* Must both stacks always stay "correct," or is lazy shift allowed? Lazy is the standard good answer.

---

## 3. Think first (one stack fails, two stacks win)

### Why one stack is not enough by itself

A single stack is LIFO. A queue is FIFO. If you only push on enqueue and only pop on dequeue, you get the newest item first. Wrong order.

You could rebuild the whole stack on every dequeue (pop everything into a temp, grab the bottom, put the rest back). That works, but every dequeue is O(N). Interviewers accept it as a first idea, then ask for better amortized cost.

### Two stacks: newest and oldest

Keep:

* `stackNewest`: receives every new element on enqueue
* `stackOldest`: holds elements in reverse of arrival order relative to newest, so its top is the queue front

**Enqueue:** always `stackNewest.push(x)`. O(1).

**Dequeue / peek:** need the oldest element. That lives on top of `stackOldest` *if* we have already shifted. If `stackOldest` is empty, pour all of `stackNewest` into `stackOldest`:

```
while stackNewest is not empty:
    stackOldest.push(stackNewest.pop())
```

Then peek or pop `stackOldest`.

**Why the order is correct:** enqueue order `1, 2, 3` leaves newest stack as top=`3`, then `2`, then `1` at bottom. After shift, oldest stack has top=`1`, then `2`, then `3`. Perfect FIFO.

**Lazy rule:** only shift when `stackOldest` is empty. If you still have `1` on oldest and you enqueue `4`, leave `4` on newest. Next remove still takes `1` from oldest. When oldest finally empties, a later remove will shift `4` (and any friends) over.

### Amortized cost intuition

Each element is pushed onto newest once, popped from newest at most once, pushed onto oldest at most once, and popped from oldest at most once. So each element pays a constant amount of work over its whole life in the queue. That is **amortized O(1)** per operation, even though a single shift can take O(N) time when N items move at once.

---

## 4. Java solution

```java
import java.util.EmptyStackException;
import java.util.Stack;

/**
 * Queue implemented with two stacks.
 * stackNewest: inbound (enqueue). stackOldest: outbound (dequeue/peek).
 * Shift only when outbound is empty and we need the front.
 */
class MyQueue {
    private final Stack<Integer> stackNewest = new Stack<>();
    private final Stack<Integer> stackOldest = new Stack<>();

    public int size() {
        return stackNewest.size() + stackOldest.size();
    }

    public boolean isEmpty() {
        return size() == 0;
    }

    /** Enqueue: always push onto the newest stack. */
    public void add(int value) {
        stackNewest.push(value);
    }

    /**
     * Move everything from newest to oldest only if oldest is empty.
     * After this, stackOldest.top is the queue front (if any elements exist).
     */
    private void shiftStacks() {
        if (stackOldest.isEmpty()) {
            while (!stackNewest.isEmpty()) {
                stackOldest.push(stackNewest.pop());
            }
        }
    }

    /** Front without remove. Shifts if needed. */
    public int peek() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new EmptyStackException(); // queue empty
        }
        return stackOldest.peek();
    }

    /** Dequeue front. Shifts if needed. */
    public int remove() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new EmptyStackException(); // queue empty
        }
        return stackOldest.pop();
    }
}
```

Walkthrough: `add(1)`, `add(2)`, `add(3)`, then `remove()`.

| Step | stackNewest (top→…) | stackOldest (top→…) | Notes |
| --- | --- | --- | --- |
| add(1) | 1 | (empty) | push newest |
| add(2) | 2, 1 | (empty) | |
| add(3) | 3, 2, 1 | (empty) | |
| remove → shift | (empty) | 1, 2, 3 | pour newest into oldest |
| remove → pop | (empty) | 2, 3 | returns `1` |

Then `add(4)`, `remove()`:

| Step | stackNewest | stackOldest | Notes |
| --- | --- | --- | --- |
| add(4) | 4 | 2, 3 | do **not** shift yet |
| remove | 4 | 3 | pop oldest → `2` (no shift; oldest was non-empty) |
| remove | 4 | (empty) | pop → `3` |
| remove → shift | (empty) | 4 | now shift, then pop → `4` |

---

## 5. Complexity table

| Operation | Worst case time | Amortized time | Extra space |
| --- | --- | --- | --- |
| `add` | O(1) | O(1) | O(1) per call |
| `remove` / `peek` (no shift) | O(1) | O(1) | O(1) |
| `remove` / `peek` (full shift of k items) | O(k) | O(1) amortized | O(1) beyond the stacks |
| Whole queue holding N items | - | - | O(N) total across both stacks |

N is the number of elements currently in the queue. A single dequeue can be linear if it triggers a big shift, but each element is shifted at most once, so over a sequence of M operations the total work is O(M). That is the amortized story interviewers want.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty queue** → `remove` / `peek` after both stacks empty. Throw or return a clear sentinel. Do not call `pop` on an empty stack blindly without a check.
* **Single element** → add then remove works: shift moves one item, pop returns it.
* **Many enqueues, then many dequeues** → one big shift, then cheap pops. Order must stay FIFO.
* **Interleaved ops** → enqueue after partial dequeue must not break front order. Lazy shift handles this if you only shift when oldest is empty.
* **Peek then remove** → both should see the same front; peek must not leave stacks inconsistent (shift is fine; do not pop on peek).
* **size / isEmpty** → sum both stacks. Do not only check one.

Common mistakes:

1. **Shifting on every enqueue or every dequeue even when oldest is full.** Wastes work and is easy to get wrong. Gate the shift with `if (stackOldest.isEmpty())`.
2. **Shifting newest into oldest when oldest is not empty.** That interleaves wrong order. Oldest still has older items; pouring newer ones on top of them breaks FIFO.
3. **Using one stack only and reverse-copying on every dequeue without explaining cost.** Works but is O(N) each time with no amortization story if you reverse both ways every call carelessly.
4. **Forgetting peek needs the same shift as remove.** Peek also needs the front on top of oldest.
5. **Returning from newest by mistake.** Newest top is the *last* arrival, not the first.

Minimal empty-safe helpers (same policy as above):

```java
public int removeOrThrow() {
    return remove();
}

public boolean tryPeek(int[] out) {
    if (isEmpty()) {
        return false;
    }
    out[0] = peek();
    return true;
}
```

---

## 7. Explain to a friend recap

Queue via stacks asks: can you get FIFO using only LIFO piles?

1. Keep two stacks: one for new arrivals (`stackNewest`), one for serving (`stackOldest`).
2. Enqueue always pushes onto newest. That is O(1).
3. When you need the front and oldest is empty, pour newest into oldest. Tops reverse so the earliest arrival sits on oldest's top.
4. Dequeue and peek operate on oldest only (after a possible shift).
5. Never pour onto a non-empty oldest stack. That rule protects order.
6. Each element moves a constant number of times, so operations are amortized O(1) even though one shift can look expensive.

If you can draw the two trays, say when you flip, and explain amortized cost without hand-waving, you own problem 3.4.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Stack of Plates](/blog/en/ctci-3-3-stack-of-plates)
* Next: [Sort Stack](/blog/en/ctci-3-5-sort-stack)