---
title: "Successor: In-Order Next Node in a BST (Java)"
description: "CTCI-style problem 4.6 for beginners: find the in-order successor of a node in a binary search tree when every node has a parent link. Right-subtree leftmost, or climb parents until you are not a right child."
date: "2026-02-22"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-6-successor.webp
previewImage: /assets/images/ctci-4-6-successor.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 4.6 for beginners: find the in-order successor of a node in a binary search tree when every node has a parent link. Right-subtree leftmost, or climb parents until you are not a right child.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

In-order walk of a BST prints keys in sorted order. Given one node, the **successor** is the next key that walk would visit. You do not restart from the root and scan the whole tree. You already hold the node, and each node has a `parent` pointer.

This post is original teaching for beginners in **Java**. Same problem family as classic BST successor questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide).

---

## 1. Sorted line analogy

Picture the BST as a sorted line of people standing by height (or key). In-order means: left subtree, then me, then right subtree. The successor of a person is whoever stands immediately to their right on that line.

Two ways to find them without redrawing the whole line:

* **You have a right-hand branch.** The next person is not your right child. It is the **leftmost** person in that right branch (the smallest key still greater than yours).
* **You have no right-hand branch.** You already finished your left side and yourself. Climb toward the root while you are still someone's **right** child. The first ancestor for whom you sit on the **left** is the next person on the line. If you climb past the root, you were last.

Parent links are the ladder. Without them you would search from the root every time.

---

## 2. Plain problem statement

**Goal:** given a node `n` in a binary search tree, return the in-order successor of `n`, or `null` if `n` is last.

**Assumptions:**

* Nodes have `left`, `right`, and `parent`.
* The tree is a BST (left keys smaller, right keys larger), or at least you only need the structural in-order next node.
* You may start from `n` only; you do not get a separate root unless you climb to it.

**Clarify before coding:**

* What if `n` is null? (Return null.)
* What if `n` has no parent and no right child? (It is the root and last; return null.)
* Duplicate keys? (Problem usually assumes unique keys. State your rule if asked.)

---

## 3. Think first

### Wrong first idea: full in-order dump

Walk the whole tree into a list, find `n`, return the next index. Correct but O(N) time and space. Interviewers want O(H) with parent links, where H is height.

### Case A: right child exists

Successor is the minimum of the right subtree:

1. Go to `n.right`.
2. While `left` is not null, go left.
3. That node is the answer.

Why? In-order does left, node, right. After `n`, the first visit in the right subtree is its leftmost node.

### Case B: no right child

Climb parents:

1. Set `p = n.parent`, `c = n`.
2. While `p` is not null and `c == p.right` (you are still a right child), set `c = p`, `p = p.parent`.
3. Return `p` (may be null if you were the overall last node).

Why? You finished a right subtree. Keep going up until the climb enters a node from the left. That node has not been "visited" yet in the mental in-order walk.

### Sketch

```
        20
       /  \
     10    30
    /  \     \
   5   15    40
      /
    12
```

| Node | Successor | Why |
| --- | --- | --- |
| 10 | 12 | right child 15 exists; leftmost of that branch is 12 |
| 15 | 20 | no right; 15 is right of 10, so climb; 10 is left of 20 → 20 |
| 40 | null | no right; climb as right child of 30, then of 20; root has no parent |
| 5 | 10 | no right; 5 is left of 10 → parent 10 |

---

## 4. Java solution

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode parent;

    TreeNode(int val) {
        this.val = val;
    }
}

class Solution {
    /** In-order successor of n, or null if n is last / null. */
    TreeNode inOrderSuccessor(TreeNode n) {
        if (n == null) {
            return null;
        }

        // Case A: right subtree exists → leftmost of right
        if (n.right != null) {
            return leftMostChild(n.right);
        }

        // Case B: climb until we are not a right child
        TreeNode current = n;
        TreeNode p = n.parent;
        while (p != null && p.right == current) {
            current = p;
            p = p.parent;
        }
        return p;
    }

    private TreeNode leftMostChild(TreeNode n) {
        if (n == null) {
            return null;
        }
        while (n.left != null) {
            n = n.left;
        }
        return n;
    }
}
```

Helper notes:

* `leftMostChild` is the same idea as "minimum in a BST subtree".
* The climb loop stops when `p == null` (no successor) or when `current` is `p.left` (found the ancestor that comes next).
* You do not need the root as a separate argument if parent links are complete.

Optional: if the interviewer forbids parent links, you search from the root with a running candidate (track the last node greater than `n` while walking). That is a different problem setup; this post sticks to parent links.

---

## 5. Complexity table

| Approach | Time | Extra space |
| --- | --- | --- |
| Parent-link successor (this solution) | O(H) | O(1) |
| Full in-order list then index | O(N) | O(N) |
| From root without parents (candidate walk) | O(H) | O(1) |

H is tree height. Balanced tree ≈ log N. Skewed tree can be N. Space stays constant for the parent-link walk.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Null input** → return null.
* **Rightmost node** → climb to root, then null. Last in in-order has no successor.
* **Root with only left subtree** → if you ask successor of the root and it has no right, return null (root is last if no right).
* **Leaf that is a left child** → successor is its parent (no climb loop iterations after the first check).
* **Deep right spine** → climb may walk many parents; still O(H), not wrong.

Common mistakes:

1. **Returning the right child directly** instead of the leftmost of the right subtree. That skips the left chain under the right child.
2. **Climbing only one parent** always. You must loop while you remain a right child.
3. **Forgetting parent is null** at the root and NPE on `p.right`.
4. **Confusing successor with predecessor.** Predecessor is symmetric: leftmost has no left → climb while left child; or rightmost of left subtree.
5. **Assuming a balanced tree** when quoting time. Say O(H), mention worst case O(N).
6. **Mutating the tree** to thread parents temporarily. Not needed if parents already exist.

Minimal usage sketch:

```java
// Build a tiny tree with parents set both ways, then:
TreeNode fifteen = /* node 15 */;
TreeNode next = new Solution().inOrderSuccessor(fifteen); // 20 in the sketch above
```

---

## 7. Explain to a friend recap

Successor is "who comes next in sorted / in-order order" for one BST node:

1. If the node has a right child, go right once, then left until you cannot. That node is next.
2. If not, walk up parents while you are still the right child. The first parent where you came from the left is next.
3. If you run out of parents, there is no next node.
4. Parent pointers make this O(height) and O(1) extra space. No full tree dump.

If you can draw the two cases on a whiteboard and walk 15 → 20 and 40 → null on a sample tree, you own problem 4.6.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Validate BST](/blog/en/ctci-4-5-validate-bst)
* Next: [Build Order](/blog/en/ctci-4-7-build-order)