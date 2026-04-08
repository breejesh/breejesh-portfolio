---
title: "Remove Dups: Delete Duplicates from an Unsorted Linked List (Java)"
description: "CTCI-style problem 2.1 for beginners: strip duplicate values from a singly linked list. HashSet walk in O(N), then a no-buffer runner pointer in O(N^2)."
date: "2026-04-08"
tags: [Algorithms]
coverImage: /assets/images/ctci-2-1-remove-dups.webp
previewImage: /assets/images/ctci-2-1-remove-dups.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 2.1 for beginners: strip duplicate values from a singly linked list. HashSet walk in O(N), then a no-buffer runner pointer in O(N^2).
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

Your phone contact list has "Ana" three times, "Sam" twice, and a few clean names. You want each person once. You do not care about alphabetical order. You just walk the list, remember who you already kept, and drop the rest. That is remove dups on a linked list.

This post is original teaching for absolute beginners in **Java**. Same problem family as classic interview linked-list warmups, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 2 starts here.

---

## 1. Everyday analogy

Picture sticky notes on a string. Each note holds one number. Notes can only point to the next note (a singly linked list).

* Walk from the first note.
* If that number is new, keep the note and remember the number.
* If that number already appeared earlier, snip the note out of the string and close the gap.

You are not sorting. You are not counting how many times a value appears. You only keep the **first** occurrence of each value and throw away later copies.

---

## 2. Plain problem statement

**Input:** the head of an unsorted singly linked list of integers (or `null`).

**Output:** the same list structure with duplicate **values** removed. Order of first occurrences stays the same. Usually you mutate in place and return void (or return the same head).

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

**Examples:**

| Before (head → …) | After | Why |
| --- | --- | --- |
| `1 → 2 → 3 → 2 → 1` | `1 → 2 → 3` | second `2` and second `1` dropped |
| `5 → 5 → 5` | `5` | keep the first only |
| `7` | `7` | single node, nothing to remove |
| `null` | `null` | empty list |
| `1 → 2 → 3` | `1 → 2 → 3` | already unique |

**Clarify before coding** (say this out loud in an interview):

* Singly or doubly linked? (Here: singly.)
* May we use extra memory? (Primary solution yes; follow-up no.)
* Stable keep-first order, or may we rearrange freely?
* What about negative numbers or zero? (Treat like any other `int`.)
* Return a new list or edit the existing nodes?

For this article: mutate in place, keep first occurrence, integers, singly linked.

---

## 3. Think first (brute, hash, then no buffer)

### Brute instinct

For every node, scan the **rest** of the list and delete any later node with the same value. That is already close to the follow-up. Nested walks: O(N²) time, O(1) extra space.

### Primary idea: remember what you kept

Use a `HashSet<Integer>` of values you have already kept. One pointer walks the list. A second pointer (or a "previous" reference) stays one step behind so you can unlink a node.

* First time you see a value: add it to the set, advance previous.
* Value already in the set: skip the current node by setting `previous.next = current.next`.

One pass over the list. Hash lookups are O(1) average. Total time O(N), extra space O(N) in the worst case (all values unique).

### Follow-up: no buffer allowed

Interviewer bans the set. For each node `current`, run a second pointer `runner` from `current` down the remainder of the list. Whenever `runner.next` holds the same data as `current`, unlink `runner.next`. Otherwise advance `runner`.

Outer loop times inner loop: O(N²) time, O(1) extra space. Correct, just slower. Good answer when memory is tight or the set is forbidden.

---

## 4. Java solutions

### (a) HashSet, one pass

```java
import java.util.HashSet;
import java.util.Set;

/**
 * Removes duplicate values from an unsorted singly linked list.
 * Keeps the first occurrence of each value. Mutates the list in place.
 */
void removeDups(Node head) {
    if (head == null) {
        return;
    }

    Set<Integer> seen = new HashSet<>();
    Node previous = null;
    Node current = head;

    while (current != null) {
        if (seen.contains(current.data)) {
            // Drop current: bridge previous over it.
            previous.next = current.next;
        } else {
            seen.add(current.data);
            previous = current;
        }
        current = current.next;
    }
}
```

