---
title: "Pattern Matching: Diophantine String Decomposition (CTCI 16.18)"
description: "Verify if a string matches a two-variable pattern ('a' and 'b') using linear Diophantine length equations and candidate string verification in O(N^2) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-18-pattern-matching.webp
previewImage: /assets/images/ctci-16-18-pattern-matching.webp
---

> **TL;DR**
> * **The Book Problem:** You are given two strings, `pattern` (containing only `'a'` and `'b'`) and `value`. Determine if `value` matches `pattern` (e.g. `catcatgocatgo` matches `aabab` where `a = "cat"` and `b = "go"`).
> * **The Optimal Solution:** **Linear Diophantine Length Equation**:
>   1. **Canonical Normalization**: If pattern starts with `'b'`, invert all characters (`'a' \leftrightarrow 'b'`) so pattern starts with `'a'`.
>   2. **Count Frequencies**: Count total occurrences of `'a'` ($c_a$) and `'b'` ($c_b$) in the pattern.
>   3. **Length Constraint**: For string length $L = |\text{value}|$:
>      $$c_a \cdot L_a + c_b \cdot L_b = L \implies L_b = \frac{L - c_a \cdot L_a}{c_b}$$
>   4. **Iterate $L_a$**: Loop over candidate lengths $L_a \in [0, \lfloor L / c_a \rfloor]$. If remaining length divides evenly by $c_b$, extract candidate substrings $s_a$ and $s_b$ and verify against `value`.
>   5. Runs in **$O(L^2)$ time** and **$O(L)$ space** (substantially outperforming $O(2^L)$ exponential backtracking).
> * **Production Reality:** Regular expression pattern compilation (capturing backreferences `\1`, `\2`), compiler macro expansion, and natural language template extraction.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.18), we are asked:

*"Given a pattern string consisting of 'a' and 'b' and an arbitrary value string, determine whether there exist distinct non-overlapping substrings for 'a' and 'b' that reconstruct value."*

## 2. Diophantine Length Mechanics

For `pattern = "aabab"` ($c_a = 3, c_b = 2$) and `value = "catcatgocatgo"` ($L = 13$):

$$3 \cdot L_a + 2 \cdot L_b = 13$$

| Candidate $L_a$ | $13 - 3 \cdot L_a$ | Valid $L_b$? | Candidate Substrings | Match? |
|---|---|---|---|---|
| $L_a = 1$ | $10$ | $L_b = 5$ | `a="c", b="atcat"` | No |
| $L_a = 2$ | $7$ | Non-integer ($7/2$) | Skip | Skip |
| **$L_a = 3$** | **$4$** | **$L_b = 2$** | **`a="cat", b="go"`** | **MATCH!** |

## Production Java Implementation

```java
public class PatternMatching {

    public static boolean matches(String pattern, String value) {
        if (pattern == null || value == null) return false;
        if (pattern.isEmpty()) return value.isEmpty();

        // 1. Canonicalize pattern to always start with 'a'
        char mainChar = pattern.charAt(0);
        char altChar = (mainChar == 'a') ? 'b' : 'a';
        int size = value.length();

        int countOfMain = 0;
        int countOfAlt = 0;
        for (char c : pattern.toCharArray()) {
            if (c == mainChar) countOfMain++;
            else countOfAlt++;
        }

        // 2. Base case: Pattern contains only one distinct character
        if (countOfAlt == 0) {
            if (size % countOfMain != 0) return false;
            int len = size / countOfMain;
            String cand = value.substring(0, len);
            return verifyPattern(pattern, value, cand, "", mainChar);
        }

        // 3. Find first index where altChar appears in pattern
        int firstAlt = pattern.indexOf(altChar);
        int maxMainSize = size / countOfMain;

        // 4. Iterate all valid lengths for mainChar
        for (int mainSize = 0; mainSize <= maxMainSize; mainSize++) {
            int remainingLength = size - (mainSize * countOfMain);
            if (remainingLength % countOfAlt == 0) {
                int altSize = remainingLength / countOfAlt;
                int altIndex = firstAlt * mainSize;

                String mainSub = value.substring(0, mainSize);
                String altSub = value.substring(altIndex, altIndex + altSize);

                if (!mainSub.equals(altSub)) {
                    if (verifyPattern(pattern, value, mainSub, altSub, mainChar)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private static boolean verifyPattern(String pattern, String value, String mainSub, String altSub, char mainChar) {
        int stringIndex = 0;
        for (char c : pattern.toCharArray()) {
            String target = (c == mainChar) ? mainSub : altSub;
            if (target.isEmpty()) continue;

            if (stringIndex + target.length() > value.length() ||
                !value.startsWith(target, stringIndex)) {
                return false;
            }
            stringIndex += target.length();
        }
        return stringIndex == value.length();
    }
}
```

## Complexity Analysis

| Approach | Time Complexity | Auxiliary Space | Search Space |
|---|---|---|---|
| **Diophantine Decomposition** | **$O(L^2)$** | **$O(L)$** | $\le L / c_a$ candidate lengths |
| **Naive Recursive Backtracking** | $O(2^L)$ | $O(L)$ | Full branch explosion |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Regex Backreferences & Template Engines

1. **Backreference Engine Complexity:** In regex engines (PCRE / Oniguruma), patterns with backreferences (such as `^(.+)\1(.+)\1\2$`) are NP-complete in the general case. Modern matchers optimize 2-group backreferences using linear length Diophantine pruning.
2. **Template Matching:** Code refactoring engines (AST transformations) match syntactic macro templates using variable length bindings.

## Edge Cases & Production Hardening

1. **Empty Pattern or Empty Value:** Fully validated in base cases.
2. **Distinctness Requirement:** `!mainSub.equals(altSub)` ensures `'a'` and `'b'` represent distinct variable bindings.
