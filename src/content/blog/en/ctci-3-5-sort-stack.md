---
title: "Sort Stack: Sorting a Stack with at Most One Auxiliary Stack (CTCI 3.5)"
description: "Write a program to sort a stack in ascending order (smallest items on top) using at most one additional temporary stack in O(N^2) time and O(N) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-3-5-sort-stack.webp
previewImage: /assets/images/ctci-3-5-sort-stack.webp
---

> **TL;DR**
> * **The Book Problem:** Write a program to sort a stack such that the smallest items are on the top. You can use an additional temporary stack, but you may not copy the elements into any other data structure (such as an array).
> * **The Optimal Solution:** Treat the temporary stack `r` as a sorted buffer (descending order, largest on top). Pop `tmp` from input stack `s`. While `!r.isEmpty() && r.peek() > tmp`, pop from `r` back into `s`, then push `tmp` into `r`. When `s` is exhausted, copy `r` back to `s` in $O(N^2)$ time and $O(N)$ auxiliary space.
> * **Production Reality:** Stack-constrained hardware controllers, depth-first search branch pruning, and in-place register sorting.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 3.5), we are asked:

*"Write a program to sort a stack such that the smallest items are on the top. You can use an additional temporary stack, but you may not copy the elements into any other data structure (such as an array). The stack supports the following operations: push, pop, peek, and isEmpty."*

## 2. Algorithmic Mechanics (Stack Insertion Sort)

We use an auxiliary stack `r` maintained in sorted order with largest elements on top:
1. Pop the top element from `s` into variable `tmp = s.pop()`.
2. While `r` is not empty and `r.peek() > tmp`:
   * Pop from `r` and push back onto `s` (`s.push(r.pop())`).
3. Push `tmp` onto `r`.
4. Repeat until `s` is empty.
5. Finally, transfer all elements from `r` back into `s`. Because `r` had largest on top, pushing into `s` leaves smallest on top.

## Production Implementation

```java
import java.util.Stack;

public class SortStack {
    /**
     * Sorts stack s so smallest items are on top using one temporary stack r.
     * Time Complexity: O(N^2)
     * Space Complexity: O(N)
     */
    public static void sort(Stack<Integer> s) {
        Stack<Integer> r = new Stack<>();

        while (!s.isEmpty()) {
            // Insert each element in s in sorted order into r
            int tmp = s.pop();
            while (!r.isEmpty() && r.peek() > tmp) {
                s.push(r.pop());
            }
            r.push(tmp);
        }

        // Copy elements from r back into s
        while (!r.isEmpty()) {
            s.push(r.pop());
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N^2)` | For each of the $N$ elements, we may transfer up to $N$ elements between stacks. |
| Auxiliary Space | `O(N)` | Single auxiliary stack storing at most $N$ elements. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Constrained Environments

1. **Embedded Microcontrollers:** Where RAM is severely restricted and dynamic heap allocators are absent, stack-based in-situ insertion sorting guarantees bounded memory footprints.
2. **Reverse Polish Notation (RPN) Calculators:** Evaluating and ordering arithmetic execution trees on hardware stack registers.

## Edge Cases & Production Hardening

1. **Already sorted stack:** Runs in $O(N)$ time with zero back-transfers.
2. **Reverse sorted stack:** Triggers worst-case $O(N^2)$ comparisons.
3. **Duplicates present (`5, 5, 5`):** Maintained cleanly via `r.peek() > tmp` strict inequality.
4. **Empty or single-element stack:** Handled cleanly in $O(1)$.
