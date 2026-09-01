---
title: "Stack of Plates: Implementing SetOfStacks with Sub-Stack Capacity Limits (CTCI 3.3)"
description: "Implement SetOfStacks composed of multiple threshold-limited sub-stacks and implement the popAt(index) sub-stack rollover operation in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-3-3-stack-of-plates.webp
previewImage: /assets/images/ctci-3-3-stack-of-plates.webp
---

> **TL;DR**
> * **The Book Problem:** Imagine a stack of plates that might topple if too high. Implement `SetOfStacks` which creates a new sub-stack once the previous one reaches its threshold capacity. `push()` and `pop()` should behave identically to a single stack. *Follow-up:* Implement `popAt(int index)` to pop from a specific sub-stack.
> * **The Optimal Solution:** Manage an `ArrayList<Stack>` of sub-stacks. For `popAt`, either leave sub-stacks partially empty or perform left-shift rollovers from subsequent stacks to keep sub-stacks at full capacity.
> * **Production Reality:** Paged virtual memory stack segments, segment tree chunking in time-series databases, and disk block allocation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 3.3), we are asked:

*"Imagine a (literal) stack of plates. If the stack gets too high, it might topple. Therefore, in real life, we would likely start a new stack when the previous stack exceeds some threshold. Implement a data structure SetOfStacks that mimics this. SetOfStacks should be composed of several stacks and should create a new stack once the previous one exceeds capacity. SetOfStacks.push() and SetOfStacks.pop() should behave identically to a single stack (that is, pop() should return the same values as it would if there were just a single stack)."*

**Follow-Up:**
*"Implement a function popAt(int index) which performs a pop operation on a specific sub-stack."*

## 2. Structural Design & Rollover Mechanics

We maintain a list of individual stack objects: `ArrayList<Stack> stacks = new ArrayList<>()`.

1. **`push(v)`:** Look at the last sub-stack in `stacks`. If it is `null` or full (`stack.size == capacity`), allocate a new sub-stack and push onto it.
2. **`pop()`:** Pop from the last sub-stack. If that sub-stack becomes empty, remove it from the `ArrayList`.
3. **`popAt(int index)` (Follow-Up):**
   * *Option 1 (No Rollover):* Simply pop from `stacks.get(index)`. Subsequent pops might hit non-full stacks, which is acceptable if full capacity is not strictly mandated.
   * *Option 2 (Rollover / Left-Shift):* Pop from `stacks.get(index)`, then remove the bottom element from stack `index + 1` and push it to the top of stack `index`, propagating the shift across all subsequent stacks.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.EmptyStackException;
import java.util.Stack;

public class SetOfStacks {
    private final ArrayList<Stack<Integer>> stacks = new ArrayList<>();
    private final int capacity;

    public SetOfStacks(int capacity) {
        this.capacity = capacity;
    }

    public Stack<Integer> getLastStack() {
        if (stacks.isEmpty()) return null;
        return stacks.get(stacks.size() - 1);
    }

    /**
     * Pushes value onto current active sub-stack.
     * Time Complexity: O(1)
     */
    public void push(int v) {
        Stack<Integer> last = getLastStack();
        if (last != null && last.size() < capacity) {
            last.push(v);
        } else {
            Stack<Integer> stack = new Stack<>();
            stack.push(v);
            stacks.add(stack);
        }
    }

    /**
     * Pops value from last sub-stack.
     * Time Complexity: O(1)
     */
    public int pop() {
        Stack<Integer> last = getLastStack();
        if (last == null) throw new EmptyStackException();
        int v = last.pop();
        if (last.isEmpty()) {
            stacks.remove(stacks.size() - 1);
        }
        return v;
    }

    /**
     * Pops from a specific sub-stack index.
     * Time Complexity: O(1) (without rollover)
     */
    public int popAt(int index) {
        if (index < 0 || index >= stacks.size()) {
            throw new IndexOutOfBoundsException();
        }
        Stack<Integer> stack = stacks.get(index);
        int v = stack.pop();
        if (stack.isEmpty()) {
            stacks.remove(index);
        }
        return v;
    }

    public boolean isEmpty() {
        Stack<Integer> last = getLastStack();
        return last == null || last.isEmpty();
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| push / pop Time | `O(1)` | Direct access to tail sub-stack in dynamic list. |
| popAt(index) Time | `O(1)` | O(1) without rollover (or O(S) with rollover where S is remaining sub-stacks). |
| Auxiliary Space | `O(N)` | Memory scales linearly with number of stored elements. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Chunked Data Structures & Paged Memory

1. **Paged Virtual Memory Systems:** Operating systems allocate stack segments in 4KB page chunks rather than massive contiguous arenas, avoiding reservation failures.
2. **Chunked Array Queues / Deques (e.g. `std::deque` in C++):** Multi-chunk ring buffers avoid expensive reallocation copies when collections expand.

## Edge Cases & Production Hardening

1. **Popping from an empty SetOfStacks:** Throws `EmptyStackException`.
2. **Last sub-stack becomes empty:** Cleanly removed from `stacks` to avoid memory leak.
3. **Invalid `popAt` index:** Validated with bounds checks.
