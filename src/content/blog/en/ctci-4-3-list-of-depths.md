---
title: "List of Depths: One Linked List per Tree Level (Java)"
description: "CTCI-style problem 4.3 for beginners: turn a binary tree into a list of linked lists, one list per depth. BFS level-order first, optional DFS with a depth index, in plain Java."
date: "2025-10-19"
tags: [Algorithms]
coverImage: /assets/images/ctci-4-3-list-of-depths.webp
previewImage: /assets/images/ctci-4-3-list-of-depths.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 4.3 for beginners: turn a binary tree into a list of linked lists, one list per depth. BFS level-order first, optional DFS with a depth index, in plain Java.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A building has floors. Everyone on floor 0 is one group. Everyone on floor 1 is another group. Same idea for a binary tree: **depth 0** is the root alone, **depth 1** is the root's children, and so on. The job is not to walk the tree randomly. It is to produce one list of nodes for each depth, so you can hand a caller "everyone on this level" without re-walking the tree.

This post is original teaching for beginners in **Java**. Same problem family as classic level-order interview questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide).

---

## 1. Everyday analogy

Picture an office building with a single elevator shaft of people arranged like a tree:

* Floor 0: the CEO (root).
* Floor 1: the two direct reports.
* Floor 2: their reports, and so on.

HR wants a **clipboard per floor**: a linked list of everyone standing on that floor, left to right if you scan the building by levels.

You can:

1. **Walk floor by floor** with a queue of people waiting on the current floor (BFS). Process everyone on floor k, write them onto clipboard k, then enqueue their kids for floor k+1.
2. **Visit people one by one** and hand each a sticky note with their floor number (DFS). When you meet someone on floor d, append them to clipboard d. If clipboard d does not exist yet, create it.

Both end with the same shape: a list of lists, index = depth.

---

## 2. Plain problem statement

**Input:** the root of a binary tree (or `null` for an empty tree).

**Output:** a list of linked lists of nodes. Entry `i` holds every node at depth `i`, typically left-to-right within that level when you use BFS.

If the tree has height H (number of edges on the longest root-to-leaf path), you get H+1 lists (depths 0 through H). An empty tree yields an empty outer list.

**Node shape we use:**

```java
class TreeNode {
    int data;
    TreeNode left;
    TreeNode right;

    TreeNode(int data) {
        this.data = data;
    }
}
```

**Example:**

```
        4
       / \
      2   6
     / \   \
    1   3   7
```

Expected (values shown; lists hold node objects):

| Depth | List (left to right) |
| --- | --- |
| 0 | 4 |
| 1 | 2 → 6 |
| 2 | 1 → 3 → 7 |

**Clarify before coding:**

* Linked lists of **node references**, or copies of values? (References to the tree nodes, unless the interviewer says otherwise.)
* Order within a level? (Usually left-to-right. BFS gives that for free.)
* May we use `java.util.LinkedList` / `ArrayList`? (Yes for this series.)
* Empty tree and single-node tree?

---

## 3. Think first

### Approach A: BFS level-order (primary)

This is the natural fit. Level-order traversal already groups nodes by depth.

1. If `root` is `null`, return an empty result.
2. Put the root in a queue.
3. While the queue is not empty:
   * Note `levelSize = queue.size()` (how many nodes are on this depth right now).
   * Create a new linked list for this depth.
   * Repeat `levelSize` times: dequeue a node, append it to the level list, enqueue its left and right children if present.
   * Add the level list to the result.

Why `levelSize`? Without it you cannot tell where one depth ends and the next begins, because the queue also holds the next level's children.

### Approach B: DFS with depth (optional)

Recurse with `(node, depth)`:

1. Maintain an outer `List<LinkedList<TreeNode>>`.
2. When you visit a node at depth `d`, if `result.size() == d`, append a new empty linked list (you are the first visitor of this depth).
3. Append the node to `result.get(d)`.
4. Recurse left with `d + 1`, then right with `d + 1`.

Visit order is preorder (root, left, right). Within a level, left-to-right still holds if you always go left before right, because earlier depths finish their left subtrees before right siblings at the same depth fill in.

DFS is useful when you already think in recursion, or when you want to avoid an explicit queue. BFS is usually clearer for "one list per level" interviews.

### What not to do

* Build one giant list of all nodes, then try to split by depth later without storing depth. You lost the grouping.
* Mutate the tree's `left`/`right` pointers to form the lists. The problem wants **new** lists of nodes, not a destroyed tree (unless asked).

---

## 4. Java solution

### BFS (primary)

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

