---
title: "Magic Index: Binary Search Fixed Point in Sorted Arrays (CTCI 8.3)"
description: "Find a magic index where A[i] = i in sorted arrays with distinct and non-distinct integers using modified binary search in O(log N) average time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-3-magic-index.webp
previewImage: /assets/images/ctci-8-3-magic-index.webp
---

> **TL;DR**
> * **The Book Problem:** A magic index in an array $A[0 \dots n - 1]$ is defined to be an index such that $A[i] = i$. Given a sorted array of distinct integers, write a method to find a magic index, if one exists, in array $A$. FOLLOW UP: What if the values are not distinct?
> * **The Optimal Solution:** Binary Search Fixed Point: (1) **Distinct Elements**: If $A[\text{mid}] > \text{mid}$, any magic index must lie on the left side ($A[i]$ grows strictly faster than $i$), giving $O(\log N)$ time and $O(\log N)$ stack space; (2) **Non-Distinct Elements**: Recursively search the left range $[start, \min(\text{mid}-1, A[\text{mid}])]$ and right range $[\max(\text{mid}+1, A[\text{mid}]), end]$, pruning unsearchable index spans in $O(\log N)$ average and $O(N)$ worst-case time.
> * **Production Reality:** Fixed-point iteration in compiler data-flow analysis, monotonic database index range lookups, and equilibrium convergence points in game theory.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.3), we are asked:

*"A magic index in an array A[0...n-1] is defined to be an index such that A[i] = i. Given a sorted array of distinct integers, write a method to find a magic index, if one exists, in array A. FOLLOW UP: What if the values are not distinct?"*

## 2. Algorithmic Breakdown

### Case 1: Distinct Integers ($A[i]$ strictly increasing)
Since elements are sorted integers with no duplicates, for any index $k > i$, $A[k] \ge A[i] + (k - i)$.
* If $A[\text{mid}] == \text{mid}$: Found magic index!
* If $A[\text{mid}] > \text{mid}$: Since values grow at least as fast as indices, for all $j > \text{mid}$, $A[j] > j$. Therefore, a magic index **cannot exist on the right**. Search strictly left: $[start, \text{mid} - 1]$.
* If $A[\text{mid}] < \text{mid}$: Magic index **cannot exist on the left**. Search strictly right: $[\text{mid} + 1, end]$.

### Case 2: Non-Distinct Integers (Duplicates Allowed)
When duplicates exist, a magic index can exist on either side of the midpoint. However, we can prune search ranges:
* Left side search bound: $\min(\text{mid} - 1, A[\text{mid}])$.
* Right side search bound: $\max(\text{mid} + 1, A[\text{mid}])$.

## Production Implementation

```java
public class MagicIndex {
    /**
     * Finds a magic index in a sorted array of DISTINCT integers.
     * Time Complexity: O(log N)
     * Space Complexity: O(log N)
     */
    public static int magicDistinct(int[] array) {
        return magicDistinct(array, 0, array.length - 1);
    }

    private static int magicDistinct(int[] array, int start, int end) {
        if (end < start) return -1;

        int mid = start + (end - start) / 2;
        if (array[mid] == mid) {
            return mid;
        } else if (array[mid] > mid) {
            return magicDistinct(array, start, mid - 1);
        } else {
            return magicDistinct(array, mid + 1, end);
        }
    }

    /**
     * Finds a magic index in a sorted array with DUPLICATE integers.
     * Time Complexity: O(log N) average, O(N) worst case.
     * Space Complexity: O(log N)
     */
    public static int magicNonDistinct(int[] array) {
        return magicNonDistinct(array, 0, array.length - 1);
    }

    private static int magicNonDistinct(int[] array, int start, int end) {
        if (end < start) return -1;

        int midIndex = start + (end - start) / 2;
        int midValue = array[midIndex];

        if (midValue == midIndex) {
            return midIndex;
        }

        // Search left: elements cannot be magic between midValue and midIndex - 1
        int leftIndex = Math.min(midIndex - 1, midValue);
        int left = magicNonDistinct(array, start, leftIndex);
        if (left >= 0) {
            return left;
        }

        // Search right: elements cannot be magic between midIndex + 1 and midValue
        int rightIndex = Math.max(midIndex + 1, midValue);
        return magicNonDistinct(array, rightIndex, end);
    }
}
```

## Complexity & Memory Analysis

| Mode | Time Complexity | Auxiliary Space | Technical Detail |
|---|---|---|---|
| Distinct Integers | `O(log N)` | `O(log N)` | Standard binary search recursion halving search space every step. |
| Non-Distinct Integers | `O(log N)` Avg / `O(N)` Worst | `O(log N)` | Bounded dual-branch pruning based on $A[\text{mid}]$ values. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Fixed-Point Equations

1. **Compiler Optimization Fixpoints:** Data-flow analysis (liveness analysis / reaching definitions) iterates transfer functions until finding fixed points ($f(x) = x$).
2. **Database Monotonic Key Splitting:** Index partition boundaries locate natural alignment points using binary search range intersections.

## Edge Cases & Production Hardening

1. **Empty / Null Array:** Returns `-1`.
2. **No Magic Index Exists ($[-10, -5, 0, 1, 2]$):** Gracefully terminates and returns `-1`.
