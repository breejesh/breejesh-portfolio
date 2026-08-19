---
title: "Delete Middle Node: Remove a Node Without Head Access (Java)"
description: "CTCI-style problem 2.3: delete a middle node of a singly linked list when you only hold a pointer to that node. Copy the next value, skip the next node, and know why the last node fails."
date: "2026-05-14"
tags: [Algorithms]
coverImage: /assets/images/ctci-2-3-delete-middle-node.webp
previewImage: /assets/images/ctci-2-3-delete-middle-node.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 2.3: delete a middle node of a singly linked list when you only hold a pointer to that node. Copy the next value, skip the next node, and know why the last node fails.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You are in a conga line. Someone taps you on the shoulder and says: remove yourself. You cannot reach the person behind you, so you cannot ask them to skip you. The only move that works is weird: you become the person in front of you. Copy their costume, their name tag, then step them out of the line and close the gap. Everyone else still thinks the chain is intact. That is delete middle node on a singly linked list.

This post is original teaching for beginners in **Java**. Same problem family as classic interview linked-list tricks, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide).

---

## 1. Everyday analogy

A singly linked list is a one-way conga line. Each person only knows who is next. You do **not** get the head of the line. You only get a pointer to one person somewhere in the middle, and the task is: take them out.

Normal unlink needs the previous node:

```
prev.next = node.next
```

Here you do not have `prev`. So you cheat:

1. Steal the next person's identity (copy `next.data` into the current node).
2. Skip the next person (`current.next = next.next`).

The middle "slot" still exists as an object, but it now holds the next value and points where the next node used to point. From the outside, that value is gone from the sequence.

---

## 2. Plain problem statement

**Input:** a single `Node` reference `node` that is **not** the first or last node of a singly linked list. You do **not** receive the head.

**Output:** mutate the list so the value that was at `node` no longer appears in the sequence. The list should look as if that middle node was deleted.

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

**Example:**

| Before | Delete this | After | Why |
| --- | --- | --- | --- |
| `a → b → c → d → e` | node holding `c` | `a → b → d → e` | `c` becomes `d`, then original `d` is skipped |
| `1 → 2 → 3 → 4` | node holding `2` | `1 → 3 → 4` | copy `3` into the `2` slot, skip old `3` |
| `1 → 2 → 3 → 4` | node holding `3` | `1 → 2 → 4` | same idea one step later |

**Clarify before coding** (say this out loud):

* Is the node guaranteed not to be the last? (Classic statement: yes, or "any node but the last".)
* Is it guaranteed not to be the head? (Usually yes for this problem; head delete needs a different contract.)
* May we overwrite `data`? (Yes. That is the whole trick.)
* Singly or doubly linked? (Here: singly.)
* What if the list has only one node? (Out of scope; you cannot "become next" with no next.)

For this article: middle-ish node with a non-null `next`, integers, mutate in place, return success or void.

---

## 3. Think first

### What you cannot do

* Walk from head to find `prev`. You do not have head.
* Set `node = node.next`. That only rebinds a local variable. The previous node's `next` still points at the old object.
* Free the node without rewiring. The chain still includes it.

### The only practical trick

If `node.next` exists:

```
node.data = node.next.data
node.next = node.next.next
```

You deleted the **next** node physically, after copying its payload into the current node. Effectively, the value that used to live at `node` is gone. Later values shift left by one "logical" slot.

### Why the last node fails

If `node.next == null`, there is no identity to steal and no next node to skip. You cannot remove the last value without the previous pointer (or a sentinel design). In an interview, say that clearly: this algorithm does not delete a true last node.

Some interviewers accept "mark as dummy / throw / return false". Pick a clear contract and stick to it.

---

## 4. Java solution

```java
/**
 * Deletes a middle node from a singly linked list given only that node.
 * Copies the next node's data into this node, then skips the next node.
 * Does not work for the last node (no next to copy from).
 *
 * @return true if deleted, false if node is null or is the last node
 */
boolean deleteMiddleNode(Node node) {
    if (node == null || node.next == null) {
        // Cannot delete last node (or a null reference) this way.
        return false;
    }

    Node next = node.next;
    node.data = next.data;
    node.next = next.next;
    return true;
}
```

Walkthrough for `a → b → c → d → e`, delete the node holding `c`:

| Step | `node.data` | `node.next` points to | List as seen from head |
| --- | --- | --- | --- |
| Start | `c` | `d` | `a → b → c → d → e` |
| Copy data | `d` | `d` (same object) | `a → b → d → d → e` (two nodes both hold `d` for a moment) |
| Skip next | `d` | `e` | `a → b → d → e` |

The old `d` node is unlinked and eligible for GC. Callers who still held a pointer to the old `c` object now see `d` in that object. That is the usual tradeoff of this trick: identity of the node object is not the same as identity of the value in the sequence.

Minimal driver for mental testing:

```java
Node build(int... vals) {
    Node dummy = new Node(0);
    Node t = dummy;
    for (int v : vals) {
        t.next = new Node(v);
        t = t.next;
    }
    return dummy.next;
}

// head: 1 → 2 → 3 → 4 → 5
// delete the node with value 3 (must look it up only for the demo)
Node head = build(1, 2, 3, 4, 5);
Node target = head.next.next; // the 3
deleteMiddleNode(target);
// list is now 1 → 2 → 4 → 5
```

In a real call site for this problem, the interviewer hands you `target` directly. You never search from head.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Copy next + skip | O(1) | O(1) | Only constant pointer work |
| Walk from head to find prev | O(N) | O(1) | Needs head; not allowed by the prompt |
| Copy whole list without that value | O(N) | O(N) | Overkill and still needs head |

This is one of the rare linked-list problems that is true O(1) time when the constraints hold.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Last node** → return false, throw, or document "not supported". Do not NPE on `node.next.data`.
* **Null node** → guard first.
* **Two-node list, delete first of the two** → works: first becomes second, then second is skipped. List becomes a single node. Whether "first of two" counts as middle depends on the interviewer's wording; the algorithm still runs.
* **Head when length > 2** → the algorithm still "works" technically (you overwrite head's data and skip the old second node). Many problem statements still say "not the first or last". Follow the stated constraint.
* **Duplicate values** → fine. You remove one occurrence of that value's position, not "all equals".
* **External references to the deleted value's old node** → they now point at the object that holds the next value. Mention this if the list is shared.

Common mistakes:

1. **Only doing `node = node.next`.** Local rebinding does not unlink anything.
2. **Forgetting to copy data.** If you only skip next, you keep the middle value and lose the next one. That is the opposite of deleting the middle.
3. **Assuming you can free the last node.** You cannot with only that pointer on a singly linked list.
4. **Returning void and ignoring failure.** Prefer a boolean or a clear exception so callers know last-node cases failed.
5. **Thinking the node object is gone.** The object at `node` stays; its payload changes. "Delete" is logical for the sequence, not always physical for that Java object.

---

## 7. Explain to a friend recap

Delete middle node asks: remove a value from a singly linked list when you only hold that node, not the head.

1. You cannot rewire the previous pointer. You do not have it.
2. Copy the next node's data into the current node.
3. Point current past the next node.
4. Last node has no next, so this trick fails. Say so up front.

If you can write the three-line body and explain the last-node limit in thirty seconds, you own problem 2.3.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Return Kth to Last](/blog/en/ctci-2-2-return-kth-to-last)
* Next: [Partition](/blog/en/ctci-2-4-partition)