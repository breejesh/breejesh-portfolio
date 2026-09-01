---
title: "Delete Middle Node: Deleting a Node from a Singly Linked List Given Only Access to That Node (CTCI 2.3)"
description: "Implement an algorithm to delete a node in the middle of a singly linked list given only direct access to that node in O(1) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-2-3-delete-middle-node.webp
previewImage: /assets/images/ctci-2-3-delete-middle-node.webp
---

> **TL;DR**
> * **The Book Problem:** Implement an algorithm to delete a node in the middle (i.e., any node but the first and last node, not necessarily the exact middle) of a singly linked list, given only access to that node.
> * **The Optimal Solution:** Copy the data and pointer from the next node into the current node (`n.data = n.next.data; n.next = n.next.next;`), effectively bypassing and deleting the successor node in $O(1)$ time and $O(1)$ space.
> * **Production Reality:** Lock-free singly linked queues, event loop timer cancellations, and memory-managed intrusive linked list node recycling.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 2.3), we are asked:

*"Implement an algorithm to delete a node in the middle (i.e., any node but the first and last node, not necessarily the exact middle) of a singly linked list, given only access to that node."*

**Example:**
* Input: the node `c` from the linked list `a -> b -> c -> d -> e -> f`
* Result: nothing is returned, but the new linked list looks like `a -> b -> d -> e -> f`

## 2. The Core Challenge & Inefficiencies

In a traditional singly linked list deletion, removing a node requires traversing from the `head` to find the predecessor node `prev` so we can update `prev.next = current.next` in $O(N)$ time.

However, when we are **only provided access to the target node `n`**, we have no reference to `head` or `prev`. Because links are unidirectional, we cannot step backward.

## 3. The Optimal Value-Copying Mechanism

Instead of physically unlinking the target node `n` from its predecessor, we copy the successor node's state into `n`:
1. Copy data: `n.data = n.next.data`.
2. Skip the successor: `n.next = n.next.next`.

This overwrites the target node with its neighbor's identity and unlinks the neighbor. The operation completes in pure $O(1)$ time without list traversal.

## Production Implementation

```java
public class DeleteMiddleNode {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    /**
     * Deletes a node from a singly linked list given only access to that node.
     * Note: Cannot delete the last node in the list.
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     */
    public static boolean deleteNode(LinkedListNode n) {
        if (n == null || n.next == null) {
            return false; // Failure: cannot delete null or tail node
        }

        LinkedListNode next = n.next;
        n.data = next.data;
        n.next = next.next;
        return true;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(1)` | Direct field assignments without traversal. |
| Auxiliary Space | `O(1)` | Modifies node pointers in-place. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Intrusive Linked Lists & Timer Cancellation

1. **Kernel Intrusive Lists (`struct list_head` in Linux):** Doubly linked intrusive lists allow $O(1)$ node removal because backward pointers exist. When systems constrain memory to singly linked nodes, copying successor payloads enables fast cancellation without list scanning.
2. **Event Loop Timer Wheels:** When a scheduled timer fires or gets cancelled, intrusive singly linked timer buckets remove the event callback node in $O(1)$ time.

## Edge Cases & Production Hardening

1. **Target node is `null`:** Guarded by `if (n == null) return false;`.
2. **Target node is the last node (`n.next == null`):** This problem **cannot** be solved if the target node is the tail, because we cannot turn `n` into `null` (references in Java are passed by value). We must flag this limitation to the interviewer. A common dummy-node workaround sets a sentinel dummy bit or marks the node as deleted.
