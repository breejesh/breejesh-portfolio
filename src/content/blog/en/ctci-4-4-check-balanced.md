---
title: "Check Balanced: Height Difference at Most One (Java)"
description: "CTCI-style problem 4.4 for beginners: decide if a binary tree is balanced. Compute height in one pass and return a fail signal as soon as any node has subtree heights that differ by more than one."
date: "2026-01-08"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-4-check-balanced.webp
previewImage: /assets/images/ctci-4-4-check-balanced.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 4.4 for beginners: decide if a binary tree is balanced. Compute height in one pass and return a fail signal as soon as any node has subtree heights that differ by more than one.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A tree is **height-balanced** when every node has left and right subtrees whose heights differ by at most one. Not only the root. Every node on the way down has to pass the same check. One deep left branch and a short right branch under some middle node is already unbalanced, even if the whole tree "looks fine" from the top.

This post is original teaching for beginners in **Java**. Same problem family as classic tree recursion interviews, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 4, problem 4.4.

---

## 1. Balance as a spirit level

Hold a spirit level on every joint of a mobile hanging from the ceiling. Each joint has a left arm and a right arm. Arms can be different lengths by a little (one "notch"), but not by two notches or more. If any joint is tilted, the whole mobile fails, not just the top hook.

In a binary tree:

* Height of a leaf is 0 (or 1, depending on your convention; pick one and stick to it).
* Height of a node is `1 + max(height(left), height(right))`.
* At that node, `|height(left) - height(right)|` must be at most 1.
* Null child height is -1 if leaves are height 0 (so a single node has height 0 and both sides "height -1" still differ by 0 after the formula, or treat null as height -1 and a leaf as 0 consistently).

The usual interview convention used below: **null has height -1**, a leaf has height `0`, a node with two leaves has height `1`.

---

## 2. Plain problem statement

**Goal:** return `true` if the binary tree is balanced, else `false`.

**Definition:** for every node, the heights of its two subtrees differ by at most 1. Both subtrees must themselves be balanced.

**Input:** root of a binary tree (`TreeNode` with `left` and `right`).

**Output:** boolean.

**Clarify before coding:**

* Empty tree (`null` root): balanced (`true`).
* Height of null: `-1` (common) or `0` (also fine if you are consistent).
* Perfect / complete / full trees: related words, not the same as "balanced" here. Stick to the height-diff definition.

**Examples**

| Tree sketch | Balanced? | Why |
| --- | --- | --- |
| Single node | yes | both sides null |
| Root with left child only | yes | heights 0 and -1, diff 1 |
| Left chain of three nodes, no right branch under root | no | under root, left height 1, right -1, diff 2 |
| Small full tree of height 2 | yes | every node diffs by 0 or 1 |

---

## 3. Think first

### Naive: height helper called twice per node

```
isBalanced(n):
  if n is null: return true
  hl = height(n.left)
  hr = height(n.right)
  if |hl - hr| > 1: return false
  return isBalanced(n.left) and isBalanced(n.right)
```

Correct. Slow. `height` walks each subtree, and you call it at every node, so the same nodes get visited again and again. Worst case around O(N log N) on a balanced tree, O(N^2) on a skewed one.

### Preferred: one pass, height or fail signal

While computing height bottom-up, also check the balance rule. If a subtree is already unbalanced, do not return a real height. Return a **fail sentinel** (often written as `-1` in short sketches; below we use `Integer.MIN_VALUE` so it never collides with null height `-1`).

Cleaner pattern used in interviews:

* Helper returns the height of a balanced subtree.
* If the subtree is unbalanced, helper returns the fail sentinel.
* Parent sees the sentinel from either child and bubbles it up without more work.
* Public method: `checkHeight(root) != UNBALANCED`.

That is **one DFS**, O(N) time, O(H) stack space. Early exit when you find the first bad node on the way up.

Why bottom-up matters: you need both child heights before you can decide the parent. Post-order is natural. Pre-order "check me first, then recurse" still needs full heights of both sides, so you end up re-walking or caching. The combined height+check pass is the clean merge.

