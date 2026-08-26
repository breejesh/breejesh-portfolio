---
title: "BST Sequences: All Arrays That Build the Same Tree (Java)"
description: "CTCI-style problem 4.9 for beginners: given a BST built by left-to-right inserts, list every array that could have produced it. Root first, then weave left and right subtree sequences with a recursive helper."
date: "2025-08-22"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-9-bst-sequences.webp
previewImage: /assets/images/ctci-4-9-bst-sequences.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 4.9 for beginners: given a BST built by left-to-right inserts, list every array that could have produced it. Root first, then weave left and right subtree sequences with a recursive helper.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You insert numbers into an empty binary search tree, one by one, always walking from the root and landing in the first empty child slot. The final tree shape depends on **order**. Different arrays can grow into the **same** tree. Problem 4.9 flips the usual question: given the finished BST, print every array that could have built it.

This post is original teaching for beginners in **Java**. Same problem family as classic interview "reconstruct insertion orders," not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Trees and graphs, problem **4.9**.

---

## 1. Deck of cards analogy

Imagine a dealer drops cards into two side piles under a single top card:

* The **top card** is always dealt first. That card becomes the BST root. Nothing else can be the root if the tree already has that root value.
* Cards smaller than the root only ever go into the **left pile** (left subtree). Cards larger only go into the **right pile**.
* Inside each pile, cards still have a parent-before-child order. You cannot insert a grandchild before its parent if the parent is the only path to that slot.
* Between left and right, the dealer may **interleave** freely. After the root is down, you can drop a left card, then a right card, then left again, as long as each pile keeps its internal order.

So the full answer is: root first, then every legal **weave** of a left sequence with a right sequence.

Tiny tree:

```
    2
   / \
  1   3
```

Only two insertion arrays:

* `{2, 1, 3}`
* `{2, 3, 1}`

`{1, 2, 3}` is wrong: root would be `1`, not `2`. `{2, 1, 3}` and `{2, 3, 1}` both produce this exact shape.

---

## 2. Plain problem statement

**Input:** root of a binary search tree with **distinct** integer values. The tree was built by inserting array elements from left to right into an empty BST.

**Output:** all arrays (lists of values) that, when inserted in order, produce **exactly this tree**.

**Rules:**

* Distinct values (no equal keys).
* Standard BST insert: go left if smaller, right if larger, attach at the first null child.
* You return sequences of values, not node references.
* Empty tree: one empty sequence is a clean teaching choice (one way to build nothing).

**Node shape:**

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}
```

**Clarify before coding:**

* Distinct values only? (Yes for this problem.)
* Mutate the tree? (No need. Read structure only.)
* Print or return a collection? (Return `List` of lists is easier to test.)
* What if the tree is null? (One empty list is fine.)

---

## 3. Think first

### What must be true of every valid array?

1. **Root is first.** If any other value came first, that value would be the root.
2. **Relative order inside the left subtree is fixed by the left subtree itself.** All left-subtree sequences must themselves be valid insertion orders for that subtree.
3. **Same for the right subtree.**
4. **Left and right may interleave** in any way that keeps those two relative orders. That mix is a **weave** (sometimes called a shuffle that preserves order inside each deck).

People sometimes guess "all left nodes before all right nodes." That is only one weave. After root `50`, you may insert `20` then `60`, or `60` then `20`. Both land on the correct side of `50`.

### Recursion shape

For node `n`:

1. Recursively compute every sequence for `n.left` → `leftSeqs`.
2. Recursively compute every sequence for `n.right` → `rightSeqs`.
3. For every pair `(L, R)`, weave `L` and `R` in all ways, then **prepend** `n.val` to each weave.
4. Base case: `null` node contributes a single empty list so weaving still works when a child is missing.

### What "weave" means

Weave two lists while keeping each list's internal order.

Example:

* first = `{1, 2}`
* second = `{3, 4}`

Weaves:

| Result |
| --- |
| `{1, 2, 3, 4}` |
| `{1, 3, 2, 4}` |
| `{1, 3, 4, 2}` |
| `{3, 1, 2, 4}` |
| `{3, 1, 4, 2}` |
| `{3, 4, 1, 2}` |

Count check: if lengths are `a` and `b`, number of weaves is `C(a+b, a)` (choose slots for the first list; the rest go to the second).

Recursive idea for weave:

* If either list is empty, append the rest of both to the current prefix and store that result.
* Else branch two ways: take the head of `first` into the prefix, or take the head of `second`. Recurse. Undo the mutation so sibling calls see the original lists.

Using `LinkedList` makes head remove/restore cheap. Clone the prefix when you store a finished sequence so later mutations do not rewrite past answers.

### Two recursive jobs, keep them separate

`allSequences` builds subtree sequence sets and prepends the root.

`weaveLists` only merges two lists.

Do not mix those concerns in one function. Trust weave when you call it from `allSequences`. Trust list restore when you implement weave.

---

## 4. Java solution

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class BstSequences {

    public List<LinkedList<Integer>> allSequences(TreeNode node) {
        List<LinkedList<Integer>> result = new ArrayList<>();

        if (node == null) {
            result.add(new LinkedList<>());
            return result;
        }

        LinkedList<Integer> prefix = new LinkedList<>();
        prefix.add(node.val);

        List<LinkedList<Integer>> leftSeq = allSequences(node.left);
        List<LinkedList<Integer>> rightSeq = allSequences(node.right);

        for (LinkedList<Integer> left : leftSeq) {
            for (LinkedList<Integer> right : rightSeq) {
                List<LinkedList<Integer>> weaved = new ArrayList<>();
                weaveLists(left, right, weaved, prefix);
                result.addAll(weaved);
            }
        }
        return result;
    }

    /**
     * Weave first and second in all ways that keep relative order inside each list.
     * Mutates first/second/prefix during recursion, then restores them.
     */
    void weaveLists(
            LinkedList<Integer> first,
            LinkedList<Integer> second,
            List<LinkedList<Integer>> results,
            LinkedList<Integer> prefix) {

        if (first.isEmpty() || second.isEmpty()) {
            LinkedList<Integer> complete = new LinkedList<>(prefix);
            complete.addAll(first);
            complete.addAll(second);
            results.add(complete);
            return;
        }

        // take head of first
        int headFirst = first.removeFirst();
        prefix.addLast(headFirst);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        first.addFirst(headFirst);

        // take head of second
        int headSecond = second.removeFirst();
        prefix.addLast(headSecond);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        second.addFirst(headSecond);
    }
}
```

