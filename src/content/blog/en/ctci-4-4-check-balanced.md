---
title: "Check Balanced: Verifying If a Binary Tree Is Height-Balanced (CTCI 4.4)"
description: "Implement an algorithm to determine if a binary tree is balanced in O(N) time and O(H) space using short-circuiting post-order height checking."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-4-check-balanced.webp
previewImage: /assets/images/ctci-4-4-check-balanced.webp
---

> **TL;DR**
> * **The Book Problem:** Implement a function to check if a binary tree is balanced. A balanced tree is defined such that the heights of the two subtrees of any node never differ by more than one.
> * **The Optimal Solution:** Use **Bottom-Up Post-Order Traversal**: Recurse down to the leaves, computing height. If any subtree is unbalanced ($|h_{left} - h_{right}| > 1$), immediately return an error code (`Integer.MIN_VALUE`) to short-circuit the execution, running in $O(N)$ time and $O(H)$ stack space instead of $O(N \log N)$ naive top-down scanning.
> * **Production Reality:** AVL / Red-Black self-balancing tree validation and LSM-tree memory compaction hierarchy monitoring.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.4), we are asked:

*"Implement a function to check if a binary tree is balanced. For the purposes of this question, a balanced tree is defined to be a tree such that the heights of the two subtrees of any node never differ by more than one."*

## 2. Why Naive Top-Down Height Checking Fails

A naive solution computes `getHeight(node.left)` and `getHeight(node.right)` at the root, checks if $|h_{left} - h_{right}| \le 1$, and then recurses on `isBalanced(node.left)` and `isBalanced(node.right)`.
* **The Flaw:** `getHeight` traverses descendant nodes repeatedly. For a balanced tree, this runs in $O(N \log N)$ time, and for a skewed tree, it degrades to $O(N^2)$.

## 3. The Optimal Post-Order Short-Circuiting Method

We calculate height and balance simultaneously in a single bottom-up pass:
1. `checkHeight(node)` returns the actual height of the subtree if it is balanced.
2. If at any node $|checkHeight(left) - checkHeight(right)| > 1$, or if a child already returned `Integer.MIN_VALUE`, return `Integer.MIN_VALUE` immediately.
3. If balanced, return $\max(leftHeight, rightHeight) + 1$.

## Production Implementation

```java
public class CheckBalanced {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Checks if a binary tree is height-balanced.
     * Time Complexity: O(N)
     * Space Complexity: O(H) where H is the height of the tree.
     */
    public static boolean isBalanced(TreeNode root) {
        return checkHeight(root) != Integer.MIN_VALUE;
    }

    private static int checkHeight(TreeNode root) {
        if (root == null) return -1; // Height of null is -1

        int leftHeight = checkHeight(root.left);
        if (leftHeight == Integer.MIN_VALUE) return Integer.MIN_VALUE; // Pass error up

        int rightHeight = checkHeight(root.right);
        if (rightHeight == Integer.MIN_VALUE) return Integer.MIN_VALUE; // Pass error up

        int heightDiff = Math.abs(leftHeight - rightHeight);
        if (heightDiff > 1) {
            return Integer.MIN_VALUE; // Found error -> pass it back
        } else {
            return Math.max(leftHeight, rightHeight) + 1;
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Each node in the tree is visited at most once; halts immediately on unbalance. |
| Auxiliary Space | `O(H)` | Call stack memory bounded by tree height $H$ ($O(\log N)$ balanced, $O(N)$ worst-case). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Self-Balancing Invariant Auditing

1. **AVL / Red-Black Tree Health Checkers:** Storage engines (e.g. RocksDB memtables) periodically audit self-balancing tree structures to detect unbalance caused by thread synchronization race conditions.
2. **Game Physics Spatial Partitioning Trees:** Ensures bounding volume hierarchies (BVH) do not degenerate into deep linear lists.

## Edge Cases & Production Hardening

1. **Empty tree (`root == null`):** Returns `true` (height $-1$).
2. **Single node:** Returns `true` (height $0$).
3. **Subtree far down is unbalanced:** Error code immediately short-circuits all remaining subtree traversals.
