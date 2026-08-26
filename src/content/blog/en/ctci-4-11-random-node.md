---
title: "Random Node: Uniform Pick From a BST (Java)"
description: "CTCI-style problem 4.11 for beginners: build a BST with insert, find, delete, and getRandomNode so every node is equally likely. Store subtree size on each node and walk a random index."
date: "2026-03-17"
tags: [Algorithms & Data Structures, Developer Tools]
coverImage: /assets/images/ctci-4-11-random-node.webp
previewImage: /assets/images/ctci-4-11-random-node.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 4.11 for beginners: build a BST with insert, find, delete, and getRandomNode so every node is equally likely. Store subtree size on each node and walk a random index.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You run a raffle where every person in a family tree must have the same chance of winning. You cannot dump everyone into a list every time someone asks for a winner. That would work, but it is slow and wasteful. If each person already knows how many people sit under them, you can roll one die and walk down the tree until you land on the chosen seat. That is **Random Node**.

This post is original teaching for beginners in **Java**. Same problem family as classic interview tree design, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 4, trees and graphs.

---

## 1. Everyday analogy

Picture a company org chart that is also a **binary search tree** (left keys smaller or equal, right keys larger). Each employee card shows:

* their number (the key)
* how many people are in their whole subtree, including themselves (`size`)

You need `getRandomNode()` so that if there are 10 people, each has probability 1/10.

Think of the subtree sizes as seat counts:

1. At the current person, look at how many seats are in the **left** team.
2. Pick a random seat number from `0` to `size - 1`.
3. If the seat is in the left range, walk left.
4. If it is exactly the left count, you are that person.
5. Otherwise walk right, after subtracting the left seats and the current seat.

One random number (or one per step, same idea) chooses among seats. Sizes keep the seats honest after inserts and deletes.

---

## 2. Plain problem statement

**Build** a binary search tree class from scratch with:

| Method | Meaning |
| --- | --- |
| `insert(value)` | insert into the BST |
| `find(value)` | return the node with that key, or null |
| `delete(value)` | remove one node with that key (if present) |
| `getRandomNode()` | return a node chosen **uniformly** at random among all nodes |

**Rules:**

* Every node currently in the tree must be equally likely.
* You own the node type, so you may store extra fields (this is the point).
* Empty tree: `getRandomNode` returns `null`.

**Clarify before coding:**

* Duplicates allowed? (Yes in this write-up: `<=` goes left.)
* Must delete rebalance the tree? (No. Standard BST delete is enough. Keep `size` correct.)
* Is "uniform" over nodes, not over values? (Yes. Two nodes with the same value are two seats.)

---

## 3. Think first

### Why the phrasing matters

The interviewer did not only say "return a random node from a binary tree." They said you are implementing the class **from scratch**. That is a hint: change the data structure. Add fields. Update them on insert and delete.

### Option A: copy all nodes to an array (slow)

Walk the tree, fill a list, pick `list.get(random.nextInt(list.size()))`.

* Correct and uniform.
* Time O(N) every call, space O(N).
* Fine as a first answer. Interviewers usually want better.

### Option B: keep a permanent array of nodes

Same idea, maintained on every insert/delete. Deletes from the middle of an array cost O(N). Not great.

### Option C: store `size` on each node (main solution)

Each node tracks:

```
size = 1 + size(left) + size(right)
```

On **insert**, bump `size` on every ancestor you pass (or rebuild size on the way back).

On **delete**, shrink `size` the same way after the structural change.

On **getRandomNode**:

1. If root is null, return null.
2. Let `i = random.nextInt(root.size())` (range `0 .. N-1`).
3. Walk with `getIthNode(i)`:

| Condition | Action |
| --- | --- |
| `i < leftSize` | go left with the same `i` |
| `i == leftSize` | return this node |
| `i > leftSize` | go right with `i - leftSize - 1` |

Why `- leftSize - 1` on the right? You skip the entire left subtree **and** the current node, so the right subtree sees indices renumbered from 0.

This is the same as "pick the i-th node in in-order," but you never build the list.

### Option D: re-roll random at every level

At each node, pick a fresh index in `0 .. size-1` and branch. Also uniform. More random calls. The single-index walk is cleaner and enough for interviews.

### What not to do

* Pick left/right/self with fixed 1/3 probabilities (skewed trees break uniformity).
* Use only root size and ignore left sizes (cannot walk fairly).
* Forget to update `size` on insert or delete (later random picks bias toward wrong branches).

---

## 4. Java solution

