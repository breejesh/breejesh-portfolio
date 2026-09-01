---
title: "Sorted Merge: In-Place Reverse Two-Pointer Array Merging (CTCI 10.1)"
description: "Merge sorted array B into sorted array A with end buffer in-place using reverse two-pointer traversal in O(A + B) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-1-sorted-merge.webp
previewImage: /assets/images/ctci-10-1-sorted-merge.webp
---

> **TL;DR**
> * **The Book Problem:** You are given two sorted arrays, $A$ and $B$, where $A$ has a large enough buffer at the end to hold $B$. Write a method to merge $B$ into $A$ in sorted order.
> * **The Optimal Solution:** Reverse Three-Pointer In-Place Merging: (1) Initialize pointer `indexA = lastA`, pointer `indexB = lastB`, and write pointer `indexMerged = lastA + lastB + 1`; (2) Compare elements from the back ($A[\text{indexA}]$ vs $B[\text{indexB}]$), copying the larger value to $A[\text{indexMerged}]$ and decrementing pointers; (3) If elements remain in $B$, copy them over to $A$; (4) Runs in optimal **$O(A + B)$ time** and **$O(1)$ auxiliary space** without shifting or extra arrays.
> * **Production Reality:** In-place merge steps in external sorting, LSM-tree SSTable compaction (RocksDB), and database sorted cursor merging.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.1), we are asked:

*"You are given two sorted arrays, A and B, where A has a large enough buffer at the end to hold B. Write a method to merge B into A in sorted order."*

## 2. Reverse Merging Logic

Merging from the front ($0 \to N$) would require shifting elements in array $A$ repeatedly ($O(N^2)$) or allocating a temporary buffer.

By starting at the very end of the merged buffer:
$$\text{indexMerged} = \text{lastA} + \text{lastB} + 1$$
We place the largest elements into the empty buffer space first. Because the write index always stays ahead of or equal to `indexA`, we will never overwrite an unread element in $A$.

## Production Implementation

```java
public class SortedMerge {
    /**
     * Merges array B into array A in sorted order in-place.
     * Time Complexity: O(A + B)
     * Space Complexity: O(1)
     */
    public static void merge(int[] a, int[] b, int lastA, int lastB) {
        int indexA = lastA - 1; // Index of last element in array a
        int indexB = lastB - 1; // Index of last element in array b
        int indexMerged = lastB + lastA - 1; // End of merged array

        // Merge a and b, starting from the last element in each
        while (indexB >= 0) {
            // End of a is greater than end of b
            if (indexA >= 0 && a[indexA] > b[indexB]) {
                a[indexMerged] = a[indexA]; // Copy element
                indexA--;
            } else {
                a[indexMerged] = b[indexB]; // Copy element
                indexB--;
            }
            indexMerged--; // Move indices
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(A + B)` | Exactly $lastA + lastB$ comparisons and assignments. |
| Auxiliary Space | `O(1)` | Three primitive integer pointers with zero heap allocations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: LSM-Tree Compaction (RocksDB)

1. **SSTable In-Place Merging:** Level-based compaction streams sorted key-value runs into unified SSTable files using reverse/forward dual cursor merging.
2. **Buffer Overrun Protection:** Reverse indexing prevents write-head clobbering in fixed-size circular ring buffers.

## Edge Cases & Production Hardening

1. **Array B is Empty ($lastB = 0$):** Loop terminates immediately; array $A$ remains untouched.
2. **Array A is Empty ($lastA = 0$):** Copies all elements of $B$ directly into $A$.
3. **All elements in B smaller than A:** $A$ elements are placed at the back, then remaining $B$ elements fill the front.
