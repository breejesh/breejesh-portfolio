---
title: "Sum Lists: Add Numbers Stored as Linked Lists (Java)"
description: "CTCI-style problem 2.5: two numbers live as linked lists, one digit per node, least significant digit at the head. Walk both lists with a carry and build the sum list. Brief note on the forward-order follow-up."
date: "2025-12-22"
tags: [Algorithms]
coverImage: /assets/images/ctci-2-5-sum-lists.webp
previewImage: /assets/images/ctci-2-5-sum-lists.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 2.5: two numbers live as linked lists, one digit per node, least significant digit at the head. Walk both lists with a carry and build the sum list. Brief note on the forward-order follow-up.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You add two big numbers on paper the way school taught you: line them up on the **right**, start at the ones place, write a digit, pass a carry left. Digits live in columns. Carry is one bit of memory between columns.

Now put each digit in a node of a singly linked list, and put the **ones digit at the head**. Walking the list is exactly walking columns from right to left on paper. That is **Sum Lists**.

This post is original teaching for beginners in **Java**. Same problem family as classic interview linked-list addition, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide).

---

## Everyday analogy

Two receipts, each number written digit by digit on sticky notes:

* `7 → 1 → 6` means **617** (7 ones, 1 ten, 6 hundreds).
* `5 → 9 → 2` means **295**.

Add them like paper:

| Column | Digits | Sum + carry in | Write | Carry out |
| --- | --- | --- | --- | --- |
| ones | 7 + 5 | 12 | 2 | 1 |
| tens | 1 + 9 | 11 | 1 | 1 |
| hundreds | 6 + 2 | 9 | 9 | 0 |

Result on paper: **912**. As a reverse list: `2 → 1 → 9`.

The list already stores digits in addition order. You do not reverse first. You just walk and carry.

---

## Problem in plain words

**Input:** heads of two singly linked lists. Each node holds one digit `0-9`. Digits are in **reverse** order: the head is the ones place.

**Output:** head of a new list representing the sum, also in reverse order (ones digit at the head).

**Node shape we use:**

```java
class Node {
    int data;
    Node next;

    Node(int data) {
        this.data = data;
    }
}
```

**Examples:**

| List A | List B | Numbers | Sum list | Why |
| --- | --- | --- | --- | --- |
| `7 → 1 → 6` | `5 → 9 → 2` | 617 + 295 | `2 → 1 → 9` | 912 |
| `9 → 9` | `1` | 99 + 1 | `0 → 0 → 1` | 100; final carry becomes a node |
| `1 → 2` | `3 → 4 → 5` | 21 + 543 | `4 → 6 → 5` | different lengths; 564 |
| `0` | `0` | 0 + 0 | `0` | still one digit |
| `null` | `5 → 1` | treat empty as 0 | `5 → 1` | one side empty |

**Clarify before coding** (say this out loud):

* Reverse order (ones at head) is the main problem. Forward order is a follow-up.
* Digits only, or full ints? Digits `0-9` per node.
* May either list be empty or null?
* New list nodes, or mutate one of the inputs? Prefer **new nodes** so you do not destroy inputs.
* Leading zeros in the conceptual number? Usually inputs are clean; still handle a leftover carry.

---

## How to think before coding

### What not to do first

Do not convert each list to an `int` or `long`, add, then rebuild. That fails for numbers longer than 64 bits, which is half the point of digit lists. Interviewers notice.

### Reverse order: match paper addition

Keep three things:

1. Pointer into list A.
2. Pointer into list B.
3. An integer `carry` (0 or 1 for base 10; in general `0` or `1` when digits are 0-9).

Each step:

```
sum = carry
if A not null: sum += A.data; A = A.next
if B not null: sum += B.data; B = B.next
digit = sum % 10
carry = sum / 10
append a new node with digit
```

Loop while **either list still has nodes or carry is non-zero**. That last clause is how `99 + 1` grows a third digit.

Use a **dummy head** so the first real digit is always `dummy.next`. No special case for the first append.

### Recursive version (same idea)

Base: both null and carry 0 → return null. Otherwise compute sum from current heads (or 0 if null) plus carry, create a node for `sum % 10`, set `next` to the recursive call on the tails with the new carry. Same complexity, call stack depth O(max length).

Iterative with a dummy head is usually cleaner in Java interviews. Either is fine if you track carry correctly.

### Follow-up idea: forward order (ones at the tail)

Now heads are the most significant digits. Paper addition wants the least significant first, so order fights you.

Short plan (you do not need full production code for this post):

1. Find lengths of both lists.
2. **Pad** the shorter list with leading zeros (new nodes, or pad conceptually in recursion) so both have the same length.
3. Recurse to the end, then add on the way back, returning both the partial list and the carry (wrapper object or a small result class).
4. If a final carry remains, prepend a new head digit.

