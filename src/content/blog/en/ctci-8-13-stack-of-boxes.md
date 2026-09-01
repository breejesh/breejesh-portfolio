---
title: "Stack of Boxes: 3D Box Stacking via Longest Increasing Subsequence DP (CTCI 8.13)"
description: "Compute the maximum possible height of a stack of 3D boxes where each box must be strictly smaller in width, height, and depth using sorting and memoization in O(N^2) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-13-stack-of-boxes.webp
previewImage: /assets/images/ctci-8-13-stack-of-boxes.webp
---

> **TL;DR**
> * **The Book Problem:** You have a stack of $n$ boxes, with widths $w_i$, heights $h_i$, and depths $d_i$. The boxes cannot be rotated and can only be stacked on top of one another if each box in the stack is strictly larger than the box below it in width, height, and depth. Implement a method to compute the height of the tallest possible stack.
> * **The Optimal Solution:** Sorted 3D LIS Dynamic Programming: (1) Sort boxes in descending order of height (or width/depth); (2) Let `stackMap[i]` store the maximum height of a stack with box `i` as the bottom base; (3) For each base box `i`, iterate through all subsequent boxes $j > i$ that satisfy strictly smaller dimensions $(w_j < w_i, h_j < h_i, d_j < d_i)$, finding the maximum sum; (4) Runs in **$O(N^2)$ time** and **$O(N)$ space**.
> * **Production Reality:** Pallet loading and container packing optimization in supply chain logistics (3D bin packing heuristics), semiconductor photolithography layer stacking, and dependency DAG topological scheduling.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.13), we are asked:

*"You have a stack of n boxes, with widths wi, heights hi, and depths di. The boxes cannot be rotated and can only be stacked on top of one another if each box in the stack is strictly larger than the box below it in width, height, and depth. Implement a method to compute the height of the tallest possible stack. The height of a stack is the sum of the heights of each box."*

## 2. Mathematical Modeling: 3D DAG & Sorting Pruning

By sorting all boxes in descending order by height ($h_0 \ge h_1 \ge \dots \ge h_{n-1}$), a box $j$ can only be placed on top of box $i$ if $j > i$. This converts the 3D stacking problem into finding the Longest Increasing/Decreasing Subsequence over width and depth on a Directed Acyclic Graph (DAG).

### Recurrence:
$$\text{maxHeight}(i) = h_i + \max_{j > i, \text{canBeAbove}(i, j)} \text{maxHeight}(j)$$
$$\text{Total Tallest Stack} = \max_{0 \le i < n} \text{maxHeight}(i)$$

## Production Implementation

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class StackOfBoxes {
    public static class Box {
        public final int width;
        public final int height;
        public final int depth;

        public Box(int w, int h, int d) {
            this.width = w;
            this.height = h;
            this.depth = d;
        }

        public boolean canBeAbove(Box other) {
            if (other == null) return true;
            return this.width < other.width &&
                   this.height < other.height &&
                   this.depth < other.depth;
        }
    }

    /**
     * Computes the maximum height of a stack of boxes.
     * Time Complexity: O(N^2)
     * Space Complexity: O(N)
     */
    public static int createStack(List<Box> boxes) {
        if (boxes == null || boxes.isEmpty()) return 0;

        // Sort descending by height
        Collections.sort(boxes, new Comparator<Box>() {
            @Override
            public int compare(Box b1, Box b2) {
                return Integer.compare(b2.height, b1.height);
            }
        });

        int[] stackMap = new int[boxes.size()];
        int maxHeight = 0;

        for (int i = 0; i < boxes.size(); i++) {
            int height = createStackHelper(boxes, i, stackMap);
            maxHeight = Math.max(maxHeight, height);
        }

        return maxHeight;
    }

    private static int createStackHelper(List<Box> boxes, int bottomIndex, int[] stackMap) {
        if (bottomIndex < boxes.size() && stackMap[bottomIndex] > 0) {
            return stackMap[bottomIndex];
        }

        Box bottom = boxes.get(bottomIndex);
        int maxSubHeight = 0;

        for (int i = bottomIndex + 1; i < boxes.size(); i++) {
            if (boxes.get(i).canBeAbove(bottom)) {
                int height = createStackHelper(boxes, i, stackMap);
                maxSubHeight = Math.max(maxSubHeight, height);
            }
        }

        int totalHeight = maxSubHeight + bottom.height;
        stackMap[bottomIndex] = totalHeight;
        return totalHeight;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N^2)` | Sorting takes $O(N \log N)$; memoized recursion evaluates each pair $(i, j)$ at most once in $O(N^2)$. |
| Auxiliary Space | `O(N)` | 1D memoization array `stackMap` and recursion stack depth $O(N)$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: 3D Bin Packing & Logistics

1. **Logistics Container Packing (Amazon Fulfillment):** 3D knapsack and bin packing heuristics stack freight pallets maximizing volume density under gravitational stability constraints.
2. **DAG Scheduling in Compilers:** Instruction scheduling engines evaluate node dependency heights in DAGs to minimize CPU pipeline bubbles.

## Edge Cases & Production Hardening

1. **Empty list:** Returns 0 height immediately.
2. **No boxes can be stacked (all identical dimensions):** Returns height of single largest individual box.