Walkthrough for `1 → 2 → 3 → 2 → 1`:

| current.data | seen before | action | list shape after step |
| --- | --- | --- | --- |
| 1 | {} | add 1, keep | `1 → 2 → 3 → 2 → 1` |
| 2 | {1} | add 2, keep | same |
| 3 | {1,2} | add 3, keep | same |
| 2 | {1,2,3} | already seen, unlink | `1 → 2 → 3 → 1` |
| 1 | {1,2,3} | already seen, unlink | `1 → 2 → 3` |

### (b) Runner pointer, no extra buffer

```java
/**
 * Same goal as removeDups, but no HashSet and no extra O(N) memory.
 * For each node, scan the rest of the list and remove matching values.
 */
void removeDupsNoBuffer(Node head) {
    Node current = head;

    while (current != null) {
        Node runner = current;
        while (runner.next != null) {
            if (runner.next.data == current.data) {
                // Skip the duplicate node.
                runner.next = runner.next.next;
            } else {
                runner = runner.next;
            }
        }
        current = current.next;
    }
}
```

Why `runner` starts at `current`, not at `head`: you only need to clean **later** copies of `current.data`. Earlier nodes were already cleaned against their own values. Moving `runner` from `current` keeps the inner scan short and avoids touching the prefix again.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| HashSet walk | O(N) average | O(N) | N = number of nodes; space holds distinct values |
| Runner (no buffer) | O(N²) | O(1) | Nested scans of the list |
| Copy into array, unique, rebuild | O(N) | O(N) | Works, but usually not what they want for "linked list skills" |

Prefer **HashSet** in production and in most interviews unless they ban extra memory. Use **runner** when they say "constant space" or "no buffer".

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty list (`null` head)** → return immediately. Do not touch anything.
* **Single node** → leave it alone.
* **All values equal** → only the head remains.
* **Duplicates at the end** → previous must still be able to unlink the last node(s).
* **No duplicates** → set grows to N; list structure unchanged.
* **Negatives and zero** → hash and `==` work the same as for positive ints.
* **Very long list** → HashSet stays linear; runner becomes painfully slow. Mention that tradeoff.

Common mistakes:

1. **Forgetting `previous` when unlinking.** If you only advance `current` and never rewire `previous.next`, the list still holds the duplicate.
2. **Advancing `previous` even when you delete.** After a delete, `previous` still points at the last kept node. Only move `previous` when you keep `current`.
3. **Losing the head.** In this problem the first node is always kept (it cannot be a "later" duplicate of itself). If a variant removed by other rules, you would need a dummy head or a returned head reference.
4. **Starting the runner at `head` every time without care.** You can, but you redo work and risk messy edge logic. From `current` is cleaner.
5. **Using `==` for object payloads later.** Here `data` is `int`, so `==` is correct. For `Integer` or custom types, think about equals and hashCode.

Minimal null-safe entry:

```java
void removeDupsSafe(Node head) {
    // null head is a no-op inside removeDups
    removeDups(head);
}
```

---

## 7. Explain to a friend recap

Remove dups asks: keep each value once in a singly linked list, first wins.

1. HashSet path: walk once, remember values you kept, unlink any repeat. O(N) time, O(N) space.
2. No-buffer path: for each node, scan the rest with a runner and cut matching nodes. O(N²) time, O(1) space.
3. Always rewire `next` when you delete. Do not advance the "kept" pointer past a deleted node.
4. Empty and single-node lists are free wins. All-equal lists shrink to one node.

If you can say that in thirty seconds and write both versions without freezing, you own problem 2.1.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [String Rotation](/blog/en/ctci-1-9-string-rotation)
* Next: [Return Kth to Last](/blog/en/ctci-2-2-return-kth-to-last)