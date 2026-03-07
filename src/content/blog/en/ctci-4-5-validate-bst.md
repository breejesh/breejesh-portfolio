---
title: "Validate BST: Min/Max Ranges on a Binary Tree (Java)"
description: "CTCI-style problem 4.5 for beginners: check whether a binary tree is a binary search tree. Primary approach uses recursive min/max bounds; in-order sorted scan is the optional check."
date: "2026-03-07"
tags: [Algorithms]
coverImage: /assets/images/ctci-4-5-validate-bst.webp
previewImage: /assets/images/ctci-4-5-validate-bst.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 4.5 for beginners: check whether a binary tree is a binary search tree. Primary approach uses recursive min/max bounds; in-order sorted scan is the optional check.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A binary search tree is not "left child smaller, right child larger." That only checks the immediate kids. A real BST says: **every** value in the left subtree is less than the node, and **every** value in the right subtree is greater. Miss one distant grandchild and the tree is not a BST, even if every local parent-child pair looks fine.

This post is original teaching for beginners in **Java**. Same problem family as classic "validate BST" interview questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 4, trees and graphs.

---

## 1. Everyday analogy

Think of a company org chart where each manager has a salary rule for their whole branch:

* Everyone under the left deputy must earn **less** than the manager.
* Everyone under the right deputy must earn **more** than the manager.
* The rule stacks. Someone three levels down still has to sit inside every boss's band above them.

So when you walk down the tree, you carry a **legal salary range**: "must be greater than `min`, must be less than `max`." At the root the range is open. At a left child, the parent's value becomes the new max. At a right child, the parent's value becomes the new min. If anyone falls outside their band, the org chart is invalid as a BST.

That is the whole primary algorithm: recurse with tightened min and max.

---

## 2. Plain problem statement

**Input:** the root of a binary tree of integers (`TreeNode` with `left`, `right`, and an `int` value).

**Output:** `true` if the tree is a binary search tree, else `false`.

**BST definition used here:**

* For every node `n`, all nodes in `n.left`'s subtree have values **strictly less than** `n.data`.
* All nodes in `n.right`'s subtree have values **strictly greater than** `n.data`.
* Both subtrees are themselves BSTs.
* Empty tree and single-node tree are BSTs.

**Examples:**

| Tree (root first, informal) | Valid BST? | Why |
| --- | --- | --- |
| `20` with left `10`, right `30` | yes | ranges hold |
| `20` with left `10`, and `10` has right `25` | no | `25` is in left of `20` but `25 > 20` |
| `20` with left `10`, right `30`, and `30` has left `25` | yes | `25` is between `20` and `30` |
| empty | yes | no node violates anything |
| only `7` | yes | one value, no comparisons |

**Clarify before coding:**

* Are equal values allowed? (This post uses **strict** `<` and `>`. If the interviewer allows duplicates, pick a side, usually left `<=` or right `>=`, and stick to it.)
* Can values hit `Integer.MIN_VALUE` / `MAX_VALUE`? (Use `Integer` null bounds, or `long` min/max, so you do not collide with real node values.)
* Is the tree guaranteed finite and acyclic? (Yes for this problem.)

---

## 3. Think first

### Wrong: only check children

```java
// BAD: misses deep violations
boolean naive(TreeNode n) {
    if (n == null) return true;
    if (n.left != null && n.left.data >= n.data) return false;
    if (n.right != null && n.right.data <= n.data) return false;
    return naive(n.left) && naive(n.right);
}
```

On the classic counterexample (`20` → left `10` → right `25`), every parent-child pair looks sorted, but `25` sits in the left subtree of `20`. The naive check returns true. Interviewers love this trap.

### Wrong-ish: max of left vs min of right only at each node

You can compute the max in the left subtree and the min in the right, then compare to the node. That works if you do it carefully for every node, but you often pay O(N) work per node without caching, which becomes O(N²). The range pass below does one walk and stays O(N).

### Primary: recursive min/max range

Pass two bounds into every recursive call:

1. Current node must satisfy `min < node.data < max` (open ends when bound is null / "no limit").
2. Recurse left with the same `min` and a new max of `node.data`.
3. Recurse right with a new min of `node.data` and the same `max`.
4. Null node: true.

That is one depth-first walk. Each node is checked once against the tightest range the ancestors force.

### Optional: in-order must be sorted

In-order traversal of a BST visits values in non-decreasing (here: strictly increasing) order. So:

1. Walk in-order.
2. Keep the previous value.
3. If the current value is not greater than previous, fail.

Same O(N) time. Nice as a second answer or a cross-check. The range method is usually easier to explain for "why is this node illegal," because you can point at the exact min/max that failed.

---

## 4. Java solution

Primary solution first (min/max). Then a short in-order version.

