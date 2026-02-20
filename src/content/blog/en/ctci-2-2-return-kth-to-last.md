---
title: "CTCI 2.2 Return Kth to Last: Two Pointers on a Linked List"
description: "Find the kth node from the end of a singly linked list. Walk the classic two-pointer gap of k, then a short recursive index wrapper, in plain Java."
date: "2026-02-20"
tags: [Algorithms]
coverImage: /assets/images/ctci-2-2-return-kth-to-last.webp
previewImage: /assets/images/ctci-2-2-return-kth-to-last.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** Find the kth node from the end of a singly linked list. Walk the classic two-pointer gap of k, then a short recursive index wrapper, in plain Java.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You and a friend walk a single-file trail. Your friend starts **k steps** ahead. When your friend hits the end of the trail, you are standing on the kth rock from the end. You never needed the total length. You only needed the gap.

That is **Return Kth to Last**: find the node that sits k places from the end of a singly linked list. We define **k = 1 as the last element**.

This is CTCI-style problem **2.2**, Chapter 2 (Linked Lists). Main solution: iterative two pointers. Optional: recursive with a small index wrapper. Original teaching in Java, not a book paste.

Series: [CTCI in Java](/blog/en/ctci-series-guide). Previous: [2.1 Remove Dups](/blog/en/ctci-2-1-remove-dups). Next: [2.3 Delete Middle Node](/blog/en/ctci-2-3-delete-middle-node).

---

## Everyday picture

A train of boxcars, head to tail. You only walk forward. There is no reverse gear and no count painted on the cars.

Someone asks: "Give me the 2nd car from the caboose." If you knew the length n, you would walk n - 2 steps from the head. You do not know n yet. Counting once to get n, then walking again, works. It is also two full passes.

Better: send a scout car **k** cars ahead. Then move scout and you together, one car at a time. When the scout falls off the end, your car is the kth from the end.

---

## Problem in plain words

**Input:** head of a singly linked list, and a positive integer `k`.

**Output:** the node that is the **kth from the end**. With our convention, `k = 1` returns the last node, `k = 2` returns the second-to-last, and so on.

**Examples** (list drawn head → tail):

| List | k | Result | Why |
| --- | --- | --- | --- |
| `1 → 2 → 3 → 4 → 5` | 1 | node `5` | last element |
| `1 → 2 → 3 → 4 → 5` | 2 | node `4` | second from end |
| `1 → 2 → 3 → 4 → 5` | 5 | node `1` | k equals length |
| `1 → 2 → 3` | 4 | null (or error) | k bigger than length |
| `7` | 1 | node `7` | single node, last is itself |

**Clarify out loud before coding:**

* Is `k = 1` the last node? (Yes here. Some teams use 0-based. Ask.)
* What if `k` is larger than the list length? Return null, throw, or return a sentinel? Pick one and stick to it. We return `null`.
* Return the **node**, or only its value? Interviews often want the node so you can keep chaining.
* Null head? Treat as empty list → null.

---

## How to think before coding

### Brute force: length, then walk

1. Walk the list once, count `n`.
2. If `k > n`, fail.
3. Walk again `n - k` steps from the head.

Correct. Two passes. Fine if the interviewer is happy with O(n) time and two trips. Many interviewers then ask: can you do it in **one** pass?

### One pass: two pointers with a gap of k

1. Pointer `p1` and `p2` both start at `head`.
2. Advance `p1` exactly `k` steps. If you fall off early, `k` is too big.
3. Advance `p1` and `p2` together until `p1` is null.
4. `p2` now sits on the kth-from-last node.

Why it works: when `p1` has walked the whole remaining suffix, `p2` has stayed exactly `k` nodes behind the "end." The end is one past the last node, so `p2` is on the kth-to-last.

Trace `1 → 2 → 3 → 4 → 5`, `k = 2`:

| Step | p1 | p2 |
| --- | --- | --- |
| start | 1 | 1 |
| advance p1 once | 2 | 1 |
| advance p1 twice | 3 | 1 |
| move both | 4 | 2 |
| move both | 5 | 3 |
| move both | null | 4 |

`p2` is `4`. Done.

### Recursive idea (optional)

Recurse to the end. On the way back, count how many nodes you have passed. When the count hits `k`, that node is the answer. You need a **shared counter** (or a small wrapper object), because a plain `int` return cannot carry both "the count" and "the answer node" cleanly in Java without a helper type.

Recursive is elegant in interviews if you can explain the stack. Prefer the iterative two-pointer version as your main answer: O(1) extra space, no stack risk on long lists.

---

## Java solution

### Node type

```java
/** Singly linked list node. Original teaching model for this series. */
public class Node {
    public int data;
    public Node next;

    public Node(int data) {
        this.data = data;
    }
}
```

