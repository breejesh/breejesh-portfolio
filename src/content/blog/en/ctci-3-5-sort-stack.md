---
title: "Sort Stack: Order a Stack With One Temporary Stack (Java)"
description: "CTCI-style problem 3.5 for beginners: sort a stack so the smallest items sit on top. Only one extra stack allowed. Insertion-sort thinking in plain Java."
date: "2025-11-28"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-3-5-sort-stack.webp
previewImage: /assets/images/ctci-3-5-sort-stack.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 3.5 for beginners: sort a stack so the smallest items sit on top. Only one extra stack allowed. Insertion-sort thinking in plain Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You have a messy pile of dinner plates. You may only lift the top plate of the pile, and you get one empty side table. You want the lightest plate on top when you are done (smallest value on top). You cannot line them up on the floor. You cannot use a third pile. That constraint is the whole puzzle of **sort stack**.

This post is original teaching for absolute beginners in **Java**. Same problem family as classic stack-sort interview questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 3, stacks and queues.

---

## 1. Everyday analogy

Think of two piles of numbered cards:

* **Source stack `s`**: the messy pile you must sort in place (well, almost: you finish by restoring the answer into `s`).
* **Temp stack `r`**: your one empty side table. It holds cards that are already in a growing sorted order.
* You may only push and pop (and peek at the top). No arrays, no lists, no hash maps.

The trick feels like **insertion sort**. Pull one card off `s`. Park bigger cards from `r` back onto `s` until the card fits. Drop it onto `r`. Repeat. When `s` is empty, dump `r` back onto `s` so the order flips the way you want.

---

## 2. Plain problem statement

**Input:** a stack of integers (or comparable values). Top of stack is what `pop` returns.

**Output:** the same stack, sorted so the **smallest** items are on **top**. Largest values sit deeper toward the bottom.

**Rules:**

* You may use **one** additional temporary stack.
* You may not use arrays, linked lists, trees, or other collections as buffers.
* You may use constants and a few local variables (the value you are currently holding).

**Examples** (rightmost value is the top):

| Before (bottom → top) | After (bottom → top) | Top after |
| --- | --- | --- |
| `3, 1, 4, 2` | `4, 3, 2, 1` | 1 |
| `5` | `5` | 5 |
| empty | empty | n/a |
| `2, 2, 1` | `2, 2, 1` | 1 |
| `1, 2, 3` (top is 3) | `3, 2, 1` | 1 |

If bottom→top is `1, 2, 3`, the top is 3 (largest). After sort, bottom→top is `3, 2, 1` so the top is 1 (smallest).

**Clarify before coding:**

* Smallest on top, or largest on top? (Here: **smallest on top**.)
* Are duplicates allowed? (Yes. Stable order among equals is not required.)
* Can we use recursion? Recursion is an implicit stack. Interviewers often want the explicit temp stack only. Prefer the iterative two-stack version.
* Mutate the given stack, or return a new one? Mutate in place by refilling `s` at the end.

---

## 3. Think first (insertion sort with a temp stack)

### What you cannot do

Dump everything into an array, call `Arrays.sort`, push back. That breaks the "no other data structures" rule.

### Insertion idea

Keep the temporary stack `r` sorted with **largest on top** (and smallest at the bottom of `r`). Then:

1. Pop `tmp` from `s`.
2. While `r` is not empty and `r.peek() > tmp`, pop from `r` and push those values back onto `s`. They are too large to sit under `tmp` on `r`.
3. Push `tmp` onto `r`. Now `r` still has largest on top among its current contents.
4. Repeat until `s` is empty.
5. Pop everything from `r` onto `s`. Each pop puts the next-largest on `s`, so when you finish, **smallest is on top of `s`**.

Why park large values back on `s`? Because you only have one temp stack. The source stack is the only legal parking lot. Those parked values will be re-inserted later, just like insertion sort revisits elements.

### Walkthrough: bottom → top `3, 1, 4, 2` (top is 2)

| Step | `tmp` | Action | `s` (bottom → top) | `r` (bottom → top) |
| --- | --- | --- | --- | --- |
| start | | | `3, 1, 4, 2` | empty |
| 1 | 2 | `r` empty, push 2 | `3, 1, 4` | `2` |
| 2 | 4 | `2 > 4`? no, push 4 | `3, 1` | `2, 4` |
| 3 | 1 | `4 > 1`, park 4 on `s`; `2 > 1`, park 2 on `s`; push 1 | `3, 4, 2` | `1` |
| 4 | 2 | `1 > 2`? no, push 2 | `3, 4` | `1, 2` |
| 5 | 4 | `2 > 4`? no, push 4 | `3` | `1, 2, 4` |
| 6 | 3 | `4 > 3`, park 4 on `s`; `2 > 3`? no, push 3 | `4` | `1, 2, 3` |
| 7 | 4 | `3 > 4`? no, push 4 | empty | `1, 2, 3, 4` |
| copy | | dump `r` → `s` | `4, 3, 2, 1` | empty |

