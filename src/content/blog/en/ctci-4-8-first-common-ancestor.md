---
title: "First Common Ancestor: LCA Without Parent Links (Java)"
description: "CTCI-style problem 4.8 for beginners: find the deepest common ancestor of two nodes in a binary tree (not necessarily a BST). Prefer one recursive pass that returns a status object; parent-link climb is the alternate."
date: "2026-05-09"
tags: [Algorithms]
coverImage: /assets/images/ctci-4-8-first-common-ancestor.webp
previewImage: /assets/images/ctci-4-8-first-common-ancestor.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 4.8 for beginners: find the deepest common ancestor of two nodes in a binary tree (not necessarily a BST). Prefer one recursive pass that returns a status object; parent-link climb is the alternate.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

Two people in a family tree. Walk up from each person toward the oldest root. The first person you both hit on those climbs is a common ancestor. The **first** common ancestor is the deepest one: as close to the two people as possible, not the root unless the root is the only shared point.

This post is original teaching for beginners in **Java**. Same problem family as classic interview tree LCA, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Problem **4.8**: binary tree, not necessarily a BST. Prefer a solution **without parent links**.

---

## 1. Tree analogy

Picture a company org chart drawn as a binary tree. Each box has at most two reports under it. Alice and Bob sit somewhere in the chart. Their manager-in-common who is farthest from the CEO (closest to Alice and Bob) is the first common ancestor.

Important distinctions:

* **Ancestor of X** includes X itself in many interview statements. If Bob reports under Alice, Alice can be the answer.
* **First / lowest** means deepest in the tree, not "first" in a left-to-right walk.
* This is **not** a BST. You cannot use value order to decide left vs right. You only have structure: left child, right child, and maybe a parent pointer if the interviewer gives one.

If nodes had parent pointers, the problem looks like two roads climbing to a shared highway, similar to linked-list intersection. Without parents, you start at the root and hunt downward with recursion.

---

## 2. Plain problem statement

**Goal:** given root of a binary tree and two nodes `p` and `q` that may or may not sit in that tree, return their first common ancestor node, or `null` if you cannot name one.

**Constraints that matter:**

* Binary tree, not necessarily BST.
* Avoid storing a list of every ancestor (the classic "avoid extra node lists" flavor).
* Prefer **no parent links** on `TreeNode`.
* Clarify whether `p` or `q` is allowed to be the answer when one sits under the other (usually yes).
* Clarify what happens if one node is missing from the tree (usually return `null`).

**Node shape (no parent):**

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

**Tiny example**

```
        3
       / \
      5   1
     / \ / \
    6  2 0  8
      / \
     7   4
```

* FCA of `6` and `4` is `5`.
* FCA of `5` and `4` is `5` (node covers itself).
* FCA of `6` and `8` is `3`.

---

## 3. Think first

### Alternate: parent links, climb like list intersection

If every node has `parent`:

1. Measure depth of `p` and of `q` by walking up to the root.
2. Lift the deeper node up until both sit at the same depth.
3. Walk both up one step at a time until the pointers meet. That node is the first common ancestor.

Runtime is O(D) for depth D of the deeper node. Extra space is O(1) beyond the tree. This is the same idea as CTCI 2.7 intersection: two paths that share a suffix toward the root.

Useful when the API already stores parents. Not the main path when the interviewer says "nodes only know their children."

### Naive without parents: side checks with `covers`

From the root, ask "does the left subtree cover `p`?" and "does the left cover `q`?"

* Different answers: `p` and `q` split under this node, so this node is the FCA.
* Same side: recurse into that side only.

Correct, but each `covers` walks a subtree, and you call it repeatedly. You still end up O(N) on a balanced tree, with a worse constant because the same nodes get scanned many times.

### Preferred: one recurse, return status

You only want to walk the tree once. A single recursive helper returns a small **status object**:

* A `node` candidate (could be `p`, `q`, a true ancestor, or `null`)
* A flag `isAncestor` that says "this `node` is already the real first common ancestor"

Rules bubble up:

1. Empty subtree → `(null, false)`.
2. Left and right both return a non-null node → current root is the common ancestor (`isAncestor = true`).
3. Current root is `p` or `q`, and the other target was found in a subtree → current root is a true ancestor.
4. Current root is `p` or `q`, and the other was **not** found below → return this root with `isAncestor = false` (might be "found one target" only).
5. Only one side found something → pass that result up unchanged (unless step 3 applies).
6. If a child already set `isAncestor = true`, short-circuit and bubble that up.

Why the flag? Without it, "I found `p` but not `q`" looks the same as "`p` is under `q`" when you only return a single node pointer. The flag separates **true LCA** from **partial find**. At the top, if `isAncestor` is false, return `null` (missing node or incomplete match).

That is the solution you want to code and explain first.

---

## 4. Java solution (no parent links)

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}

/** Status from one recursive pass. */
class Result {
    TreeNode node;
    boolean isAncestor;

    Result(TreeNode node, boolean isAncestor) {
        this.node = node;
        this.isAncestor = isAncestor;
    }
}

class FirstCommonAncestor {

