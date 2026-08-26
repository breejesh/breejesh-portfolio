---
title: "Loop Detection: Find the Start of a Cycle in a Linked List (Java)"
description: "CTCI-style problem 2.8 for beginners: given a circular linked list, return the node where the loop begins. Floyd tortoise and hare, then the head reset trick, in plain Java."
date: "2026-02-12"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-2-8-loop-detection.webp
previewImage: /assets/images/ctci-2-8-loop-detection.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 2.8 for beginners: given a circular linked list, return the node where the loop begins. Floyd tortoise and hare, then the head reset trick, in plain Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You jog on a trail that starts straight and then joins a circular park path. You never notice the join until you start seeing the same tree again. A friend starts with you and runs twice as fast. You will meet somewhere on that circle. The cool part: once you meet, if your friend walks back to the trailhead and you both walk at the same pace, you meet again exactly at the entrance to the loop. That is **loop detection** on a linked list.

This post is original teaching for absolute beginners in **Java**. Same problem family as classic interview cycle questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 2 ends here.

---

## 1. Everyday analogy

Think of a running track with an access road:

* The access road is the non-loop prefix of the list (from `head` until the first node that is also on the cycle).
* The oval track is the cycle. Some node points back into an earlier node instead of ending at `null`.
* A **tortoise** walks one step at a time. A **hare** walks two steps at a time.

If there is no oval, the hare hits the end of the road (`null`) and you are done: no loop.

If there is an oval, the hare eventually laps the tortoise on the track. They collide at some node *inside* the cycle, not necessarily the start. Phase two finds the start: send one runner back to the trailhead, keep the other at the meeting point, both walk one step at a time. Their next collision is the **beginning of the loop**.

---

## 2. Plain problem statement

**Input:** the head of a singly linked list. The list may be linear, or it may contain a cycle (some node’s `next` points to an earlier node).

**Output:** the node at the **beginning of the loop**, or `null` if there is no loop.

"Beginning of the loop" means the first node that can be reached again by following `next` forever. It is the unique node that has two incoming edges in the cycle picture: one from the non-loop prefix (or from itself if the whole list is a cycle starting at the head), and one from the previous node on the cycle.

**Node shape we use:**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

**Examples (letters label node identity, not just values):**

| List shape | Loop starts at | Why |
| --- | --- | --- |
| `A → B → C → D → E → C` (E points back to C) | `C` | first node on the cycle |
| `A → B → C → null` | none (`null`) | linear list |
| `A → A` (self loop) | `A` | single node cycle |
| `A → B → C → A` | `A` | cycle includes the head |
| `null` | `null` | empty list |

**Clarify before coding:**

* Singly linked? (Yes.)
* Must we use O(1) extra space? (Floyd does. A HashSet of visited nodes is simpler but uses O(N) space.)
* Return the node object, not just its data value.
* Is a self-loop allowed? (Yes.)

---

## 3. Think first (hash set, then Floyd)

### Brute instinct: remember every node you visit

Walk from the head. Put each `Node` reference into a `HashSet`. If `next` is already in the set, that node is the loop start (the first time you try to re-enter a visited node via a later edge, you have found the start for a standard single-cycle list). If you hit `null`, there is no loop.

Time O(N), space O(N). Fine in production. Interviewers often want the constant-space version.

### Floyd: tortoise and hare (detect, then locate)

**Phase 1, detect a meeting point.**

* `slow = head`, `fast = head`
* Loop: `slow = slow.next` (1 step), `fast = fast.next.next` (2 steps)
* Guard: if `fast` or `fast.next` is `null`, no cycle → return `null`
* When `slow == fast`, they met inside the cycle

**Phase 2, find the loop start.**

* Leave `slow` (or `fast`) at the meeting node
* Set the other pointer back to `head`
* Advance **both** one step at a time until they are equal
* That node is the beginning of the loop

### Why the reset works (short intuition)

Let:

* `μ` = number of nodes before the loop starts (the access road length)
* `λ` = length of the cycle (the oval)
* When they meet, `slow` has walked some distance `μ + a` into the structure (`a` steps past the loop entrance, with `0 ≤ a < λ`)

Because `fast` moves twice as fast, the extra distance it ran is a whole number of laps. That forces a clean modular identity: the remaining distance from the meeting point around the cycle back to the entrance equals `μ` modulo `λ`.

