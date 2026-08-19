---
title: "CTCI 2.6 Palindrome Linked List in Java: Reverse the Second Half"
description: "Check if a singly linked list is a palindrome. Find the middle with slow and fast pointers, reverse the second half, compare, and restore if you need the list intact. O(n) time, O(1) space."
date: "2026-04-01"
tags: [Algorithms]
coverImage: /assets/images/ctci-2-6-palindrome.webp
previewImage: /assets/images/ctci-2-6-palindrome.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** Check if a singly linked list is a palindrome. Find the middle with slow and fast pointers, reverse the second half, compare, and restore if you need the list intact. O(n) time, O(1) space.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A **palindrome** reads the same forward and backward. Easy on a string: two pointers at the ends, walk inward. A **singly linked list** only walks forward. There is no `prev`, and random access costs a full scan. So the interview version of "is this list a palindrome?" forces you to invent structure you do not get for free.

This is problem **2.6** in the *Cracking the Coding Interview* style set (linked lists). Original teaching, not a book paste.

---

## Everyday picture

Imagine a row of sticky notes on a long tape: `1 → 2 → 3 → 2 → 1`. You want to know if folding the tape in half would line every note up with its mirror.

You cannot flip the whole tape without losing the order of the first half. Practical move:

1. Find the fold (the middle of the list).
2. Flip only the second half so it points back toward the middle.
3. Walk both halves from the head and from the new start of the flipped half. Every pair of values should match.
4. If the list must look like it did before, flip the second half again to restore it.

That is the whole plan: **find mid, reverse second half, compare, optionally restore**.

---

## Problem in plain words

**Input:** head of a singly linked list of nodes with integer values (or any comparable data).

**Output:** `true` if the sequence of values is a palindrome; otherwise `false`.

**Examples**

| List | Answer | Why |
| --- | --- | --- |
| `1 → 2 → 2 → 1` | `true` | Even length; both halves match |
| `1 → 2 → 3 → 2 → 1` | `true` | Odd length; center `3` sits alone |
| `1 → 2 → 3` | `false` | Ends disagree |
| `7` | `true` | Single node |
| empty / `null` | `true` (usual teaching choice) | Empty sequence is a palindrome |

**Clarify in the interview**

* May you mutate the list temporarily? (This solution does, then restores.)
* Null and empty: `true` or throw?
* Values: only digits, or general ints?

You return a boolean. You are not asked to print the reverse or rebuild a new list as the final answer.

---

## How to think before coding

### Stack or copy (fine, not the star)

Push every value onto a stack, or copy into an array, then compare with a second pass from the head. Time O(n), extra space O(n). Mention it. Interviewers often ask for better space next.

Recursive reverse-compare also works and is elegant, but the call stack is still O(n) on a long list. Same space class as the stack approach.

### Main approach: reverse second half (O(1) extra space)

1. **Find the middle** with two pointers: `slow` steps one node, `fast` steps two. When `fast` cannot take two more steps, `slow` sits at the last node of the first half (for even length) or at the center (for odd length).
2. **Reverse** the list that starts at `slow.next`. Classic three-pointer reverse: `prev`, `curr`, `next`.
3. **Compare** from `head` and from the reversed second half, node by node, until the second half ends. On odd length, the center node is never compared to a pair, which is correct.
4. **Restore** (optional but good hygiene): reverse the second half again and reattach it at `slow.next` so callers still see the original order.

Why this is enough: a palindrome is defined by matching pairs around the center. After you reverse the back half, those pairs sit at matching positions on two forward walks.

---

## Java solution: mid, reverse, compare, restore

