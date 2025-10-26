---
title: "Stack of Plates: SetOfStacks with Capacity and popAt (Java)"
description: "CTCI-style problem 3.3 for beginners: when one plate stack is too tall, start another. Build SetOfStacks so push and pop still feel like one stack, then a short note on popAt(index)."
date: "2025-10-26"
tags: [Algorithms]
coverImage: /assets/images/ctci-3-3-stack-of-plates.webp
previewImage: /assets/images/ctci-3-3-stack-of-plates.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 3.3 for beginners: when one plate stack is too tall, start another. Build SetOfStacks so push and pop still feel like one stack, then a short note on popAt(index).
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You are drying plates after dinner. One stack on the counter is fine until it wobbles. At some height you start a second stack beside it, then a third. From the outside you still take the top plate from the newest stack and put a clean plate on that same newest stack. Internally there are several short stacks, not one skyscraper. That is **SetOfStacks**.

This post is original teaching for absolute beginners in **Java**. Same problem family as classic interview stack-capacity questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 3, stacks and queues.

---

## 1. Everyday analogy

Think of dinner plates and a rule: **no stack taller than capacity**.

* Each physical pile is one inner stack with a max size (say 5 plates).
* When the current pile is full, you open a new pile on the right.
* **push** always places a plate on the rightmost pile that still has room (or creates a new pile if the rightmost is full).
* **pop** always takes a plate from the rightmost non-empty pile.
* If a pile becomes empty after a pop, you remove that empty pile so the "rightmost" pointer stays honest.

Callers do not manage pile numbers. They only call `push` and `pop` as if there were one logical stack. You hide the multi-stack bookkeeping.

The follow-up is meaner: **popAt(index)** removes the top plate from a specific pile (by sub-stack index), not only from the newest one. That can leave a hole in the middle of your row of piles. You decide whether to roll plates left to fill holes or leave sparse sub-stacks. Interviewers care that you name the trade-off.

---

## 2. Plain problem statement

**Build** a structure `SetOfStacks` with a fixed `capacity` per inner stack.

**Operations:**

* `push(value)`: push onto the logical stack (newest sub-stack, or a new one if needed).
* `pop()`: pop from the logical stack (top of the newest non-empty sub-stack). Behave like one stack for LIFO order.
* Optional follow-up: `popAt(index)`: pop only from sub-stack `index`.

**Invariants:**

* No inner stack holds more than `capacity` elements.
* Empty trailing stacks should not stick around after `pop`.
* `pop` on a fully empty structure should fail cleanly (exception or a defined empty signal).

**Examples** (capacity = 3):

| Action | Inner stacks (left = older) | Notes |
| --- | --- | --- |
| push 1,2,3 | `[1,2,3]` | first stack full |
| push 4 | `[1,2,3] [4]` | new stack created |
| push 5,6 | `[1,2,3] [4,5,6]` | second full |
| pop | `[1,2,3] [4,5]` | returns 6 |
| pop, pop | `[1,2,3]` | second stack removed when empty |
| popAt(0) after more pushes | depends | pops top of stack 0 only |

**Clarify before coding:**

* Capacity is fixed at construction? (Yes for this post.)
* What if capacity is 0 or negative? (Reject at construction.)
* pop on empty: throw, or return null? (We throw `EmptyStackException`.)
* popAt: rollover (shift) vs leave empty slots in middle stacks? (Discuss both; implement a simple leave-as-is version and note rollover.)

---

## 3. Think first

### One ArrayDeque is not enough

A single `Stack` or `ArrayDeque` already gives push/pop. The point of this problem is the **capacity constraint per physical stack**, like plates that would topple, or like fixed-size pages in a memory story.

### List of stacks

Keep an `ArrayList<Stack<Integer>>` (or `ArrayList<ArrayDeque<Integer>>`) named `stacks`.

* **push(v):**
  1. If `stacks` is empty, or the last stack's size equals `capacity`, append a new empty stack.
  2. Push `v` onto the last stack.

* **pop():**
  1. If there are no stacks, throw empty.
  2. Pop from the last stack.
  3. If that stack is now empty, remove it from the list.
  4. Return the value.

* **Helper `lastStack()`:** returns the rightmost stack, or null if none.

That is the whole base design. No fancy tree. Just a growable list of fixed-capacity LIFO buckets.

### Follow-up mental model for popAt

`popAt(index)` needs bounds checks: index in range, that stack non-empty.

After you pop from a middle stack, options:

1. **Leave holes.** Stack `i` may be shorter than capacity while stack `i+1` still has items. Simpler code. `push` still only touches the last stack (unless you also rebalance on push, which most solutions do not).
2. **Rollover / shift.** When you pop from stack `i`, pull the bottom element of stack `i+1` onto the top of stack `i`, and cascade. Keeps every stack full except possibly the last. More code, nicer "dense" layout, O(N) worst case per popAt if many stacks.

Say both out loud. Implement the simple version unless they demand rollover.

---

## 4. Java solution (SetOfStacks)

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.EmptyStackException;
import java.util.List;

/**
 * Several fixed-capacity stacks that behave as one logical stack for push/pop.
 * Capacity is per inner stack. New stacks open when the current one is full.
 */
class SetOfStacks {
    private final int capacity;
    private final List<Deque<Integer>> stacks = new ArrayList<>();

    SetOfStacks(int capacity) {
        if (capacity < 1) {
            throw new IllegalArgumentException("capacity must be at least 1");
        }
        this.capacity = capacity;
    }

    void push(int value) {
        Deque<Integer> last = lastStack();
        if (last == null || last.size() == capacity) {
            last = new ArrayDeque<>();
            stacks.add(last);
        }
        last.push(value);
    }

