---
title: "Peaks and Valleys: Linear-Time Alternating Subsequence Sorting (CTCI 10.11)"
description: "Reorganize an array of integers into an alternating sequence of peaks and valleys using greedy local maximum swaps in O(N) time and O(1) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
previewImage: /assets/images/ctci-10-11-peaks-and-valleys.webp
---

> **TL;DR**
> * **The Book Problem:** In an array of integers, a "peak" is an element $\ge$ its adjacent neighbors, and a "valley" is an element $\le$ its adjacent neighbors. For example, in $\{5, 8, 6, 2, 3, 4, 6\}$, $\{8, 6\}$ are peaks and $\{5, 2\}$ are valleys. Given an array of integers, sort the array into an alternating sequence of peaks and valleys (e.g. $\text{peak} \ge \text{valley} \le \text{peak} \ge \text{valley} \dots$).
> * **The Optimal Solution:** **Greedy Local Maximum Window Swapping**: (1) Instead of sorting in $O(N \log N)$, iterate across odd indices `for (int i = 1; i < array.length; i += 2)` designating each index $i$ as a peak; (2) Inspect the 3-element window $\{A[i-1], A[i], A[i+1]\}$; (3) Find the index of the maximum element in this window and swap it into position $i$; (4) Swapping the maximum to $A[i]$ never breaks the preceding valley/peak invariant; (5) Executes in **$O(N)$ time** and **$O(1)$ space**.
> * **Production Reality:** Signal processing waveform smoothing, financial candlestick zigzag chart construction, and UI mountain-range terrain rendering.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 10.11), we are asked:

*"In an array of integers, sort the array into an alternating sequence of peaks and valleys."*

**Example:**
* Input: `[5, 3, 1, 2, 3]`
* Output: `[5, 1, 3, 2, 3]` (or `[3, 1, 5, 2, 3]`)

## 2. Deriving the Greedy O(N) Invariant

Sorting the array in $O(N \log N)$ and swapping adjacent pairs works, but is suboptimal.

### The Greedy 3-Element Window
Iterate across all peaks at odd indices $i = 1, 3, 5, \dots$:
1. Look at $A[i-1], A[i], A[i+1]$.
2. Find the index `maxIdx` containing the largest value.
3. Swap $A[i]$ with $A[\text{maxIdx}]$.

### Why does this never break previous invariants?
Suppose index $i-2$ was a peak. That means $A[i-2] \ge A[i-1]$.
If $A[i-1]$ is the maximum in window $\{A[i-1], A[i], A[i+1]\}$, we swap $A[i-1]$ with $A[i]$. The new value at $A[i-1]$ is *strictly smaller* than the old value. Thus, $A[i-2]$ remains $\ge A[i-1]$, preserving all prior peak invariants.

## Production Implementation

```java
public class PeaksAndValleys {
    /**
     * Reorganizes array into alternating peaks and valleys.
     * Time Complexity: O(N)
     * Space Complexity: O(1)
     */
    public static void sortValleyPeak(int[] array) {
        for (int i = 1; i < array.length; i += 2) {
            int biggestIndex = maxIndex(array, i - 1, i, i + 1);
            if (i != biggestIndex) {
                swap(array, i, biggestIndex);
            }
        }
    }

    private static int maxIndex(int[] array, int a, int b, int c) {
        int len = array.length;
        int aValue = a >= 0 && a < len ? array[a] : Integer.MIN_VALUE;
        int bValue = b >= 0 && b < len ? array[b] : Integer.MIN_VALUE;
        int cValue = c >= 0 && c < len ? array[c] : Integer.MIN_VALUE;

        int max = Math.max(aValue, Math.max(bValue, cValue));
        if (aValue == max) return a;
        if (bValue == max) return b;
        return c;
    }

    private static void swap(int[] array, int left, int right) {
        int temp = array[left];
        array[left] = array[right];
        array[right] = temp;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Exactly $N / 2$ 3-element window evaluations and swaps. |
| Auxiliary Space | `O(1)` | In-place primitive array index swaps. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Signal Processing & Financial ZigZag

1. **Digital Signal Processing (DSP):** Audio compression and seismic waveform filtering detect alternating extrema (peaks/troughs) to compress continuous analog signals into key inflection vectors.
2. **Financial Technical Analysis (ZigZag Indicator):** Eliminates noise in price action time-series by filtering for alternating relative extremes.

## Edge Cases & Production Hardening

1. **Arrays with Length $\le 2$:** Handled gracefully with zero out-of-bounds exceptions.
2. **All Identical Elements ($[2, 2, 2, 2]$):** Every element is simultaneously a peak and a valley; algorithm terminates with no unnecessary swaps.
