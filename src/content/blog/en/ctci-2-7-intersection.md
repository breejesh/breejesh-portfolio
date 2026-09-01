---
title: "Intersection: Determining If Two Singly Linked Lists Intersect (CTCI 2.7)"
description: "Determine if two singly linked lists intersect by reference and return the intersecting node in O(N + M) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-2-7-intersection.webp
previewImage: /assets/images/ctci-2-7-intersection.webp
---

> **TL;DR**
> * **The Book Problem:** Given two (singly) linked lists, determine if the two lists intersect. Return the intersecting node. Note that the intersection is defined based on reference, not value.
> * **The Optimal Solution:** Traverse both lists to compute their lengths and tail node references. If tails differ by reference (`tail1 != tail2`), the lists cannot intersect. If tails match, advance the longer list's pointer by $|len_1 - len_2|$ steps, then advance both pointers together until `p1 == p2` in $O(N + M)$ time and $O(1)$ space.
> * **Production Reality:** Garbage collector reference graph cycle tracking, git DAG commit merge base resolution, and memory alias detection.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 2.7), we are asked:

*"Given two (singly) linked lists, determine if the two lists intersect. Return the intersecting node. Note that the intersection is defined based on reference, not value. That is, if the kth node of the first linked list is the exact same node (by reference) as the jth node of the second linked list, then they are intersecting."*

**Key Conceptual Insight:**
In a singly linked list, a node only has one `next` pointer. Therefore, once two lists intersect at a shared node, **all subsequent nodes from that point forward are identical and shared**. This creates a Y-shaped junction leading to a common tail node.

## 2. The Algorithmic Approaches

### Approach 1: Hash Set Lookup
Traverse List 1 and insert all node references into a `HashSet<LinkedListNode>`. Then traverse List 2 and check if any node exists in the set.
* **Time Complexity:** $O(N + M)$
* **Space Complexity:** $O(N)$ auxiliary memory (allocates a set proportional to the first list's length).

### Approach 2: Length Alignment & Tail Verification (Optimal O(1) Space)
1. Traverse List 1: get length $len_1$ and last node $tail_1$.
2. Traverse List 2: get length $len_2$ and last node $tail_2$.
3. Compare tails: If `tail1 != tail2`, return `null` immediately (no intersection).
4. Set two pointers at the heads of List 1 and List 2.
5. Advance the pointer of the longer list forward by $|len_1 - len_2|$ nodes.
6. Advance both pointers in lockstep (1 step each) until `p1 == p2`.
7. Return `p1` (the intersecting node).

## Production Implementation

```java
public class IntersectionList {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    private static class Result {
        public LinkedListNode tail;
        public int size;
        public Result(LinkedListNode tail, int size) {
            this.tail = tail;
            this.size = size;
        }
    }

    /**
     * Finds the intersecting node of two singly linked lists.
     * Time Complexity: O(A + B) where A and B are the list lengths.
     * Space Complexity: O(1) auxiliary space.
     */
    public static LinkedListNode findIntersection(LinkedListNode list1, LinkedListNode list2) {
        if (list1 == null || list2 == null) return null;

        // Step 1: Get tail and sizes
        Result result1 = getTailAndSize(list1);
        Result result2 = getTailAndSize(list2);

        // Step 2: If different tails, then no intersection
        if (result1.tail != result2.tail) {
            return null;
        }

        // Step 3: Set pointers to start of each list
        LinkedListNode shorter = result1.size < result2.size ? list1 : list2;
        LinkedListNode longer = result1.size < result2.size ? list2 : list1;

        // Step 4: Advance pointer on longer list by difference in lengths
        longer = getKthNode(longer, Math.abs(result1.size - result2.size));

        // Step 5: Move both pointers until you have a collision
        while (shorter != longer) {
            shorter = shorter.next;
            longer = longer.next;
        }

        // Return either pointer (intersecting node)
        return longer;
    }

    private static Result getTailAndSize(LinkedListNode list) {
        if (list == null) return null;

        int size = 1;
        LinkedListNode current = list;
        while (current.next != null) {
            size++;
            current = current.next;
        }
        return new Result(current, size);
    }

    private static LinkedListNode getKthNode(LinkedListNode head, int k) {
        LinkedListNode current = head;
        while (k > 0 && current != null) {
            current = current.next;
            k--;
        }
        return current;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N + M)` | Traversing both lists to find lengths takes $N + M$; scanning to intersection takes at most $\max(N, M)$. |
| Auxiliary Space | `O(1)` | Uses reference pointers and size counters without heap allocation. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Memory Graphs and Git DAGs

1. **Garbage Collection (JVM / V8):** Tracing garbage collectors detect shared heap allocations by verifying common memory references across active root pointer sets.
2. **Git Directed Acyclic Graphs (DAGs):** Git commit histories merge branches at common base commits using topological ancestry alignment.

## Edge Cases & Production Hardening

1. **No intersection:** Handled in $O(N + M)$ via `result1.tail != result2.tail` guard.
2. **Identical lists (`list1 == list2`):** Difference is 0, loops 0 times, returns head immediately.
3. **Intersection at the head:** Both pointers start aligned and collide at step 0.
4. **Lists of different lengths ($N \gg M$):** Difference offset correctly aligns traversal.