```java
public class LinkedListPalindrome {

    public static class ListNode {
        int val;
        ListNode next;

        ListNode(int val) {
            this.val = val;
        }
    }

    /**
     * Returns true if the list values form a palindrome.
     * Temporarily reverses the second half, then restores it.
     */
    public static boolean isPalindrome(ListNode head) {
        if (head == null || head.next == null) {
            return true;
        }

        // 1. Middle: slow ends at end of first half (even) or at center (odd)
        ListNode slow = head;
        ListNode fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        // 2. Reverse second half
        ListNode secondHalf = reverse(slow.next);

        // 3. Compare first half with reversed second half
        ListNode p1 = head;
        ListNode p2 = secondHalf;
        boolean ok = true;
        while (p2 != null) {
            if (p1.val != p2.val) {
                ok = false;
                break;
            }
            p1 = p1.next;
            p2 = p2.next;
        }

        // 4. Restore list
        slow.next = reverse(secondHalf);
        return ok;
    }

    private static ListNode reverse(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome(list(1, 2, 2, 1)));       // true
        System.out.println(isPalindrome(list(1, 2, 3, 2, 1)));    // true
        System.out.println(isPalindrome(list(1, 2, 3)));          // false
        System.out.println(isPalindrome(list(7)));                // true
        System.out.println(isPalindrome(null));                   // true
    }

    private static ListNode list(int... vals) {
        ListNode dummy = new ListNode(0);
        ListNode t = dummy;
        for (int v : vals) {
            t.next = new ListNode(v);
            t = t.next;
        }
        return dummy.next;
    }
}
```

### Walkthrough: `1 → 2 → 3 → 2 → 1`

| Step | What happens |
| --- | --- |
| Mid | `slow` lands on `3` (center). `fast` cannot take two more steps. |
| Reverse | Second half `2 → 1` becomes `1 → 2`. List shape: first half still `1 → 2 → 3`, then reversed tail. |
| Compare | `1` vs `1`, `2` vs `2`. Second half ends. Match. |
| Restore | Reverse `1 → 2` back to `2 → 1` and hang it after `3`. Original list again. |

### Walkthrough: `1 → 2 → 2 → 1` (even)

| Step | What happens |
| --- | --- |
| Mid | Loop condition stops with `slow` on the first `2` (end of first half). |
| Reverse | Second half `2 → 1` becomes `1 → 2`. |
| Compare | `1` vs `1`, `2` vs `2`. Match. |
| Restore | Put the second half back. |

Odd length skips the center during compare. Even length compares two equal-sized halves. Same code path handles both.

---

## Time and space

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Reverse second half | O(n) | O(1) | Main answer; mutates then restores |
| Stack of values | O(n) | O(n) | Simple; good first draft |
| Copy to array + two pointers | O(n) | O(n) | Same idea as stack |
| Recursion (implicit stack) | O(n) | O(n) call frames | Clean code, not constant space |

Finding the middle is one pass. Reverse is proportional to half the list. Compare is another half-pass. Restore is another reverse. Overall linear, constant extra pointers only.

---

## Edge cases interviewers poke

* **Odd length:** center node has no pair. Do not compare it against anything. The mid logic above leaves it in the first half and starts reverse at `slow.next`.
* **Even length:** two equal halves. Same loop; no leftover center.
* **Single node:** early return `true`.
* **Two nodes:** `1 → 1` is true; `1 → 2` is false. Mid puts `slow` on the first node; reverse and compare one pair.
* **Null head:** treat as `true` (or define and stick to it).
* **Must not mutate permanently:** restore after compare. If the interviewer forbids any mutation, fall back to stack/copy and say so.
* **Shared structure / concurrent readers:** mutating even briefly is unsafe. Say that out loud if the list is shared.

Half the bugs here are mid off-by-one (starting the reverse one node too early or late) and forgetting to restore when the prompt requires the original list.

---

## Common mistakes

1. **Using string two-pointer thinking** without a way to move backward on a singly linked list.
2. **Wrong middle:** reversing from the center on even length and comparing a mismatched length.
3. **Forgetting restore** after a destructive reverse.
4. **Comparing past the second half** or including the center as if it had a twin.
5. **Claiming O(1) space** while using recursion without acknowledging the call stack.

---

## Explain to a friend

You get a one-way chain of values. Can it read the same forward and backward?

Fold at the middle. Flip only the back half so it points the other way. Walk from the front and from the flipped back: every pair should match. Flip the back half again if you need the chain restored.

In Java: slow/fast for the mid, reverse the second half, compare, reverse again to clean up. That is O(n) time and O(1) extra space. A stack works too if extra memory is fine.

Previous in the series: [Sum Lists](/blog/en/ctci-2-5-sum-lists). Next: [Intersection](/blog/en/ctci-2-7-intersection). Series map: [CTCI in Java](/blog/en/ctci-series-guide).