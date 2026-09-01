---
title: "Power Set: Generating All Subsets of a Set (CTCI 8.4)"
description: "Generate all 2^N subsets of a set using combinatorial recursion and binary bitmask iteration in O(N * 2^N) time and space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-4-power-set.webp
previewImage: /assets/images/ctci-8-4-power-set.webp
---

> **TL;DR**
> * **The Book Problem:** Write a method to return all subsets of a set.
> * **The Optimal Solution:** Combinatorial Doubling / Binary Bitmask Iteration: (1) **Recursive Approach**: Base case $P(\emptyset) = \{\emptyset\}$. For element $x$, clone all subsets of $P(S \setminus \{x\})$ and append $x$ to each clone, doubling the subset count; (2) **Binary Bitmask Approach**: Iterate integer $k$ from $0$ to $2^N - 1$, where the $i$-th bit of $k$ determines the presence of element $i$. Both run in optimal $O(N \cdot 2^N)$ time and $O(N \cdot 2^N)$ space.
> * **Production Reality:** Feature subset selection in machine learning, database query optimizer join-enumeration graphs, and cryptographic key ring powerset combinations.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.4), we are asked:

*"Write a method to return all subsets of a set."*

## 2. Algorithmic Approaches

### Approach 1: Combinatorial Doubling (Recursion)
* For set $\{a_1, a_2, \dots, a_n\}$, first compute all subsets of $\{a_1, \dots, a_{n-1}\}$.
* For each existing subset, create a copy and append $a_n$.
* Combine the original subsets with the cloned subsets. Total subsets $= 2^n$.

### Approach 2: Binary Bitmask Representation (Iterative)
* A set of size $n$ has $2^n$ subsets.
* Each subset corresponds uniquely to an $n$-bit binary integer $k \in [0, 2^n - 1]$.
* If the $i$-th bit of $k$ is `1`, include element $A[i]$ in subset $k$.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class PowerSet {
    /**
     * Generates all subsets of a set using Binary Bitmask representation.
     * Time Complexity: O(N * 2^N)
     * Space Complexity: O(N * 2^N)
     */
    public static List<List<Integer>> getSubsetsBitmask(List<Integer> set) {
        List<List<Integer>> allSubsets = new ArrayList<>();
        int max = 1 << set.size(); // 2^N subsets

        for (int k = 0; k < max; k++) {
            List<Integer> subset = new ArrayList<>();
            for (int i = 0; i < set.size(); i++) {
                // If the i-th bit is set in k, include set[i]
                if (((k >> i) & 1) == 1) {
                    subset.add(set.get(i));
                }
            }
            allSubsets.add(subset);
        }

        return allSubsets;
    }

    /**
     * Generates all subsets using Combinatorial Doubling (Recursion).
     * Time Complexity: O(N * 2^N)
     * Space Complexity: O(N * 2^N)
     */
    public static List<List<Integer>> getSubsetsRecursive(List<Integer> set, int index) {
        List<List<Integer>> allSubsets;
        if (set.size() == index) { // Base case: empty set
            allSubsets = new ArrayList<>();
            allSubsets.add(new ArrayList<>()); // Add empty set
        } else {
            allSubsets = getSubsetsRecursive(set, index + 1);
            int item = set.get(index);
            List<List<Integer>> moreSubsets = new ArrayList<>();
            for (List<Integer> subset : allSubsets) {
                List<Integer> newSubset = new ArrayList<>(subset);
                newSubset.add(item);
                moreSubsets.add(newSubset);
            }
            allSubsets.addAll(moreSubsets);
        }
        return allSubsets;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N * 2^N)` | Generates $2^N$ total subsets, each taking on average $N / 2$ copy operations. |
| Auxiliary Space | `O(N * 2^N)` | Memory required to store the full power set collection in heap. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Combinatorial Feature Selection

1. **Machine Learning Feature Subset Search:** Exhaustive evaluation of model performance across powersets of candidate input features.
2. **SQL Query Optimizer Join Enumeration:** Dynamic programming engines (System R) iterate over relations powersets to generate optimal physical join trees.

## Edge Cases & Production Hardening

1. **Empty Set ($\emptyset$):** Returns `[[]]` (one subset containing the empty set).
2. **$N \ge 30$:** Guard clauses prevent $2^N$ integer overflow and out-of-memory heap exhaustion.
