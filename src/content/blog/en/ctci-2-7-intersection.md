---
title: "CTCI 2.7 Intersection: Find Where Two Lists Share a Node (Java)"
description: "Given two singly linked lists, return the first shared node by reference (not value). Same tail means they merge; align lengths, then walk together."
date: "2025-12-18"
tags: [Algorithms]
coverImage: /assets/images/ctci-2-7-intersection.webp
previewImage: /assets/images/ctci-2-7-intersection.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** Given two singly linked lists, return the first shared node by reference (not value). Same tail means they merge; align lengths, then walk together.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

Two country roads. Each starts in a different village. Somewhere past the hills they join into one highway and never split again. Cars on either road that reach the merge point share every mile after that. Linked lists can do the same: two chains of nodes, separate at the start, then one shared suffix of **the same node objects**.

This post is problem **2.7 Intersection** from the [CTCI Java series](/blog/en/ctci-series-guide). Original teaching, not a book paste. You return the first shared node, or `null` if the roads never meet.

---

## Everyday analogy

Think of sticky notes on two strings. Each note is a **node object** in memory. A note has a value and a pointer to the next note.

Intersection here is **not** "same number appears in both lists." Two notes can both say `7` and still be different paper. Intersection means both strings eventually reach **the exact same sticky note** (same object in the heap). From that note onward, both lists share the rest of the chain, because `next` pointers are the same objects too.

So: two roads, one merge. Find the first shared mile marker.

---

## The problem in plain words

**Input:** heads of two singly linked lists, `list1` and `list2` (either may be `null`).

**Output:** the **first shared node by reference**, or `null` if there is no shared node.

**Rules that matter**

* Compare nodes with `==` (same object), not `data == data`.
* If they intersect, they share a full suffix: once pointers join, they never fork into different tails.
* Lists may have different lengths before the merge.
* You may not mutate the lists unless you restore them (this solution does not mutate).

**Example (by reference)**

```
list1:  a1 → a2 → c1 → c2 → c3
list2:  b1 → b2 → b3 → c1 → c2 → c3
```

`c1` is the same object in both walks. Answer: node `c1`. Values might look equal earlier; that is irrelevant.

**Node shape**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

---

## How to think before coding

### Hash set of nodes (simple, uses memory)

1. Walk `list1`. Put every **node reference** into a `HashSet<Node>` (identity, not value).
2. Walk `list2`. For each node, if the set already holds that same object, return it.
3. If you finish `list2` with no hit, return `null`.

Time O(A + B), extra space O(A) where A and B are the lengths. Easy to explain. Interviewers often ask for constant extra space next.

### Preferred: same tail + length align (O(1) space)

Key facts:

1. If two singly linked lists intersect, they end on the **same last node**. Different tails means different endings: no shared suffix.
2. If they share a suffix of length S, and the full lengths are L1 and L2, then the private prefixes have lengths L1 - S and L2 - S. The longer list has a longer private prefix equal to `|L1 - L2|`.

Algorithm:

1. Walk each list once. Count length and remember the **tail** node.
2. If the two tails are not the same object, return `null`.
3. Let `diff = |len1 - len2|`. Advance the pointer on the **longer** list by `diff` steps so both pointers have the same number of nodes left.
4. Walk both pointers one step at a time. The first time `p1 == p2`, that is the intersection.
5. If you hit null together, something is wrong with the tail check; with a correct tail check you will meet at the shared start or prove no share earlier.

Why it works: after alignment, both walks are the same length. Every step either stays on private nodes (still different objects) or lands on the shared suffix at the same remaining distance. The first equal references are the merge node.

---

## Java solution

```java
/**
 * Finds the first node that appears in both lists by reference (same object).
 * Returns null if the lists do not intersect.
 */
Node findIntersection(Node list1, Node list2) {
    if (list1 == null || list2 == null) {
        return null;
    }

    TailAndSize a = getTailAndSize(list1);
    TailAndSize b = getTailAndSize(list2);

    // Different last nodes => no shared suffix.
    if (a.tail != b.tail) {
        return null;
    }

    Node shorter = a.size <= b.size ? list1 : list2;
    Node longer = a.size <= b.size ? list2 : list1;
    int diff = Math.abs(a.size - b.size);

    // Skip the extra private prefix on the longer list.
    longer = getKthNode(longer, diff);

    while (shorter != longer) {
        shorter = shorter.next;
        longer = longer.next;
    }
    return longer; // same as shorter; the merge node (or null if both empty, not our case)
}

static class TailAndSize {
    Node tail;
    int size;

    TailAndSize(Node tail, int size) {
        this.tail = tail;
        this.size = size;
    }
}

TailAndSize getTailAndSize(Node head) {
    if (head == null) {
        return new TailAndSize(null, 0);
    }
    int size = 1;
    Node current = head;
    while (current.next != null) {
        size++;
        current = current.next;
    }
    return new TailAndSize(current, size);
}

/** Returns the node k steps from head (0 = head). Assumes the list is long enough. */
Node getKthNode(Node head, int k) {
    Node current = head;
    for (int i = 0; i < k; i++) {
        current = current.next;
    }
    return current;
}
```

