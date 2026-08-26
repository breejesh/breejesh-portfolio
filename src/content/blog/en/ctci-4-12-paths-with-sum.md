---
title: "Paths with Sum: Count Downward Paths That Hit a Target (Java)"
description: "CTCI-style problem 4.12 for beginners: count every path in a binary tree that sums to a target. Paths go parent to child only. Brute force from each node, then running sum plus a HashMap of prefix counts."
date: "2026-06-20"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-4-12-paths-with-sum.webp
previewImage: /assets/images/ctci-4-12-paths-with-sum.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 4.12 for beginners: count every path in a binary tree that sums to a target. Paths go parent to child only. Brute force from each node, then running sum plus a HashMap of prefix counts.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You walk down a mountain trail. Markers on each fork show a number: climb gain or drop. You want every stretch of trail where the net change equals a target, say 8. A stretch can start mid-trail, stop mid-trail, and never climb back up. That is **paths with sum** on a binary tree: only parent to child, any start, any end.

This post is original teaching for beginners in **Java**. Same problem family as classic interview tree path-sum questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 4, trees and graphs, ends here.

---

## 1. Everyday analogy

Think of a family tree of bank deposits and withdrawals. Each person has one parent above them and up to two kids below. Money on a person is that person's transaction.

A **path** here is not any social connection. It is a straight walk down the tree: grandparent to parent to child. You never hop sideways. You never climb back up.

You pick any person as the start of the walk and any descendant as the end (including the start alone). Add the values along that downward chain. If the sum equals the target, count it.

Example with target `8`:

```
        10
       /  \
      5   -3
     / \    \
    3   2   11
   / \   \
  3  -2   1
```

Three paths sum to 8:

* `5 → 3`
* `5 → 2 → 1`
* `-3 → 11`

`10 → 5` is 15, not a hit. A single node with value 8 would also count if it existed.

---

## 2. Plain problem statement

**Input:** root of a binary tree. Each node holds an `int` (positive, negative, or zero). An integer `targetSum`.

**Output:** the number of downward paths whose node values add up to `targetSum`.

**Rules:**

* Path must go **parent → child** only (down the tree).
* Path may start at any node, not only the root.
* Path may end at any node, not only a leaf.
* A single node is a valid path of length 1.
* Nodes may hold negative values, so you cannot prune early with "sum already too big".

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

**Examples:**

| Tree idea | Target | Count | Why |
| --- | --- | --- | --- |
| tree above | 8 | 3 | `5→3`, `5→2→1`, `-3→11` |
| single node `8` | 8 | 1 | the node alone |
| single node `1` | 8 | 0 | no path hits 8 |
| `null` root | anything | 0 | empty tree |
| path `1 → 2 → 3` only | 3 | 2 | `1→2`, and node `3` alone (if 3 is a node) |

**Clarify before coding:**

* Values can be negative? (Yes. That blocks simple early cutoffs.)
* Count overlapping paths separately? (Yes. Same node can sit on many counted paths.)
* Path must be contiguous downward? (Yes. No skipping a middle child.)
* Do we return the paths or only the count? (Count only for this problem.)

---

## 3. Think first

### Brute: every node is a possible start

For each node `u` in the tree, run a DFS that starts at `u` and walks only downward. Keep a running sum. Every time the running sum equals the target, increment the answer. Continue past hits, because a longer path might hit again later (negatives exist).

```
for each node u:
    dfsFrom(u, running = 0)
```

Inside `dfsFrom`:

1. If node is null, return.
2. `running += node.val`
3. If `running == target`, count++
4. Recurse left and right with the same `running`

Time: from each of N nodes you may walk O(N) descendants in a skewed tree, so O(N²) worst case. On a balanced tree the work is closer to O(N log N). Space is O(H) recursion height for the inner walk, plus another O(H) if you traverse starts with recursion too.

Fine as a first answer. Interviewers usually want the linear pass next.

### Optimized: running sum + prefix counts

