---
title: "Stack Min: push, pop, and min() in O(1) (Java)"
description: "CTCI-style problem 3.2 for beginners: design a stack that returns the current minimum in constant time. Track mins with a second stack (or store min-so-far on each node), with clear Java."
date: "2025-11-29"
tags: [Algorithms]
coverImage: /assets/images/ctci-3-2-stack-min.webp
previewImage: /assets/images/ctci-3-2-stack-min.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 3.2 for beginners: design a stack that returns the current minimum in constant time. Track mins with a second stack (or store min-so-far on each node), with clear Java.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You keep score chips in a cup. You only ever add a chip on top or take the top chip off. Sometimes a friend asks, "What is the lowest score in the cup right now?" If you dump everything out to scan, that is slow. If you keep a second, smaller cup that only holds new lows, you answer in one glance. That second cup is the idea behind **Stack Min**.

This post is original teaching for absolute beginners in **Java**. Same problem family as classic interview stack questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 3, stacks and queues.

---

## 1. Everyday analogy

A normal stack is a plate pile: last on, first off. You always see the top plate. You do **not** automatically know the cheapest plate buried somewhere under the top.

Stack Min adds one rule: at any moment you must know the **smallest value still in the stack**, without scanning.

* **push(x):** put x on top.
* **pop():** remove the top.
* **min():** return the current minimum among all values still stacked. Must stay fast even when the stack is deep.

The trick is not a clever search. It is **remembering history of new lows** as you push, and **forgetting a low** only when you pop the value that created it.

---

## 2. Plain problem statement

**Build** a stack of integers with three operations, each in **O(1)** time:

| Operation | Meaning |
| --- | --- |
| `push(value)` | push onto the stack |
| `pop()` | remove and return the top |
| `min()` | return the smallest value currently in the stack (do not remove it) |

Optional helpers: `peek()`, `isEmpty()`. Same complexity goals.

**Examples:**

| Action | Stack (bottom → top) | min() |
| --- | --- | --- |
| push 5 | 5 | 5 |
| push 3 | 5, 3 | 3 |
| push 7 | 5, 3, 7 | 3 |
| push 3 | 5, 3, 7, 3 | 3 |
| pop | 5, 3, 7 | 3 |
| pop | 5, 3 | 3 |
| pop | 5 | 5 |

**Clarify before coding:**

* Integers only for this write-up? (Yes. Same pattern works for any comparable type.)
* What if `min()` or `pop()` runs on an empty stack? (Throw, e.g. `EmptyStackException`.)
* Are duplicates allowed? (Yes. That is a common trap for the min tracker.)
* Must `min()` leave the stack unchanged? (Yes. Only `pop` removes.)

---

## 3. Think first

### Why a single stack is not enough by itself

If you only store values, `min()` needs a full scan: O(N). You could recompute min on every pop by scanning again. Still not O(1). Caching one `currentMin` field fails on pop: when you remove the current minimum, you no longer know what the *previous* minimum was unless you stored it.

### Approach A: second stack of mins (main solution)

Keep two stacks:

1. **`values`:** the real data, normal LIFO.
2. **`mins`:** only the minimum history.

Rules:

* On **push(x):**
  1. Always push `x` onto `values`.
  2. If `mins` is empty **or** `x <= mins.peek()`, also push `x` onto `mins`.
* On **pop():**
  1. Pop from `values`.
  2. If that value **equals** `mins.peek()`, pop `mins` too.
* On **min():** return `mins.peek()` (after empty checks).

Use `<=` (not `<`) when deciding to record a new min. That way duplicate minima each get their own entry on `mins`, and each pop of a duplicate peels one entry correctly.

### Approach B: node stores min-so-far

Each stack node holds `(value, minWhenThisWasPushed)`. When you push `x`, the new node's min field is `min(x, previousTop.min)` (or just `x` if the stack was empty). Then `min()` is `top.min` in O(1). Space is still O(N), one extra int per node instead of a second stack that is often shorter.

Both are valid interview answers. The second stack is easy to draw. The node field is compact and nice if you already own the node type.

### What not to do

* Sorting the stack (destroys LIFO order).
* Scanning on every `min()` call (misses the O(1) requirement).
* Only storing the first min and never updating (wrong after larger pushes and after popping the min).

---

## 4. Java solution

Main design: two stacks. Uses `java.util.Stack` for clarity in interviews; in production code you would often prefer `ArrayDeque`.

