---
title: "Triple Step: Count Ways to Climb n Stairs with 1, 2, or 3 Hops (Java)"
description: "CTCI-style problem 8.1 for beginners: a child climbs n stairs taking 1, 2, or 3 steps at a time. Count the ways with recursion, memoization, and bottom-up DP in Java."
date: "2026-01-04"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-1-triple-step.webp
previewImage: /assets/images/ctci-8-1-triple-step.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 8.1 for beginners: a child climbs n stairs taking 1, 2, or 3 steps at a time. Count the ways with recursion, memoization, and bottom-up DP in Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A child is running up a staircase with **n** steps. On each move she can take **1**, **2**, or **3** stairs. Order matters: 1 then 2 is different from 2 then 1. How many distinct ways can she climb to the top?

This is the classic warm-up for **recursion and dynamic programming**. You write the recurrence first, watch the call tree explode, then cache answers (memo) or fill an array from the bottom (bottom-up). This post is original teaching for beginners in **Java**. Same problem family as classic interview stair-climbing questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8 starts here.

---

## 1. Everyday analogy

Think of a kid on a playground ladder with `n` rungs left to the platform.

* From any height, she can hop one rung, two rungs, or three rungs (if enough remain).
* Each sequence of hops is a different "route" even if the same sizes appear in a different order.
* For a short ladder, you can list every sequence by hand.
* For a tall ladder, listing dies. You notice: the number of ways to finish from height `i` only depends on the ways from `i-1`, `i-2`, and `i-3`.

That last sentence is the whole algorithm. Once you trust the recurrence, memoization and bottom-up DP are just two ways to compute it without repeating work.

---

## 2. Plain problem statement

**Input:** a non-negative integer `n` (number of stairs).

**Output:** the number of ways to climb `n` stairs taking steps of size 1, 2, or 3 only. Order matters.

**Signature shape:**

```java
long countWays(int n);
```

Use `long` (or `BigInteger` for huge `n`) because the answer grows fast. Interviews often use `int` for small `n`; say the overflow risk out loud.

**Small values you should know cold:**

| n | Ways | Sequences (sketch) |
| --- | --- | --- |
| 0 | 1 | one empty way: already at the top |
| 1 | 1 | `(1)` |
| 2 | 2 | `(1,1)`, `(2)` |
| 3 | 4 | `(1,1,1)`, `(1,2)`, `(2,1)`, `(3)` |
| 4 | 7 | four from last hop 1, two from last hop 2, one from last hop 3 |

For `n = 4`, last hop of size 1 means the first three stairs had 4 ways; last hop 2 means first two stairs had 2 ways; last hop 3 means first one stair had 1 way. Total `4 + 2 + 1 = 7`.

**Clarify in the interview:**

* Is `n = 0` allowed? Common teaching base case: **1** way (do nothing). Some people say 0; pick one and stay consistent with the recurrence.
* Does order matter? **Yes.** Combinations vs permutations: here sequences matter.
* Only steps `{1,2,3}`? Yes for this problem. Generalize later if asked.
* Return type and overflow? State it.
* Negative `n`? Invalid; return 0 or throw.

---

## 3. Think first

### Recurrence

Let `ways(n)` be the number of ways to climb `n` stairs.

To finish `n` stairs, the **last hop** was 1, 2, or 3 (when `n` is large enough):

```
ways(n) = ways(n - 1) + ways(n - 2) + ways(n - 3)   for n > 3
```

Base cases (with the "empty climb counts as 1" model):

```
ways(0) = 1
ways(1) = 1
ways(2) = 2
```

You can also set:

```
ways(0) = 1
ways(negative) = 0
```

and use one recursive formula for all `n > 0`:

```
ways(n) = ways(n - 1) + ways(n - 2) + ways(n - 3)
```

with the negatives contributing zero. Same numbers.

### Why naive recursion is slow

```
ways(5)
  ways(4)
    ways(3) ...
    ways(2) ...
    ways(1) ...
  ways(3) ...
  ways(2) ...
```

`ways(3)` is computed many times. The call tree is exponential. Fine for `n ≤ 10` in a whiteboard demo; dies for larger `n`.

### Memoization (top-down DP)

Same recursive structure, but store `ways(i)` the first time you compute it. Later calls return the stored value. Each `i` from `0` to `n` is filled once, so time becomes linear.

### Bottom-up DP

Allocate an array `dp[0..n]`. Set base cases, then for `i = 3..n` (or `i = 1..n` with careful negatives):

```
dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3]
```

No recursion stack. Easy to optimize to three rolling variables if you only need `ways(n)`.

### Relation to Fibonacci

Classic two-step climbing (`1` or `2` only) is Fibonacci. Triple step is the same idea with a three-term recurrence (tribonacci-style). Naming is optional; the recurrence is what matters.

---

## 4. Java solution

### Naive recursion (show, then improve)

```java
// Exponential. Good for teaching the recurrence only.
long countWaysNaive(int n) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }
    return countWaysNaive(n - 1)
        + countWaysNaive(n - 2)
        + countWaysNaive(n - 3);
}
```

