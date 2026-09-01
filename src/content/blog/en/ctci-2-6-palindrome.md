---
title: "Palindrome: Checking If a Singly Linked List Is a Palindrome (CTCI 2.6)"
description: "Implement an algorithm to check if a singly linked list is a palindrome using fast/slow runner pointers and a stack in O(N) time and O(N) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-2-6-palindrome.webp
previewImage: /assets/images/ctci-2-6-palindrome.webp
---

> **TL;DR**
> * **The Book Problem:** Implement a function to check if a singly linked list is a palindrome.
> * **The Optimal Solution:** Use the Fast/Slow Runner Pointer technique to find the list's midpoint while pushing the first half's elements onto a `Stack`. If the list length is odd, skip the middle element, then pop elements from the stack while comparing against the second half in $O(N)$ time and $O(N)$ auxiliary space.
> * **Production Reality:** Bidirectional validation in forward-only streaming tokenizers, palindrome motif matching in genomics, and distributed pipeline rollback validation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 2.6), we are asked:

*"Implement a function to check if a linked list is a palindrome."*

**Example:**
* `0 -> 1 -> 2 -> 1 -> 0 -> true`
* `0 -> 1 -> 2 -> 2 -> 1 -> 0 -> true`
* `0 -> 1 -> 2 -> 3 -> 0 -> false`

## 2. The Algorithmic Approaches

### Approach 1: Reverse and Compare
Clone the linked list, reverse the cloned list, and compare the first half of both lists. If they match element-by-element, the list is a palindrome.
* **Complexity:** $O(N)$ time and $O(N)$ auxiliary memory.

### Approach 2: Iterative Fast/Slow Runner + Stack (Optimal & Direct)
Instead of cloning the entire list, we only store the first half:
1. Deploy a `slow` pointer (moves 1 step) and a `fast` pointer (moves 2 steps).
2. As `slow` walks the first half, push its data onto a `Stack<Integer>`.
3. When `fast` reaches the end:
   * If `fast != null` (odd length), advance `slow` one step to skip the center element.
4. Continue walking `slow` through the second half, popping from the stack and comparing:
   * If any value mismatches: return `false`.
5. If stack exhausts cleanly: return `true`.

## Production Implementation

```java
import java.util.Stack;

public class PalindromeList {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    /**
     * Checks if a singly linked list is a palindrome using a fast/slow runner and stack.
     * Time Complexity: O(N)
     * Space Complexity: O(N) (stores N/2 elements)
     */
    public static boolean isPalindrome(LinkedListNode head) {
        LinkedListNode fast = head;
        LinkedListNode slow = head;

        Stack<Integer> stack = new Stack<>();

        // Push elements from first half of linked list onto stack
        while (fast != null && fast.next != null) {
            stack.push(slow.data);
            slow = slow.next;
            fast = fast.next.next;
        }

        // Odd number of elements, so skip the middle element
        if (fast != null) {
            slow = slow.next;
        }

        // Compare second half to stack
        while (slow != null) {
            int top = stack.pop();

            // If values are different, then it's not a palindrome
            if (top != slow.data) {
                return false;
            }
            slow = slow.next;
        }

        return true;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | `fast` pointer traverses the list in $N/2$ iterations; second half scan takes $N/2$ steps. |
| Auxiliary Space | `O(N)` | The stack holds exactly $\lfloor N/2 \rfloor$ elements. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Forward-Only Stream Verification

1. **Unidirectional Network Stream Parsing:** Network protocol parsers scanning incoming byte packets can verify symmetric checksums without buffering the entire payload array in memory.
2. **Genomic Inverted Repeat Scanning:** Detection of mirror symmetry in DNA strands using bounded memory windows.

## Edge Cases & Production Hardening

1. **Empty list (`null`):** Returns `true`.
2. **Single node (`1`):** `fast.next == null`, stack is empty, skips center, returns `true`.
3. **Even length palindrome (`1 -> 2 -> 2 -> 1`):** `fast == null` at loop termination, verifies both halves cleanly.
4. **Odd length palindrome (`1 -> 2 -> 1`):** `fast != null` triggers `slow = slow.next` center skip.