Walkthrough for the sample tree `2 / 1  3`:

1. Left child `1` is a leaf: sequences `{{1}}`.
2. Right child `3` is a leaf: sequences `{{3}}`.
3. Weave `{1}` with `{3}`: `{1,3}` and `{3,1}`.
4. Prepend root `2`: `{2,1,3}` and `{2,3,1}`.

Larger sketch: root `50`, left subtree rooted at `20`, right at `60`. Recurse until each subtree returns its own sequence set. Weave every left sequence with every right sequence, then put `50` in front of each weave. That is the full answer for the tree.

Minimal usage:

```java
TreeNode root = new TreeNode(2);
root.left = new TreeNode(1);
root.right = new TreeNode(3);

List<LinkedList<Integer>> seqs = new BstSequences().allSequences(root);
// [[2, 1, 3], [2, 3, 1]]
```

---

## 5. Complexity table

| Piece | Cost notes |
| --- | --- |
| Number of sequences | Can grow **combinatorial**. Worst case is a skinny chain on one side plus a large free weave with the other side. |
| Weave of lengths a, b | `C(a+b, a)` results; each result costs O(a+b) to build when you clone/append. |
| `allSequences` | Product of left count and right count at each node, times weave cost. |
| Extra space | Output size dominates. Recursion depth is O(H) for the tree walk plus O(a+b) for weave depth. |

Interviews care less about a tight closed form and more that you name the explosion: output can be huge, so generating all sequences is only fine for small trees.

Time is **output-sensitive**. You will touch every sequence you return. Do not claim O(N) unless N is tiny and the tree is a pure chain (often one sequence only).

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Null root** → one empty sequence (or empty result list if you prefer; say which).
* **Single node** → only `{val}`.
* **Left only or right only** → no real interleave; weaves collapse to "the non-empty side after root."
* **Balanced small tree** → classic two-way weave after root (sample `2/1/3`).
* **Deep left, deep right** → many weaves; watch stack and cloning.

Common mistakes:

1. **Forcing all left before all right.** Misses half (or more) of the valid orders.
2. **Forgetting root must be first.** Any sequence that starts with a non-root value is invalid for this tree.
3. **Breaking relative order inside a subtree.** If left needs `20` before `10`, a weave may not put `10` ahead of `20`.
4. **Not restoring lists after recursion.** Sharing the same `LinkedList` without undo corrupts sibling branches.
5. **Mutating the shared prefix when storing results.** Clone before `results.add`.
6. **Trying to enumerate permutations of all nodes and test each insert.** Works for tiny N, fails the spirit of the problem, and is much slower than structured weave.

Quick self-check in the interview: pick one returned array, insert into a fresh BST, and confirm the shape matches. Spot-check a weave that interleaves left and right early.

---

## 7. Explain to a friend recap

BST Sequences answers "which insertion orders rebuild this exact BST?":

1. Root is always the first insert.
2. Recursively list every valid order for the left subtree and for the right subtree.
3. **Weave** each left list with each right list, keeping order inside each list.
4. Prepend the root to every weave.
5. Implement weave by repeatedly taking the next head from left or from right, with undo after each recursive branch.

If you can draw the three-node sample, write both answers, and explain why `{1,2,3}` is illegal for root `2`, you own problem 4.9.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [First Common Ancestor](/blog/en/ctci-4-8-first-common-ancestor)
* Next: [Check Subtree](/blog/en/ctci-4-10-check-subtree)