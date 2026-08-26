---
title: "Parens: All Valid Parenthesis Strings via Left/Right Counts (Java)"
description: "CTCI-style problem 8.9 for beginners: generate every valid string of n pairs of parentheses. Backtrack with open and close remaining counts, prune illegal prefixes early, and count Catalan results."
date: "2026-02-09"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-9-parens.webp
previewImage: /assets/images/ctci-8-9-parens.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 8.9 for beginners: generate every valid string of n pairs of parentheses. Backtrack with open and close remaining counts, prune illegal prefixes early, and count Catalan results.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You need every string made of **n** open parens and **n** close parens that is **valid**: never more closes than opens in any prefix, and equal counts at the end. For `n = 3` that is five strings, not all 20 ways to place three `(` and three `)`. Most random placements break mid-string.

This post is original teaching for beginners in **Java**. Same problem family as classic interview generate-parentheses questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8 recursion and DP, problem **8.9**.

---

## 1. Everyday analogy

Think of a coat-check counter with **n** tickets and **n** coats.

* Handing out a ticket is `(`.
* Returning a coat is `)`.
* You can never return a coat when nobody is waiting (that would be a `)` with no unmatched `(`).
* At the end every ticket is used and every coat is returned.

Valid sequences are exactly the ways the line can work without a negative "people waiting" count. Invalid sequences try to return a coat first, or end with tickets still out.

You do not list every shuffle of n opens and n closes and then filter. You only extend prefixes that still could finish valid. That is the backtracking idea: two counters, two choices, prune early.

---

## 2. Plain problem statement

**Input:** a non-negative integer `n`, the number of pairs.

**Output:** all strings of length `2n` that use exactly `n` characters `(` and `n` characters `)` and are correctly matched.

**Examples:**

| n | Valid strings |
| --- | --- |
| 0 | `[""]` (one empty string; pick a convention) |
| 1 | `["()"]` |
| 2 | `["(())", "()()"]` |
| 3 | `["((()))", "(()())", "(())()", "()(())", "()()()"]` |

**Clarify before coding:**

* `n = 0`: empty list or one empty string? Teaching choice here: one empty result (base case of the recursion).
* Order of results? Not required. Any order is fine unless they ask for lexicographic.
* Only `(` and `)`? Yes for the classic problem. Brackets of other types are a different question.
* Return `List<String>` in Java. Do not print only; collect so tests are easy.

You are **not** asked to validate one string (that is the stack problem). You **generate** every valid one.

---

## 3. Think first

### Two rules that define valid

A string of parens is valid if and only if:

1. In every prefix, `#(` ≥ `#)`.
2. At the full string, `#(` = `#) = n`.

Rule 1 stops `)(` and `())(`. Rule 2 stops leftover opens.

### Why brute force of all sequences is weak

There are `C(2n, n)` strings with exactly n opens and n closes. Many fail rule 1. For `n = 3`, `C(6, 3) = 20` candidates and only **5** valid. For larger n the gap grows. Interviewers want pruning while you build, not generate-then-filter.

### Left and right remaining counts

Keep:

* `left`: how many `(` you still may place (start at `n`).
* `right`: how many `)` you still may place (start at `n`).

At each step:

1. If `left > 0`, you may place `(`, then recurse with `left - 1`.
2. If `right > left`, you may place `)` (you still have more closes budgeted than opens remaining, which means more opens are already on the path than closes). Then recurse with `right - 1`.
3. If `left == 0` and `right == 0`, the path is a complete valid string. Record it.

Why `right > left` for a close? After placing some characters, opens placed = `n - left`, closes placed = `n - right`. You need closes placed < opens placed before adding another close, i.e. `n - right < n - left`, which simplifies to `right > left`. Same invariant, different counters.

### Same idea with used counts

Some people track `openUsed` and `closeUsed` from zero:

* Place `(` if `openUsed < n`.
* Place `)` if `closeUsed < openUsed`.

Same tree. Pick one story and stick to it. Below uses **remaining** counts.

### Tree for n = 2

```
path="", left=2, right=2
  '(' → "(", 1, 2
    '(' → "((", 0, 2
      ')' → "(()", 0, 1
        ')' → "(())"  done
    ')' → "()", 1, 1
      '(' → "()(", 0, 1
        ')' → "()()"  done
      ')'  forbidden (right == left; close would break balance)
  ')'  forbidden at root (need right > left; here they are equal)
```


Two leaves: `(())` and `()()`. No dead ends that finish as invalid strings.

### Count: Catalan numbers

The number of valid strings for n pairs is the **nth Catalan number**:

```
C_n = (1 / (n + 1)) * (2n choose n)
```

| n | C_n |
| --- | --- |
| 0 | 1 |
| 1 | 1 |
| 2 | 2 |
| 3 | 5 |
| 4 | 14 |
| 5 | 42 |

Say this in the interview. Output size is Catalan, not `2^(2n)` and not `C(2n, n)`.

### Builder choice

`StringBuilder` for the current path: append, recurse, delete last char. Length of every complete answer is `2n`.

---

## 4. Java solution

