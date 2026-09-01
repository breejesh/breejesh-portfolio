---
title: "Living People: Sweep-Line Delta Arrays & Population Maximums (CTCI 16.10)"
description: "Find the calendar year with the maximum number of living people using a sweep-line difference array and prefix sums in O(P + Y) linear time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-10-living-people.webp
previewImage: /assets/images/ctci-16-10-living-people.webp
---

> **TL;DR**
> * **The Book Problem:** Given a list of people with their birth and death years (all within 1900-2000 inclusive), find the year with the maximum number of people alive. A person is considered alive during both their birth year and death year.
> * **The Optimal Solution:** **Sweep-Line Delta Array (Difference Array)**:
>   1. **Event Deltas**: Create an integer array `deltas` of size $102$ initialized to zeros (indexing years $1900..2000$).
>   2. **Mark Intervals**: For each person $(B, D)$:
>      * Increment arrival delta: `deltas[B - 1900] += 1;`
>      * Decrement departure delta on year *following* death: `deltas[D - 1900 + 1] -= 1;`
>   3. **Running Prefix Sum**: Iterate through the delta array accumulating `currentlyAlive += deltas[i]`, updating `maxAlive` and recording the earliest `maxYear`.
>   4. Runs in **$O(P + Y)$ time** ($P = \text{people}, Y = 101\text{ years}$) and strictly **$O(Y) = O(1)$ space**.
> * **Production Reality:** Peak concurrent connection tracking in load balancers (Envoy/Nginx), hotel room reservation capacity management, and cloud VM autoscaling.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.10), we are asked:

*"Given a collection of Person objects containing birth and death years between 1900 and 2000 inclusive, compute the year with the maximum living population."*

## 2. Sweep-Line Delta Array Mechanics

```
Person 1: [1908, 1912] ──> +1 at 1908, -1 at 1913
Person 2: [1910, 1915] ──> +1 at 1910, -1 at 1916

Year:   1908  1909  1910  1911  1912  1913  1914  1915  1916
Delta:   +1     0    +1     0     0    -1     0     0    -1
Prefix:   1     1     2     2     2     1     1     1     0
                      ▲
                      └── Max Population = 2 in Year 1910
```

## Production Java Implementation

```java
public class LivingPeople {

    public static class Person {
        public final int birth;
        public final int death;

        public Person(int birth, int death) {
            this.birth = birth;
            this.death = death;
        }
    }

    private static final int MIN_YEAR = 1900;
    private static final int MAX_YEAR = 2000;

    /**
     * Optimal Sweep-Line Algorithm using Difference Array.
     * Time Complexity: O(P + Y) where Y = MAX_YEAR - MIN_YEAR + 1
     * Space Complexity: O(Y) = O(1)
     */
    public static int maxAliveYear(Person[] people, int minYear, int maxYear) {
        if (people == null || people.length == 0) return minYear;

        int yearRange = maxYear - minYear + 1;
        // +2 buffer to accommodate deltas[death - minYear + 1] safely
        int[] deltas = new int[yearRange + 2];

        // 1. Record birth and death events
        for (Person person : people) {
            int birthIndex = person.birth - minYear;
            int deathIndex = person.death - minYear;

            if (birthIndex >= 0 && birthIndex <= yearRange) {
                deltas[birthIndex]++;
            }
            if (deathIndex >= 0 && deathIndex + 1 < deltas.length) {
                deltas[deathIndex + 1]--;
            }
        }

        // 2. Running Prefix Sum Scan
        int maxAlive = 0;
        int maxYear = minYear;
        int currentlyAlive = 0;

        for (int i = 0; i < yearRange; i++) {
            currentlyAlive += deltas[i];
            if (currentlyAlive > maxAlive) {
                maxAlive = currentlyAlive;
                maxYear = minYear + i;
            }
        }

        return maxYear;
    }
}
```

## Complexity & Algorithmic Comparison

| Approach | Time Complexity | Auxiliary Space | Best Used When |
|---|---|---|---|
| **Sweep-Line Delta Array** | **$O(P + Y)$** | **$O(Y)$** | Bounded year range ($1900..2000$). |
| **Dual Sorted Arrays** | $O(P \log P)$ | $O(P)$ | Unbounded/sparse year ranges ($1..10^9$). |
| **Brute Force Counting** | $O(P \cdot Y)$ | $O(1)$ | Impractical under large $P$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: High-Throughput Concurrency Tracking

1. **Active Concurrent Session Capacity:** Distributed gateways (Cloudflare / AWS ALB) monitor concurrent active TCP connections by incrementing counters on connection establishment (`SYN-ACK`) and scheduling decrement offsets on connection teardown (`FIN/RST`), visualizing maximum load profiles.
2. **Prometheus Range Queries:** Time-series metric engines compute instantaneous max concurrency using step-wise delta rate aggregators.

## Edge Cases & Production Hardening

1. **Same-Year Birth and Death ($B = D$):** A person born in 1908 and dying in 1908 correctly increments `deltas[1908]` and decrements `deltas[1909]`, remaining counted in 1908.
2. **Multiple Maximum Years:** The strict inequality `currentlyAlive > maxAlive` guarantees returning the earliest chronological peak year.
