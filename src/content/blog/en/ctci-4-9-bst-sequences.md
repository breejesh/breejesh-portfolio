---
title: "BST Sequences: Generating All Array Permutations That Create a Given BST (CTCI 4.9)"
description: "Reconstruct all possible array insertion sequences that yield a specific binary search tree using recursive subtree weaving in exponential time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-9-bst-sequences.webp
previewImage: /assets/images/ctci-4-9-bst-sequences.webp
---

> **TL;DR**
> * **The Book Problem:** A binary search tree was created by traversing through an array from left to right and inserting each element. Given a binary search tree with distinct elements, print all possible arrays that could have led to this tree.
> * **The Optimal Solution:** The root of any subtree must always appear before its children. Recursively retrieve all sequences from the left subtree and all sequences from the right subtree. Then, **weave** every left sequence with every right sequence (preserving their internal relative order), prepending the root node to every woven combination.
> * **Production Reality:** Database transaction permutation fuzzing, distributed consensus state machine replay analysis, and property-based test generation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.9), we are asked:

*"A binary search tree was created by traversing through an array from left to right and inserting each element. Given a binary search tree with distinct elements, print all possible arrays that could have led to this tree."*

**Example:**
* Input Tree: Root `2`, Left child `1`, Right child `3`
* Output: `[2, 1, 3]`, `[2, 3, 1]`

## 2. The Algorithmic Weaving Mechanism

For any node in the BST:
1. The `root` must be inserted before any of its descendants.
2. Left subtree nodes can be interleaved with right subtree nodes in any order, provided the relative order within the left subtree and the relative order within the right subtree are strictly preserved.
3. We implement a helper function `weaveLists(first, second, results, prefix)`:
   * Remove the head from `first`, append to `prefix`, and recurse.
   * Backtrack (restore head to `first` and remove from `prefix`).
   * Remove the head from `second`, append to `prefix`, and recurse.
   * Backtrack.
   * If either list is empty, append the remaining elements to `prefix` and add to `results`.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class BSTSequences {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Generates all insertion sequences that produce the given BST.
     */
    public static List<LinkedList<Integer>> allSequences(TreeNode node) {
        List<LinkedList<Integer>> result = new ArrayList<>();

        if (node == null) {
            result.add(new LinkedList<>());
            return result;
        }

        LinkedList<Integer> prefix = new LinkedList<>();
        prefix.add(node.val);

        // Recurse on left and right subtrees
        List<LinkedList<Integer>> leftSeq = allSequences(node.left);
        List<LinkedList<Integer>> rightSeq = allSequences(node.right);

        // Weave together each list from the left and right sides
        for (LinkedList<Integer> left : leftSeq) {
            for (LinkedList<Integer> right : rightSeq) {
                List<LinkedList<Integer>> weaved = new ArrayList<>();
                weaveLists(left, right, weaved, prefix);
                result.addAll(weaved);
            }
        }

        return result;
    }

    private static void weaveLists(LinkedList<Integer> first, LinkedList<Integer> second,
                                   List<LinkedList<Integer>> results, LinkedList<Integer> prefix) {
        // One list is empty -> add remainder to a cloned prefix and store result
        if (first.isEmpty() || second.isEmpty()) {
            LinkedList<Integer> result = (LinkedList<Integer>) prefix.clone();
            result.addAll(first);
            result.addAll(second);
            results.add(result);
            return;
        }

        // Recurse with head of first added to prefix
        int headFirst = first.removeFirst();
        prefix.addLast(headFirst);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        first.addFirst(headFirst);

        // Recurse with head of second added to prefix
        int headSecond = second.removeFirst();
        prefix.addLast(headSecond);
        weaveLists(first, second, results, prefix);
        prefix.removeLast();
        second.addFirst(headSecond);
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | $O(2^N \text{ to } N!)$ | Combinatorial output size depends on the shape of the tree (exponential in branching). |
| Auxiliary Space | $O(N \times K)$ | Memory proportional to storing all $K$ valid sequence permutations of length $N$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Concurrency Fuzzing & Replay

1. **Distributed System State Machine Fuzzing (Jepsen / Chaos Engineering):** Generates all topologically valid concurrent event sequences to detect race conditions in consensus logs (Raft/Paxos).
2. **Database Transaction Serializability Auditing:** Simulates valid interleavings of read/write operations.

## Edge Cases & Production Hardening

1. **Null tree:** Returns list containing a single empty list `[[]]`.
2. **Single node tree:** Returns list containing `[[node.val]]`.
3. **Linear tree (all left or all right):** Exactly 1 sequence permutation produced.
