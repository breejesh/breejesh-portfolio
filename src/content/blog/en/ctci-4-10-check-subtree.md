---
title: "CTCI 4.10 Check Subtree: Is T2 Hiding Inside T1? (Java)"
description: "T1 is much larger than T2. Decide if T2 is a subtree of T1: search for T2's root in T1 then matchTree, or serialize preorder with null markers and test contains. Java, O(n + km) vs O(n + m)."
date: "2026-05-24"
tags: [Algorithms]
coverImage: /assets/images/ctci-4-10-check-subtree.webp
previewImage: /assets/images/ctci-4-10-check-subtree.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** T1 is much larger than T2. Decide if T2 is a subtree of T1: search for T2's root in T1 then matchTree, or serialize preorder with null markers and test contains. Java, O(n + km) vs O(n + m).
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You have a big binary tree **T1** and a much smaller tree **T2**. The question is simple to say and easy to get wrong: is **T2 a subtree of T1**? That means some node `n` in T1 owns a whole branch that looks exactly like T2, same structure and same values, all the way down to the leaves. Cut the tree at `n` and you should get T2, not "something that starts like T2."

This post is problem **4.10 Check Subtree** from the [CTCI Java series](/blog/en/ctci-series-guide). Original teaching, not a book paste. Two solid approaches: recursive search plus tree match, and preorder strings with null markers.

---

## Everyday picture

Think of a company org chart (T1) and a photo of one team (T2).

* T2 is a subtree only if some manager in T1 has **exactly** that team under them: same people in the same left/right seats, including who has empty chairs (null children).
* It is **not** enough that the same names appear somewhere in the big chart. Order and shape matter.
* It is **not** enough that a path from root to a leaf matches T2. Subtree means the full rooted shape under some node.

So: find a candidate root in T1, then prove the whole small tree lines up. Or: write both trees as a careful string and ask if the small string sits inside the big one.

---

## Problem in plain words

**Input:** roots of two binary trees, `t1` and `t2`. Assume T1 is much larger than T2 (that is the usual interview framing).

**Output:** `true` if T2 is a subtree of T1; otherwise `false`.

**Definition:** T2 is a subtree of T1 if there exists a node `n` in T1 such that the subtree rooted at `n` is **identical** to T2 (values and structure).

**Examples**

```
T1:          1
           /   \
          2     3
         / \   /
        4   5 6

T2:      2
        / \
       4   5
```

Answer: `true`. The left child of T1's root matches T2 completely.

```
T2':     2
        /
       4
```

Answer: `false` if T1's node `2` still has a right child `5`. Structure must match, not only a partial shape.

**Clarify in the interview**

* Empty T2: often treated as a subtree of anything (or reject; pick a contract). Empty T1 with non-empty T2 is `false`.
* Values can repeat in T1, so you may need several candidate starts.
* Compare by **value and structure**, not by object reference (trees are usually separate objects).
* Binary tree, not necessarily a BST.

**Node shape**

```java
public class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}
```

---

## How to think before coding

### Approach A: search for root, then matchTree

1. Walk T1 (DFS or BFS). Whenever a node has `val == t2.val`, call `matchTree(node, t2)`.
2. `matchTree(a, b)` is true only if both are null, or both non-null with the same value and matching left and right subtrees.
3. If any candidate matches fully, return true. If T1 ends with no match, return false.

This is the approach most people sketch first. It is clear and does not need extra string memory.

Worst case cost: you may compare T2 against many places in T1. If T1 has size `n`, T2 has size `m`, and many nodes share T2's root value, you can spend up to about O(n · m) work. When values are unique-ish, it is closer to O(n + m).

### Approach B: preorder with null markers, then contains

1. Serialize T1 and T2 with a **preorder** walk that **records null children** (for example `X` for null, or a delimiter scheme).
2. Ask whether T2's string is a **substring** of T1's string.

Why null markers matter: without them, different shapes can serialize the same. With them, a contiguous preorder chunk of the big tree that equals the small tree's full serialization means the rooted shapes match. You still need separators so values like `12` do not fake-match `1` then `2`. A common pattern is to wrap values: `"#3#"` and `"#X#"` for null, then join, then `contains`.