---

## 4. Java solution

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}

class CheckBalanced {
    // Distinct from null height (-1) so failure never looks like an empty child.
    private static final int UNBALANCED = Integer.MIN_VALUE;

    public boolean isBalanced(TreeNode root) {
        return checkHeight(root) != UNBALANCED;
    }

    /** Height if this subtree is balanced; UNBALANCED if any node fails. */
    private int checkHeight(TreeNode node) {
        if (node == null) {
            return -1;
        }

        int left = checkHeight(node.left);
        if (left == UNBALANCED) {
            return UNBALANCED;
        }

        int right = checkHeight(node.right);
        if (right == UNBALANCED) {
            return UNBALANCED;
        }

        if (Math.abs(left - right) > 1) {
            return UNBALANCED;
        }

        return Math.max(left, right) + 1;
    }
}
```

Why `Integer.MIN_VALUE` instead of reusing `-1`? Null height is already `-1`. If you also use `-1` for "unbalanced", a parent cannot tell "left child is missing" from "left subtree failed". A separate fail sentinel is easier to defend in a room.

Walkthrough (balanced):

```
      1
     / \
    2   3
   /
  4
```

* Node 4: left -1, right -1, diff 0, height 0.
* Node 2: left 0, right -1, diff 1, height 1.
* Node 3: left -1, right -1, diff 0, height 0.
* Node 1: left 1, right 0, diff 1, height 2.
* `checkHeight` returns 2, not `UNBALANCED` → `true`.

Walkthrough (unbalanced):

```
    1
   /
  2
 /
3
```

* Node 3: height 0.
* Node 2: left 0, right -1, height 1.
* Node 1: left 1, right -1, diff 2 → return `UNBALANCED` → `false`.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Height helper at every node | O(N log N) to O(N^2) | O(H) recursion | Simple, not ideal |
| Single pass height + fail signal | O(N) | O(H) stack | Each node visited once |
| Explicit stack DFS with same logic | O(N) | O(H) | Rare in interviews; recursion is fine |

H is tree height. Skewed tree: H = N, so stack is O(N). Balanced tree: H = log N.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Null root** → balanced.
* **Single node** → balanced.
* **Only one long arm** under some deep node, root still looks short → still false; check every node, not only the root.
* **Diff exactly 1** → allowed. Diff 2 → fail.
* **Both subtrees tall but equal** → fine if each side is balanced inside.

Common mistakes:

1. **Only comparing heights at the root.** A deep imbalance under one child is still unbalanced.
2. **Calling `height` separately on left and right at every node.** Correct answer, quadratic risk. Upgrade to the combined pass.
3. **Using `-1` for both null height and failure.** Confusing. Use a distinct fail sentinel.
4. **Forgetting early return.** Once a child is unbalanced, bubble up; do not keep walking the sibling for height if you already know the answer is false (optional optimization; still O(N) worst case if the bad node is last).
5. **Off-by-one on null height.** Null = -1 and leaf = 0 keeps `max + 1` clean. If null = 0, a leaf becomes 1; say that out loud so the interviewer tracks your numbers.
6. **AVL vs "balanced".** Interview "balanced" here is the height-diff definition, not a full AVL insert walkthrough unless they ask.

Minimal usage sketch:

```java
TreeNode root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
boolean ok = new CheckBalanced().isBalanced(root); // true
```

---

## 7. Explain to a friend recap

Check Balanced is a tree DFS that folds two jobs into one:

1. Define height: null is -1, otherwise `1 + max(left, right)`.
2. At every node, after both children report, if either failed, you fail. If `|left - right| > 1`, you fail.
3. Otherwise return your height so the parent can do the same check.
4. Public API is a boolean: helper did not return the fail sentinel.

If you can draw a three-node left chain, show the diff of 2 at the root, and contrast it with the O(N) single-pass helper, you own problem 4.4. Next up is validating BST ranges, same recursive spine, different rule.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [List of Depths](/blog/en/ctci-4-3-list-of-depths)
* Next: [Validate BST](/blog/en/ctci-4-5-validate-bst)