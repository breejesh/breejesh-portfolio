---
title: "Lambda Random: Uniform Probability Random Subset Generation in Java (CTCI 13.8)"
description: "Generate a uniform random subset of an arbitrary list in Java using Lambda expressions, Streams API, and independent Bernoulli trial filtering in O(N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-13-8-lambda-random.webp
previewImage: /assets/images/ctci-13-8-lambda-random.webp
---

> **TL;DR**
> * **The Book Problem:** Using Lambda expressions, write a function `List<Integer> getRandomSubset(List<Integer> list)` that returns a random subset of arbitrary size. All subsets (including the empty set) should be equally likely to be chosen.
> * **The Mathematical Breakthrough:** **Independent Bernoulli Trials ($p = 0.5$)**: (1) For a list of size $N$, there are exactly $2^N$ possible subsets; (2) For every subset to have an equal probability of $1 / 2^N$, each element must independently have a $50\%$ chance of inclusion; (3) Filter the stream using an independent boolean predicate: `filter(item -> rand.nextBoolean())` or `ThreadLocalRandom.current().nextBoolean()`; (4) Collect the resulting elements into a list: `.collect(Collectors.toList())`; (5) Runs in **$O(N)$ time** and **$O(N)$ expected space**.
> * **Production Reality:** Randomized A/B testing user assignment, Monte Carlo simulations, and reservoir sampling algorithms.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 13.8), we are asked:

*"Using Lambda expressions, write a function List<Integer> getRandomSubset(List<Integer> list) that returns a random subset of arbitrary size where all 2^N subsets are equally likely to be chosen."*

## 2. Mathematical Proof of Uniform Probability

Given a set $L$ with $|L| = N$:
Total number of subsets is $|\mathcal{P}(L)| = 2^N$.

For any specific target subset $S$ with $|S| = k$:
$$P(S) = \prod_{x \in S} P(\text{include } x) \times \prod_{y \notin S} P(\text{exclude } y) = \left(\frac{1}{2}\right)^k \times \left(\frac{1}{2}\right)^{N - k} = \left(\frac{1}{2}\right)^N = \frac{1}{2^N}$$

Since every subset has probability exactly $1 / 2^N$, uniform distribution is guaranteed.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

public class RandomSubsetGenerator {

    /**
     * Generates a uniformly distributed random subset using Lambda expressions.
     * Time Complexity: O(N)
     * Space Complexity: O(N)
     */
    public static List<Integer> getRandomSubset(List<Integer> list) {
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }

        Random rand = new Random();
        return list.stream()
            .filter(item -> rand.nextBoolean()) // Independent 50% probability inclusion
            .collect(Collectors.toList());
    }

    /**
     * High-Performance Thread-Safe Concurrent Implementation
     */
    public static <T> List<T> getRandomSubsetConcurrent(List<T> list) {
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }

        return list.stream()
            .filter(item -> ThreadLocalRandom.current().nextBoolean())
            .collect(Collectors.toList());
    }
}
```

## Complexity & Probability Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Single streaming pass evaluating $N$ random booleans. |
| Expected Subset Size | $E[K] = N / 2$ | Expected binomial distribution mean $\mu = N \cdot p = 0.5N$. |
| Subset Probability | $P(S) = 2^{-N}$ | Strictly uniform across all $2^N$ power set combinations. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: High-Throughput Random Number Generation

1. **`ThreadLocalRandom` vs `java.util.Random`:** Standard `java.util.Random` uses an `AtomicLong` seed updated via CAS (Compare-And-Swap). Under multi-threaded concurrent workloads, thousands of threads contending on the same seed cause heavy CPU cache-line bouncing. `ThreadLocalRandom` isolates the seed to each thread's local storage with zero synchronization overhead.
2. **Cryptographic Randomness:** For security token sub-sampling, use `SecureRandom` to prevent PRNG state recovery attacks.

## Edge Cases & Production Hardening

1. **Empty List:** Returns empty list immediately without throwing exceptions.
2. **Null List:** Handled via null-check returning an unmodifiable empty list.
