---
title: "Paths with Sum: Counting Downward Tree Paths with Target Sum (CTCI 4.12)"
description: "Design an algorithm to count the number of downward paths in a binary tree that sum to a target value using prefix sums and a hash table in O(N) time and O(log N) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-12-paths-with-sum.webp
previewImage: /assets/images/ctci-4-12-paths-with-sum.webp
---

> **TL;DR**
> * **The Book Problem:** You are given a binary tree in which each node contains an integer value (which might be positive or negative). Design an algorithm to count the number of paths that sum to a given value. The path does not need to start or end at the root or a leaf, but it must go downwards.
> * **The Optimal Solution:** Use **Prefix Sums with a Hash Map**: Maintain a running cumulative sum `runningSum` along the current path from the root. The number of subpaths ending at the current node that sum to `targetSum` equals the count of earlier ancestors with prefix sum `runningSum - targetSum`. Store frequencies in a `HashMap<Integer, Integer>`, incrementing on entry and decrementing (backtracking) on exit in $O(N)$ time and $O(H)$ space.
> * **Production Reality:** Financial trade journal subsegment profit tracking, network packet stream bandwidth window aggregation, and audio waveform amplitude thresholding.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 4.12), we are asked:

*"You are given a binary tree in which each node contains an integer value (which might be positive or negative). Design an algorithm to count the number of paths that sum to a given value. The path does not need to start or end at the root or a leaf, but it must go downwards (traveling only from parent nodes to child nodes)."*

## 2. Why Naive Path-Counting Takes $O(N \log N)$ to $O(N^2)$

A naive approach visits every node and recursively searches for downward paths starting at that node:
* At depth $d$, each node is touched by $d$ ancestor recursive calls.
* Total time: $O(N \log N)$ for balanced trees and $O(N^2)$ for linear trees.

## 3. The Optimal Prefix Sum Algorithm

A contiguous subpath from ancestor $A$ to node $B$ has sum:
$$\text{PathSum}(A \to B) = \text{RunningSum}(B) - \text{RunningSum}(\text{parent}(A))$$

Rearranging for the target condition $\text{PathSum} = \text{targetSum}$:
$$\text{RunningSum}(\text{parent}(A)) = \text{RunningSum}(B) - \text{targetSum}$$

**Algorithm:**
1. Traverse down the tree maintaining `runningSum`.
2. Look up `runningSum - targetSum` in a `HashMap<Integer, Integer> pathCount`.
3. Add the count of matching ancestor prefix sums to total paths.
4. Add current `runningSum` to the hash table.
5. Recurse into left and right children.
6. **Backtrack:** Decrement the count of `runningSum` in the hash table before returning to the parent.

## Production Implementation

```java
import java.util.HashMap;

public class PathsWithSum {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * Counts downward paths summing to targetSum.
     * Time Complexity: O(N)
     * Space Complexity: O(log N) on balanced trees, O(N) worst-case.
     */
    public static int countPathsWithSum(TreeNode root, int targetSum) {
        return countPathsWithSum(root, targetSum, 0, new HashMap<Integer, Integer>());
    }

    private static int countPathsWithSum(TreeNode node, int targetSum, int runningSum,
                                         HashMap<Integer, Integer> pathCount) {
        if (node == null) return 0;

        runningSum += node.val;
        int sum = runningSum - targetSum;
        int totalPaths = pathCount.getOrDefault(sum, 0);

        // If runningSum equals targetSum itself, an additional path starts from root
        if (runningSum == targetSum) {
            totalPaths++;
        }

        // Increment pathCount with current runningSum
        incrementHashTable(pathCount, runningSum, 1);

        // Count paths in left and right subtrees
        totalPaths += countPathsWithSum(node.left, targetSum, runningSum, pathCount);
        totalPaths += countPathsWithSum(node.right, targetSum, runningSum, pathCount);

        // Backtrack: Remove runningSum to avoid leaking into sibling subtrees
        incrementHashTable(pathCount, runningSum, -1);

        return totalPaths;
    }

    private static void incrementHashTable(HashMap<Integer, Integer> hashTable, int key, int delta) {
        int newCount = hashTable.getOrDefault(key, 0) + delta;
        if (newCount == 0) {
            hashTable.remove(key); // Free hash slot
        } else {
            hashTable.put(key, newCount);
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Each node is visited exactly once with $O(1)$ average hash table operations. |
| Auxiliary Space | `O(log N) to O(N)` | Hash map and recursion stack contain at most $H$ entries (current root-to-leaf path). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Continuous Range Sum Evaluation

1. **Financial Transaction Stream Subsegment Analysis:** Identifying contiguous trade intervals that sum to an exact target loss or gain.
2. **Network Packet Buffer Window Analysis:** Locating contiguous sequence ranges that match target byte transfer quotas.

## Edge Cases & Production Hardening

1. **Negative values and zeros:** Supported cleanly since hash map tracks duplicate prefix frequencies.
2. **Empty tree:** Returns `0`.
3. **Paths starting at root:** Handled via `if (runningSum == targetSum) totalPaths++`.
