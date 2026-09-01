---
title: "The Masseuse: Non-Adjacent Dynamic Programming & Space Optimization (CTCI 17.16)"
description: "Maximize appointment booking minutes without accepting consecutive requests using Fibonacci-like constant space Dynamic Programming in O(N) linear time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-16-the-masseuse.webp
previewImage: /assets/images/ctci-17-16-the-masseuse.webp
---

> **TL;DR**
> * **The Book Problem:** A masseuse receives appointment requests and must take a break between sessions (cannot accept any two adjacent appointments). Given an array of request durations, find the maximum total booked minutes she can accept.
> * **The Optimal Solution:** **Non-Adjacent Dynamic Programming with $O(1)$ State Space**:
>   1. **Recurrence Relation**: For appointment $i$ with duration $M[i]$:
>      $$\text{Best}[i] = \max(\text{Best}[i-1],\, \text{Best}[i-2] + M[i])$$
>   2. **State Variable Compression**: Instead of allocating an $O(N)$ table, maintain only two integer variables: `oneAway` (best minutes ending at $i-1$) and `twoAway` (best minutes ending at $i-2$).
>   3. Runs in strictly **$O(N)$ linear time** and **$O(1)$ auxiliary space**.
> * **Production Reality:** LeetCode 198 (House Robber), compute cluster cooling cycle scheduling, and energy-aware sensor duty cycling.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.16), we are asked:

*"Given an array of back-to-back appointment durations, select a non-adjacent subset that maximizes total minutes in O(N) time and O(1) space."*

## 2. Dynamic Programming State Reduction

```
Durations: [ 30, 15, 60, 75, 45, 15, 15, 45 ]

Step 0: m = 30 ──> best = max(0, 0 + 30) = 30. (oneAway=30, twoAway=0)
Step 1: m = 15 ──> best = max(30, 0 + 15) = 30. (oneAway=30, twoAway=30)
Step 2: m = 60 ──> best = max(30, 30 + 60) = 90. (oneAway=90, twoAway=30)
Step 3: m = 75 ──> best = max(90, 30 + 75) = 105. (oneAway=105, twoAway=90)
Step 4: m = 45 ──> best = max(105, 90 + 45) = 135. (oneAway=135, twoAway=105)
Step 5: m = 15 ──> best = max(135, 105 + 15) = 135. (oneAway=135, twoAway=135)
Step 6: m = 15 ──> best = max(135, 135 + 15) = 150. (oneAway=150, twoAway=135)
Step 7: m = 45 ──> best = max(150, 135 + 45) = 180. (oneAway=180, twoAway=150)

Result = 180 minutes (Selections: 30 + 60 + 45 + 45 = 180).
```

## Production Java Implementation

```java
public class MasseuseSchedule {

    /**
     * Finds maximum booked minutes in O(N) time and O(1) space.
     * Time Complexity: O(N)
     * Space Complexity: O(1)
     */
    public static int maxMinutes(int[] massages) {
        if (massages == null || massages.length == 0) {
            return 0;
        }

        int oneAway = 0; // Represents DP[i - 1]
        int twoAway = 0; // Represents DP[i - 2]

        for (int m : massages) {
            int currentBest = Math.max(oneAway, twoAway + m);
            twoAway = oneAway;
            oneAway = currentBest;
        }

        return oneAway;
    }
}
```

## Complexity Analysis

| Strategy | Time Complexity | Auxiliary Space | DP Table Allocation |
|---|---|---|---|
| **Space-Optimized DP** | **$O(N)$** | **$O(1)$** | **0 arrays** |
| **Tabulated DP Array** | $O(N)$ | $O(N)$ | Array of size $N$ |
| **Brute-Force Recursion** | $O(2^N)$ | $O(N)$ | Stack overflow |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Duty-Cycling in Sensor Networks

1. **IoT Sensor Sleep Duty-Cycles:** Solar-powered environmental sensors must cycle between heavy transmission and mandatory idle cool-down intervals. Firmware controllers maximize total telemetry volume across scheduled event windows using non-adjacent dynamic programming.
2. **Compute Server Cooling Windows:** High-performance thermal throttling algorithms interleave high-wattage computing jobs with cooldown states.

## Edge Cases & Production Hardening

1. **Empty Array / Zero Appointments:** Returns `0` cleanly.
2. **Single Appointment (`[45]`):** Returns `45` in $O(1)$.
