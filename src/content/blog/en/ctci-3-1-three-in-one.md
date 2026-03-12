---
title: "Three in One: Three Stacks in a Single Array (Java)"
description: "CTCI-style problem 3.1 for beginners: implement three stacks with one array. Fixed equal slices, a sizes[] array, and a clean FixedMultiStack in Java."
date: "2026-03-12"
tags: [Algorithms]
coverImage: /assets/images/ctci-3-1-three-in-one.webp
previewImage: /assets/images/ctci-3-1-three-in-one.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 3.1 for beginners: implement three stacks with one array. Fixed equal slices, a sizes[] array, and a clean FixedMultiStack in Java.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You have one long shelf and three roommates. Each person gets a fixed slice of the shelf for their own stack of books. You never put Roommate A's books into B's slice. When a slice is full, that person is stuck even if the others still have empty space. That is **three stacks in one array** with fixed division.

This post is original teaching for absolute beginners in **Java**. Same problem family as classic multi-stack interview questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 3 (Stacks and Queues) starts here.

---

## 1. Everyday analogy

Imagine a parking strip with **three equal zones** painted on the asphalt:

* Zone 0 holds cars for stack 0.
* Zone 1 holds cars for stack 1.
* Zone 2 holds cars for stack 2.

Each zone fills from its left edge toward its right. A **size** counter per zone tells you how many cars are already parked there. You never need a separate top pointer if you store sizes: the top of stack `k` sits at the last occupied slot in that zone.

If zone 0 is full, you refuse the next car for stack 0. Empty spots in zone 2 do not help. That is the fixed-division trade-off: simple math, wasted space when loads are uneven.

There is a harder version where zone walls can slide (flexible division). We mention it briefly. The interview default for beginners is fixed equal parts.

---

## 2. Plain problem statement

**Input / goal:** Design a data structure that implements **three stacks** using **one** underlying array.

**Operations** (each takes a stack number `0`, `1`, or `2`):

* `push(stackNum, value)`: push onto that stack
* `pop(stackNum)`: remove and return the top
* `peek(stackNum)`: return the top without removing
* `isEmpty(stackNum)` / `isFull(stackNum)`: capacity checks

**Main approach in this post:** fixed division. Split the array into three equal contiguous blocks of capacity `stackCapacity`. Track how full each block is with `sizes[3]`.

**Clarify before coding:**

* Stack indices are `0`, `1`, `2` (zero-based).
* Total array length is `3 * stackCapacity`.
* What happens on push when full? Throw (or return an error). Same idea for pop when empty.
* Are the stacks independent? Yes. Push on stack 0 must not corrupt stack 1.

**Picture for `stackCapacity = 4` (array length 12):**

| Indices | Stack | Meaning |
| --- | --- | --- |
| `0..3` | 0 | first slice |
| `4..7` | 1 | second slice |
| `8..11` | 2 | third slice |

If stack 1 currently has size 2, its values sit at indices `4` and `5`, and the top is at index `5`.

---

## 3. Think first (fixed vs flexible)

### Fixed division (teach this first)

1. Allocate `values = new int[stackCapacity * 3]`.
2. Keep `sizes = new int[3]`, all zeros at start.
3. **Offset** of stack `stackNum` is `stackNum * stackCapacity`.
4. **Index of top** after a successful push (or for peek/pop) is `offset + sizes[stackNum] - 1`.
5. Push: if full, fail. Else increment size, write at the new top index.
6. Pop: if empty, fail. Else read top, clear that slot (optional), decrement size.
7. Peek: if empty, fail. Else return `values[indexOfTop]`.

Why sizes instead of three top pointers? They are equivalent. Size is the number of live elements; top index is a function of offset and size. One small array of three ints is easy to reason about in interviews.

### Flexible / dynamic division (optional harder idea)

If one stack grows hot and another stays empty, fixed slices waste cells. A flexible design lets stacks expand into free space: you track start/end bounds per stack, and may shift elements when a neighbor needs room. Correct, but more code (boundaries, shifting, full-array detection across all stacks). Mention it if the interviewer asks "can we use space better?" Then offer fixed first unless they want the hard version.

For this article, ship **fixed**.

### Index math to memorize

```
offset(stackNum)     = stackNum * stackCapacity
indexOfTop(stackNum) = offset + sizes[stackNum] - 1
isEmpty              = sizes[stackNum] == 0
isFull               = sizes[stackNum] == stackCapacity
```

Draw one row of twelve boxes on the whiteboard and walk a push/pop on stack 1. If the indices look right, the class almost writes itself.

---

## 4. Java solution