```java
import java.util.ArrayList;
import java.util.List;

/**
 * Generate all valid strings of n pairs of parentheses.
 * Backtracking with remaining open and close counts.
 */
public class Parens {

    public List<String> generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        if (n < 0) {
            return result;
        }
        backtrack(n, n, new StringBuilder(), result);
        return result;
    }

    /**
     * @param left  remaining '(' you may still place
     * @param right remaining ')' you may still place
     */
    private void backtrack(int left, int right, StringBuilder path, List<String> result) {
        if (left == 0 && right == 0) {
            result.add(path.toString());
            return;
        }

        if (left > 0) {
            path.append('(');
            backtrack(left - 1, right, path, result);
            path.deleteCharAt(path.length() - 1);
        }

        // Only close when more opens are already on the path than closes.
        // Equivalent: remaining closes strictly exceed remaining opens.
        if (right > left) {
            path.append(')');
            backtrack(left, right - 1, path, result);
            path.deleteCharAt(path.length() - 1);
        }
    }
}
```

### Walkthrough: n = 3

Start `left = 3`, `right = 3`, path empty.

1. Must open first: `"("`, left 2, right 3.
2. From there you can open or close (right > left). Branches grow every legal mix.
3. Leaves (in one depth-first order):

```
((()))
(()())
(())()
()(())
()()()
```

Five strings. Matches `C_3 = 5`.

### Optional: used-count form

Same control flow, different parameters:

```java
private void backtrack(int n, int openUsed, int closeUsed, StringBuilder path, List<String> result) {
    if (path.length() == 2 * n) {
        result.add(path.toString());
        return;
    }
    if (openUsed < n) {
        path.append('(');
        backtrack(n, openUsed + 1, closeUsed, path, result);
        path.deleteCharAt(path.length() - 1);
    }
    if (closeUsed < openUsed) {
        path.append(')');
        backtrack(n, openUsed, closeUsed + 1, path, result);
        path.deleteCharAt(path.length() - 1);
    }
}
```

Call with `backtrack(n, 0, 0, new StringBuilder(), result)`. Prefer one form in the interview so you do not mix the inequality.

### Smoke tests

```java
Parens p = new Parens();

assert p.generateParenthesis(0).equals(List.of(""));
assert p.generateParenthesis(1).equals(List.of("()"));

List<String> two = p.generateParenthesis(2);
assert two.size() == 2;
assert two.contains("(())") && two.contains("()()");

List<String> three = p.generateParenthesis(3);
assert three.size() == 5;
assert three.contains("((()))");
assert three.contains("(()())");
assert three.contains("(())()");
assert three.contains("()(())");
assert three.contains("()()()");

assert p.generateParenthesis(4).size() == 14;
```

---

## 5. Complexity table

Let `C_n` be the nth Catalan number (number of results).

| Piece | Cost | Notes |
| --- | --- | --- |
| Result count | `C_n` | ~ `4^n / (n^(3/2) √π)` asymptotically |
| Each result length | `2n` | fixed |
| Work to build all | O(C_n · n) style | each valid string is a path of length 2n; internal nodes share prefixes |
| Recursion depth | O(n) | at most 2n frames, path length ≤ 2n |
| Extra space | O(n) stack + path | beyond the output list |
| Output space | O(C_n · n) | must store every string |

You cannot list all answers faster than proportional to output size. The win is that you never visit a prefix that already broke the balance rule. A generate-all-`C(2n,n)`-then-filter approach pays for invalid full strings too.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **n = 0** → one empty string (if that is your base case).
* **n = 1** → only `"()"`.
* **n negative** → empty list; do not recurse forever.
* **Large n** → `C_10 = 16796`, `C_15` is already large. Mention Catalan growth if they ask about scale.
* **Only collect length 2n** → if you forget the base case and also forget both counters hit zero, you miss results or hang.

Common mistakes:

1. **Allowing `)` whenever `right > 0`.** That permits `)(` prefixes. Need `right > left` (remaining) or `closeUsed < openUsed` (used).
2. **Forgetting to undo** the append (`deleteCharAt`). Sibling branches share a dirty builder.
3. **Generating all `C(2n, n)` bit patterns or shuffles**, then validating with a stack. Correct but slower story; lead with prune-as-you-go.
4. **Using a Set to dedupe.** Valid generation should not create duplicates if each step places a single fixed character type under clear counters.
5. **Off-by-one on n pairs vs n characters.** Total length is **2n**, not n.
6. **Printing only**, no return value. Prefer a list so complexity and tests are clear.

Related problems people mix up:

* **Validate one string:** stack or counter, O(n). Not this problem.
* **Longest valid parentheses substring:** DP or stack. Different.
* **Generate with multiple bracket types** under nesting rules: similar backtracking, more symbols.

---

## 7. Explain to a friend recap

Parens generation, interview version:

1. You need every string with n `(` and n `)` that never goes negative on balance and ends at zero.
2. Build left to right. Track how many opens and closes you still may place (or how many you already used).
3. Place `(` when opens remain.
4. Place `)` only when a close would not beat the opens already written.
5. When both remaining counts are zero, record the string.
6. Count of answers is the nth Catalan number: 1, 1, 2, 5, 14, ...
7. Same backtracking skeleton as permutations: choose, recurse, undo. The legality filter is the balance rule.

If you can draw the n = 2 tree with two leaves and explain why a leading `)` is banned, you own problem 8.9. Next up, paint fill floods a region with another recursive walk.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Permutations with Dups](/blog/en/ctci-8-8-permutations-with-dups)
* Next: [Paint Fill](/blog/en/ctci-8-10-paint-fill)