### Main answer: iterative two-pointer

```java
/**
 * Returns the kth node from the end of the list.
 * k = 1 means the last node. Returns null if the list is too short
 * or inputs are invalid.
 */
public static Node kthToLast(Node head, int k) {
    if (head == null || k < 1) {
        return null;
    }

    Node p1 = head;
    Node p2 = head;

    // Open a gap of k between p1 and p2.
    for (int i = 0; i < k; i++) {
        if (p1 == null) {
            // k is larger than the number of nodes.
            return null;
        }
        p1 = p1.next;
    }

    // When p1 walks off the end, p2 is k nodes from the end.
    while (p1 != null) {
        p1 = p1.next;
        p2 = p2.next;
    }
    return p2;
}
```

Build a tiny list and call it:

```java
// 1 → 2 → 3 → 4 → 5
Node head = new Node(1);
head.next = new Node(2);
head.next.next = new Node(3);
head.next.next.next = new Node(4);
head.next.next.next.next = new Node(5);

Node ans = kthToLast(head, 2); // data == 4
```

### Optional: recursive with an index wrapper

```java
/** Mutable counter so recursion can share one index on the way back. */
static class Index {
    int value = 0;
}

/**
 * Recursive kth-to-last. Same k convention: k = 1 is the last node.
 * Uses O(n) stack space. Prefer kthToLast for production-sized lists.
 */
public static Node kthToLastRecursive(Node head, int k) {
    if (k < 1) {
        return null;
    }
    return kthToLastRecursive(head, k, new Index());
}

private static Node kthToLastRecursive(Node head, int k, Index idx) {
    if (head == null) {
        return null;
    }
    Node candidate = kthToLastRecursive(head.next, k, idx);
    idx.value += 1;
    if (idx.value == k) {
        return head;
    }
    return candidate;
}
```

On the unwind, the last node gets count 1, the one before it gets 2, and so on. When count equals `k`, return that node. Nodes closer to the head keep returning the candidate they already found (or null if `k` was too large).

---

## Complexity

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Length then walk | O(n) | O(1) | Two passes |
| Two-pointer gap | O(n) | O(1) | One pass, main answer |
| Recursive index | O(n) | O(n) stack | Nice to mention, not the default ship |

You must look at every node in the worst case (or at least enough of the list to place both pointers), so linear time is the right order.

---

## Edge cases interviewers poke

1. **Null head.** Empty list. Return null.
2. **k less than 1.** Invalid. Return null (or throw). State the contract.
3. **k larger than length.** After fewer than k advances, `p1` is null. Return null.
4. **k equals length.** After k advances, `p1` is null. The joint walk never runs. `p2` stays on head. Correct: head is the kth from the end.
5. **k = 1.** Last node. Gap of one: `p1` starts one step ahead, both walk until `p1` is null, `p2` lands on the last real node.
6. **Single node, k = 1.** Works. Single node, k = 2: fail.
7. **Do not mutate the list.** This problem is read-only. Leave `next` pointers alone.
8. **Off-by-one on the gap.** The classic bug is advancing `k - 1` or `k + 1` by accident. Trace k = 1 and k = n on paper before you talk.

---

## Common mistakes

* Counting from the **front** as "kth node" instead of kth from the **end**.
* Using a 0-based mental model (`k = 0` is last) without saying so. The room gets confused.
* Advancing the runner `k - 1` times when your definition is k = 1 last. Stick to "advance k times, then walk together until runner is null."
* Forgetting to check null while opening the gap, then NPE when `k` is huge.
* Returning `p2.data` when the interviewer asked for the **node**.

---

## Recap you can tell a friend

You want the kth boxcar from the end, and you only walk forward.

Send a scout **k** cars ahead. Walk scout and you in lockstep. When the scout falls off the train, you are on the kth car from the end. No length variable required.

Recursive version: walk to the end, count on the way back, grab the node when the count hits k. Same idea, stack instead of a second pointer.

Ship the two-pointer version. Mention recursion if they ask for another angle.

---

## Practice

1. Code `kthToLast` from memory. Trace k = 1, k = 2, and k = n on `1 → 2 → 3 → 4 → 5`.
2. Implement the length-then-walk version and prove both return the same node.
3. Write the recursive wrapper and explain why a shared `Index` (or `int[]`) is needed in Java.
4. Break your own code with k = 0, empty list, and k bigger than length.

Previous: [2.1 Remove Dups](/blog/en/ctci-2-1-remove-dups). Next: [2.3 Delete Middle Node](/blog/en/ctci-2-3-delete-middle-node). Full series map: [CTCI in Java](/blog/en/ctci-series-guide).