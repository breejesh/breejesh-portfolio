---
title: "Successor: Finding the In-Order Successor in a BST (CTCI 4.6)"
description: "Write an algorithm to find the in-order successor of a node in a binary search tree with parent pointers in O(H) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-6-successor.webp
previewImage: /assets/images/ctci-4-6-successor.webp
---

> **TL;DR**
> * **The Book Problem:** Write an algorithm to find the "next" node (i.e., in-order successor) of a given node in a binary search tree. You may assume that each node has a link to its parent.
> * **The Optimal Solution:** (1) If the node has a right child, the successor is the **leftmost child of the right subtree**; (2) Else, traverse upwards through parent pointers until we find a parent for which our current node was in the **left subtree**, running in $O(H)$ time and $O(1)$ space.
> * **Production Reality:** Bi-directional B-Tree cursor iterators (`cursor.next()`) in database storage engines, range query scanning, and standard library ordered map iterators.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.6), we are asked:

*"Write an algorithm to find the 'next' node (i.e., in-order successor) of a given node in a binary search tree. You may assume that each node has a link to its parent."*

**Recall In-Order Traversal Order:** Left $\to$ Current $\to$ Right.
The in-order successor of node $x$ is the node with the smallest key strictly greater than $x.val$.

## 2. Case Analysis & Algorithmic Mechanics

There are two distinct structural cases:

### Case 1: Node Has a Right Subtree
If `node.right != null`, the successor is the smallest element in the right subtree:
* Step right once: `curr = node.right`.
* Step left as far as possible: `while (curr.left != null) curr = curr.left;`.
* Return `curr`.

### Case 2: Node Has No Right Subtree
If `node.right == null`, we must look to the ancestors:
* If `node` is the left child of its parent, the parent is the immediate successor.
* If `node` is the right child of its parent, we have already traversed the parent. We traverse up the tree (`node = parent; parent = parent.parent`) until we find a node that is the **left child** of its parent.
* If we reach the root without fulfilling this, the node was the maximum element in the BST, and no successor exists (`null`).

## Production Implementation

```java
public class Successor {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode parent;

        public TreeNode(int x) {
            this.val = x;
        }
    }

    /**
     * Finds the in-order successor of a node in a BST.
     * Time Complexity: O(H) where H is tree height.
     * Space Complexity: O(1)
     */
    public static TreeNode inorderSucc(TreeNode n) {
        if (n == null) return null;

        // Case 1: Found right children -> return leftmost node of right subtree
        if (n.right != null) {
            return leftMostChild(n.right);
        } else {
            // Case 2: Go up until we're on left instead of right
            TreeNode q = n;
            TreeNode x = q.parent;

            while (x != null && x.left != q) {
                q = x;
                x = x.parent;
            }
            return x;
        }
    }

    private static TreeNode leftMostChild(TreeNode n) {
        if (n == null) return null;
        while (n.left != null) {
            n = n.left;
        }
        return n;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(H)` | Traverses downward to the leftmost leaf or upward along ancestor chain (bounded by tree height $H$). |
| Auxiliary Space | `O(1)` | Iterates in-place using reference pointers without recursion or memory allocation. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Database Cursor Iterators

1. **Storage Engine Range Scans (B-Tree Cursors):** When executing `SELECT * WHERE id > 500 LIMIT 10`, storage engines seek node 500 and repeatedly invoke successor traversal across sibling tree blocks.
2. **C++ `std::map::iterator++`:** Iterates through red-black trees in $O(1)$ amortized time per step using parent pointers.

## Edge Cases & Production Hardening

1. **Maximum element in BST:** Ancestor loop reaches root (`x == null`), returning `null`.
2. **Root node:** If right child exists, returns leftmost of right; otherwise returns `null`.
3. **Null input:** Guard clause returns `null`.
