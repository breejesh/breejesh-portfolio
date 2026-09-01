---
title: "First Common Ancestor: Lowest Common Ancestor in a Binary Tree (CTCI 4.8)"
description: "Design an algorithm to find the first common ancestor of two nodes in a binary tree without extra data structures or parent pointers in O(N) time and O(H) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-8-first-common-ancestor.webp
previewImage: /assets/images/ctci-4-8-first-common-ancestor.webp
---

> **TL;DR**
> * **The Book Problem:** Design an algorithm and write code to find the first common ancestor of two nodes in a binary tree. Avoid storing additional nodes in a data structure. (Note: This is not necessarily a binary search tree).
> * **The Optimal Solution:** Use **Post-Order Tree Search**: A node $r$ is the common ancestor if $p$ is on one subtree and $q$ is on the other subtree, or if $r$ is either $p$ or $q$ and the other is a descendant. Recurse down: if left and right child calls return non-null nodes, the current node is the LCA, executing in $O(N)$ time and $O(H)$ stack space.
> * **Production Reality:** DOM element event bubbling ancestor matching, taxonomy ontology subsumption queries, and git merge base calculation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.8), we are asked:

*"Design an algorithm and write code to find the first common ancestor of two nodes in a binary tree. Avoid storing additional nodes in a data structure. NOTE: This is not necessarily a binary search tree."*

## 2. Algorithmic Mechanics (Post-Order Recursion)

We bubble up findings from the bottom of the tree:
1. Base case: If `root == null`, return `null`.
2. If `root == p || root == q`, return `root`.
3. Recurse on left: `left = commonAncestor(root.left, p, q)`.
4. Recurse on right: `right = commonAncestor(root.right, p, q)`.
5. Evaluate returned values:
   * If both `left != null` and `right != null`, it means $p$ and $q$ are in separate subtrees of `root`. Therefore, `root` is the Lowest Common Ancestor.
   * If only `left != null`, both nodes (or the ancestor) reside in the left subtree; return `left`.
   * If only `right != null`, both nodes reside in the right subtree; return `right`.
   * If both are `null`, neither node was found; return `null`.

## Production Implementation

```java
public class FirstCommonAncestor {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;

        public TreeNode(int x) {
            this.val = x;
        }
    }

    /**
     * Finds the Lowest Common Ancestor (LCA) of nodes p and q.
     * Time Complexity: O(N)
     * Space Complexity: O(H) where H is tree height.
     */
    public static TreeNode commonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        // Error check: Ensure both nodes exist in the tree
        if (!covers(root, p) || !covers(root, q)) {
            return null;
        }
        return ancestorHelper(root, p, q);
    }

    private static TreeNode ancestorHelper(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) {
            return root;
        }

        boolean pIsOnLeft = covers(root.left, p);
        boolean qIsOnLeft = covers(root.left, q);

        // Nodes are on different sides -> root is the common ancestor
        if (pIsOnLeft != qIsOnLeft) {
            return root;
        }

        // Both nodes are on the same side -> traverse deeper
        TreeNode childSide = pIsOnLeft ? root.left : root.right;
        return ancestorHelper(childSide, p, q);
    }

    private static boolean covers(TreeNode root, TreeNode p) {
        if (root == null) return false;
        if (root == p) return true;
        return covers(root.left, p) || covers(root.right, p);
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Traverses tree nodes to locate $p$ and $q$. |
| Auxiliary Space | `O(H)` | Call stack memory bounded by tree height $H$ ($O(\log N)$ balanced, $O(N)$ worst-case). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Hierarchy Resolution

1. **Browser DOM Event Bubbling:** When dispatching events between elements, rendering engines locate the lowest common ancestor node to construct the event propagation chain.
2. **Organizational & File Access Control Trees:** Finding the closest common supervisory group to apply inheritance rules.

## Edge Cases & Production Hardening

1. **One or both nodes not in tree:** Initial `covers` check returns `null` safely.
2. **$p$ is an ancestor of $q$ (or vice-versa):** Returns $p$ (or $q$) as the ancestor.
3. **$p == q$:** Handled cleanly, returning $p$.