On a one-dimensional array, "how many subarrays sum to target" uses a map of prefix sums. A path in a tree that only goes downward is like a subarray along one root-to-leaf spine, but paths can start mid-spine.

Define `runningSum` at a node as the sum of values from the **root of the whole tree** down to this node (the path you are currently walking in a DFS).

If some ancestor had prefix sum `S`, and the current prefix is `runningSum`, then the path from **below that ancestor** down to **here** sums to `runningSum - S`.

You want `runningSum - S == targetSum`, so `S == runningSum - targetSum`.

Keep a `HashMap<Integer, Integer>`: how many times each prefix sum has appeared on the **current root-to-here path**. At each node:

1. Look up `runningSum - targetSum` in the map. That count is how many paths **end at this node** and sum to the target.
2. Add 1 to the map entry for `runningSum`.
3. Recurse left and right.
4. **Backtrack**: subtract 1 from the map entry for `runningSum` (remove if zero). Sibling subtrees must not see this prefix.

Seed the map with `0 → 1` before the walk. That models an empty prefix above the root, so a path that starts at the root (or equals the full root-to-here sum) still matches when `runningSum == targetSum`.

One DFS visits each node once. Map work is amortized O(1) per node. That is O(N) time. Extra space is O(H) for the recursion stack and at most O(H) live keys on the current path if you clean up on backtrack (worst case O(N) on a stick tree).

---

## 4. Java solution

### Brute force (clear first pass)

```java
int countPathsBrute(TreeNode root, int targetSum) {
    if (root == null) {
        return 0;
    }
    // paths starting at root, plus paths entirely in left, plus entirely in right
    return countFrom(root, targetSum)
        + countPathsBrute(root.left, targetSum)
        + countPathsBrute(root.right, targetSum);
}

/** Paths that start at 'node' and go only downward. */
int countFrom(TreeNode node, long remaining) {
    if (node == null) {
        return 0;
    }
    int count = 0;
    if (node.val == remaining) {
        count++;
    }
    // use long remaining if you subtract; here we pass target and sum carefully:
    count += countFrom(node.left, remaining - node.val);
    count += countFrom(node.right, remaining - node.val);
    return count;
}
```

Using `remaining` (how much is still needed) is the same idea as a growing running sum. Either style is fine.

### Primary: prefix map (interview target)

```java
import java.util.HashMap;
import java.util.Map;

int countPathsWithSum(TreeNode root, int targetSum) {
    Map<Integer, Integer> prefixCounts = new HashMap<>();
    prefixCounts.put(0, 1); // empty prefix above the root
    return dfs(root, 0, targetSum, prefixCounts);
}

int dfs(TreeNode node, int runningSum, int targetSum, Map<Integer, Integer> prefixCounts) {
    if (node == null) {
        return 0;
    }

    runningSum += node.val;

    // how many prefixes make (runningSum - prefix) == targetSum?
    int pathsEndingHere = prefixCounts.getOrDefault(runningSum - targetSum, 0);

    prefixCounts.put(runningSum, prefixCounts.getOrDefault(runningSum, 0) + 1);

    int total = pathsEndingHere
        + dfs(node.left, runningSum, targetSum, prefixCounts)
        + dfs(node.right, runningSum, targetSum, prefixCounts);

    // backtrack so other branches do not see this prefix
    int c = prefixCounts.get(runningSum);
    if (c == 1) {
        prefixCounts.remove(runningSum);
    } else {
        prefixCounts.put(runningSum, c - 1);
    }

    return total;
}
```

Walkthrough for the sample tree and target `8` when DFS first reaches the left `5` (running sum from root: `10 + 5 = 15`):