    /**
     * First common ancestor of p and q under root, or null if neither
     * is a valid pair fully present (for example one node missing).
     */
    TreeNode commonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        Result r = helper(root, p, q);
        return r.isAncestor ? r.node : null;
    }

    private Result helper(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null) {
            return new Result(null, false);
        }

        // Same node asked twice (p == q == root)
        if (root == p && root == q) {
            return new Result(root, true);
        }

        Result left = helper(root.left, p, q);
        if (left.isAncestor) {
            return left; // already locked in below
        }

        Result right = helper(root.right, p, q);
        if (right.isAncestor) {
            return right;
        }

        if (left.node != null && right.node != null) {
            // p and q found in different subtrees
            return new Result(root, true);
        }

        if (root == p || root == q) {
            // Found one target here; true ancestor only if the other was below
            boolean foundOther = left.node != null || right.node != null;
            return new Result(root, foundOther);
        }

        // Pass up whichever side found a node (or null)
        TreeNode bubble = left.node != null ? left.node : right.node;
        return new Result(bubble, false);
    }
}
```

Walkthrough on the sample tree for `p = 6`, `q = 4` (both under `5`):

| Step | Focus | What bubbles | Notes |
| --- | --- | --- | --- |
| 1 | Leaf `6` | node=`6`, false | root matches `p` |
| 2 | Subtree of `2` finds `4` | node=`4`, false | right of `2` |
| 3 | Node `2` | node=`2`? no: left null, right `4` | not p/q; bubble `4` |
| 4 | Node `5`: left has `6`, right path has `4` | node=`5`, **true** | both sides non-null |
| 5 | Root `3` | left already `isAncestor` | short-circuit return `5` |

If `q` were a node outside the tree, you might bubble `p` with `isAncestor = false` all the way up, and the public method returns `null`. That is the flag earning its keep.

---

## 5. Alternate: parent-link climb

When `TreeNode` has `parent`:

```java
class TreeNodeWithParent {
    int val;
    TreeNodeWithParent left;
    TreeNodeWithParent right;
    TreeNodeWithParent parent;
}

TreeNodeWithParent commonAncestorWithParents(
        TreeNodeWithParent p, TreeNodeWithParent q) {
    int delta = depth(p) - depth(q);
    TreeNodeWithParent first = delta > 0 ? q : p;   // shallower
    TreeNodeWithParent second = delta > 0 ? p : q;  // deeper
    second = goUpBy(second, Math.abs(delta));

    while (first != second && first != null && second != null) {
        first = first.parent;
        second = second.parent;
    }
    return (first == null || second == null) ? null : first;
}

int depth(TreeNodeWithParent node) {
    int d = 0;
    while (node != null) {
        node = node.parent;
        d++;
    }
    return d;
}

TreeNodeWithParent goUpBy(TreeNodeWithParent node, int delta) {
    while (delta > 0 && node != null) {
        node = node.parent;
        delta--;
    }
    return node;
}
```

Mention this in the interview after the recursive status solution: "If parents exist, align depths and climb; same idea as list intersection." Then return to the no-parent version as the default for plain binary trees.

---

## 6. Complexity table

| Approach | Time | Extra space | Needs parent? |
| --- | --- | --- | --- |
| Parent climb (depth align) | O(D) | O(1) | yes |
| Repeated `covers` + branch | O(N) (worse constants) | O(H) stack | no |
| One recurse + `Result` status | O(N) | O(H) stack | no |

N = nodes in the tree, D = depth of deeper node, H = height (recursion stack). You cannot beat O(N) worst case without parents or extra indexes, because a missing node forces you to look everywhere.

---

## 7. Edge cases and common mistakes

Interviewers poke these:

* **One node is ancestor of the other** → answer is the upper node (`isAncestor` becomes true when the second target is found under it).
* **`p == q`** → that node (if present).
* **One or both missing** → `null` via `isAncestor == false` at the top.
* **Root is the only common ancestor** → both targets live on different sides of the root (or one is the root and the other is below).
* **Empty tree / null root** → `null`.
* **Not a BST** → never compare `val` to decide direction.

Common mistakes:

1. **Returning the first partial find as LCA** without a flag or a prior "both nodes exist" scan.
2. **Storing full root-to-node paths** in lists when the problem asks you to avoid that style (fine as a warm-up; call it out and move on).
3. **Using BST logic** on a plain binary tree.
4. **Forgetting `p` or `q` can be the answer** when one covers the other.
5. **Mutating the tree** or parent pointers when you only needed a read-only walk.

Minimal usage sketch:

```java
// build sample tree rooted at 3 ... then:
TreeNode ans = new FirstCommonAncestor().commonAncestor(root, node6, node4);
// ans.val == 5
```

---

## 8. Explain to a friend recap

First Common Ancestor on a plain binary tree:

1. Deepest node that has both targets in its subtree (a node counts as in its own subtree).
2. With parent links: equalize depths, climb together until pointers match.
3. Without parents (preferred): one DFS that returns a **status** (`node` + `isAncestor`).
4. Both children report a find → current node is the LCA.
5. Current node is one target and the other was found below → current node is the LCA.
6. Partial find without the flag true → bubble up; top level returns `null` if never confirmed.

If you can draw the sample tree, mark where left and right each report a hit, and explain why the flag exists, you own problem 4.8.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Build Order](/blog/en/ctci-4-7-build-order)
* Next: [BST Sequences](/blog/en/ctci-4-9-bst-sequences)