class ListOfDepths {
    public static List<LinkedList<TreeNode>> createLevelLists(TreeNode root) {
        List<LinkedList<TreeNode>> result = new ArrayList<>();
        if (root == null) {
            return result;
        }

        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);

        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            LinkedList<TreeNode> level = new LinkedList<>();

            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.remove();
                level.add(node);
                if (node.left != null) {
                    queue.add(node.left);
                }
                if (node.right != null) {
                    queue.add(node.right);
                }
            }

            result.add(level);
        }

        return result;
    }
}
```

Walkthrough on the sample tree:

| Step | Queue before level | levelSize | Level list built | Enqueued children |
| --- | --- | --- | --- | --- |
| 1 | [4] | 1 | 4 | 2, 6 |
| 2 | [2, 6] | 2 | 2 → 6 | 1, 3, then 7 |
| 3 | [1, 3, 7] | 3 | 1 → 3 → 7 | (none) |
| 4 | empty | stop | | |

Result size is 3. Depths 0, 1, 2.

### DFS (optional)

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

class ListOfDepthsDfs {
    public static List<LinkedList<TreeNode>> createLevelLists(TreeNode root) {
        List<LinkedList<TreeNode>> result = new ArrayList<>();
        createLevelLists(root, 0, result);
        return result;
    }

    private static void createLevelLists(
            TreeNode node,
            int depth,
            List<LinkedList<TreeNode>> result) {
        if (node == null) {
            return;
        }

        if (result.size() == depth) {
            result.add(new LinkedList<TreeNode>());
        }

        result.get(depth).add(node);
        createLevelLists(node.left, depth + 1, result);
        createLevelLists(node.right, depth + 1, result);
    }
}
```

Same sample, preorder visit order for appends: 4, then 2, 1, 3, then 6, 7. After all visits:

* depth 0: [4]
* depth 1: [2, 6]
* depth 2: [1, 3, 7]

Same grouping as BFS.

---

## 5. Complexity table

| Approach | Time | Extra space (beyond output) |
| --- | --- | --- |
| BFS level-order | O(N) | O(W) queue, W = max width of the tree |
| DFS recursion | O(N) | O(H) call stack, H = height |

N is the number of nodes. You always touch every node once and append it once, so time is linear.

Output space is O(N) either way: every node appears in exactly one inner list. That is required by the problem, not optional overhead.

For a complete tree, max width is about N/2 on the bottom level, so the BFS queue can be Θ(N). For a skinny tree (one child always), the queue stays small and the DFS stack is Θ(N).

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty tree** (`root == null`) → empty outer list, not a list containing one empty list.
* **Single node** → one list with that node only.
* **Unbalanced tree** → deepest side still gets its own deeper lists; missing siblings simply never appear.
* **Skewed left or right** → still one list per existing depth; list sizes are 1 for every depth.
* **Duplicate values** → lists hold node references, so two nodes with `data == 5` are distinct entries.

Common mistakes:

1. **Forgetting `levelSize` in BFS.** You then mix depths in one pass or need a sentinel/null marker hack.
2. **Enqueueing null children** without checks, then later NPE when you process them as real nodes.
3. **Using depth as array index without growing the outer list in DFS.** First time you see depth d, you must create the list.
4. **Returning values instead of nodes** when the signature asked for nodes (or the reverse).
5. **Rewiring `left`/`right` into a linked list** and breaking the original tree.
6. **Off-by-one on "depth vs height".** Depth of root is 0. Number of lists is height + 1 for a non-empty tree.

Minimal usage sketch:

```java
TreeNode root = new TreeNode(4);
root.left = new TreeNode(2);
root.right = new TreeNode(6);
// ... attach 1, 3, 7

List<LinkedList<TreeNode>> levels = ListOfDepths.createLevelLists(root);
// levels.get(0) is 4
// levels.get(1) is 2 → 6
// levels.get(2) is 1 → 3 → 7
```

---

## 7. Explain to a friend recap

List of Depths is "group tree nodes by floor number":

1. **BFS:** process the queue in level-sized batches. Each batch becomes one linked list. Children wait for the next batch.
2. **DFS:** pass depth down the recursion. Append each node to `lists.get(depth)`. Create the list when you first reach that depth.
3. Empty tree → no lists. Root only → one list of one node.
4. Time O(N). Extra space is the queue width or the recursion height, plus the output lists themselves.

If you can draw the office floors, write the BFS `levelSize` loop without looking it up, and name one edge case (null root), you own problem 4.3.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Minimal Tree](/blog/en/ctci-4-2-minimal-tree)
* Next: [Check Balanced](/blog/en/ctci-4-4-check-balanced)