Time: O(n + m) to build strings (and substring search is linear with a good method; Java's `contains` is fine to mention). Space: O(n + m) for the strings.

Interview habit: lead with **search + matchTree**. Mention the string method as a second angle that trades space for simpler matching logic.

---

## Java solution: search + matchTree

```java
public class CheckSubtree {

    public static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    /**
     * Returns true if t2 is a subtree of t1 (same values and structure under some node).
     * Empty t2 is treated as a subtree. Null t1 with non-empty t2 is not.
     */
    public static boolean containsTree(TreeNode t1, TreeNode t2) {
        if (t2 == null) {
            return true;
        }
        if (t1 == null) {
            return false;
        }
        return subTree(t1, t2);
    }

    /** Walk t1; at each node try a full match against t2. */
    private static boolean subTree(TreeNode r1, TreeNode r2) {
        if (r1 == null) {
            return false;
        }
        if (r1.val == r2.val && matchTree(r1, r2)) {
            return true;
        }
        return subTree(r1.left, r2) || subTree(r1.right, r2);
    }

    /** True only if both trees are identical from these roots. */
    private static boolean matchTree(TreeNode a, TreeNode b) {
        if (a == null && b == null) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        if (a.val != b.val) {
            return false;
        }
        return matchTree(a.left, b.left) && matchTree(a.right, b.right);
    }
}
```

Trace on the first example: `subTree` walks T1, hits node `2`, `matchTree` checks `2/4/5` against T2 and returns true. Done.

If node `2` in T1 had a different right child, `matchTree` fails and the search continues through the rest of T1.

---

## Java solution: preorder strings + contains

```java
public class CheckSubtreeSerialized {

    public static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    public static boolean containsTree(TreeNode t1, TreeNode t2) {
        if (t2 == null) {
            return true;
        }
        if (t1 == null) {
            return false;
        }
        String s1 = serialize(t1);
        String s2 = serialize(t2);
        return s1.contains(s2);
    }

    /** Preorder with null markers and value wrappers so tokens cannot glue. */
    private static String serialize(TreeNode node) {
        StringBuilder sb = new StringBuilder();
        write(node, sb);
        return sb.toString();
    }

    private static void write(TreeNode node, StringBuilder sb) {
        if (node == null) {
            sb.append("#X#");
            return;
        }
        sb.append('#').append(node.val).append('#');
        write(node.left, sb);
        write(node.right, sb);
    }
}
```

Example idea (simplified tokens): T2 might look like `#2##4##X##X##5##X##X#`. That full blob must appear inside T1's serialization for a true match. The `#` wrappers stop `12` from looking like `1` followed by `2`.

---

## Complexity

| Approach | Time (rough) | Extra space | Notes |
| --- | --- | --- | --- |
| search + matchTree | O(n + k · m) worst ~ O(n · m) | O(h) recursion (height of T1 / T2) | `k` = times T2.root value appears in T1 |
| preorder string + contains | O(n + m) build (+ linear search) | O(n + m) strings | simpler match step; pay memory |

`n` = nodes in T1, `m` = nodes in T2. The problem statement says T1 is much larger than T2, so both are practical; say which trade-off you pick.

---

## Edge cases interviewers poke

1. **Null / empty T2.** Contract: usually `true` (empty tree is a subtree). State it.
2. **Null T1, non-empty T2.** `false`.
3. **Identical trees.** T2 equals T1. First node matches fully; return `true`.
4. **Repeated root values.** Several nodes in T1 equal T2.root; only one full match (or none). Do not stop at the first value hit without `matchTree`.
5. **Same values, wrong shape.** Left/right swapped, or missing null. `matchTree` and null-marked serialization both catch this.
6. **T2 larger than T1.** Can only be true if they are equal in size and structure; usually false. Still fine for both algorithms.
7. **Single-node T2.** True iff that value appears anywhere in T1.
8. **Deep skinny trees.** Recursion depth is height. Mention stack depth; iterative variants exist if they care.

---

## Common mistakes

* Checking only that every value in T2 appears in T1 (multiset equality). Shape is ignored.
* Matching a **path** instead of a **full subtree** (forgetting sibling branches and nulls).
* Serialization **without null markers**, so different topologies collide.
* Serialization without **value delimiters**, so multi-digit values glue (`12` vs `1`,`2`).
* In `subTree`, comparing values and returning true without calling `matchTree` on the whole shape.
* Mutating T1 or T2 during the check.
* Confusing "subtree" with "T2 is a BST range inside a BST." This problem is general binary trees and structural identity.

---

## Recap you can tell a friend

Is the small tree sitting somewhere inside the big tree as a complete branch?

Walk the big tree. Every time you see the small tree's root value, compare the whole shapes: both null, or same value and same left and right. If any candidate fits, yes.

Or write both trees as preorder text that records empty children and wraps each value. If the small text is inside the big text, the shapes match.

Lead with search + matchTree in interviews. Keep the string trick as a second story when they ask for another way.

---

## Practice

1. Code `containsTree` and `matchTree` from memory on paper.
2. Draw T1 with two nodes equal to T2's root; only one is a true subtree. Trace which candidate fails.
3. Serialize a tiny tree with and without null markers; show how two different shapes collide without markers.
4. Explain O(n · m) vs O(n + m) and when each shows up.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [BST Sequences](/blog/en/ctci-4-9-bst-sequences)
* Next: [Random Node](/blog/en/ctci-4-11-random-node)