So if one pointer restarts at the head and both walk `μ` steps at speed 1, they arrive at the entrance together. You do not need to know `μ` or `λ` in code. Equality of the two pointers is enough.

You do not need a proof on the whiteboard. You *do* need the story: meet on the oval, then race from head and meeting point at equal speed, collide at the gate.

---

## 4. Java solution

```java
/**
 * Returns the node at the start of the cycle, or null if the list is acyclic.
 * Floyd cycle detection: meet with tortoise/hare, then reset one pointer to head.
 */
Node findLoopStart(Node head) {
    if (head == null) {
        return null;
    }

    Node slow = head;
    Node fast = head;

    // Phase 1: do they ever meet?
    boolean met = false;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            met = true;
            break;
        }
    }

    if (!met) {
        return null; // no loop
    }

    // Phase 2: one pointer back to head; both step once until equal.
    slow = head;
    while (slow != fast) {
        slow = slow.next;
        fast = fast.next;
    }
    return slow; // beginning of the loop
}
```

Walkthrough for `A → B → C → D → E → C`:

| Phase | Event |
| --- | --- |
| Start | `slow` and `fast` at `A` |
| Steps | hare pulls ahead; both eventually enter `C-D-E` |
| Meet | they collide on some node in `{C, D, E}` (exact node depends on lengths; often `C` or `D` or `E`) |
| Reset | put `slow` on `A`, leave `fast` on the meeting node |
| Equal pace | both advance one node at a time |
| Done | they stand together on `C` |

For a self-loop `A → A`: phase 1 meets immediately at `A` after the first move pair. Phase 2 sets `slow = head` which is also `A`, so `slow == fast` at once. Return `A`.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| HashSet of visited nodes | O(N) | O(N) | Simple; first re-seen node is the loop start |
| Floyd (tortoise / hare) | O(N) | O(1) | Two phases; preferred interview answer for space |
| Mark nodes (mutate a flag field) | O(N) | O(1) | Needs a writable field; bad if the list is shared |

N is the number of distinct nodes until you re-enter the cycle (or the full length if linear). Floyd never allocates a set, so it wins when memory is tight or the interviewer bans buffers.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **No loop** → phase 1 hits `null` via `fast` or `fast.next`. Return `null`. Do not enter phase 2.
* **Single node, no self-loop** (`A → null`) → `fast.next` is null on the first check. No loop.
* **Single node self-loop** (`A → A`) → loop start is `A`. Phase 2 is immediate equality after reset.
* **Cycle includes the head** (`A → B → C → A`) → loop start is `A`. After meeting, resetting `slow` to head makes them meet at `A` without extra walking if the meeting point is already consistent, or after walking the full cycle offset.
* **Empty list** → return `null` up front.
* **Two-node cycle** (`A → B → A`) → still works; do not special-case.
* **Long prefix, tiny loop** or **tiny prefix, huge loop** → same algorithm. Time stays linear in N.

Common mistakes:

1. **Comparing data values instead of node identity.** Two nodes can hold the same `int` without being the same object. Use `==` on references.
2. **Moving both pointers before checking null on `fast.next`.** Always guard `fast != null && fast.next != null` before `fast.next.next`.
3. **Forgetting phase 2.** Meeting proves a cycle exists. It does **not** prove the meeting node is the start.
4. **Advancing at different speeds in phase 2.** Both must move one step. The math only works at equal pace after the reset.
5. **Returning the meeting point from phase 1 as the answer.** Wrong almost always, unless the loop happens to start there by luck of the lengths.

Minimal null-safe entry:

```java
Node findLoopStartSafe(Node head) {
    return findLoopStart(head);
}
```

---

## 7. Explain to a friend recap

Loop detection asks: if a singly linked list has a cycle, which node begins it?

1. Tortoise steps one, hare steps two. If the hare falls off the end, no cycle.
2. If they meet, a cycle exists somewhere after (or at) the head.
3. Put one pointer back at the head. Walk both one step at a time. Where they meet is the loop start.
4. Why: the non-loop prefix length and the offset around the cycle line up when both walk at the same speed after the reset. You get the gate of the oval without counting μ or λ by hand.
5. Empty list and linear lists return null. A self-loop of one node returns that node.

If you can say that in thirty seconds, sketch the two phases, and not confuse "meeting point" with "loop start", you own problem 2.8.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Intersection](/blog/en/ctci-2-7-intersection)
* Next: [Three in One](/blog/en/ctci-3-1-three-in-one)