Walkthrough for the diagram above:

| Step | Detail |
| --- | --- |
| list1 length | 5, tail = c3 |
| list2 length | 6, tail = c3 |
| tails equal? | yes (same object) |
| diff | 1; advance list2 one step to b2 |
| paired walk | (a1,b2), (a2,b3), (c1,c1) stop |
| result | node c1 |

Hash set version for contrast:

```java
import java.util.HashSet;
import java.util.Set;

Node findIntersectionWithSet(Node list1, Node list2) {
    Set<Node> seen = new HashSet<>();
    for (Node n = list1; n != null; n = n.next) {
        seen.add(n);
    }
    for (Node n = list2; n != null; n = n.next) {
        if (seen.contains(n)) {
            return n;
        }
    }
    return null;
}
```

`HashSet` uses object identity for `Node` unless you override `equals`/`hashCode`. Do **not** override those to use `data` for this problem, or you will match values instead of references.

---

## Complexity

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Length align + joint walk | O(A + B) | O(1) | Two length passes, then one joint walk |
| HashSet of nodes | O(A + B) | O(A) | Simple; mention as first draft |
| Nested scan (each node of A against all of B) | O(A · B) | O(1) | Correct but slow; skip as the main answer |

You must look at every node at least once in the worst case to know the tails and lengths, so linear in total nodes is the right order.

---

## Edge cases interviewers poke

1. **No intersection.** Different tails. Return `null` immediately after the length/tail pass. Do not keep walking forever.
2. **One or both null.** No nodes to share. Return `null`.
3. **Same list twice.** `findIntersection(head, head)` should return `head` (every node is shared; first shared is the head). Lengths equal, joint walk meets on the first step without advancing.
4. **Intersection at the last node only.** Shared suffix length 1. Alignment still works; you meet at that last node.
5. **Intersection at the head of the shorter list.** Longer list is advanced by `diff`, then the first comparison can already be equal.
6. **Equal values, different objects.** `3 → 4 → 5` and another `3 → 4 → 5` built separately: tails are different objects. Answer is `null`. Say "by reference" out loud.
7. **Very different lengths.** Large `diff` is fine; just advance carefully and do not walk off the end (tail equality already guarantees both lists have at least the shared suffix).
8. **Cycles.** Classic CTCI 2.7 assumes acyclic lists. If cycles are possible, you need loop detection first ([Loop Detection](/blog/en/ctci-2-8-loop-detection)). State the assumption.

---

## Common mistakes

* Checking **values** instead of node identity (`n1.data == n2.data` or a bad `equals`).
* Forgetting the **tail check** and only aligning lengths. Two separate lists of the same length never meet, but the joint walk would still run to null and return null; the tail check fails fast and proves the geometry.
* Advancing the **shorter** list by the difference instead of the longer one.
* Building a set of **integer values** instead of node references.
* Mutating one list to attach it to the other as a hack, then forgetting that interviewers hate silent mutation of inputs.
* Assuming the merge node is the first equal **value** in a simultaneous walk without length alignment. Off-by-prefix bugs.

---

## Recap you can tell a friend

Two one-way chains. Do they ever land on the **same** node object and share the rest of the road?

If their last nodes differ, they never merge. If the last nodes are the same object, they share a suffix. Measure both lengths, skip the extra head start on the longer chain, then walk side by side until the pointers are the same reference. That node is the intersection.

Hash set of nodes also works if extra memory is fine. For interviews, lead with the O(1) space length-align story.

---

## Practice

1. Code `findIntersection` from memory: tail + size, align, walk.
2. Draw two lists that share only the last node and trace the pointers.
3. Draw two lists with equal values and no shared objects; confirm you return null.
4. Explain why `HashSet<Integer>` of values is the wrong tool.

Previous: [Palindrome](/blog/en/ctci-2-6-palindrome). Next: [Loop Detection](/blog/en/ctci-2-8-loop-detection). Full series map: [CTCI in Java](/blog/en/ctci-series-guide).