You can reverse both inputs, call the reverse-order solution, reverse the result. That works and is easy to explain. Interviewers may still want the pad-and-recurse version to show you can add without mutating order.

Main focus of this article stays on reverse order.

---

## Java solution (reverse order, iterative)

```java
/**
 * Adds two numbers stored as reverse-order digit lists.
 * Example: 7→1→6 + 5→9→2 represents 617 + 295 → 2→1→9 (912).
 */
Node sumLists(Node l1, Node l2) {
    Node dummy = new Node(0);
    Node tail = dummy;
    int carry = 0;

    while (l1 != null || l2 != null || carry != 0) {
        int sum = carry;
        if (l1 != null) {
            sum += l1.data;
            l1 = l1.next;
        }
        if (l2 != null) {
            sum += l2.data;
            l2 = l2.next;
        }

        tail.next = new Node(sum % 10);
        tail = tail.next;
        carry = sum / 10;
    }

    return dummy.next;
}
```

Walkthrough for `7 → 1 → 6` and `5 → 9 → 2`:

| Step | l1 digit | l2 digit | carry in | sum | write | carry out | result so far |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 7 | 5 | 0 | 12 | 2 | 1 | `2` |
| 2 | 1 | 9 | 1 | 11 | 1 | 1 | `2 → 1` |
| 3 | 6 | 2 | 1 | 9 | 9 | 0 | `2 → 1 → 9` |
| 4 | - | - | 0 | stop | | | done |

Recursive sketch (same reverse-order contract):

```java
Node sumListsRecursive(Node l1, Node l2, int carry) {
    if (l1 == null && l2 == null && carry == 0) {
        return null;
    }

    int sum = carry;
    if (l1 != null) {
        sum += l1.data;
    }
    if (l2 != null) {
        sum += l2.data;
    }

    Node result = new Node(sum % 10);
    Node next1 = (l1 == null) ? null : l1.next;
    Node next2 = (l2 == null) ? null : l2.next;
    result.next = sumListsRecursive(next1, next2, sum / 10);
    return result;
}

// Public entry: sumListsRecursive(a, b, 0)
```

---

## Forward order in one short pass

If digits run most-significant-first (`6 → 1 → 7` for 617):

* Option A: reverse both, `sumLists`, reverse the answer.
* Option B: pad the shorter list, recurse to the tails, add while unwinding, wrap carry + node in a small helper class, prepend leftover carry.

Option A reuses the code above. Option B is the classic "no reverse" follow-up. Either is enough to name in the interview before you write reverse order cleanly.

---

## Complexity

| | Cost | Why |
| --- | --- | --- |
| Time | O(max(m, n)) | One pass over both lists; at most one extra node for final carry |
| Extra space (iterative) | O(max(m, n)) for the output | Output size is the length of the sum; auxiliary pointers are O(1) |
| Extra space (recursive) | O(max(m, n)) stack + output | Depth follows the longer list |

You cannot beat linear in the input length: every digit can affect the sum.

---

## Edge cases interviewers poke

1. **Different lengths.** `1 → 2` and `3 → 4 → 5`. Keep looping while either pointer is non-null. Missing side contributes 0.
2. **Final carry.** `9 → 9` + `1` → `0 → 0 → 1`. The loop condition must include `carry != 0`.
3. **One list null or empty.** Sum is a copy of the other list (plus any carry chain). Do not crash on null.
4. **Both single node.** `5` + `7` → `2 → 1` when there is a carry.
5. **Zero.** `0` + `0` → `0`. Returning `null` for zero is usually wrong unless the problem says empty means zero.
6. **All nines.** Long carry chains; still one new node per digit plus at most one extra.
7. **Mutating inputs by accident.** Building with `new Node(...)` keeps callers' lists intact.
8. **Forward-order trap.** If the interviewer flipped the digit order mid-problem, restate the order out loud before coding.

Common mistakes:

* Stopping when **both** lists end but carry is still 1.
* Using `sum % 10` for carry and `sum / 10` for the digit (swapped).
* Converting to `int` and overflowing.
* Forgetting the dummy head and special-casing the first node until the code is messy.

---

## Recap you can tell a friend

Sum Lists is paper addition where each digit is a linked-list node and the **ones place sits at the head**.

1. Walk both lists together with a carry.
2. Each step: add the two digits (or zero if a list ended) plus carry, write `sum % 10`, set carry to `sum / 10`.
3. Keep going until both lists are done **and** carry is zero.
4. Dummy head makes appending painless.
5. Forward order is the same math after you reverse, or after you pad and recurse from the high end.

If you can add `7→1→6` and `5→9→2` on a whiteboard without freezing on the last carry, you own problem 2.5.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Partition](/blog/en/ctci-2-4-partition)
* Next: [Palindrome](/blog/en/ctci-2-6-palindrome)