### Top-down with memo array

```java
long countWaysMemo(int n) {
    if (n < 0) {
        return 0;
    }
    long[] memo = new long[n + 1];
    java.util.Arrays.fill(memo, -1);
    return ways(n, memo);
}

long ways(int n, long[] memo) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }
    if (memo[n] != -1) {
        return memo[n];
    }
    memo[n] = ways(n - 1, memo)
        + ways(n - 2, memo)
        + ways(n - 3, memo);
    return memo[n];
}
```

`memo[i] == -1` means "not computed yet." After the first fill, every subproblem is O(1).

### Bottom-up array

```java
long countWaysBottomUp(int n) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }

    // dp[i] = ways to climb i stairs
    long[] dp = new long[n + 1];
    dp[0] = 1;
    if (n >= 1) {
        dp[1] = 1;
    }
    if (n >= 2) {
        dp[2] = 2;
    }

    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3];
    }
    return dp[n];
}
```

### Bottom-up with O(1) extra space

You only need the last three values:

```java
long countWaysRolling(int n) {
    if (n < 0) {
        return 0;
    }
    if (n == 0) {
        return 1;
    }
    if (n == 1) {
        return 1;
    }
    if (n == 2) {
        return 2;
    }

    long a = 1; // ways(0) after shift thinking, or track ways(i-3)
    long b = 1; // ways(1)
    long c = 2; // ways(2)
    // After loop for i, c holds ways(i)
    for (int i = 3; i <= n; i++) {
        long next = a + b + c;
        a = b;
        b = c;
        c = next;
    }
    return c;
}
```

Walkthrough for `n = 4`:

| i | a (i-3) | b (i-2) | c (i-1) | next |
| --- | --- | --- | --- | --- |
| start | 1 | 1 | 2 | |
| 3 | 1 | 2 | 4 | 1+1+2=4 |
| 4 | 2 | 4 | 7 | 1+2+4=7 |

Answer `7`. Matches the table.

### Minimal smoke checks

```java
assert countWaysBottomUp(0) == 1;
assert countWaysBottomUp(1) == 1;
assert countWaysBottomUp(2) == 2;
assert countWaysBottomUp(3) == 4;
assert countWaysBottomUp(4) == 7;
assert countWaysBottomUp(5) == 13;
assert countWaysMemo(10) == countWaysBottomUp(10);
assert countWaysRolling(10) == countWaysBottomUp(10);
assert countWaysNaive(5) == 13;
```

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Naive recursion | O(3^n) rough | O(n) stack | Teaching only |
| Memo top-down | O(n) | O(n) memo + stack | Same recurrence, cached |
| Bottom-up array | O(n) | O(n) | Clear and interview-friendly |
| Rolling three vars | O(n) | O(1) | Best space if only `ways(n)` needed |

All linear methods visit each subproblem a constant number of times. The exponential tree is the thing you must call out and fix.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **`n = 0`:** 1 with the empty-way model; state your choice.
* **`n = 1, 2, 3`:** hardcode or derive carefully so the loop never reads past the array.
* **Negative `n`:** return 0 (or reject).
* **Large `n`:** `int` overflows past small double-digit values; prefer `long` and mention modular arithmetic if they want "ways mod 10^9+7".
* **Off-by-one in the loop:** `for (i = 3; i <= n; i++)` needs `dp` sized `n + 1`.
* **Treating order as irrelevant:** `(1,2)` and `(2,1)` are two ways, not one combination.
* **Wrong base for `ways(0)`:** if you set `ways(0) = 0`, the whole table shifts; stay consistent with the last-hop argument.
* **Memo not initialized:** use a sentinel (`-1`) or a `Boolean` "seen" flag so `0` is a valid stored answer only when you mean "zero ways" for invalid cases (here non-negative bases are positive).

Common mistakes:

1. **Writing Fibonacci for two-step only** when the problem allows three.
2. **Forgetting `ways(n - 3)`** in the sum.
3. **Returning early without caching** in the memo version (defeats the point).
4. **Integer overflow** silently giving wrong answers for `n` around 40+.
5. **Confusing "number of ways" with "minimum hops"** (different problem).

---

## 7. Explain to a friend recap

Triple step in one breath:

1. Last hop is 1, 2, or 3, so `ways(n) = ways(n-1) + ways(n-2) + ways(n-3)`.
2. Base: `ways(0)=1`, `ways(1)=1`, `ways(2)=2` (and negatives are 0).
3. Naive recursion recomputes the same subproblems forever. Cache them or build bottom-up.
4. Bottom-up array is the clean whiteboard answer. Rolling three variables is the space polish.
5. Count **sequences**, not unordered multisets. Watch overflow.

If you can write the recurrence, fill `dp[0..n]` for `n = 5` by hand (answer 13), and explain why memo turns exponential into linear, you own problem 8.1. Chapter 8 is open: next up is a robot walking a grid with blocked cells.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Hash Table](/blog/en/ctci-7-12-hash-table)
* Next: [Robot in a Grid](/blog/en/ctci-8-2-robot-in-a-grid)