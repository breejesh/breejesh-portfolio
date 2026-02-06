---
title: "Minimal Tree: Build a Balanced BST from a Sorted Array (Java)"
description: "CTCI-style problem 4.2 for beginners: given a sorted array of unique ints, build a binary search tree of minimal height. Pick the mid as root, recurse on left and right halves."
date: "2026-02-06"
tags: [Algorithms]
coverImage: /assets/images/ctci-4-2-minimal-tree.webp
previewImage: /assets/images/ctci-4-2-minimal-tree.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 4.2 for beginners: given a sorted array of unique ints, build a binary search tree of minimal height. Pick the mid as root, recurse on left and right halves.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A sorted line of unique numbers is already half a binary search tree. The only question is *which* value becomes the root so the tree stays short. If you always insert from left to right into an empty BST, you get a long stick of height N. Pick the middle of the array as the root, then do the same trick on each half, and the height drops to about log2(N).

This post is original teaching for beginners in **Java**. Same problem family as classic interview BST construction, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 4 continues here after graphs open the chapter.

---

## 1. Balanced bookshelf analogy

Imagine a sorted shelf of books numbered 1 through 7:

`[1, 2, 3, 4, 5, 6, 7]`

You want a **binary search tree**: left child always holds smaller values, right child holds larger ones. You also want the tree as **short as possible** (minimal height), so searches do not walk a long spine.

If you make 1 the root and keep inserting 2, 3, 4, ... you get:

```
1
 \
  2
   \
    3
     ...
```

Height 7. Painful.

If you put **4** (the middle) at the root, left half `[1, 2, 3]` becomes the left subtree, right half `[5, 6, 7]` becomes the right. Repeat on each half: mid of left is 2, mid of right is 6. You get a bushy tree of height 3:

```
      4
     / \
    2   6
   / \ / \
  1  3 5  7
```

That pattern is the whole algorithm: **mid as root, recurse left, recurse right**.

---

## 2. Plain problem statement

**Input:** a sorted array of unique integers in increasing order. Example: `int[] arr = {1, 2, 3, 4, 5, 6, 7}`.

**Output:** the root of a binary search tree that contains every value, with **minimal possible height**.

**Node shape we use:**

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

**Rules and clarifications:**

* Values are unique (no duplicates to place on left or right).
* Array is already sorted ascending. You do not need to sort.
* Minimal height means as balanced as a BST on N unique keys can be: height is floor(log2(N)) + 1 for a full shape, or close when N is not one less than a power of two.
* You may return `null` for an empty range (empty array or empty subarray).

**Clarify in the interview**

* Is the array guaranteed sorted and unique? (Yes for this classic version.)
* Do you need parent pointers? (No for this problem.)
* Should you copy the array slices or pass index bounds? (Index bounds are cleaner and O(1) extra per call.)

---

## 3. Think first

### Naive: insert one by one from the left

Start empty, call `insert(arr[i])` for i from 0 to N-1.

* Correct BST: yes.
* Height: O(N) because sorted order always goes right.
* Time: O(N log N) if inserts rebalance, or O(N^2) for a naive BST insert on sorted input.

Mention it, then discard for the height goal.

### Better idea: choose root carefully

In a BST, the root must sit between left and right subtrees. For a **sorted** array, any index `mid` can be the root of the subarray `arr[start..end]`:

* Left subtree = BST of `arr[start..mid-1]`
* Right subtree = BST of `arr[mid+1..end]`

To minimize height, left and right should have roughly the same size. The middle index does that:

```
mid = (start + end) / 2
```

(or `start + (end - start) / 2` if you care about overflow on huge arrays).

Base case: if `start > end`, return `null`. That means this side has no nodes.

This is the same structure as binary search, but you **build a tree** instead of searching.

Why it is a valid BST: every value left of mid is smaller than `arr[mid]`, every value right is larger. Recursion preserves that on every subtree. Why height is minimal: each level roughly halves the remaining elements, so depth is O(log N).

---

## 4. Java solution