| Step | runningSum | Look up `runningSum - 8` | Map idea | Paths ending here |
| --- | --- | --- | --- | --- |
| at 10 | 10 | 2 → 0 hits | put 10 | 0 |
| at 5 | 15 | 7 → 0 | put 15 | 0 |
| at left 3 | 18 | 10 → 1 (the root prefix) | path `5→3` | 1 |
| at child 3 | 21 | 13 → 0 | | 0 |
| at -2 | 16 | 8 → 0 | | 0 |
| back; at 2 | 17 | 9 → 0 | | 0 |
| at 1 | 18 | 10 → 1 | path `5→2→1` | 1 |
| right side -3 | 7 | -1 → 0 | | 0 |
| at 11 | 18 | 10 → 1 | path `-3→11` | 1 |

Total 3. The map always reflects only the ancestors on the active DFS path because of backtracking.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Brute: start DFS from every node | O(N²) worst, ~O(N log N) balanced | O(H) stack | Easy to explain first |
| Running sum + HashMap prefixes | O(N) | O(H) typical, O(N) worst stick | Preferred interview answer |
| Store all root-to-leaf lists, scan | O(N²) values copied | O(N) or worse | Heavy; avoid |

N is the number of nodes. H is tree height. The map solution wins because each node does a constant amount of map work once.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Null root** → return 0.
* **Single node equals target** → 1. Relies on the `0 → 1` seed in the map.
* **Single node not equal** → 0.
* **All negatives, positive target** → still walk everything; no early exit.
* **Zeros in the tree** → a zero can extend a path without changing the sum; multiple overlapping hits are real.
* **Target 0** → every empty-extension style hit still needs care: a path of actual nodes that sum to 0 counts; do not count a fictional empty path. With the standard map seed, a node whose running sum equals a previous prefix counts a real non-empty segment.
* **Skewed chain** → map and stack grow to O(N); still correct and linear time.
* **Same prefix sum twice on one path** (because of zeros or canceling negatives) → map stores a **count**, not a boolean. Two ancestors with the same prefix both matter.

Common mistakes:

1. **Forgetting to backtrack the map.** Then a prefix from the left subtree leaks into the right. Counts go wrong.
2. **Forgetting `prefixCounts.put(0, 1)`.** Paths that start at the root (full prefix equals target) are undercounted.
3. **Stopping when sum equals target.** Longer paths can hit again when negatives or zeros appear. Always continue DFS.
4. **Allowing parent pointers or arbitrary LCA paths.** The problem is **downward only**, not "any two nodes".
5. **Using node identity in the map instead of prefix sums.** The key is the numeric running sum.
6. **Integer overflow** on huge values. Interviews usually stick to `int`; mention `long` if values can be large.

Minimal smoke test:

```java
TreeNode root = new TreeNode(10);
root.left = new TreeNode(5);
root.right = new TreeNode(-3);
root.left.left = new TreeNode(3);
root.left.right = new TreeNode(2);
root.right.right = new TreeNode(11);
root.left.left.left = new TreeNode(3);
root.left.left.right = new TreeNode(-2);
root.left.right.right = new TreeNode(1);

System.out.println(countPathsWithSum(root, 8)); // 3
System.out.println(countPathsWithSum(null, 8)); // 0
System.out.println(countPathsWithSum(new TreeNode(8), 8)); // 1
```

---

## 7. Explain to a friend recap

Paths with Sum asks: how many downward parent-to-child stretches in a binary tree add up to a target?

1. Brute: from every node, walk down and count running sums that hit the target. Correct, up to O(N²).
2. Better: DFS with a running sum from the tree root. Keep a map of how often each prefix sum appears on the current path.
3. At each node, paths ending here that hit the target equal the map count of `runningSum - target`.
4. Seed the map with `0 → 1`. Increment the current prefix before children. Decrement (backtrack) after.
5. Negatives and zeros mean you never prune on "sum too large". Overlapping paths all count.

If you can draw the sample tree, show why three paths hit 8, and explain why backtracking the HashMap matters, you own problem 4.12. Chapter 4 closes on a tree walk that is really a prefix-sum trick in disguise.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Random Node](/blog/en/ctci-4-11-random-node)
* Next: [Insertion](/blog/en/ctci-5-1-insertion)