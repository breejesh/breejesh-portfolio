---
title: "Loop Detection: Finding the Start of a Linked List Cycle via Floyd's Algorithm (CTCI 2.8)"
description: "Given a circular linked list, implement an algorithm that returns the node at the beginning of the loop using Floyd's Tortoise and Hare cycle-finding algorithm in O(N) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-2-8-loop-detection.webp
previewImage: /assets/images/ctci-2-8-loop-detection.webp
---

> **TL;DR**
> * **The Book Problem:** Given a circular linked list, implement an algorithm that returns the node at the beginning of the loop.
> * **The Core Breakthrough:** Floyd's Tortoise and Hare: (1) Advance Slow by 1 step and Fast by 2 steps until they collide at distance $k$ from loop start; (2) Reset Slow to list head; (3) Advance both Slow and Fast 1 step at a time until they collide again at the exact loop entry node in $O(N)$ time and $O(1)$ space.
> * **Production Reality:** Cycle detection in distributed deadlocks, transaction dependency graphs, and pointer sanitizers.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 2.8), we are given a linked list that contains a loop (a corrupt list where a node's next pointer points back to an earlier node). We must return the exact node at the beginning of the loop without modifying the list or using extra memory.

## 2. Mathematical Proof of Floyd's Cycle Detection

Let $k$ be the number of nodes before the loop begins, and let $C$ be the loop length.
1. When `Slow` enters the loop (after $k$ steps), `Fast` is at step $2k$ (which is $k \pmod C$ steps inside the loop).
2. `Fast` is $C - (k \pmod C)$ steps behind `Slow`. Since `Fast` catches up by 1 step per iteration, they will collide after $C - (k \pmod C)$ iterations.
3. The collision point is exactly $k$ steps away from the loop start.
4. Therefore, keeping `Fast` at the collision point and moving `Slow` back to the `head`, and advancing both 1 node per step, they will meet at the loop start after exactly $k$ steps.

## Production Implementation

```java
public class LoopDetection {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    public static LinkedListNode findBeginning(LinkedListNode head) {
        LinkedListNode slow = head;
        LinkedListNode fast = head;

        // Find meeting point inside loop
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
                break; // Collision found
            }
        }

        // Error check: No loop found
        if (fast == null || fast.next == null) {
            return null;
        }

        // Move slow to Head, keep fast at Meeting Point
        slow = head;
        while (slow != fast) {
            slow = slow.next;
            fast = fast.next;
        }

        // Both now point to the start of the loop
        return fast;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Fast pointer travels at most 2N steps. |
| Auxiliary Space | `O(1)` | Two pointer registers without HashSet allocation. |

## Real-World Systems Engineering Discussion

PostgreSQL transaction managers and distributed consensus engines use Floyd's cycle detection on wait-for dependency graphs to detect circular wait deadlocks in $O(1)$ space.

## Edge Cases & Production Hardening

1. No loop in list: Fast reaches null, returns null in O(N).
2. Loop starts at head: Returns head in 0 steps.
