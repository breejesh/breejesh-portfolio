---
title: "Coins: Dynamic Programming for Infinite Coin Change Combinations (CTCI 8.11)"
description: "Calculate the number of ways to represent n cents using infinite quarters (25c), dimes (10c), nickels (5c), and pennies (1c) in O(N) time and O(N) space."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-11-coins.webp
previewImage: /assets/images/ctci-8-11-coins.webp
---

> **TL;DR**
> * **The Book Problem:** Given an infinite number of quarters (25 cents), dimes (10 cents), nickels (5 cents), and pennies (1 cent), write code to calculate the number of ways of representing $n$ cents.
> * **The Optimal Solution:** 2D Memoization / 1D Bottom-Up Dynamic Programming: (1) Standard coin denominations array `denoms = [25, 10, 5, 1]`; (2) 2D memoized table `memo[amount][index]` representing ways to make `amount` using coin denominations from `index` onward; (3) 1D bottom-up iterative DP: `ways[i] += ways[i - coin]` for each denomination, executing in **$O(N)$ time** (where $N = n / 5$) and **$O(N)$ auxiliary space**.
> * **Production Reality:** Discrete currency change algorithms in POS cash registers, integer knapsack partitioning, and packet size segmentation in network MTUs.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.11), we are asked:

*"Given an infinite number of quarters (25 cents), dimes (10 cents), nickels (5 cents), and pennies (1 cent), write code to calculate the number of ways of representing n cents."*

## 2. Dynamic Programming Formulations

### Approach 1: Top-Down Memoized Recursion (Book Solution)
Let $f(\text{amount}, \text{index})$ be the number of ways to make `amount` using coins `denoms[index...]`:
* At each step, choose to take $0, 1, 2, \dots$ coins of denomination `denoms[index]` until $k \cdot \text{denoms}[index] > \text{amount}$.
* Recurse with remaining amount:
  $$f(\text{amount}, \text{index}) = \sum_{k=0}^{\lfloor \text{amount} / \text{denoms}[\text{index}] \rfloor} f(\text{amount} - k \cdot \text{denoms}[\text{index}], \text{index} + 1)$$
* Cache results in `int[][] memo = new int[amount + 1][denoms.length]`.

### Approach 2: 1D Bottom-Up Dynamic Programming
* Initialize `int[] ways = new int[n + 1]; ways[0] = 1;`.
* For each `coin` in `[25, 10, 5, 1]`:
  * For `i` from `coin` to `n`: `ways[i] += ways[i - coin]`.

## Production Implementation

```java
public class CoinChange {
    /**
     * Top-Down 2D Memoized Recursion (Gayle Laakmann McDowell Solution).
     * Time Complexity: O(N * D) where D = 4 denominations
     * Space Complexity: O(N * D)
     */
    public static int makeChange(int amount) {
        int[] denoms = {25, 10, 5, 1};
        int[][] map = new int[amount + 1][denoms.length];
        return makeChangeHelper(amount, denoms, 0, map);
    }

    private static int makeChangeHelper(int amount, int[] denoms, int index, int[][] map) {
        if (map[amount][index] > 0) {
            return map[amount][index];
        }
        if (index >= denoms.length - 1) {
            return 1; // 1 cent is the last denomination: exactly 1 way
        }

        int denomAmount = denoms[index];
        int ways = 0;
        for (int i = 0; i * denomAmount <= amount; i++) {
            int amountRemaining = amount - i * denomAmount;
            ways += makeChangeHelper(amountRemaining, denoms, index + 1, map);
        }

        map[amount][index] = ways;
        return ways;
    }

    /**
     * 1D Bottom-Up Dynamic Programming.
     * Time Complexity: O(N)
     * Space Complexity: O(N)
     */
    public static int makeChangeBottomUp(int n) {
        int[] denoms = {25, 10, 5, 1};
        int[] ways = new int[n + 1];
        ways[0] = 1;

        for (int coin : denoms) {
            for (int i = coin; i <= n; i++) {
                ways[i] += ways[i - coin];
            }
        }

        return ways[n];
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Exactly 4 passes through array of length $N + 1$. |
| Auxiliary Space | `O(N)` | 1D / 2D dynamic programming lookup table. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Integer Partitioning & Knapsack

1. **Point of Sale (POS) Cash Dispensers:** Automated register dispensing algorithms evaluate coin denomination combinations to dispense optimal change under inventory limits.
2. **Network MTU Packet Chunking:** Segmenting arbitrary large byte buffers into standard network packet frame sizes (1500-byte Ethernet, 9000-byte Jumbo).

## Edge Cases & Production Hardening

1. **$n = 0$ cents:** Returns 1 way (using zero coins).
2. **$n < 0$:** Handled via base-case guards returning 0.
3. **Small amounts ($n < 5$):** Returns 1 (all pennies).
