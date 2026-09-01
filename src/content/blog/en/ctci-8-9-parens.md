---
title: "Parens: Generating Valid Parentheses Combinations (CTCI 8.9)"
description: "Generate all Catalan-number valid combinations of n pairs of parentheses using bounded prefix backtracking in O(4^N / sqrt(N)) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-9-parens.webp
previewImage: /assets/images/ctci-8-9-parens.webp
---

> **TL;DR**
> * **The Book Problem:** Implement an algorithm to print all valid (properly opened and closed) combinations of $n$ pairs of parentheses.
> * **The Optimal Solution:** Bounded Prefix Backtracking: (1) Maintain counts of remaining open parens `leftRem` and closed parens `rightRem`; (2) At each index $0 \dots 2N - 1$, add `'('` if `leftRem > 0`; (3) Add `')'` if and only if `rightRem > leftRem` (ensuring we never close a parenthesis that hasn't been opened); (4) Generates exactly the $n$-th **Catalan Number** $C_n = \frac{1}{n+1}\binom{2n}{n} \approx O\left(\frac{4^n}{n\sqrt{n}}\right)$ valid combinations in optimal $O(C_n \cdot N)$ time and $O(N)$ auxiliary stack space.
> * **Production Reality:** Compiler AST parser validation (LALR / LL(k) grammars), JSON / XML tokenizer nesting balance checkers, and SQL nested subquery validation engines.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.9), we are asked:

*"Implement an algorithm to print all valid (e.g., properly opened and closed) combinations of n pairs of parentheses."*

**Example ($n = 3$):**
`["((()))", "(()())", "(())()", "()(())", "()()()"]`

## 2. Bounded Prefix Backtracking Logic

A parentheses string is valid if and only if:
1. Total `'('` equals total `')'` ($= n$).
2. At every prefix, the number of `')'` never exceeds the number of `'('`.

We construct the string character-by-character:
* Insert `'('` whenever `leftRem > 0`.
* Insert `')'` whenever `rightRem > leftRem`.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class ValidParens {
    /**
     * Generates all valid combinations of n pairs of parentheses.
     * Time Complexity: O(4^N / sqrt(N)) [Catalan number Cn * N]
     * Space Complexity: O(N) auxiliary recursion stack space
     */
    public static List<String> generateParens(int count) {
        char[] str = new char[count * 2];
        List<String> list = new ArrayList<>();
        addParen(list, count, count, str, 0);
        return list;
    }

    private static void addParen(List<String> list, int leftRem, int rightRem,
                                 char[] str, int index) {
        // Invalid state: more right parens remaining than left parens
        if (leftRem < 0 || rightRem < leftRem) return;

        // Base case: all parens placed
        if (leftRem == 0 && rightRem == 0) {
            list.add(String.copyValueOf(str));
        } else {
            if (leftRem > 0) {
                str[index] = '(';
                addParen(list, leftRem - 1, rightRem, str, index + 1);
            }
            if (rightRem > leftRem) {
                str[index] = ')';
                addParen(list, leftRem, rightRem - 1, str, index + 1);
            }
        }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | $O\left(\frac{4^N}{\sqrt{N}}\right)$ | Generates exactly $C_N = \frac{1}{N+1}\binom{2N}{N}$ strings, with $O(N)$ copy cost per string. |
| Auxiliary Space | `O(N)` | Recursion depth bounded by $2N$ call frames and a single reusable character buffer. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Grammar Parsing & AST Validation

1. **Compiler AST Parsers (ANTLR / LLVM Clang):** Validates matched bracket, curly brace, and parenthesis scopes across source files using pushdown automaton states.
2. **JSON / YAML Stream Parsers (Jackson / Serde):** Validates nesting depth against maximum recursion limits (e.g. max depth 1,000) to prevent stack overflow exploits.

## Edge Cases & Production Hardening

1. **$n = 0$:** Returns `[""]`.
2. **$n = 1$:** Returns `["()"]`.
3. **$n = 3$:** Returns all 5 Catalan permutations.