    int pop() {
        Deque<Integer> last = lastStack();
        if (last == null) {
            throw new EmptyStackException();
        }
        int value = last.pop();
        if (last.isEmpty()) {
            stacks.remove(stacks.size() - 1);
        }
        return value;
    }

    /**
     * Pop only from sub-stack at index (0 = oldest).
     * Leaves later stacks as-is (no rollover). See section 5.
     */
    int popAt(int index) {
        if (index < 0 || index >= stacks.size()) {
            throw new IndexOutOfBoundsException("sub-stack index: " + index);
        }
        Deque<Integer> stack = stacks.get(index);
        if (stack.isEmpty()) {
            throw new EmptyStackException();
        }
        int value = stack.pop();
        if (stack.isEmpty()) {
            stacks.remove(index);
        }
        return value;
    }

    boolean isEmpty() {
        return stacks.isEmpty();
    }

    int numberOfStacks() {
        return stacks.size();
    }

    private Deque<Integer> lastStack() {
        if (stacks.isEmpty()) {
            return null;
        }
        return stacks.get(stacks.size() - 1);
    }
}
```

Walkthrough with capacity 3:

1. `push(1..3)` → one full stack `[1,2,3]` (top is 3).
2. `push(4)` → second stack appears: `[1,2,3] [4]`.
3. `pop()` → 4; second stack empty and removed → `[1,2,3]`.
4. `pop()` → 3 → `[1,2]`.
5. After more pushes so you have three stacks, `popAt(0)` removes only the top of the oldest stack. Later stacks stay put (no shift).

Why `ArrayDeque` instead of `java.util.Stack`? `Stack` is an old synchronized `Vector` subclass. `ArrayDeque` is the usual modern LIFO choice in Java interviews. Behavior is the same for our purposes.

---

## 5. popAt note (follow-up)

`popAt(index)` is the twist that shows whether you only memorized "list of stacks" or thought about structure.

**Simple version (above):** pop from `stacks.get(index)`, drop the sub-stack if empty. Middle stacks can sit below capacity while newer stacks are full. That is fine if the problem only requires a legal pop from that sub-stack.

**Rollover version (sketch, not required code):**

* Pop from stack `index`.
* While there is a next stack, take its **bottom** element (need a structure that exposes bottom, or rebuild) and push it onto the current stack so capacity is restored.
* Repeat down the chain until the last stack.

Rollover keeps the plate metaphor tight: when you remove a plate from an older pile, plates "fall left" from newer piles so no mid pile stays half empty. Cost grows with the number of stacks and elements shifted. Mention it, implement only if asked.

Also clarify index meaning: is 0 the oldest stack or the newest? Pick one and stick to it. In the code above, **0 is the oldest**.

---

## 6. Complexity table

| Operation | Time | Extra space (beyond the elements) | Notes |
| --- | --- | --- | --- |
| `push` | O(1) amortized | O(1) | occasional new stack allocation |
| `pop` | O(1) | O(1) | may remove an empty trailing stack |
| `popAt` (no rollover) | O(1) or O(S) | O(1) | O(S) if removing a middle empty stack shifts the list |
| `popAt` (with rollover) | O(N) worst | O(1) | may touch every later stack |
| `isEmpty` | O(1) | O(1) | empty iff no sub-stacks remain |

N is total elements across all stacks. S is the number of sub-stacks. Space for the structure itself is O(N) to store the values, same as one big stack, plus a small number of stack headers.

---

## 7. Edge cases and common mistakes

Interviewers poke these:

* **capacity = 1** → every push opens a new stack (or fills a size-1 stack and the next push opens another). pop still peels the newest one. Works if you never special-case.
* **capacity invalid** → throw in the constructor, do not wait until push.
* **pop on empty** → throw. Do not return 0 or -1 unless the problem allows a sentinel.
* **pop until empty, then push again** → list of stacks grows from zero cleanly.
* **popAt out of range** → bounds exception.
* **popAt that empties a middle stack** → remove that entry so indices of later stacks shift, or leave a tombstone. Removing is cleaner; document that later indices change.
* **Only one stack, not full** → push stays on that stack. Do not create a second stack early.

Common mistakes:

1. **Forgetting to remove empty trailing stacks after pop.** Then `lastStack()` points at an empty pile and the next pop fails or needs extra null checks.
2. **pushing onto a full last stack.** Always check `size() == capacity` before push.
3. **Treating popAt like pop.** They are different APIs. Callers of popAt chose a specific sub-stack.
4. **Using capacity as total capacity across all stacks.** Capacity is per sub-stack.
5. **Implementing rollover by accident with a single ArrayList of values and modular arithmetic.** That can work for a different design, but then "sub-stacks" become virtual. Prefer an explicit list of deques so the plate metaphor stays visible on the whiteboard.

---

## 8. Explain to a friend recap

Stack of plates asks: keep several short stacks under a capacity limit, but make push and pop feel like one stack.

1. Hold an ordered list of inner stacks. Only the last one receives normal pushes.
2. If the last stack is full, append a new empty stack, then push.
3. Pop from the last stack. If it empties, delete it from the list.
4. LIFO order of the logical stack is preserved: newest plate out first, across pile boundaries.
5. popAt(index) pops only that pile. Either leave holes or roll plates left to refill. Say which you chose.

If you can draw three stacks of height 3, push a 10th plate, pop twice, and explain why the empty rightmost pile disappears, you own problem 3.3.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Stack Min](/blog/en/ctci-3-2-stack-min)
* Next: [Queue via Stacks](/blog/en/ctci-3-4-queue-via-stacks)