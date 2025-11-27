---
title: "Boolean Evaluation: Count Ways to Parenthesize an Expression (Java)"
description: "CTCI-style problem 8.14 for beginners: count how many full parenthesizations of a 0/1 expression with &, |, and ^ evaluate to true or false. Memoized recursion on substrings in Java."
date: "2025-11-27"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-14-boolean-evaluation.webp
previewImage: /assets/images/ctci-8-14-boolean-evaluation.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 8.14 for beginners: count how many full parenthesizations of a 0/1 expression with &, |, and ^ evaluate to true or false. Memoized recursion on substrings in Java.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A boolean expression is a chain of bits and operators: `1^0|0|1`. Without parentheses it is ambiguous. With full parentheses every binary operator has a clear left and right subexpression. **Boolean Evaluation** asks: given the string and a target truth value, how many different full parenthesizations make the whole thing equal that target?

This post is original teaching for beginners in **Java**. Same problem family as classic recursion and DP interview questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8 ends here on memoized splits of an expression.

---

## 1. Everyday analogy

Think of a line of light switches (`0` off, `1` on) with gates between them: **AND** (`&`), **OR** (`|`), **XOR** (`^`).

You must decide the order of combining pairs. Each order is a full parenthesization:

```
1 ^ 0 | 1
  could be (1 ^ 0) | 1
  or       1 ^ (0 | 1)
```

Those two trees can disagree. The first is `(1) | 1` → true. The second is `1 ^ (1)` → false.

Your job is not to pick one order. It is to **count** how many orders produce a given result (true or false).

Short expressions feel like small trees. Longer ones explode into Catalan-like numbers of binary trees, so you will need memoization.

---

## 2. Plain problem statement

**Input:** a string `expr` of odd length. Characters at even indices are `'0'` or `'1'`. Characters at odd indices are `'&'`, `'|'`, or `'^'`. A boolean `result` (the target).

**Output:** the number of ways to fully parenthesize `expr` so it evaluates to `result`.

**Rules:**

* Every parenthesization is a full binary tree over the operators (each operator has exactly one left subexpression and one right subexpression).
* Operators are evaluated only after both sides are fully resolved (no operator precedence tricks; parentheses decide everything).
* Count distinct parenthesization trees, not distinct final expression strings.

**Examples:**

| Expression | Target | Ways | Notes |
| --- | --- | --- | --- |
| `"1"` | true | 1 | single bit |
| `"1"` | false | 0 | |
| `"1^0\|1"` | true | 1 | walkthrough below |
| `"1^0\|0\|1"` | false | 2 | classic sample |
| `"0&0&0&1^1\|0"` | true | 10 | classic sample |

Clarify:

* Empty string? Return 0 (or define invalid).
* Invalid length or characters? Out of scope; assume well formed.
* Does order of same operators count as different if the tree differs? Yes. Trees, not flattened strings.
* Overflow? Use `int` unless the interviewer says otherwise. For huge strings the count grows fast.

---

## 3. Think first

### Brute: try every split

For a full parenthesization of a multi-operator expression, **some operator is the root** (the last one applied). That operator sits at an odd index `i`. Left substring is `expr[0..i)`, right is `expr[i+1..]`.

Recursively:

1. If length is 1: return 1 if that bit matches the target, else 0.
2. For each operator index `i = 1, 3, 5, ...`:
   * Count ways left is true and false.
   * Count ways right is true and false.
   * Combine with the operator to get how many ways the whole split equals the target.
3. Sum over all root operator positions.

That is correct and matches the definition of full parenthesization.

### Combine truth tables

For one fixed root operator, let:

* `lt`, `lf` = ways left is true / false
* `rt`, `rf` = ways right is true / false

Total ways for this split (any result): `(lt + lf) * (rt + rf)`.

Ways the split is **true**:

| Op | true when |
| --- | --- |
| `&` | left true and right true → `lt * rt` |
| `\|` | not both false → `lt*rt + lt*rf + lf*rt` |
| `^` | sides differ → `lt*rf + lf*rt` |

Ways the split is **false** = total for the split minus ways true (or write the dual table).

Add the chosen count into the answer for this expression and target.

### Why memoization

