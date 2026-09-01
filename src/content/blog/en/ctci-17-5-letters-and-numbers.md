---
title: "Letters and Numbers: Longest Balanced Subarray via Prefix Delta Maps (CTCI 17.5)"
description: "Find the longest contiguous subarray containing an equal number of letters and numbers using cumulative prefix difference mapping in O(N) linear time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-5-letters-and-numbers.webp
previewImage: /assets/images/ctci-17-5-letters-and-numbers.webp
---

> **TL;DR**
> * **The Book Problem:** Given an array filled with characters (letters and numbers), find the longest contiguous subarray with an equal number of letters and numbers.
> * **The Optimal Solution:** **Prefix Delta Sum & First-Occurrence Hash Map**:
>   1. **Delta Mapping**: Map letters to $+1$ and numbers to $-1$.
>   2. **Running Delta Invariant**: Compute the cumulative difference sum $D[i] = \sum_{k=0}^i \Delta_k$.
>   3. **Equal Subarray Lemma**: If $D[i] == D[j]$ (where $i < j$), the net sum of deltas between indices $i+1$ and $j$ is strictly $0$ (guaranteeing an exact balance of letters and numbers).
>   4. **First-Seen Map**: Store the earliest occurrence index for each running delta value in `Map<Integer, Integer>` (with baseline $(0, -1)$).
>   5. Runs in **$O(N)$ time** (single linear pass) and **$O(N)$ auxiliary space**.
> * **Production Reality:** Audio signal zero-crossing rate analysis, DNA nucleotide GC/AT skew analysis, and financial order flow imbalance tracking.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.5), we are asked:

*"Given an array containing letters and numbers in arbitrary order, identify and return the longest contiguous subarray with an identical count of letters and numbers."*

## 2. Prefix Delta Mechanics

```
Array:        ['a', 'a', '1', '1', 'a', '1', '1', 'a', 'a', '1', 'a', 'a', '1']
Delta (+1/-1):  +1   +1   -1   -1   +1   -1   -1   +1   +1   -1   +1   +1   -1
Prefix Sum:      1    2    1    0    1    0   -1    0    1    0    1    2    1
                 ▲                   ▲                   ▲                   ▲
                 └── First seen at 0 └── Matched at 4    └── Matched at 8    └── Matched at 12 (Len = 12!)

Longest Balanced Subarray: indices [1 .. 12] of length 12.
```

## Production Java Implementation

```java
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class LettersAndNumbers {

    /**
     * Finds the longest contiguous subarray with equal letters and numbers.
     * Time Complexity: O(N)
     * Space Complexity: O(N)
     */
    public static char[] findLongestSubarray(char[] array) {
        if (array == null || array.length < 2) {
            return new char[0];
        }

        // Map storing: Running Delta -> Earliest Index seen
        Map<Integer, Integer> firstSeen = new HashMap<>();
        firstSeen.put(0, -1); // Baseline for balanced prefix starting at index 0

        int runningDelta = 0;
        int maxLen = 0;
        int bestStart = -1;

        for (int i = 0; i < array.length; i++) {
            if (Character.isLetter(array[i])) {
                runningDelta += 1;
            } else if (Character.isDigit(array[i])) {
                runningDelta -= 1;
            }

            if (firstSeen.containsKey(runningDelta)) {
                int prevIndex = firstSeen.get(runningDelta);
                int length = i - prevIndex;
                if (length > maxLen) {
                    maxLen = length;
                    bestStart = prevIndex + 1;
                }
            } else {
                firstSeen.put(runningDelta, i);
            }
        }

        if (maxLen == 0) {
            return new char[0];
        }

        return Arrays.copyOfRange(array, bestStart, bestStart + maxLen);
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Single pass through the array with $O(1)$ amortized hash map lookups. |
| Auxiliary Space | `O(N)` | Hash map holding at most $2N + 1$ unique delta values. |
| Subarray Extraction | `O(M)` | Copying range of length $M \le N$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: DNA Skew & Signal Zero-Crossings

1. **Genomic GC-Skew Curves:** Bioinformatic algorithms identify replication origins in bacterial circular chromosomes by mapping $(G - C) / (G + C)$ prefix deltas across megabase sequences.
2. **Order Flow Imbalance (OFI):** High-frequency trading engines monitor buy-volume vs. sell-volume tick deltas to detect equilibrium price channels in $O(1)$ updates per packet.

## Edge Cases & Production Hardening

1. **No Balanced Subarray (`['a', 'a', 'a']`):** Returns an empty array cleanly.
2. **Full Array is Balanced (`['a', '1', 'a', '1']`):** Triggered against baseline `(0, -1)` returning full range `[0..3]`.
