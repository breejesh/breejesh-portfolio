---
title: "Partition: Partitioning a Linked List Around a Value X (CTCI 2.4)"
description: "Partition a singly linked list around a value x such that all nodes less than x appear before nodes greater than or equal to x in O(N) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-2-4-partition.webp
previewImage: /assets/images/ctci-2-4-partition.webp
---

> **TL;DR**
> * **The Book Problem:** Write code to partition a linked list around a value $x$, such that all nodes less than $x$ come before all nodes greater than or equal to $x$. If $x$ is contained within the list, the values of $x$ only need to be after the elements less than $x$.
> * **The Optimal Solution:** Maintain two pointers `head` and `tail` pointing to the original list's start. As we iterate through nodes, insert elements $< x$ at the `head` and elements $\ge x$ at the `tail`, achieving an unstable partition in $O(N)$ time and $O(1)$ auxiliary space.
> * **Production Reality:** Quicksort linked list partitioning, priority dispatch queue tiering, and memory allocator size-class binning.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 2.4), we are asked:

*"Write code to partition a linked list around a value x, such that all nodes less than x come before all nodes greater than or equal to x. If x is contained within the list, the values of x only need to be after the elements less than x. The partition element x can appear anywhere in the 'right partition'; it does not need to appear between the left and right partitions."*

**Example:**
* Input: `3 -> 5 -> 8 -> 5 -> 10 -> 2 -> 1` [partition = `5`]
* Output: `1 -> 2 -> 3 -> 5 -> 8 -> 5 -> 10` (or `3 -> 1 -> 2 -> 10 -> 5 -> 5 -> 8`)

## 2. The Algorithmic Approaches

There are two primary ways to solve this problem:

### Approach A: Stable Two-List Partitioning (Preserves Original Relative Order)
Create two separate lists:
1. `before`: elements $< x$ (tracked by `beforeStart` and `beforeEnd`).
2. `after`: elements $\ge x$ (tracked by `afterStart` and `afterEnd`).
3. Merge `beforeEnd.next = afterStart` and terminate `afterEnd.next = null`.

### Approach B: Head / Tail Growing Partitioning (Compact & Clean)
If relative element order does not need to be preserved (unstable partition), we can grow the list from both ends:
1. Initialize `head = node` and `tail = node`.
2. For each subsequent node `current`:
   * If `current.data < x`, insert it before `head` (`current.next = head; head = current;`).
   * If `current.data >= x`, insert it after `tail` (`tail.next = current; tail = current;`).
3. Set `tail.next = null`.

## Production Implementation

```java
public class PartitionList {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    /**
     * Partitions a linked list around value x using head/tail pointer growth.
     * Time Complexity: O(N)
     * Space Complexity: O(1) auxiliary space
     */
    public static LinkedListNode partition(LinkedListNode node, int x) {
        if (node == null) return null;

        LinkedListNode head = node;
        LinkedListNode tail = node;

        LinkedListNode current = node;
        while (current != null) {
            LinkedListNode next = current.next;
            if (current.data < x) {
                // Insert node at head
                current.next = head;
                head = current;
            } else {
                // Insert node at tail
                tail.next = current;
                tail = current;
            }
            current = next;
        }
        tail.next = null;

        // The head has changed, so we return the new head
        return head;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Single pass over all $N$ nodes in the linked list. |
| Auxiliary Space | `O(1)` | In-place pointer modifications with no auxiliary data structures. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Quicksort and Queue Priority Splitting

1. **Quicksort for Linked Lists:** Linked list Quicksort implementations use this partition step to split nodes without allocating arrays, maintaining $O(\log N)$ stack space.
2. **Network Packet QoS / Priority Queues:** Routers classify incoming network packets into low-latency vs bulk-throughput queues based on DSCP priority thresholds.

## Edge Cases & Production Hardening

1. **Empty list or single node:** Handled immediately in $O(1)$.
2. **All elements $< x$ or all elements $\ge x$:** Handled cleanly; `tail.next = null` prevents circular reference cycles.
3. **Partition value $x$ not in list:** Works correctly since the condition only checks `< x` vs `\ge x`.