```java
public class MinimalTree {

    static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    /** Build a minimal-height BST from a sorted unique array. */
    public static TreeNode createMinimalBST(int[] arr) {
        if (arr == null || arr.length == 0) {
            return null;
        }
        return build(arr, 0, arr.length - 1);
    }

    private static TreeNode build(int[] arr, int start, int end) {
        if (start > end) {
            return null;
        }

        int mid = start + (end - start) / 2;
        TreeNode node = new TreeNode(arr[mid]);
        node.left = build(arr, start, mid - 1);
        node.right = build(arr, mid + 1, end);
        return node;
    }
}
```

Walkthrough on `{1, 2, 3, 4, 5, 6, 7}`:

| Call range | mid index | root value | left range | right range |
| --- | --- | --- | --- | --- |
| 0..6 | 3 | 4 | 0..2 | 4..6 |
| 0..2 | 1 | 2 | 0..0 | 2..2 |
| 0..0 | 0 | 1 | empty | empty |
| 2..2 | 2 | 3 | empty | empty |
| 4..6 | 5 | 6 | 4..4 | 6..6 |
| 4..4 | 4 | 5 | empty | empty |
| 6..6 | 6 | 7 | empty | empty |

Result tree (same as the bookshelf drawing):

```
      4
     / \
    2   6
   / \ / \
  1  3 5  7
```

Odd length arrays put a clean middle at the root. Even length (for example `{1, 2, 3, 4}`) can use either of the two center indices depending on integer division. Both give minimal height; trees may differ slightly in shape but not in height class.

In-order traversal of the finished tree reprints the original sorted array. That is a quick mental check after you code.

---

## 5. Complexity table

| Piece | Cost | Why |
| --- | --- | --- |
| Time | O(N) | each array index becomes exactly one node; constant work per index |
| Extra stack space | O(log N) | recursion depth equals tree height |
| Tree space | O(N) | N nodes stored |
| Naive sorted inserts | O(N^2) time, O(N) height | right spine |

You do not need extra arrays for left and right halves. Index bounds reuse the same `arr`.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty array or null** → return `null`.
* **Single element** → one node, both children null. Height 1.
* **Two elements** → one root, one child (left or right depending on mid). Height 2.
* **Even length** → either center index is fine; stick to one formula and explain it.
* **Already "almost" a tree in your head** → still write the recursive mid rule; do not hardcode shapes.

Common mistakes:

1. **Inserting sorted values left to right into an empty BST.** Correct BST, terrible height.
2. **Copying subarrays every call** (`Arrays.copyOfRange`). Works, but wastes time and memory. Prefer `start`/`end`.
3. **Off-by-one on bounds.** Left is `start..mid-1`, right is `mid+1..end`. Including `mid` again duplicates the root.
4. **Using `mid = (start + end) / 2` on huge indices.** Prefer `start + (end - start) / 2` in languages where int can overflow (same habit as binary search).
5. **Forgetting the base case `start > end`.** Infinite recursion or null pointer chaos.
6. **Building a heap-style complete tree without BST order.** Completeness alone does not give search-tree order; the mid-of-sorted-range rule does both balance and BST.

Minimal usage sketch:

```java
int[] sorted = {1, 2, 3, 4, 5, 6, 7};
TreeNode root = MinimalTree.createMinimalBST(sorted);
// root.val == 4, left subtree has 1..3, right has 5..7
```

Optional helper to check height after building:

```java
static int height(TreeNode n) {
    if (n == null) return 0;
    return 1 + Math.max(height(n.left), height(n.right));
}
// for 7 nodes, height should be 3
```

---

## 7. Explain to a friend recap

Minimal Tree is "make the shortest BST from a sorted unique array":

1. Array is already sorted. That gives BST order for free when you split around a root.
2. Pick the middle element as the root of the current range.
3. Left half builds the left child. Right half builds the right child.
4. Empty range returns `null`. One element returns a leaf.
5. Time O(N), height O(log N). Do not insert sorted keys one by one or you grow a stick.

If you can draw `{1,2,3,4,5,6,7}` into the balanced tree above and explain why mid beats "always take the first element," you own problem 4.2. Next up is walking a tree by depth.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Route Between Nodes](/blog/en/ctci-4-1-route-between-nodes)
* Next: [List of Depths](/blog/en/ctci-4-3-list-of-depths)