Top of `s` is 1. Done.

---

## 4. Java solution

Use `java.util.Stack` for teaching, or any LIFO type with `push`, `pop`, `peek`, `isEmpty`.

```java
import java.util.Stack;

/**
 * Sorts stack so smallest values end on top.
 * Uses one temporary stack. Insertion-sort style moves.
 */
void sortStack(Stack<Integer> s) {
    Stack<Integer> r = new Stack<Integer>();

    while (!s.isEmpty()) {
        int tmp = s.pop();

        // Park larger values back onto s so tmp can sit on r.
        while (!r.isEmpty() && r.peek() > tmp) {
            s.push(r.pop());
        }
        r.push(tmp);
    }

    // r has largest on top. Reverse onto s so smallest ends on top.
    while (!r.isEmpty()) {
        s.push(r.pop());
    }
}
```

If the problem asks for **largest on top** instead, flip the comparison to `r.peek() < tmp` and rethink the final copy, or sort for smallest-on-top and then reverse with the same two stacks. Always confirm the required order out loud before you code.

Minimal driver sketch:

```java
Stack<Integer> s = new Stack<Integer>();
s.push(3);
s.push(1);
s.push(4);
s.push(2); // top is 2
sortStack(s);
// pop order: 1, 2, 3, 4
```

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Temp stack (insertion style) | O(N²) worst case | O(N) for the temp stack | Each of N values can move back and forth many times |
| Already sorted (lucky) | closer to O(N) | O(N) | Few park moves if order is friendly |
| Array dump + sort (banned here) | O(N log N) | O(N) | Breaks the one-stack rule |

N is the number of elements in the stack. Worst case looks like reverse-sorted input with lots of parking. Extra space is the second stack of up to N elements, plus O(1) locals. You cannot get below O(N) extra stack space if you must hold everything while reordering under LIFO rules without recursion depth tricks.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty stack** → both loops no-op. Fine.
* **Single element** → pop to `r`, push back to `s`. Still correct.
* **All equal** → `r.peek() > tmp` is never true if you use strict `>`. Duplicates stay put. Good.
* **Already smallest on top** → still may reshuffle through `r`. Correctness matters more than early exit unless you want an optimization pass.
* **Strictly decreasing tops** (already largest on top if values decrease toward the top) → many park operations. Still O(N²) and correct.
* **Negatives and zeros** → comparison works the same for `Integer`.

Common mistakes:

1. **Wrong comparison.** `r.peek() < tmp` builds the opposite order on `r`. You will finish with largest on top of `s` after the copy, or total chaos if you mix conditions.
2. **Forgetting the final dump.** Leaving the answer on `r` fails the "sort this stack" API if the caller still holds `s`.
3. **Using a second buffer type.** `ArrayList` as a parking lot violates the problem even if the code "works".
4. **Comparing after pop without peek.** Always peek (or hold) before you decide to move from `r` back to `s`.
5. **Infinite loop.** If you push `tmp` back onto `s` by accident inside the outer loop without progress, you spin. Keep `tmp` in a local variable until it lands on `r`.

Null-safe entry if the API allows a null stack:

```java
void sortStackSafe(Stack<Integer> s) {
    if (s == null) {
        return;
    }
    sortStack(s);
}
```

---

## 7. Explain to a friend recap

Sort stack asks: reorder a stack so the smallest values sit on top, using only one extra stack.

1. Hold a temp stack `r`. Grow it so **largest sits on top of `r`**.
2. Pop one value `tmp` from the input stack.
3. While the top of `r` is bigger than `tmp`, park those bigger values back on the input stack.
4. Push `tmp` onto `r`. Repeat until the input is empty.
5. Dump `r` back onto the input stack. The reverse leaves **smallest on top**.

It is insertion sort wearing a stack costume. Time O(N²), extra space O(N) for the helper stack. Empty, single-element, and duplicate cases fall out of the same loops.

If you can say that in thirty seconds, sketch the park-and-insert move, and not "cheat" with an array, you own problem 3.5.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Queue via Stacks](/blog/en/ctci-3-4-queue-via-stacks)
* Next: [Animal Shelter](/blog/en/ctci-3-6-animal-shelter)