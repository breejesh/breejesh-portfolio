---
title: "Random Set: Reservoir Sampling of M Elements from an N-Array (CTCI 17.3)"
description: "Select a uniformly random subset of M elements from an array of size N using streaming Reservoir Sampling and mathematical induction in O(N) time and O(M) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-3-random-set.webp
previewImage: /assets/images/ctci-17-3-random-set.webp
---

> **TL;DR**
> * **The Book Problem:** Write a method to randomly generate a set of $m$ integers from an array of size $n$. Each element in the original array must have an exact equal probability of being chosen ($m / n$).
> * **The Optimal Solution:** **Reservoir Sampling (Streaming Selection)**:
>   1. Initialize a reservoir array `subset` of size $m$ containing the first $m$ elements: `subset[0..m-1] = array[0..m-1]`.
>   2. For index $i = m$ to $n - 1$:
>      * Generate a random integer $k \in [0, i]$ (inclusive).
>      * If $k < m$, replace `subset[k] = array[i]`.
>   3. **Mathematical Proof of Uniformity**: At any step $i$, each element among $0..i$ resides in the subset with exact probability $m / (i + 1)$. Upon termination, every element has exact inclusion probability $m / n$.
>   4. Runs in **$O(N)$ time** and **$O(M)$ auxiliary space**.
> * **Production Reality:** Distributed telemetry packet sampling in Envoy/Wireshark, database `TABLESAMPLE BERNOULLI` queries, and Big Data stream sampling in Apache Spark.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.3), we are asked:

*"Given an array of size n and an integer m (where m <= n), generate a subset of exactly m elements such that every one of the n elements has an identical probability m / n of being selected."*

## 2. Mathematical Induction of Reservoir Sampling

```
Base Case (i = m - 1):
  First m elements are in subset with probability m / m = 1.0 (Correct!).

Inductive Step (Processing element at index i >= m):
  1. Element array[i] enters subset with probability:
     Pr(enter) = m / (i + 1)

  2. Any existing element in subset survives eviction with probability:
     Pr(survive) = 1 - Pr(chosen to be evicted)
                 = 1 - [Pr(new element enters) * Pr(this specific slot replaced)]
                 = 1 - [(m / (i + 1)) * (1 / m)]
                 = 1 - (1 / (i + 1)) = i / (i + 1)

  3. Cumulative probability of existing element remaining:
     Pr(in subset at step i) = (m / i) * (i / (i + 1)) = m / (i + 1) (Q.E.D.!)
```

## Production Java Implementation

```java
import java.util.Random;

public class RandomSet {

    private static final Random RNG = new Random();

    /**
     * Selects m random elements from an array of size n without modifying original input.
     * Time Complexity: O(N)
     * Space Complexity: O(M)
     */
    public static int[] pickMRecursively(int[] array, int m) {
        if (array == null || m <= 0 || m > array.length) {
            return new int[0];
        }

        int[] subset = new int[m];

        // 1. Initialize reservoir with first m elements
        System.arraycopy(array, 0, subset, 0, m);

        // 2. Iterate through remaining elements (m to n - 1)
        for (int i = m; i < array.length; i++) {
            int k = RNG.nextInt(i + 1); // Random index in [0, i]
            if (k < m) {
                subset[k] = array[i]; // Replace existing reservoir slot
            }
        }

        return subset;
    }
}
```

## Complexity Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Single forward linear pass over array of size $N$. |
| Auxiliary Space | `O(M)` | Reservoir buffer storing exactly $M$ selected elements. |
| Streaming Capability | `Infinite Streams` | Does not require prior knowledge of total stream length $N$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Telemetry Stream Sampling in Envoy

1. **Distributed Request Sampling:** When network proxies (Envoy / Istio) process 10,000,000 requests/sec, logging all headers exhausts disk I/O. Proxies run Reservoir Sampling over incoming TCP stream packets to store an exact, unbiased sample of $M = 1,000$ traces per minute.
2. **Database Query Optimizer Statistics:** PostgreSQL `ANALYZE` and Presto use reservoir sampling to build column histograms from terabyte-scale tables without reading entire disk partitions into RAM.

## Edge Cases & Production Hardening

1. **$M = N$:** Copies and returns the original array directly.
2. **$M > N$ or $M \le 0$:** Returns an empty array safely without throwing `NegativeArraySizeException`.