```java
class TreeNode {
    int data;
    TreeNode left;
    TreeNode right;

    TreeNode(int data) {
        this.data = data;
    }
}

class ValidateBST {

    /** Public entry: empty tree is a valid BST. */
    boolean isBST(TreeNode root) {
        return check(root, null, null);
    }

    /**
     * @param min exclusive lower bound, or null if none
     * @param max exclusive upper bound, or null if none
     */
    private boolean check(TreeNode node, Integer min, Integer max) {
        if (node == null) {
            return true;
        }

        if (min != null && node.data <= min) {
            return false;
        }
        if (max != null && node.data >= max) {
            return false;
        }

        // Left: values must stay < node.data
        // Right: values must stay > node.data
        return check(node.left, min, node.data)
                && check(node.right, node.data, max);
    }
}
```

Walkthrough on a bad tree:

```
      20
     /
   10
     \
      25
```

| Call | node | min | max | Result |
| --- | --- | --- | --- | --- |
| 1 | 20 | null | null | ok, go left and right |
| 2 | 10 | null | 20 | ok (`10 < 20`) |
| 3 | 25 | 10 | 20 | fail: `25 >= 20` |
| right of 20 | null | 20 | null | true (never reached if short-circuit after fail) |

`25` is greater than its parent `10`, so a child-only check is happy. The range still carries max `20` from the grandparent, and that catches it.

Optional in-order check:

```java
class ValidateBSTInOrder {
    private Integer prev = null;

    boolean isBST(TreeNode root) {
        prev = null;
        return inOrder(root);
    }

    private boolean inOrder(TreeNode node) {
        if (node == null) {
            return true;
        }
        if (!inOrder(node.left)) {
            return false;
        }
        if (prev != null && node.data <= prev) {
            return false;
        }
        prev = node.data;
        return inOrder(node.right);
    }
}
```

Reset `prev` at the start of every public call if you reuse the object. A pure recursive version can pass `prev` as a one-element array or a small holder so the "last seen" value updates across the call stack without a field.

Using `long` bounds instead of `Integer` nulls is also common:

```java
boolean isBST(TreeNode root) {
    return checkLong(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean checkLong(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.data <= min || node.data >= max) return false;
    return checkLong(node.left, min, node.data)
            && checkLong(node.right, node.data, max);
}
```

That avoids `null` checks. It still works for every `int` node value because `int` never equals `Long.MIN_VALUE` as a real "sentinel conflict" in the same way `Integer.MIN_VALUE` would if you used `int` bounds with `<= min` on a node that holds `Integer.MIN_VALUE`.

---

## 5. Complexity table

| Approach | Time | Extra space |
| --- | --- | --- |
| Min/max recursion | O(N) | O(H) stack, H = height (O(N) worst skew) |
| In-order with prev | O(N) | O(H) stack |
| Naive child-only check | O(N) | O(H), but **wrong** on deep violations |
| Max-left / min-right at every node (no memo) | O(N²) worst | O(H) |

N is the number of nodes. Balanced trees keep stack depth around log N. Interviewers usually want O(N) time and the correct global invariant, not a local parent-child scan.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty tree** → true.
* **Single node** → true.
* **Duplicates** → under strict rules, two equal values fail. Confirm the company's BST definition.
* **Skewed tree** (linked-list shape) → still O(N) time; watch stack depth in language settings, not usually an issue in interviews.
* **Value equals bound** → `node.data <= min` or `>= max` must fail for strict BSTs.
* **Integer extremes** → prefer `Integer` null bounds or `long` sentinels so `Integer.MIN_VALUE` as real data still works.

Common mistakes:

1. **Only comparing to children.** Classic false positive on the `20 / 10 / 25` tree.
2. **Updating both bounds wrong on left/right.** Left keeps the old min and sets max to parent. Right sets min to parent and keeps the old max. Swap those and valid trees fail.
3. **Using `int min = Integer.MIN_VALUE` with `node.data <= min`.** A legitimate root of `Integer.MIN_VALUE` looks illegal. Use null bounds or `long`.
4. **Forgetting to reset `prev` in the in-order object.** Second call reuses a stale previous value.
5. **Allowing equals on both sides.** Pick a duplicate policy once. Do not mix `<=` left and `<=` right without thinking (that breaks uniqueness of placement).
6. **Returning true as soon as one subtree is fine.** Both sides must pass: use `&&`, not early true from the left alone without checking right.

Minimal usage sketch:

```java
TreeNode root = new TreeNode(20);
root.left = new TreeNode(10);
root.right = new TreeNode(30);
root.left.right = new TreeNode(25); // invalid under 20

ValidateBST v = new ValidateBST();
boolean ok = v.isBST(root); // false
```

---

## 7. Explain to a friend recap

Validate BST asks one question: is every node inside the range its ancestors force?

1. Definition: whole left subtree `<` node, whole right subtree `>` node, recursively.
2. Child-only checks are not enough. Deep values can break an ancestor without breaking their parent.
3. Primary solution: recurse with min and max. Left call gets `max = node.data`. Right call gets `min = node.data`.
4. Null is valid. First violation returns false.
5. Optional: in-order walk must see strictly increasing values. Same complexity, different story.
6. Watch duplicates and integer edge values when you pick bound types.

If you can draw the `20 / 10 / 25` counterexample, tighten ranges down the left path, and show where max `20` rejects `25`, you own problem 4.5.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Check Balanced](/blog/en/ctci-4-4-check-balanced)
* Next: [Successor](/blog/en/ctci-4-6-successor)