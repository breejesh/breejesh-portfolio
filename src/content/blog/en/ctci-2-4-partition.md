---
title: "CTCI 2.4 Partition: Split a Linked List Around x"
description: "Partition a singly linked list so every node less than x comes before every node greater than or equal to x. Two-list merge in Java, plus a short head/tail grow note."
date: "2026-02-01"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-2-4-partition.webp
previewImage: /assets/images/ctci-2-4-partition.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** Partition a singly linked list so every node less than x comes before every node greater than or equal to x. Two-list merge in Java, plus a short head/tail grow note.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

Airport security has two lanes. One for bags under a weight limit, one for bags at or over it. People walk up in random order. You do not sort them by weight. You only care that every light bag ends up on the left lane and every heavy bag ends up on the right. That is **partition** for a linked list: a cut around a value `x`, not a full sort.

This is problem **2.4** from the [CTCI Java series](/blog/en/ctci-series-guide), Chapter 2 (Linked Lists). Original walkthrough and code, not a book paste.

---

## The problem in plain words

You get the head of a singly linked list of integers, and an integer `x`.

**Goal:** rearrange the nodes so that every node with value **strictly less than** `x` comes before every node with value **greater than or equal to** `x`.

Details interviews care about:

- Nodes equal to `x` live on the **right** side (with the "greater or equal" group). They do not need a special middle bucket unless you invent one.
- **Stable order** (keeping original relative order inside each side) is nice and often free with the two-list approach. The problem does not always require stability.
- Prefer **reusing existing nodes**. Do not allocate a fresh node for every value unless the interviewer says you must.

Example from the classic set:

```
Input:  3 → 5 → 8 → 5 → 10 → 2 → 1 ,  x = 5
One valid output:  3 → 1 → 2 → 10 → 5 → 5 → 8
```

Left of the cut: `3, 1, 2` (all `< 5`). Right: `10, 5, 5, 8` (all `>= 5`). Another valid list could shuffle order inside each half, as long as the cut rule holds.

---

## How to think before coding

### Wrong instinct: sort the list

Full sort is correct for the cut rule, but it is more work than asked. Partition is weaker than sort. Target linear time and constant extra pointers.

### Main idea: two lists, then glue

Walk the list once. For each node, detach it (`node.next = null` after saving the real next), then append it to one of two chains:

1. **Before** list: values `< x`
2. **After** list: values `>= x`

Keep a head and a tail for each chain so append is O(1). When the walk ends:

- If **before** is empty, return **after** head.
- Else set `beforeTail.next = afterHead` and return **before** head.
- Set `afterTail.next = null` (or keep detaching as you go) so you do not leave a cycle from old links.

That is the whole algorithm. One pass. Four pointers (or two dummy heads). Easy to explain on a whiteboard.

### Optional variant: grow from head and tail

Another style grows a single result list from both ends:

- Values `< x` are inserted at the **front** (new head).
- Values `>= x` are appended at the **tail**.

That also partitions in one pass. Order on the left is usually **reversed** relative to the original, which is fine when stability is not required. The two-list merge is clearer when you want stable order and a story that matches "left bucket, right bucket."

---

## Java solution (two-list merge)

```java
/** Singly linked list node used across Chapter 2 examples. */
public class ListNode {
    public int val;
    public ListNode next;

    public ListNode(int val) {
        this.val = val;
    }
}

/**
 * Partition list around x: all nodes with val < x before nodes with val >= x.
 * Stable within each side if you always append to that side's tail.
 * Reuses existing nodes. Returns the new head.
 */
public static ListNode partition(ListNode head, int x) {
    ListNode beforeHead = null;
    ListNode beforeTail = null;
    ListNode afterHead = null;
    ListNode afterTail = null;

    ListNode current = head;
    while (current != null) {
        ListNode next = current.next;
        // Detach so old links cannot form a cycle after the merge.
        current.next = null;

        if (current.val < x) {
            if (beforeHead == null) {
                beforeHead = current;
                beforeTail = current;
            } else {
                beforeTail.next = current;
                beforeTail = current;
            }
        } else {
            if (afterHead == null) {
                afterHead = current;
                afterTail = current;
            } else {
                afterTail.next = current;
                afterTail = current;
            }
        }

        current = next;
    }

    if (beforeHead == null) {
        return afterHead;
    }

    beforeTail.next = afterHead;
    return beforeHead;
}
```

