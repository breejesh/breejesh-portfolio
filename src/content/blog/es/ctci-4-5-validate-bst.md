---
title: "Validate BST: Implement a Function to Check If a Binary Tree Is a BST (CTCI 4.5)"
description: "Implement a function to check if a binary tree is a binary search tree using min/max range propagation in O(N) time and O(log N) stack space."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-5-validate-bst.webp
previewImage: /assets/images/ctci-4-5-validate-bst.webp
---

> **TL;DR**
> * **The Book Problem:** Implement a function to check if a binary tree is a binary search tree.
> * **The Core Breakthrough:** Min/Max Range Pass-Down: Every node must satisfy $\text{min} < \text{node.val} \le \text{max}$. Propagate bounds down the tree: left child gets $(\text{min}, \text{node.val}]$, right child gets $(\text{node.val}, \text{max})$ in $O(N)$ time.
> * **Production Reality:** Integrity verification of B-Tree database pages in PostgreSQL and filesystem directory trees.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.5), we are asked:

*"Implement a function to check if a binary tree is a binary search tree."*

*Definition:* A Binary Search Tree requires that all left descendants $\le \text{node.val} <$ all right descendants for every node in the tree.

## 2. The Subtree Fallacy & The Min/Max Interval Solution

A common pitfall is checking only that `node.left.val <= node.val && node.right.val > node.val`. This fails for trees where a right descendant in a left subtree exceeds the root (e.g. root 20, left 10, right child of 10 is 25).

*Correct Algorithm:* Pass valid ranges $(min, max)$ downward during recursive traversal, verifying that every node obeys the global bounds established by all ancestors.

## Implementación en producción

```java
public class ValidateBST {
    public static class TreeNode {
        public int val;
        public TreeNode left, right;
        public TreeNode(int v) { this.val = v; }
    }

    public static boolean checkBST(TreeNode root) {
        return checkBST(root, null, null);
    }

    private static boolean checkBST(TreeNode node, Integer min, Integer max) {
        if (node == null) return true;

        // If node violates min or max boundary
        if ((min != null && node.val <= min) || (max != null && node.val > max)) {
            return false;
        }

        // Left children must be <= node.val; Right children must be > node.val
        return checkBST(node.left, min, node.val) && checkBST(node.right, node.val, max);
    }
}
```

## Análisis de complejidad y memoria

| Métrica | Complejidad | Detalle técnico |
|---|---|---|
| Time Complexity | `O(N)` | Every node visited exactly once. |
| Auxiliary Space | `O(log N) to O(N)` | Call stack depth bounded by tree height. |

## Discusión de ingeniería de sistemas en el mundo real

Database index page verification utilities (`amcheck` in PostgreSQL) run min/max range scans to detect B-Tree pointer corruption caused by storage hardware bit rot.

## Casos límite y robustez en producción

1. Integer.MIN_VALUE / Integer.MAX_VALUE nodes: Handled using `Integer` objects rather than primitive sentinel values.
2. Duplicate values: Obey strict book convention (`left <= root < right`).