```java
import java.util.Random;

class TreeNode {
    int data;
    TreeNode left;
    TreeNode right;
    int size; // nodes in this subtree, including this

    TreeNode(int d) {
        data = d;
        size = 1;
    }

    /** Insert value into this BST subtree. Call on root from Tree. */
    void insertInOrder(int d) {
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
        size++; // this subtree grew by one
    }

    TreeNode find(int d) {
        if (d == data) {
            return this;
        } else if (d < data) {
            return left != null ? left.find(d) : null;
        } else {
            return right != null ? right.find(d) : null;
        }
    }

    /**
     * Return the node at in-order index i (0-based) in this subtree.
     * leftSize seats are on the left, then this node, then the right.
     */
    TreeNode getIthNode(int i) {
        int leftSize = left == null ? 0 : left.size;
        if (i < leftSize) {
            return left.getIthNode(i);
        } else if (i == leftSize) {
            return this;
        } else {
            // skip left subtree and this node
            return right.getIthNode(i - leftSize - 1);
        }
    }

    void refreshSize() {
        int ls = left == null ? 0 : left.size;
        int rs = right == null ? 0 : right.size;
        size = 1 + ls + rs;
    }
}

class Tree {
    private TreeNode root;
    private final Random random = new Random();

    int size() {
        return root == null ? 0 : root.size;
    }

    void insert(int value) {
        if (root == null) {
            root = new TreeNode(value);
        } else {
            root.insertInOrder(value);
        }
    }

    TreeNode find(int value) {
        return root == null ? null : root.find(value);
    }

    TreeNode getRandomNode() {
        if (root == null) {
            return null;
        }
        int i = random.nextInt(size()); // 0 .. N-1
        return root.getIthNode(i);
    }

    /** Delete one occurrence of value. Returns true if something was removed. */
    boolean delete(int value) {
        if (root == null) {
            return false;
        }
        int before = size();
        root = deleteNode(root, value);
        return size() < before;
    }

    private TreeNode deleteNode(TreeNode node, int value) {
        if (node == null) {
            return null;
        }
        if (value < node.data) {
            node.left = deleteNode(node.left, value);
        } else if (value > node.data) {
            node.right = deleteNode(node.right, value);
        } else {
            // found: standard BST delete
            if (node.left == null) {
                return node.right;
            }
            if (node.right == null) {
                return node.left;
            }
            // two children: copy in-order successor, then remove it from the right
            TreeNode succ = minNode(node.right);
            node.data = succ.data;
            node.right = deleteNode(node.right, succ.data);
        }
        node.refreshSize();
        return node;
    }

    private TreeNode minNode(TreeNode node) {
        while (node.left != null) {
            node = node.left;
        }
        return node;
    }
}
```

**Walkthrough** (insert 20, 10, 30, 5, 15):

```
        20 (size 5)
       /  \
   10 (3)  30 (1)
   /  \
5(1) 15(1)
```

* Random `i = 0` → left of 20 has size 3, `0 < 3` → go left to 10 → left of 10 has size 1, `0 < 1` → go left to 5 → left size 0, `0 == 0` → return **5**.
* Random `i = 2` → at 20, leftSize 3, `2 < 3` → at 10, leftSize 1, `2 == 1`? no, `2 > 1` → right with `2 - 1 - 1 = 0` → at 15, leftSize 0, `0 == 0` → return **15**.
* Random `i = 3` → at 20, leftSize 3, `3 == 3` → return **20**.
* Random `i = 4` → at 20, go right with `4 - 3 - 1 = 0` → return **30**.

Each of the five nodes maps to exactly one index. Uniform.

Why not pick left with probability `leftSize / size`, self with `1 / size`, right with `rightSize / size`? You can. That is the multi-roll version. Single index is the same math with one random draw at the top.

---

## 5. Complexity table

| Operation | Time (balanced) | Time (worst, skewed) | Notes |
| --- | --- | --- | --- |
| `insert` | O(log N) | O(N) | height walk + size++ on path |
| `find` | O(log N) | O(N) | normal BST search |
| `delete` | O(log N) | O(N) | BST delete + recompute size on path |
| `getRandomNode` | O(log N) | O(N) | one random int + height walk |
| Array copy each time | O(N) | O(N) | always full walk |

Space is O(N) for the tree itself. The `size` field is O(1) per node. No extra O(N) buffer for random picks.

Runtime is best described as **O(D)** where D is tree depth. Balanced trees give O(log N). A sorted insert order without balancing still works, just slower walks.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty tree** → `getRandomNode` returns `null`. Do not call `nextInt(0)`.
* **Single node** → only index 0, always that node.
* **All inserts on one side** → still uniform if sizes are correct; just deeper walks.
* **Duplicates** → each node is its own seat. Sizes count nodes, not distinct keys.
* **Delete root / delete leaf / delete with two children** → structure changes, then sizes must match the new shape.

Common mistakes:

1. **Probabilities 1/3 / 1/3 / 1/3** for left, self, right. Unbalanced trees over-pick small sides.
2. **Forgetting `size++` on the path up insert.** Root size lies; random walks go to empty children.
3. **Not fixing sizes after delete.** Same bias, worse over time.
4. **Using `i - leftSize` without the extra `-1` when going right.** Off-by-one: you forget that the current node also consumed an index.
5. **Assuming values are unique when counting.** Uniformity is over **nodes**.
6. **Building a full list "just to be safe" after you already have sizes.** That throws away the O(D) win.

Minimal usage sketch:

```java
Tree tree = new Tree();
tree.insert(20);
tree.insert(10);
tree.insert(30);
TreeNode r = tree.getRandomNode(); // one of 20, 10, 30 with equal chance
tree.delete(10);
TreeNode f = tree.find(30);
```

---

## 7. Explain to a friend recap

Random Node is a tree design problem, not only a "pick random" one-liner:

1. You own the BST class, so store **`size`** on every node: count of nodes in that subtree.
2. Keep sizes honest on **insert** and **delete**.
3. `getRandomNode` picks an index `i` from `0` to `N - 1`, then walks: left if `i` is in the left count, current if equal to left count, right with `i` adjusted otherwise.
4. That walk is "find the i-th in-order node" without building an array.
5. Time follows tree height. Space is one int per node.

If you can draw a small tree with sizes, map indices 0..N-1 to nodes, and explain why right uses `i - leftSize - 1`, you own problem 4.11.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Check Subtree](/blog/en/ctci-4-10-check-subtree)
* Next: [Paths with Sum](/blog/en/ctci-4-12-paths-with-sum)