The same substring (for example `"0|1"`) is asked many times, once for true and once for false, from different parent contexts. Key the memo by `(substring, desiredResult)` or by start/end indices plus result.

Without memo, work tracks the number of binary trees, which grows like Catalan numbers: exponential in the number of operators.

With memo on O(n²) substrings and 2 results, each state scans O(n) split points, so about O(n³) after you pay for substring work carefully. Using indices instead of new strings keeps constants honest.

### Index form (preferred for code)

Work on the original char array with `count(start, end, result)` meaning the substring `expr[start..end)` (end exclusive, `end - start` odd).

Operators live at odd offsets from `start`. Loop `k = start + 1; k < end; k += 2`.

---

## 4. Java solution

### Memoized recursion on substrings (string keys)

Clear first version. Easy to explain on a whiteboard.

```java
import java.util.HashMap;
import java.util.Map;

public class BooleanEvaluation {

    public static int countEval(String expr, boolean result) {
        if (expr == null || expr.isEmpty()) {
            return 0;
        }
        return ways(expr, result, new HashMap<String, Integer>());
    }

    private static int ways(String expr, boolean result, Map<String, Integer> memo) {
        if (expr.length() == 0) {
            return 0;
        }
        if (expr.length() == 1) {
            boolean bit = expr.charAt(0) == '1';
            return bit == result ? 1 : 0;
        }

        String key = result + "#" + expr;
        if (memo.containsKey(key)) {
            return memo.get(key);
        }

        int total = 0;
        // operators sit at odd indices: 1, 3, 5, ...
        for (int i = 1; i < expr.length(); i += 2) {
            char op = expr.charAt(i);
            String left = expr.substring(0, i);
            String right = expr.substring(i + 1);

            int leftTrue = ways(left, true, memo);
            int leftFalse = ways(left, false, memo);
            int rightTrue = ways(right, true, memo);
            int rightFalse = ways(right, false, memo);

            int waysTrue = 0;
            if (op == '&') {
                waysTrue = leftTrue * rightTrue;
            } else if (op == '|') {
                waysTrue = leftTrue * rightTrue
                    + leftTrue * rightFalse
                    + leftFalse * rightTrue;
            } else if (op == '^') {
                waysTrue = leftTrue * rightFalse + leftFalse * rightTrue;
            }

            int totalForSplit = (leftTrue + leftFalse) * (rightTrue + rightFalse);
            int waysForTarget = result ? waysTrue : (totalForSplit - waysTrue);
            total += waysForTarget;
        }

        memo.put(key, total);
        return total;
    }
}
```

### Same idea with indices (less string allocation)

```java
public static int countEvalIndexed(String expr, boolean result) {
    if (expr == null || expr.isEmpty()) {
        return 0;
    }
    // memo[start][end][0=false,1=true] ; -1 means unknown
    int n = expr.length();
    int[][][] memo = new int[n][n + 1][2];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= n; j++) {
            memo[i][j][0] = -1;
            memo[i][j][1] = -1;
        }
    }
    return waysIdx(expr, 0, n, result, memo);
}

private static int waysIdx(String expr, int start, int end, boolean result, int[][][] memo) {
    int r = result ? 1 : 0;
    if (memo[start][end][r] != -1) {
        return memo[start][end][r];
    }

    if (end - start == 1) {
        boolean bit = expr.charAt(start) == '1';
        int ans = bit == result ? 1 : 0;
        memo[start][end][r] = ans;
        return ans;
    }

    int total = 0;
    for (int k = start + 1; k < end; k += 2) {
        char op = expr.charAt(k);
        int lt = waysIdx(expr, start, k, true, memo);
        int lf = waysIdx(expr, start, k, false, memo);
        int rt = waysIdx(expr, k + 1, end, true, memo);
        int rf = waysIdx(expr, k + 1, end, false, memo);

        int waysTrue = 0;
        if (op == '&') {
            waysTrue = lt * rt;
        } else if (op == '|') {
            waysTrue = lt * rt + lt * rf + lf * rt;
        } else if (op == '^') {
            waysTrue = lt * rf + lf * rt;
        }

        int splitTotal = (lt + lf) * (rt + rf);
        total += result ? waysTrue : (splitTotal - waysTrue);
    }

    memo[start][end][r] = total;
    return total;
}
```