```java
/**
 * Three stacks packed into one array with fixed equal slices.
 * stackNum is 0, 1, or 2.
 */
class FixedMultiStack {
    private final int numberOfStacks = 3;
    private final int stackCapacity;
    private final int[] values;
    private final int[] sizes;

    FixedMultiStack(int stackCapacity) {
        if (stackCapacity <= 0) {
            throw new IllegalArgumentException("stackCapacity must be positive");
        }
        this.stackCapacity = stackCapacity;
        this.values = new int[stackCapacity * numberOfStacks];
        this.sizes = new int[numberOfStacks]; // all 0
    }

    void push(int stackNum, int value) {
        assertValidStack(stackNum);
        if (isFull(stackNum)) {
            throw new IllegalStateException("stack " + stackNum + " is full");
        }
        sizes[stackNum]++;
        values[indexOfTop(stackNum)] = value;
    }

    int pop(int stackNum) {
        assertValidStack(stackNum);
        if (isEmpty(stackNum)) {
            throw new IllegalStateException("stack " + stackNum + " is empty");
        }
        int top = indexOfTop(stackNum);
        int value = values[top];
        values[top] = 0; // optional clear; helps debugging
        sizes[stackNum]--;
        return value;
    }

    int peek(int stackNum) {
        assertValidStack(stackNum);
        if (isEmpty(stackNum)) {
            throw new IllegalStateException("stack " + stackNum + " is empty");
        }
        return values[indexOfTop(stackNum)];
    }

    boolean isEmpty(int stackNum) {
        assertValidStack(stackNum);
        return sizes[stackNum] == 0;
    }

    boolean isFull(int stackNum) {
        assertValidStack(stackNum);
        return sizes[stackNum] == stackCapacity;
    }

    /** Absolute index of the current top element for this stack. */
    private int indexOfTop(int stackNum) {
        int offset = stackNum * stackCapacity;
        return offset + sizes[stackNum] - 1;
    }

    private void assertValidStack(int stackNum) {
        if (stackNum < 0 || stackNum >= numberOfStacks) {
            throw new IllegalArgumentException("stackNum must be 0, 1, or 2");
        }
    }
}
```

Walkthrough with `stackCapacity = 3` (array length 9):

| Step | Call | sizes | Top write / read |
| --- | --- | --- | --- |
| start | (empty) | `[0,0,0]` | - |
| 1 | `push(0, 10)` | `[1,0,0]` | write `values[0] = 10` |
| 2 | `push(0, 20)` | `[2,0,0]` | write `values[1] = 20` |
| 3 | `push(1, 99)` | `[2,1,0]` | write `values[3] = 99` |
| 4 | `peek(0)` | unchanged | read `20` at index `1` |
| 5 | `pop(0)` | `[1,1,0]` | return `20`, clear index `1` |
| 6 | `push(0, 30)` | `[2,1,0]` | write `values[1] = 30` |

Stack 0 never touches indices `3..8`. Stack 1 never touches `0..2` or `6..8`.

---

## 5. Complexity table

| Operation | Time | Extra space beyond the shared array | Notes |
| --- | --- | --- | --- |
| `push` / `pop` / `peek` | O(1) | O(1) | only arithmetic + array access |
| `isEmpty` / `isFull` | O(1) | O(1) | read one entry in `sizes` |
| Construction | O(N) | O(1) besides the array | `N = 3 * stackCapacity` array allocation |
| Fixed multi-stack overall | - | O(N) for values + O(1) for sizes (3 ints) | wasted cells when load is uneven |
| Flexible multi-stack (idea) | push can be O(N) if shifting | more bookkeeping | better space use, harder code |

Interviewers mostly want constant-time ops and correct index math. Flexible shifting is a follow-up, not the first solution.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **`stackCapacity = 1`:** each stack holds one value. Second push on the same stack must fail.
* **Empty pop / peek:** throw (or return a sentinel if you agreed on one). Never read `indexOfTop` when size is 0; that index would be `offset - 1`, which is wrong and can cross into another stack.
* **Full push:** throw. Do not silently overwrite.
* **Invalid `stackNum`:** reject outside `{0,1,2}`.
* **Independence:** filling stack 2 must leave stack 0 empty and usable.
* **Zero or negative capacity:** reject in the constructor.
* **Pop then push again:** size goes down, then up; the same index is reused. That is correct stack behavior.

Common mistakes:

1. **Using `offset + size` as top without subtracting 1.** After size becomes 1, top is at `offset + 0`, not `offset + 1`.
2. **Incrementing size after writing with the old size.** Order matters: either increment first then write at `indexOfTop`, or write at `offset + size` then increment. Pick one and stay consistent. The code above increments first.
3. **Sharing one top pointer for all three stacks.** That is a single stack, not three.
4. **Forgetting `isFull` before push.** You will stomp the next slice.
5. **Allowing stack 0 to grow past its slice into stack 1.** Fixed division forbids that; enforce capacity per stack.

Minimal smoke test sketch:

```java
void demo() {
    FixedMultiStack stacks = new FixedMultiStack(2);
    stacks.push(0, 1);
    stacks.push(0, 2);
    // stacks.push(0, 3); // would throw: full
    stacks.push(2, 9);
    assert stacks.pop(0) == 2;
    assert stacks.peek(0) == 1;
    assert stacks.pop(2) == 9;
    assert stacks.isEmpty(1);
}
```

---

## 7. Explain to a friend recap

Three in One asks: can you pack three independent stacks into one array?

1. Split the array into three equal slices of length `stackCapacity`.
2. Keep `sizes[3]`. Top of stack `k` lives at `k * stackCapacity + sizes[k] - 1`.
3. Push only if not full: bump size, write at top. Pop only if not empty: read top, clear, drop size.
4. All ops are O(1). The cost is wasted space when one stack is hot and another is idle.
5. Flexible walls that steal free cells are a harder follow-up. Start with fixed slices unless asked otherwise.

If you can draw the three slices, name the top index formula, and refuse full pushes without crosstalk between stacks, you own problem 3.1.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Loop Detection](/blog/en/ctci-2-8-loop-detection)
* Next: [Stack Min](/blog/en/ctci-3-2-stack-min)