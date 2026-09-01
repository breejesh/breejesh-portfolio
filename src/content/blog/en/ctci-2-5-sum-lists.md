---
title: "Sum Lists: Adding Numbers Represented by Linked Lists (CTCI 2.5)"
description: "Add two numbers stored in reverse and forward order as singly linked lists, handling carries recursively in O(N) time and O(N) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-2-5-sum-lists.webp
previewImage: /assets/images/ctci-2-5-sum-lists.webp
---

> **TL;DR**
> * **The Book Problem:** You have two numbers represented by a linked list, where each node contains a single digit. The digits are stored in reverse order, such that the 1's digit is at the head. Write a function that adds the two numbers and returns the sum as a linked list. *Follow-up:* Solve when digits are stored in forward order.
> * **The Optimal Solution:** (1) Reverse order: Recursive/iterative full-adder with carry propagation in $O(\max(N, M))$ time; (2) Forward order: Pad shorter list with leading zeros, recurse to the tail, and return a result object carrying the sum node and carry bit backward.
> * **Production Reality:** Arbitrary-precision arithmetic (BigInteger / BigDecimal libraries), financial ledger transaction balancing, and cryptographic key generation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 2.5), we are asked:

*"You have two numbers represented by a linked list, where each node contains a single digit. The digits are stored in reverse order, such that the 1's digit is at the head of the list. Write a function that adds the two numbers and returns the sum as a linked list."*

**Example (Reverse Order):**
* Input: `(7 -> 1 -> 6)` + `(5 -> 9 -> 2)`. That is, $617 + 295$.
* Output: `2 -> 1 -> 9`. That is, $912$.

**Follow-Up (Forward Order):**
* Input: `(6 -> 1 -> 7)` + `(2 -> 9 -> 5)`. That is, $617 + 295$.
* Output: `9 -> 1 -> 2`. That is, $912$.

## 2. Reverse Order Addition (Recursive Full-Adder)

Because digits start with the 1's place at the head, addition aligns naturally:
1. Add corresponding digit values plus incoming `carry`: `value = (l1.data + l2.data + carry) % 10`.
2. Compute outgoing carry: `carry = (l1.data + l2.data + carry) / 10`.
3. Recursively call `addLists(l1.next, l2.next, carry)`.
4. Base case: If both nodes are `null` and `carry == 0`, terminate recursion.

## 3. Forward Order Follow-Up (Padding & Post-Order Recursion)

When digits are in forward order (MSB at the head), lists of different lengths cannot be added from the head because place values would misalign (e.g. adding hundreds place to thousands place).

**Algorithm:**
1. Calculate lengths of both lists.
2. Pad the shorter list with leading `0` nodes until lengths match.
3. Recurse to the tail to add least significant digits first.
4. On stack return, create sum node and propagate carry upward using a `PartialSum` wrapper.
5. If final carry $> 0$, insert a node `new LinkedListNode(carry)` at the head.

## Production Implementation

```java
public class SumLists {
    public static class LinkedListNode {
        public int data;
        public LinkedListNode next;
        public LinkedListNode(int d) { this.data = d; }
    }

    // Part 1: Reverse Order Addition
    public static LinkedListNode addListsReverse(LinkedListNode l1, LinkedListNode l2, int carry) {
        if (l1 == null && l2 == null && carry == 0) {
            return null;
        }

        int value = carry;
        if (l1 != null) value += l1.data;
        if (l2 != null) value += l2.data;

        LinkedListNode result = new LinkedListNode(value % 10);

        if (l1 != null || l2 != null) {
            LinkedListNode more = addListsReverse(
                l1 == null ? null : l1.next,
                l2 == null ? null : l2.next,
                value >= 10 ? 1 : 0
            );
            result.next = more;
        }

        return result;
    }

    // Part 2 Follow-Up: Forward Order Helper Class
    private static class PartialSum {
        public LinkedListNode sum = null;
        public int carry = 0;
    }

    public static LinkedListNode addListsForward(LinkedListNode l1, LinkedListNode l2) {
        int len1 = length(l1);
        int len2 = length(l2);

        // Pad shorter list with zeros
        if (len1 < len2) l1 = padList(l1, len2 - len1);
        else l2 = padList(l2, len1 - len2);

        PartialSum sum = addListsHelper(l1, l2);

        if (sum.carry == 0) return sum.sum;
        else {
            LinkedListNode result = insertBefore(sum.sum, sum.carry);
            return result;
        }
    }

    private static PartialSum addListsHelper(LinkedListNode l1, LinkedListNode l2) {
        if (l1 == null && l2 == null) return new PartialSum();

        PartialSum sum = addListsHelper(l1.next, l2.next);
        int val = sum.carry + l1.data + l2.data;

        LinkedListNode full_result = insertBefore(sum.sum, val % 10);
        sum.sum = full_result;
        sum.carry = val / 10;
        return sum;
    }

    private static int length(LinkedListNode n) {
        int count = 0;
        while (n != null) { count++; n = n.next; }
        return count;
    }

    private static LinkedListNode padList(LinkedListNode l, int padding) {
        LinkedListNode head = l;
        for (int i = 0; i < padding; i++) head = insertBefore(head, 0);
        return head;
    }

    private static LinkedListNode insertBefore(LinkedListNode list, int data) {
        LinkedListNode node = new LinkedListNode(data);
        if (list != null) node.next = list;
        return node;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(max(N, M))` | Traverses lists of lengths $N$ and $M$ once (or twice including padding). |
| Auxiliary Space | `O(max(N, M))` | Result linked list contains $\max(N, M) + 1$ nodes plus call stack frames. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Arbitrary-Precision Math & Crypto

1. **BigInt / Bignum Libraries (GMP, Java BigInteger):** Standard CPU ALU registers cap at 64 bits. When computing 2048-bit RSA keys or astronomical precision, linked segments or limb arrays execute multi-digit additions with carry propagation.
2. **High-Precision Financial Ledgers:** Currency transactions needing 30 decimal digits use chained decimal structures to avoid IEEE 754 floating-point rounding errors.

## Edge Cases & Production Hardening

1. **Lists of unequal lengths (`9->9` + `1`):** Trailing carries expand list size (`0->0->1`).
2. **Carry at the most significant digit:** Correctly appends extra node.
3. **One list is null:** Returns remaining list copy.