### Walkthrough: `"1^0|1"` and target true

Operators at indices 1 (`^`) and 3 (`|`).

**Root at `^`:** left `"1"`, right `"0|1"`.

* Left: 1 true, 0 false.
* Right `"0|1"`: only one tree, `0|1` → true. So right true = 1, right false = 0.
* `^` true when sides differ: `1 * 0 + 0 * 1 = 0`. So 0 ways true for this root.

**Root at `|`:** left `"1^0"`, right `"1"`.

* Left `"1^0"`: one tree, true. left true = 1, left false = 0.
* Right: true = 1.
* `|` true: `1*1 + 1*0 + 0*1 = 1`.

Total ways true = 0 + 1 = **1**.

Ways false = 1 (the other root). Check: `countEval("1^0|1", false)` should be 1.

### Walkthrough: classic `"1^0|0|1"` → false = 2

There are three operators, so Catalan C₃ = 5 full parenthesizations. Exactly two of them evaluate to false. The memoized recursion enumerates those five by choosing each operator as root and combining child counts; you do not list trees by hand in the interview, but you can for a short string to build trust.

Smoke test:

```java
public static void main(String[] args) {
    System.out.println(countEval("1", true));              // 1
    System.out.println(countEval("1", false));             // 0
    System.out.println(countEval("1^0|1", true));          // 1
    System.out.println(countEval("1^0|1", false));         // 1
    System.out.println(countEval("1^0|0|1", false));       // 2
    System.out.println(countEval("0&0&0&1^1|0", true));    // 10
}
```

---

## 5. Complexity table

Let n = length of the string (roughly 2m + 1 for m operators).

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Recursion, no memo | Exponential (Catalan) | O(m) stack | Fine only for tiny inputs |
| Memo on substrings | O(n³) style with index DP | O(n²) states | Preferred interview answer |
| Bottom-up DP on length | Same order | O(n²) | Same recurrence filled short→long |

Each of O(n²) intervals has 2 result flavors. Each interval tries O(n) roots. That multiplies to cubic work. String-key memo is the same asymptotic idea with more allocation.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Single bit** `"0"` / `"1"` with matching or mismatching target.
* **One operator** `"1&0"`, `"1|0"`, `"1^0"`: only one tree; answer is 0 or 1.
* **All false bits with `|`:** still may be false only if every subexpression stays false; walk the tables, do not guess.
* **Target false:** easy to forget and only implement the true tables. Use `total - waysTrue` or write both.
* **Even length or trailing operator:** invalid input; state your assumption.
* **Large n:** counts overflow `int`. Mention `long` if needed.

Common mistakes:

1. **Treating operators with precedence** instead of pure parenthesization. The problem ignores usual precedence; every tree is allowed.
2. **Looping every index as a split**, including bit positions. Only odd indices (operators) are roots.
3. **Memo key missing the result.** Ways to true and ways to false for the same substring differ. Cache both or key by result.
4. **Multiplying wrong truth combinations** for `|` or `^`. Write the three-line table on the board before coding.
5. **Returning total trees when asked for one target.** Always filter by `result`.
6. **Off-by-one on substrings** (`substring(i)` vs `substring(i+1)`). The operator at `i` is not part of either side.

---

## 7. Explain to a friend recap

Boolean Evaluation counts parenthesizations of a `0`/`1` expression with `&`, `|`, `^` that evaluate to a given truth value.

1. Some operator is the last one applied (the root of the parse tree).
2. Split left and right of that operator. Recursively count how often each side is true and false.
3. Combine with the operator's truth table to get ways for true (and false as total minus true).
4. Sum over every possible root operator.
5. Memoize by substring (or start/end) plus desired result so Catalan blow-up dies.

If you can walk `"1^0|1"`, fill the `&` / `|` / `^` true-counts, and explain why the memo key includes the target boolean, you own problem 8.14. Chapter 8 recursion and DP closes on a classic "count ways to parenthesize" pattern.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Stack of Boxes](/blog/en/ctci-8-13-stack-of-boxes)
* Next: [Stock Data](/blog/en/ctci-9-1-stock-data)