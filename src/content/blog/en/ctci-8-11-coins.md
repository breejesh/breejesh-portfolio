---
title: "Coins: Number of Ways to Make Change (Java)"
description: "CTCI-style problem 8.11 for beginners: count combinations that make n cents with quarters, dimes, nickels, and pennies. Bottom-up DP coin change, order does not matter, plain Java."
date: "2026-01-14"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-11-coins.webp
previewImage: /assets/images/ctci-8-11-coins.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 8.11 for beginners: count combinations that make n cents with quarters, dimes, nickels, and pennies. Bottom-up DP coin change, order does not matter, plain Java.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You have infinite coins of a few fixed values. Someone asks: how many different piles make exactly `n` cents? Not the fewest coins. The **count of combinations**. That is the classic **Coins** problem: quarters (25), dimes (10), nickels (5), pennies (1), and a target amount.

This post is original teaching for beginners in **Java**. Same problem family as interview coin-change combination questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8, recursion and dynamic programming, problem 8.11.

---

## 1. Everyday analogy

Think of a vending machine that only accepts 25, 10, 5, and 1. You need to pay exactly 30 cents. You do not care which coin you drop first. Three dimes is one way. One quarter and one nickel is another. Six nickels is another. Order in the slot does not create a new way.

If order mattered, three dimes would explode into many permutations of the same three coins. Interviews almost always want **combinations**: same multiset of coins, one way.

A small table of "how many ways to make each amount" is easier than inventing every pile by hand. That table is dynamic programming.

---

## 2. Plain problem statement

**Input:** a non-negative integer `n` (cents to make). Optionally a list of denominations; the classic set is `{25, 10, 5, 1}`.

**Output:** the number of **distinct combinations** of those coins that sum to exactly `n`. Coins of the same value are identical. You may use as many of each coin as you want (unlimited supply).

**Examples** with coins `{25, 10, 5, 1}`:

| n | Ways (idea) | Count |
| --- | --- | --- |
| 0 | empty pile | 1 |
| 1 | one penny | 1 |
| 5 | five pennies; one nickel | 2 |
| 10 | see walkthrough below | 4 |
| 30 | many mixes of 25/10/5/1 | 18 |

Ways for `n = 10` (each line is one combination):

```
10×1
1×5 + 5×1
2×5
1×10
```

That is 4. You do **not** count `5 then 5` as different from `5 then 5` in reverse; nickels are identical.

**Clarify before coding:**

* Combinations or permutations? Combinations (order does not matter).
* Unlimited supply of each denomination? Yes, unless told otherwise.
* What is `ways(0)`? Usually **1** (one empty combination). Say it out loud.
* Negative `n`? Return 0, or assume callers pass `n >= 0`.
* Return type? `int` is fine for interview sizes; mention `long` if `n` can get large.
* Fixed coins vs generic array? Code the generic array; demo with `{25, 10, 5, 1}`.

---

## 3. Think first

### Brute force recursion

Pick one coin type at a time so order never creeps in. For coin index `i` and remaining amount `rem`:

* If `rem == 0`, count 1.
* If `rem < 0` or you ran out of coin types, count 0.
* Otherwise try using 0, 1, 2, ... copies of `coins[i]`, and recurse on the next coin type with the leftover amount.

That explores every combination once. Without memoization it is slow: many overlapping subproblems like "ways with coins from index 2 and rem = 40".

### Memoized recursion

Cache on `(coinIndex, remaining)`. Same logic, much faster. Still two dimensions of state.

### Bottom-up DP (interview default)

Build an array `ways[0 .. n]` where `ways[a]` means "number of combinations that sum to `a`".

```
ways[0] = 1
for each coin c in coins:
    for a from c to n:
        ways[a] += ways[a - c]
```

Why this loop order matters:

| Outer loop | Inner loop | What you count |
| --- | --- | --- |
| coins, then amounts | as above | **combinations** (each multiset once) |
| amounts, then coins | swap the loops | **permutations** (order matters) |

You want the first table. Each coin is fully "introduced" before you move on, so sequences that only differ by order collapse into one path through the array.

Intuition for one step: once coin `c` is available, every old way to make `a - c` becomes a way to make `a` by adding one more `c`. You may add several `c` coins across successive updates of the same `ways` array because the inner loop runs ascending.

### Tiny walkthrough: n = 10, coins = [1, 5, 10]

Start: `ways = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]`

After coin 1 (only pennies): every amount has 1 way.

After coin 5:

* amount 5: `ways[5] += ways[0]` → 2
* amount 6: `ways[6] += ways[1]` → 2
* ...
* amount 10: `ways[10] += ways[5]` → 3 (then still may pick up more from `ways[5]` already updated... with ascending order, amount 10 also sees the updated lower cells correctly for multiple nickels)

After coin 10: `ways[10] += ways[0]` adds the pure-dime combination. Final `ways[10] = 4`.

### Why not "min coins" DP

The famous "fewest coins" problem stores a minimum length. This problem stores a **count**. Same shape of nested loops, different recurrence:

* min: `dp[a] = min(dp[a], dp[a - c] + 1)`
* ways: `ways[a] += ways[a - c]`

Do not mix them in your head during the interview.