```java
import java.util.EmptyStackException;
import java.util.Stack;

/**
 * Stack that supports push, pop, peek, and min in O(1) time.
 * mins holds a history of new (or equal) minima.
 */
class StackWithMin {
    private final Stack<Integer> values = new Stack<>();
    private final Stack<Integer> mins = new Stack<>();

    public void push(int value) {
        values.push(value);
        if (mins.isEmpty() || value <= mins.peek()) {
            mins.push(value);
        }
    }

    public int pop() {
        if (values.isEmpty()) {
            throw new EmptyStackException();
        }
        int value = values.pop();
        if (value == mins.peek()) {
            mins.pop();
        }
        return value;
    }

    public int min() {
        if (mins.isEmpty()) {
            throw new EmptyStackException();
        }
        return mins.peek();
    }

    public int peek() {
        if (values.isEmpty()) {
            throw new EmptyStackException();
        }
        return values.peek();
    }

    public boolean isEmpty() {
        return values.isEmpty();
    }
}
```

Walkthrough for push 5, 3, 7, 3 then two pops:

| Step | values (bottom → top) | mins | min() |
| --- | --- | --- | --- |
| push 5 | 5 | 5 | 5 |
| push 3 | 5, 3 | 5, 3 | 3 |
| push 7 | 5, 3, 7 | 5, 3 | 3 |
| push 3 | 5, 3, 7, 3 | 5, 3, 3 | 3 |
| pop (3) | 5, 3, 7 | 5, 3 | 3 |
| pop (7) | 5, 3 | 5, 3 | 3 |

Notice 7 never entered `mins`. The second 3 did, so the first pop of 3 still leaves min = 3.

### Alternate sketch: min on each node

```java
class NodeWithMin {
    final int value;
    final int min; // smallest value in the stack when this node is at the top

    NodeWithMin(int value, int min) {
        this.value = value;
        this.min = min;
    }
}

class StackWithMinNodes {
    private final Stack<NodeWithMin> stack = new Stack<>();

    public void push(int value) {
        int newMin = stack.isEmpty() ? value : Math.min(value, stack.peek().min);
        stack.push(new NodeWithMin(value, newMin));
    }

    public int pop() {
        return stack.pop().value;
    }

    public int min() {
        return stack.peek().min;
    }
}
```

Same O(1) operations. Extra space is always one int per element, not a shorter min stack.

---

## 5. Complexity table

| Approach | push | pop | min | Extra space | Notes |
| --- | --- | --- | --- | --- | --- |
| Scan whole stack for min | O(1) | O(1) | O(N) | O(1) | fails the brief |
| Recompute min only on pop | O(1) | O(N) | O(1) | O(1) | still not all O(1) |
| Second min stack | O(1) | O(1) | O(1) | O(N) worst, often less | main answer here |
| Min field on each node | O(1) | O(1) | O(1) | O(N) always | clean if you control the node |

N is the number of elements in the stack. Both good answers use linear extra memory in the worst case. That is expected: you are buying constant-time min.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty stack, then min() or pop()** → throw. Do not return a magic number like `Integer.MAX_VALUE` unless the problem says so.
* **Single element** → push once, min equals that value, pop leaves empty, min must not be called without a guard.
* **Duplicates of the minimum** → must use `<=` when pushing onto `mins`. If you only push on strict `<`, two copies of the same min break after the first pop of that value.
* **Strictly increasing sequence** (1, 2, 3, 4) → `mins` only holds 1. Fine.
* **Strictly decreasing sequence** (4, 3, 2, 1) → every push updates min. `mins` grows with `values`.
* **Pop the global min, then a larger top remains** → previous min must reappear from the min history (or from the previous node's min field).

Common mistakes:

1. **Using `<` instead of `<=` for the min stack.** Duplicate mins break.
2. **Always popping `mins` on every `pop`.** Wrong when the popped value was not the current min.
3. **Forgetting empty checks** before `peek` on either stack.
4. **Returning min from `values` by scanning** and calling it O(1) anyway.
5. **Mutating the stack inside `min()`.** `min` is a query, not a destructive operation.

---

## 7. Explain to a friend recap

Stack Min asks for a stack where push, pop, and "what is the smallest value right now?" are all constant time.

1. A plain stack cannot answer min without a scan.
2. Keep a second stack of minima (or store min-so-far on each node).
3. On push, record a new min only when the new value is less than or equal to the old min.
4. On pop, drop a min entry only if the value you removed was that min.
5. Watch empty stacks and duplicate minima. Those are the usual bugs.

If you can draw the two stacks for push 5, 3, 7, 3 and explain why the second 3 matters, you own problem 3.2.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Three in One](/blog/en/ctci-3-1-three-in-one)
* Next: [Stack of Plates](/blog/en/ctci-3-3-stack-of-plates)