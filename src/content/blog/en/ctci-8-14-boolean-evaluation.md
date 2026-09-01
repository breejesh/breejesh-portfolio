---
title: "Boolean Evaluation: Counting Parenthesizations with Interval DP (CTCI 8.14)"
description: "Count the number of ways to parenthesize a boolean expression of symbols 0, 1, &, |, ^ to evaluate to a desired boolean result using interval DP in O(N^3) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-14-boolean-evaluation.webp
previewImage: /assets/images/ctci-8-14-boolean-evaluation.webp
---

> **TL;DR**
> * **The Book Problem:** Given a boolean expression consisting of the symbols `0` (false), `1` (true), `&` (AND), `|` (OR), and `^` (XOR), and a desired boolean result value `result`, implement a function to count the number of ways to parenthesize the expression such that it evaluates to `result`.
> * **The Optimal Solution:** Interval Dynamic Programming / Catalan Matrix Chain: (1) Split expression across every binary operator at odd indices $i = 1, 3, 5 \dots$; (2) Recursively compute the number of ways left substring evaluates to `true` ($l_t$) / `false` ($l_f$) and right substring evaluates to `true` ($r_t$) / `false` ($r_f$); (3) Apply boolean truth tables for `&`, `|`, and `^` to aggregate matching combinations; (4) Memoize results using `HashMap<String, Integer>`, running in **$O(N^3)$ time** and **$O(N^2)$ space**.
> * **Production Reality:** SQL query predicate pushdown optimizer trees, compiler AST operator precedence re-association, and hardware digital logic circuit synthesis.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.14), we are asked:

*"Given a boolean expression consisting of the symbols 0 (false), 1 (true), & (AND), | (OR), and ^ (XOR), and a desired boolean result value result, implement a function to count the number of ways to parenthesize the expression such that it evaluates to result."*

**Example:**
* `countEval("1^0|0|1", false)` $\to 2$
* `countEval("0&0&0&1^10", true)` $\to 10$

## 2. Interval Splitting & Truth Tables

For any split at operator $op$:
* Total left ways: $l_{total} = l_t + l_f$
* Total right ways: $r_{total} = r_t + r_f$
* Total ways to parenthesize the partition: $\text{total} = l_{total} \times r_{total}$

### Truth Table Combinatorics:
* **Operator `&`:**
  * $\text{trueWays} = l_t \times r_t$
* **Operator `|`:**
  * $\text{trueWays} = l_t \times r_t + l_t \times r_f + l_f \times r_t$
* **Operator `^`:**
  * $\text{trueWays} = l_t \times r_f + l_f \times r_t$

For any operator, $\text{falseWays} = \text{total} - \text{trueWays}$.

## Production Implementation

```java
import java.util.HashMap;
import java.util.Map;

public class BooleanEvaluation {
    /**
     * Counts the number of ways to parenthesize a boolean expression to equal result.
     * Time Complexity: O(N^3)
     * Space Complexity: O(N^2)
     */
    public static int countEval(String s, boolean result) {
        return countEvalHelper(s, result, new HashMap<>());
    }

    private static int countEvalHelper(String s, boolean result, Map<String, Integer> memo) {
        if (s.length() == 0) return 0;
        if (s.length() == 1) {
            return stringToBool(s) == result ? 1 : 0;
        }

        String key = result + s;
        if (memo.containsKey(key)) {
            return memo.get(key);
        }

        int ways = 0;

        for (int i = 1; i < s.length(); i += 2) {
            char op = s.charAt(i);
            String left = s.substring(0, i);
            String right = s.substring(i + 1);

            int leftTrue = countEvalHelper(left, true, memo);
            int leftFalse = countEvalHelper(left, false, memo);
            int rightTrue = countEvalHelper(right, true, memo);
            int rightFalse = countEvalHelper(right, false, memo);

            int total = (leftTrue + leftFalse) * (rightTrue + rightFalse);
            int totalTrue = 0;

            if (op == '^') {
                totalTrue = leftTrue * rightFalse + leftFalse * rightTrue;
            } else if (op == '&') {
                totalTrue = leftTrue * rightTrue;
            } else if (op == '|') {
                totalTrue = leftTrue * rightTrue + leftFalse * rightTrue + leftTrue * rightFalse;
            }

            int subWays = result ? totalTrue : (total - totalTrue);
            ways += subWays;
        }

        memo.put(key, ways);
        return ways;
    }

    private static boolean stringToBool(String c) {
        return c.equals("1");
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N^3)` | There are $O(N^2)$ distinct substring subproblems, each evaluating up to $O(N)$ operator split points. |
| Auxiliary Space | `O(N^2)` | Memoization map stores distinct substring keys of length $N$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Query Optimizers & ASTs

1. **SQL Predicate Pushdown Tree Enumeration:** Evaluates alternative boolean groupings of `WHERE` clauses to choose the execution plan that filters rows earliest.
2. **Digital Logic Circuit Synthesis (FPGA / ASIC):** Minimizes logic gate delay and area by re-associating symmetric logic operations.

## Edge Cases & Production Hardening

1. **Single Literal (`"1"`, true):** Returns 1.
2. **Single Literal (`"0"`, true):** Returns 0.
3. **Empty String:** Returns 0 safely.