### Design sketch on the whiteboard

1. Write denominations `25, 10, 5, 1`.
2. Draw `ways[0]=1`, rest zero.
3. Process one coin column at a time (mentally) for a small `n` like 10.
4. Circle that loop order (coin outer) so you do not slip into permutations.
5. Code the generic method, then call it with the classic array.

---

## 4. Java solution

```java
/**
 * Number of combinations that sum to n using unlimited coins from denominations.
 * Order does not matter. ways(0) == 1.
 */
int makeChange(int n, int[] coins) {
    if (n < 0) {
        return 0;
    }
    int[] ways = new int[n + 1];
    ways[0] = 1;

    for (int coin : coins) {
        if (coin <= 0) {
            continue; // skip bad denominations if any slip in
        }
        for (int amount = coin; amount <= n; amount++) {
            ways[amount] += ways[amount - coin];
        }
    }
    return ways[n];
}

/** Classic CTCI denominations: quarters, dimes, nickels, pennies. */
int makeChange(int n) {
    return makeChange(n, new int[] {25, 10, 5, 1});
}
```

### Recursive + memo variant (same answer)

Useful if the interviewer asks for top-down first:

```java
int makeChangeMemo(int n, int[] coins) {
    if (n < 0) {
        return 0;
    }
    Integer[][] memo = new Integer[coins.length][n + 1];
    return waysFrom(0, n, coins, memo);
}

private int waysFrom(int index, int remaining, int[] coins, Integer[][] memo) {
    if (remaining == 0) {
        return 1;
    }
    if (index == coins.length) {
        return 0;
    }
    if (memo[index][remaining] != null) {
        return memo[index][remaining];
    }

    int ways = 0;
    int coin = coins[index];
    for (int count = 0; count * coin <= remaining; count++) {
        ways += waysFrom(index + 1, remaining - count * coin, coins, memo);
    }
    memo[index][remaining] = ways;
    return ways;
}
```

The bottom-up array is shorter to type under time pressure. Know both.

### Walkthrough: n = 5, coins = [1, 5]

| Step | State of ways[0..5] |
| --- | --- |
| init | `[1, 0, 0, 0, 0, 0]` |
| after 1 | `[1, 1, 1, 1, 1, 1]` |
| after 5 | `[1, 1, 1, 1, 1, 2]` |

Answer **2**: five pennies, or one nickel.

### Minimal smoke tests

```java
public static void main(String[] args) {
    int[] coins = {25, 10, 5, 1};
    System.out.println(makeChange(0, coins));   // 1
    System.out.println(makeChange(1, coins));   // 1
    System.out.println(makeChange(5, coins));   // 2
    System.out.println(makeChange(10, coins));  // 4
    System.out.println(makeChange(30, coins));  // 18
}
```

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Plain recursion (no memo) | exponential | O(d) stack | d = number of denominations; too slow |
| Memo on (index, rem) | O(d · n · (n/c_min)) worst naive loops; tighter with one-coin branch | O(d · n) | fine; more code |
| Bottom-up `ways[]` | O(d · n) | O(n) | preferred interview answer |
| Bottom-up if only 4 fixed coins | O(n) | O(n) | same idea, d is constant |

For the classic four coins, time is linear in `n`. Still say O(d · n) so you sound general.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **`n = 0`** → return 1 (one empty combination). Not 0.
* **`n` negative** → 0, or reject input.
* **Only pennies** → exactly one way for every non-negative `n`.
* **Cannot make `n`** (for example coins `{2, 4}` and `n = 3`) → `ways[n]` stays 0.
* **Duplicate denominations in the array** → you would double-count; assume unique values, or dedupe first.
* **Coin larger than `n`** → the inner loop simply never runs for that coin; harmless.
* **Integer overflow** → for large `n` and many coins, `int` can wrap. Mention `long` if constraints grow.

Common mistakes:

1. **Swapping loop order** and counting permutations. Three pennies would be overcounted as different orders.
2. **Setting `ways[0] = 0`.** Then every amount stays zero forever.
3. **Using a 2D table unnecessarily** and getting index math wrong. 1D is enough for combinations with unlimited coins.
4. **Solving min-coin instead of count.** Different recurrence.
5. **Mutating the `coins` array or sorting when not needed.** Sorting does not hurt, but combinations DP does not require it if you always process whole coins one type at a time.

---

## 7. Explain to a friend recap

Coins asks: with unlimited 25/10/5/1, how many different combinations make exactly `n` cents?

1. Order does not matter. Three dimes is one way, not six permutations.
2. `ways[0] = 1`. You can make zero cents one way: use nothing.
3. For each coin, walk amounts from that coin up to `n` and do `ways[a] += ways[a - c]`.
4. Coin-outer loop order yields combinations. Amount-outer yields permutations. Say which you want.
5. Time O(d · n), space O(n). For n = 10 the answer is 4; for n = 30 it is 18 with the classic set.

If you can fill `ways` for n = 10 by hand and explain why the loop order kills permutations, you own problem 8.11.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Paint Fill](/blog/en/ctci-8-10-paint-fill)
* Next: [Eight Queens](/blog/en/ctci-8-12-eight-queens)