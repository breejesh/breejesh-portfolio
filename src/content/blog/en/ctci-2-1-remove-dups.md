---
title: "Remove Dups: Removing Duplicates from an Unsorted Linked List (CTCI 2.1)"
description: "Write code to remove duplicates from an unsorted linked list with a HashSet in O(N) time and without a temporary buffer in O(N^2) time using runner pointers."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-2-1-remove-dups.webp
previewImage: /assets/images/ctci-2-1-remove-dups.webp
---

> **TL;DR**
> * **The Book Problem:** Write code to remove duplicates from an unsorted linked list. How would you solve this problem if a temporary buffer is not allowed?
> * **The Solution:** (1) With Buffer: Use `HashSet<Integer>` in $O(N)$ time and $O(N)$ space; (2) Without Buffer: Use a **Runner Pointer** scanning ahead from current node in $O(N^2)$ time and $O(1)$ space.
> * **Production Reality:** Deduplication in memory allocator free-lists and transaction journal chains.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 2.1), we are asked:

*"Write code to remove duplicates from an unsorted linked list. How would you solve this problem if a temporary buffer is not allowed?"*

## 2. Buffer vs Runner Pointer Mechanics

1. **HashSet Solution ($O(N)$ Time, $O(N)$ Space):** Traverse the list with a single pointer and maintain a `HashSet`. If an element is already in the set, unlink it: `prev.next = current.next`.
2. **No Buffer Solution ($O(N^2)$ Time, $O(1)$ Space):** For each `current` node, deploy a `runner` pointer that iterates through all remaining nodes, deleting any node whose data matches `current.data`.

## Production Implementation

```java
public class RemoveDups {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    // Solution 1: With Buffer - O(N) Time, O(N) Space
    public static void deleteDups(LinkedListNode n) {
        HashSet<Integer> set = new HashSet<>();
        LinkedListNode prev = null;
        while (n != null) {
            if (set.contains(n.data)) {
                prev.next = n.next;
            } else {
                set.add(n.data);
                prev = n;
            }
            n = n.next;
        }
    }

    // Solution 2: Without Buffer - O(N^2) Time, O(1) Space
    public static void deleteDupsNoBuffer(LinkedListNode head) {
        LinkedListNode current = head;
        while (current != null) {
            LinkedListNode runner = current;
            while (runner.next != null) {
                if (runner.next.data == current.data) {
                    runner.next = runner.next.next; // Delete duplicate
                } else {
                    runner = runner.next;
                }
            }
            current = current.next;
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity (With Buffer) | `O(N)` | Single pass with O(1) HashSet lookups. |
| Time Complexity (No Buffer) | `O(N^2)` | Nested runner pointer traversal. |
| Space Complexity | `O(N) vs O(1)` | HashSet memory vs in-place pointers. |

## Real-World Systems Engineering Discussion

Kernel slab allocators sanitize fragmented free-list pointer chains during memory garbage compaction to prevent dangling circular references.

## Edge Cases & Production Hardening

1. List with all identical values (`1->1->1`): Leaves single node.
2. Empty list / 1 node: Untouched in O(1).
