---
title: "Check Subtree: Determining If a Binary Tree Is a Subtree of Another (CTCI 4.10)"
description: "Design an algorithm to determine if large binary tree T2 is a subtree of huge binary tree T1 using tree search matching in O(N + kM) time and O(log N) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-10-check-subtree.webp
previewImage: /assets/images/ctci-4-10-check-subtree.webp
---

> **TL;DR**
> * **The Book Problem:** $T_1$ and $T_2$ are two very large binary trees, with $T_1$ much bigger than $T_2$. Create an algorithm to determine if $T_2$ is a subtree of $T_1$. A tree $T_2$ is a subtree of $T_1$ if there exists a node $n$ in $T_1$ such that the subtree of $n$ is identical to $T_2$.
> * **The Optimal Solution:** Use **Tree Search Matching**: Scan $T_1$ for nodes whose value matches $T_2$'s root. For each candidate node, invoke `matchTree(n1, n2)` which compares structure and values simultaneously. If $T_2$ is not a match, continue searching $T_1$, achieving $O(N + kM)$ time ($O(N)$ average) and $O(\log N + \log M)$ space without massive string serializations.
> * **Production Reality:** Abstract Syntax Tree (AST) code linting pattern matchers (ESLint / Semgrep), DOM node fragment matching, and compiler optimization subexpression tree matching.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.10), we are asked:

*"T1 and T2 are two very large binary trees, with T1 much bigger than T2. Create an algorithm to determine if T2 is a subtree of T1. A tree T2 is a subtree of T1 if there exists a node n in T1 such that the subtree of n is identical to T2. That is, if you cut off the tree at node n, the two trees would be identical."*

## 2. Comparison of Approaches

### Approach 1: Pre-Order Traversal String Serialization
Serialize both trees into strings including `X` for `null` nodes, then run substring matching (KMP / Rabin-Karp):
* *Pros:* $O(N + M)$ time.
* *Cons:* Requires $O(N + M)$ memory allocation up front, which can easily trigger `OutOfMemoryError` on massive trees (millions of nodes).

### Approach 2: Tree Search Matching (Book Optimal Solution)
Traverse $T_1$. Whenever `t1.val == t2.val`, run `matchTree(t1, t2)`:
* *Memory:* $O(\log N + \log M)$ auxiliary stack space.
* *Time:* Most comparisons fail at the root of $T_2$ within $O(1)$ steps, yielding $O(N)$ expected runtime.

## Production Implementation

```java
public class CheckSubtree {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Checks if t2 is a subtree of t1.
     * Time Complexity: O(N + kM) where k is the number of occurrences of t2.val in t1.
     * Space Complexity: O(log N + log M) stack space.
     */
    public static boolean containsTree(TreeNode t1, TreeNode t2) {
        // An empty tree is always a subtree
        if (t2 == null) return true;
        return subTree(t1, t2);
    }

    private static boolean subTree(TreeNode r1, TreeNode r2) {
        if (r1 == null) {
            return false; // Big tree empty & subtree still not found
        } else if (r1.val == r2.val && matchTree(r1, r2)) {
            return true;
        }
        return subTree(r1.left, r2) || subTree(r1.right, r2);
    }

    private static boolean matchTree(TreeNode r1, TreeNode r2) {
        if (r1 == null && r2 == null) {
            return true; // Nothing left in either subtree
        } else if (r1 == null || r2 == null) {
            return false; // Exactly one tree is empty
        } else if (r1.val != r2.val) {
            return false; // Value mismatch
        } else {
            return matchTree(r1.left, r2.left) && matchTree(r1.right, r2.right);
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N + kM)` | $N$ nodes in $T_1$, $M$ nodes in $T_2$, and $k$ matching candidate roots. |
| Auxiliary Space | `O(log N + log M)` | Maximum call stack depth on balanced trees. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Code Pattern Analyzers

1. **Static Analysis AST Matchers (Semgrep / CodeQL):** Code search engines match AST structural subtrees against security vulnerability patterns.
2. **Compiler Optimization Subexpression Folding (LLVM):** Detects identical sub-DAG expressions to eliminate common subexpressions.

## Edge Cases & Production Hardening

1. **$T_2$ is null:** Returns `true` (empty tree is a valid subtree of anything).
2. **$T_1$ is null ($T_2$ non-null):** Returns `false`.
3. **Repeated root values:** `subTree` continues searching both branches if initial `matchTree` fails.
