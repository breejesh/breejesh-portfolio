---
title: "Random Node: Binary Tree Random Node Selection with Equal Probability (CTCI 4.11)"
description: "Design and implement a binary tree class with insert, find, delete, and getRandomNode() ensuring uniform probability in O(log N) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-11-random-node.webp
previewImage: /assets/images/ctci-4-11-random-node.webp
---

> **TL;DR**
> * **The Book Problem:** You are implementing a binary tree class from scratch which, in addition to `insert`, `find`, and `delete`, has a method `getRandomNode()` which returns a random node from the tree. All nodes should be equally likely to be chosen. Design and implement `getRandomNode`.
> * **The Optimal Solution:** Store subtree `size` in each `TreeNode`. In `getRandomNode()`, generate random index $d \in [0, \text{size}-1]$. If $d < \text{left.size}$, recurse left with $d$. If $d == \text{left.size}$, return the current node. Otherwise, recurse right with $d - (\text{left.size} + 1)$ in $O(\log N)$ time (for balanced trees) and $O(1)$ auxiliary space.
> * **Production Reality:** Randomized Treap balancing, Monte Carlo tree search (MCTS) path selection in reinforcement learning, and database query index sampling.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.11), we are asked:

*"You are implementing a binary tree class from scratch which, in addition to insert, find, and delete, has a method getRandomNode() which returns a random node from the tree. All nodes should be equally likely to be chosen. Design and implement an algorithm for getRandomNode, and explain how you would implement the rest of the methods."*

## 2. Mathematical Probability & Subtree Sizing

Why does picking 1/3 for (left, current, right) fail?
* If the left subtree has 100 nodes and the right has 1 node, picking left 1/3 of the time gives each left node a probability of $\frac{1}{3} \times \frac{1}{100} = \frac{1}{300}$, while the single right node has probability $\frac{1}{3}$. This is non-uniform!

**Uniform Probability Requirement:**
For any tree of $N$ nodes, every node must be selected with exact probability $1/N$:
* Probability of current node = $\frac{1}{N}$.
* Probability of left subtree = $\frac{left.size}{N}$.
* Probability of right subtree = $\frac{right.size}{N}$.

## Production Implementation

```java
import java.util.Random;

public class RandomNodeTree {
    public static class TreeNode {
        private int data;
        public TreeNode left;
        public TreeNode right;
        private int size = 0;

        public TreeNode(int d) {
            data = d;
            size = 1;
        }

        public int data() { return data; }
        public int size() { return size; }

        public TreeNode getRandomNode() {
            int leftSize = left == null ? 0 : left.size();
            Random random = new Random();
            int index = random.nextInt(size);

            if (index < leftSize) {
                return left.getRandomNode();
            } else if (index == leftSize) {
                return this;
            } else {
                return right.getRandomNode();
            }
        }

        public void insertInOrder(int d) {
            if (d <= data) {
                if (left == null) {
                    left = new TreeNode(d);
                } else {
                    left.insertInOrder(d);
                }
            } else {
                if (right == null) {
                    right = new TreeNode(d);
                } else {
                    right.insertInOrder(d);
                }
            }
            size++;
        }

        public TreeNode find(int d) {
            if (d == data) {
                return this;
            } else if (d <= data) {
                return left != null ? left.find(d) : null;
            } else {
                return right != null ? right.find(d) : null;
            }
        }
    }

    public static class Tree {
        private TreeNode root = null;

        public int size() {
            return root == null ? 0 : root.size();
        }

        public TreeNode getRandomNode() {
            if (root == null) return null;
            Random random = new Random();
            int i = random.nextInt(size());
            return root.getIthNode(i);
        }

        public void insertInOrder(int value) {
            if (root == null) {
                root = new TreeNode(value);
            } else {
                root.insertInOrder(value);
            }
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| getRandomNode Time | `O(log N)` | Bounded by tree depth $D$ on balanced trees ($O(N)$ worst-case for skewed). |
| insert / find / delete Time | `O(log N)` | Traverses single root-to-leaf path while maintaining `size` counters. |
| Auxiliary Space | `O(1)` | Iterative or tail-call stack overhead. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Randomized Tree Structures

1. **Treaps & Randomized Search Trees:** Use random priority keys to ensure self-balancing properties without complex multi-case tree rotations.
2. **Database Query Optimizer Statistics (PostgreSQL / MySQL `ANALYZE`):** Uses reservoir sampling over B-Trees to estimate distribution histograms without full table scans.

## Edge Cases & Production Hardening

1. **Single Random Call per Invocation:** Fast $O(1)$ random generator seed reuse.
2. **Empty tree:** Returns `null` cleanly without `IllegalArgumentException`.
3. **Deletions:** Must decrement `size` along the ancestor path of the removed node.
