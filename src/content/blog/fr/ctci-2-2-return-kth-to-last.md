---
title: "Return Kth to Last: Finding the Kth to Last Element of a Singly Linked List (CTCI 2.2)"
description: "Implement an algorithm to find the kth to last element of a singly linked list using the two-pointer sliding window technique in O(N) time and O(1) space."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-2-2-return-kth-to-last.webp
previewImage: /assets/images/ctci-2-2-return-kth-to-last.webp
---

> **TL;DR**
> * **The Book Problem:** Implement an algorithm to find the kth to last element of a singly linked list.
> * **The Core Breakthrough:** Two Pointers Spaced $k$ Nodes Apart: Advance pointer 1 by $k$ steps. Then advance pointer 1 and pointer 2 together until pointer 1 hits `null`. Pointer 2 is now exactly at the $k$-th to last node in $O(N)$ time and $O(1)$ space.
> * **Production Reality:** Sliding window rate limiters and streaming buffer playback offset tracking.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 2.2), we are asked:

*"Implement an algorithm to find the kth to last element of a singly linked list."*

Note: $k=1$ represents the last element (tail), $k=2$ represents the second to last, etc.

## 2. The Two-Pointer Sliding Window Mechanism

Instead of traversing twice (once to count $N$ and once to reach $N - k$), we place two pointers, $p_1$ and $p_2$, at the head:
1. Advance $p_1$ forward by $k$ nodes.
2. If $p_1$ hits `null` before $k$ steps, the list has fewer than $k$ nodes (return `null`).
3. Move both $p_1$ and $p_2$ at identical speed (1 node per step).
4. When $p_1$ hits `null` (the end of the list), $p_2$ is positioned at exactly $(N - k)$ nodes from the head (the $k$-th to last node).

## Implémentation de production

```java
public class KthToLast {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    public static LinkedListNode nthToLast(LinkedListNode head, int k) {
        if (head == null || k <= 0) return null;

        LinkedListNode p1 = head;
        LinkedListNode p2 = head;

        // Move p1 k nodes into the list
        for (int i = 0; i < k; i++) {
            if (p1 == null) return null; // Out of bounds
            p1 = p1.next;
        }

        // Move both pointers together until p1 hits end of list
        while (p1 != null) {
            p1 = p1.next;
            p2 = p2.next;
        }
        return p2;
    }
}
```

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| Time Complexity | `O(N)` | Single pass over the linked list of N nodes. |
| Auxiliary Space | `O(1)` | Two pointer references. |

## Analyse d'ingénierie système en production réelle

Log streaming and telemetry ring buffers maintain trailing pointers spaced $K$ events behind the active write head to emit sliding window latency metrics without storing historical arrays.

## Cas limites et durcissement en production

1. k > list size: Returns null in O(k).
2. k = 1: Returns last node (tail).
