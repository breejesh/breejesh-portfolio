---
title: "List of Depths: Creating Linked Lists of Nodes at Each Tree Depth (CTCI 4.3)"
description: "Design an algorithm to create a linked list of all nodes at each depth of a binary tree using iterative level-order traversal in O(N) time and O(N) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-3-list-of-depths.webp
previewImage: /assets/images/ctci-4-3-list-of-depths.webp
---

> **TL;DR**
> * **The Book Problem:** Given a binary tree, design an algorithm which creates a linked list of all the nodes at each depth (e.g., if you have a tree with depth $D$, you will have $D$ linked lists).
> * **The Optimal Solution:** Use **Iterative Level-Order BFS**: Maintain `ArrayList<LinkedList<TreeNode>>`. For level $i+1$, iterate through the nodes in level $i$'s list and append their non-null left and right children into a new list, achieving $O(N)$ time and $O(N)$ space without an explicit queue data structure.
> * **Production Reality:** Hierarchical filesystem indexing, abstract syntax tree (AST) scoping layers, and UI render tree layer compositing.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.3), we are asked:

*"Given a binary tree, design an algorithm which creates a linked list of all the nodes at each depth (e.g., if you have a tree with depth D, you'll have D linked lists)."*

## 2. Algorithmic Approaches

### Approach 1: Depth-First Search (Pre-Order with Level Parameter)
Pass a `level` integer down recursive calls:
```java
void createLevelLinkedList(TreeNode root, ArrayList<LinkedList<TreeNode>> lists, int level) {
    if (root == null) return;
    LinkedList<TreeNode> list;
    if (lists.size() == level) {
        list = new LinkedList<>();
        lists.add(list);
    } else {
        list = lists.get(level);
    }
    list.add(root);
    createLevelLinkedList(root.left, lists, level + 1);
    createLevelLinkedList(root.right, lists, level + 1);
}
```

### Approach 2: Iterative Level-Order (BFS Without Queue Overhead)
Because level $i$ contains all parents of level $i+1$, we don't need a general queue:
1. Initialize `current = new LinkedList<TreeNode>()` containing `root`.
2. Add `current` to `result`.
3. While `current` is not empty:
   * Initialize `parents = current`.
   * Create new empty list `current = new LinkedList<TreeNode>()`.
   * For each node `parent` in `parents`:
     * If `parent.left != null`, add to `current`.
     * If `parent.right != null`, add to `current`.
   * If `current` is non-empty, add to `result`.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class ListOfDepths {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Creates linked lists of nodes at each depth level.
     * Time Complexity: O(N)
     * Space Complexity: O(N)
     */
    public static List<LinkedList<TreeNode>> createLevelLinkedList(TreeNode root) {
        List<LinkedList<TreeNode>> result = new ArrayList<>();
        if (root == null) return result;

        LinkedList<TreeNode> current = new LinkedList<>();
        current.add(root);

        while (!current.isEmpty()) {
            result.add(current); // Add previous level
            LinkedList<TreeNode> parents = current; // Go to next level
            current = new LinkedList<>();

            for (TreeNode parent : parents) {
                // Visit the children
                if (parent.left != null) {
                    current.add(parent.left);
                }
                if (parent.right != null) {
                    current.add(parent.right);
                }
            }
        }

        return result;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Every node in the binary tree is visited and added to a list exactly once. |
| Auxiliary Space | `O(N)` | The output list structure contains all $N$ tree nodes. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Hierarchical Layering

1. **Browser DOM Layer Compositing:** The Chromium rendering engine creates layer lists for paint-order rendering and hardware rasterization.
2. **Compiler Abstract Syntax Trees (AST):** Scoping passes group symbol declarations by lexical nesting depth.

## Edge Cases & Production Hardening

1. **Empty tree (`root == null`):** Returns empty `ArrayList`.
2. **Skewed tree (linked-list-like):** Creates $N$ lists each containing 1 node in $O(N)$ time.
3. **Complete binary tree:** The final list contains $N/2$ nodes (leaf layer).
