---
title: "Majority Element: Boyer-Moore Streaming Voting Algorithm (CTCI 17.10)"
description: "Find the majority element (> 50% frequency) in an array using the two-phase Boyer-Moore Voting Algorithm in O(N) linear time and O(1) auxiliary space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-10-majority-element.webp
previewImage: /assets/images/ctci-17-10-majority-element.webp
---

> **TL;DR**
> * **The Book Problem:** A majority element is an element that makes up strictly more than half ($> \lfloor N/2 \rfloor$) of the items in an array. Find the majority element, or return $-1$ if none exists, in $O(N)$ time and $O(1)$ space.
> * **The Optimal Solution:** **Boyer-Moore Voting Algorithm**:
>   1. **Phase 1 (Candidate Election)**:
>      * Initialize `candidate = 0` and `count = 0`.
>      * For each element $x$: if `count == 0`, set `candidate = x` and `count = 1`; else if $x == \text{candidate}$, increment `count++`; else decrement `count--`.
>   2. **Phase 2 (Validation Verification)**:
>      * Count actual occurrences of `candidate` across the array.
>      * If $\text{count} > \lfloor N / 2 \rfloor$, return `candidate`; otherwise return $-1$.
>   3. Runs in **$O(N)$ time** (two linear passes) and strictly **$O(1)$ auxiliary space**.
> * **Production Reality:** Heavy-hitter stream mining in network routers (Cisco NetFlow), distributed consensus voting (Raft / Paxos), and distributed sensor outlier rejection.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.10), we are asked:

*"Find the strict majority element (> 50% frequency) in an integer array in linear time without using a hash map or sorting."*

## 2. Boyer-Moore Cancellation Invariant

The algorithm operates on pairwise element cancellation: whenever two distinct elements are paired, both are removed without altering the relative dominance of the true majority element.

```
Array: [ 1,  2,  5,  9,  5,  9,  5,  5,  5 ] (N = 9, Majority must appear >= 5 times)

Phase 1 (Election):
  x = 1 ──> cand = 1, count = 1
  x = 2 ──> cand = 1, count = 0 (Cancelled!)
  x = 5 ──> cand = 5, count = 1
  x = 9 ──> cand = 5, count = 0 (Cancelled!)
  x = 5 ──> cand = 5, count = 1
  x = 9 ──> cand = 5, count = 0 (Cancelled!)
  x = 5 ──> cand = 5, count = 1
  x = 5 ──> cand = 5, count = 2
  x = 5 ──> cand = 5, count = 3
  Surviving Candidate: 5

Phase 2 (Verification):
  Count of 5 in array = 5. Since 5 > 9/2 (= 4), Result = 5!
```

## Production Java Implementation

```java
public class MajorityElement {

    /**
     * Finds the majority element in O(N) time and O(1) space.
     * Time Complexity: O(N)
     * Space Complexity: O(1)
     */
    public static int findMajorityElement(int[] array) {
        if (array == null || array.length == 0) {
            return -1;
        }

        // Phase 1: Boyer-Moore Candidate Election
        int candidate = 0;
        int count = 0;

        for (int x : array) {
            if (count == 0) {
                candidate = x;
                count = 1;
            } else if (x == candidate) {
                count++;
            } else {
                count--;
            }
        }

        // Phase 2: Candidate Verification Pass
        int actualCount = 0;
        for (int x : array) {
            if (x == candidate) {
                actualCount++;
            }
        }

        return (actualCount > array.length / 2) ? candidate : -1;
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Auxiliary Space | Verifies Absence |
|---|---|---|---|
| **Boyer-Moore Voting** | **$O(N)$** | **$O(1)$** | **Yes (Phase 2)** |
| **Frequency HashMap** | $O(N)$ | $O(N)$ | Yes |
| **Array Sorting** | $O(N \log N)$ | $O(1)$ | Yes |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Network Stream Heavy Hitters

1. **Space-Saving & Misra-Gries Algorithms:** In high-speed 100GbE packet routers (Cisco / Juniper), hardware TCAM chips implement generalized Boyer-Moore algorithms (Misra-Gries $\text{Top-}K$) to detect DDoS attack IP addresses consuming $> 1/K$ bandwidth in $O(1)$ updates per packet.
2. **Byzantine Fault Tolerant (BFT) Consensus:** Distributed state machines require $> 2/3$ or $> 1/2$ node vote matching before committing distributed transaction logs.

## Edge Cases & Production Hardening

1. **No Majority Element (`[1, 2, 3, 4]`):** Phase 1 elects a candidate, but Phase 2 catches that $\text{actualCount} = 1 \le 2$, returning `-1`.
2. **Single Element Array (`[42]`):** Returns `42` directly in $O(1)$.