Trace the example with `x = 5`:

| Node seen | Goes to | Before list | After list |
| --- | --- | --- | --- |
| 3 | before | 3 | (empty) |
| 5 | after | 3 | 5 |
| 8 | after | 3 | 5 → 8 |
| 5 | after | 3 | 5 → 8 → 5 |
| 10 | after | 3 | 5 → 8 → 5 → 10 |
| 2 | before | 3 → 2 | 5 → 8 → 5 → 10 |
| 1 | before | 3 → 2 → 1 | 5 → 8 → 5 → 10 |

Glue: `3 → 2 → 1 → 5 → 8 → 5 → 10`. Valid partition. (The book's sample order differs inside each half; both are fine.)

Dummy-node version of the same idea: start with empty `before` and `after` sentinels, always append via their tails, then link `beforeTail.next = afterHead.next` and return `beforeHead.next`. Same complexity, slightly fewer null checks.

---

## Complexity

| | Cost | Why |
| --- | --- | --- |
| Time | O(n) | One walk over n nodes. Each node is appended once. |
| Extra space | O(1) | A handful of pointers. Nodes themselves are reused, not copied into new objects. |

You must look at every node to know which side it belongs on, so linear time is the right floor.

---

## Edge cases interviewers poke

1. **Null or empty list.** Return null. Do not crash on `beforeTail`.
2. **All values `< x`.** After list stays empty. Return before head. Tail's `next` is already null if you detached.
3. **All values `>= x`.** Before list empty. Return after head.
4. **Single node.** Either side is fine depending on the value. Result is that same node with `next == null`.
5. **`x` appears many times.** All copies go to the after side. No special middle list required.
6. **Duplicates mixed with other values.** Stability (if you append) keeps relative order inside each side. State that out loud if they ask.
7. **Forgetting to null out `next`.** Classic bug: after merge, the old chain still points somewhere and you get a cycle or a wrong tail.
8. **Comparing with `<=` by accident.** Problem is usually **strict** `<` on the left. Confirm the inequality before coding.

---

## Common mistakes

- Sorting, then claiming you "partitioned." Correct but overkill, and signals you missed the weaker requirement.
- Building new nodes for every value and leaking the old list. Interviewers often want pointer surgery on the existing nodes.
- Linking `before` to `after` without handling empty before (null pointer) or empty after (fine if tail already points to null).
- Leaving `afterTail.next` pointing into the middle of the old list because you never broke links.

---

## Recap you can tell a friend

Partition is airport lanes, not a full sort. Everything under weight `x` goes left. Everything else goes right.

Walk the list once. Pull each node off and append it to a **before** chain or an **after** chain. Glue before to after. Return the left head, or the right head if the left never got a node.

One pass, a few pointers, no drama. If they allow unstable order, growing from head and tail works too. Prefer the two lists when you want a clean story and stable halves.

---

## Practice

1. Code `partition` from memory with four pointers, then again with dummy heads.
2. Trace `3 → 5 → 8 → 5 → 10 → 2 → 1` with `x = 5` on paper.
3. Trace all-small and all-large inputs.
4. Break a correct solution on purpose by skipping `current.next = null` and see the cycle.

Previous in the series: [Delete Middle Node](/blog/en/ctci-2-3-delete-middle-node). Next: [Sum Lists](/blog/en/ctci-2-5-sum-lists). Full map: [CTCI in Java](/blog/en/ctci-series-guide).