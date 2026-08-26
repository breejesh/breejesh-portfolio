---
title: "Permutations without Dups: All Orders of a Unique String (Java)"
description: "CTCI-style problem 8.7 for beginners: list every permutation of a string whose characters are all different. Backtracking with a used-char set, plain Java, and a short walkthrough for abc."
date: "2025-10-18"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-7-permutations-without-dups.webp
previewImage: /assets/images/ctci-8-7-permutations-without-dups.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 8.7 for beginners: list every permutation of a string whose characters are all different. Backtracking with a used-char set, plain Java, and a short walkthrough for abc.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You have a short word. Every letter is unique. How many ways can you rearrange those letters, and how do you list every arrangement without repeating work? That is **Permutations without Dups**: generate all orderings of a string with distinct characters.

This post is original teaching for beginners in **Java**. Same problem family as classic interview "generate all permutations," not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Recursion and dynamic programming, problem **8.7**.

---

## 1. Everyday analogy

Think of three distinct name tags on a table: `A`, `B`, `C`. You want every possible line of people wearing those tags.

* For the **first** seat you may pick any of the three tags.
* For the **second** seat you pick any tag that is still on the table.
* The **last** seat gets whatever is left.

If you draw that as a tree, the first level has three branches, each second level has two, and the leaves are full lines: `ABC`, `ACB`, `BAC`, `BCA`, `CAB`, `CBA`. Six leaves, which is `3! = 6`.

The coding trick is the same tree walk: **choose**, **recurse**, **undo** the choice so the next branch sees a clean table. That undo step is backtracking.

---

## 2. Plain problem statement

**Input:** a string `s` whose characters are **all different** (no duplicate letters).

**Output:** a list of every distinct permutation of `s`. Order of the list does not matter unless the interviewer asks for sorted output.

**Examples:**

| Input | Output (any order) |
| --- | --- |
| `"abc"` | `"abc"`, `"acb"`, `"bac"`, `"bca"`, `"cab"`, `"cba"` |
| `"ab"` | `"ab"`, `"ba"` |
| `"a"` | `"a"` |
| `""` | one empty string (or an empty list; pick one and stick to it) |

**Clarify before coding:**

* Characters are unique? (Yes for 8.7. Problem 8.8 handles duplicates.)
* Case sensitive? (`'A'` and `'a'` are different if both appear.)
* Return `List<String>` or print? (Returning a list is easier to test.)
* Empty string? (One empty permutation is a clean base case.)
* Mutate the input? (Prefer working on a char array copy or a builder so callers keep their string.)

---

## 3. Think first

### Count first

For `n` unique characters there are `n!` permutations. For `n = 10` that is already over three million. Interviews want the generator, not a claim that you materialize huge `n` for free.

### Brute idea (say it, skip coding it)

Generate every ordering of indices with nested loops or with `Collections.shuffle` until you "have enough." Neither scales, and shuffle does not prove completeness. Skip it once you have named factorial growth.

### Clean recursive idea

Build a partial answer `prefix`. At each step:

1. If `prefix` length equals `n`, store a copy of `prefix` and return.
2. For each character that is **not yet used**, append it, recurse, then remove it (backtrack).

You need a way to know which characters are free:

* A `boolean[] used` of length `n` (index into the original string), or
* A set of remaining characters, or
* In-place **swaps** on a char array (swap chosen char into the current index, recurse on the suffix, swap back).

All three are valid. The `used` array is easy to explain out loud. Swaps use less extra structure. Below we use `used` for clarity, then show a short swap variant.

### Why "without dups" matters

If the string had two identical letters, the same tree would produce duplicate strings. Problem 8.8 fixes that with "skip a character when it matches a previous unused sibling." Here every character is unique, so every leaf is a distinct string. No extra skip logic.

### Second classic shape (optional)

Another book-style view: take permutations of the string **without** the first character, then insert that character into every index of every sub-permutation. Same count, different recursion. Backtracking with a growing prefix is usually faster to write under pressure.

---

## 4. Java solution

### Backtracking with a used array

```java
import java.util.ArrayList;
import java.util.List;

public class PermutationsWithoutDups {

    public List<String> permutations(String s) {
        List<String> result = new ArrayList<>();
        if (s == null) {
            return result;
        }
        boolean[] used = new boolean[s.length()];
        backtrack(s, new StringBuilder(), used, result);
        return result;
    }

    private void backtrack(String s, StringBuilder path,
                           boolean[] used, List<String> result) {
        if (path.length() == s.length()) {
            result.add(path.toString());
            return;
        }

        for (int i = 0; i < s.length(); i++) {
            if (used[i]) {
                continue;
            }
            used[i] = true;
            path.append(s.charAt(i));
            backtrack(s, path, used, result);
            path.deleteCharAt(path.length() - 1); // undo
            used[i] = false;                       // undo
        }
    }
}
```

Walkthrough for `"abc"`:

1. Path empty. Try index 0 (`a`): path `"a"`.
2. From `"a"`, try `b` → `"ab"`, then only `c` left → `"abc"` (store). Undo `c`, undo `b`.
3. From `"a"`, try `c` → `"ac"`, then `b` → `"acb"` (store). Undo back to empty of `a`.
4. Same for starting with `b`, then with `c`. Six stored strings.

Minimal usage:

```java
List<String> perms = new PermutationsWithoutDups().permutations("abc");
// size 6; contains "abc", "acb", "bac", "bca", "cab", "cba"
```

### Swap-based variant (same idea)

```java
public List<String> permutationsSwap(String s) {
    List<String> result = new ArrayList<>();
    if (s == null) {
        return result;
    }
    char[] chars = s.toCharArray();
    swapBacktrack(chars, 0, result);
    return result;
}

private void swapBacktrack(char[] chars, int index, List<String> result) {
    if (index == chars.length) {
        result.add(new String(chars));
        return;
    }
    for (int i = index; i < chars.length; i++) {
        swap(chars, index, i);
        swapBacktrack(chars, index + 1, result);
        swap(chars, index, i); // restore
    }
}

private void swap(char[] chars, int i, int j) {
    char tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
}
```

At depth `index`, the prefix `chars[0..index)` is fixed. You try every remaining character in the suffix by swapping it into `index`, recurse, then swap back. Same factorial tree, no `boolean[]`.

Either form is fine in an interview. Pick one, finish it, then mention the other if there is time.

---

## 5. Complexity table

| Piece | Cost notes |
| --- | --- |
| Number of leaves | `n!` for unique length-`n` input |
| Work per leaf | O(n) to copy the finished string into the result |
| Total time | O(n · n!) to build every permutation string |
| Recursion depth | O(n) |
| Extra space (ignoring output) | O(n) for path + used flags (or O(1) beyond the char array for swaps) |
| Output space | O(n · n!) to hold every string |

Time is **output-sensitive**. You touch every permutation you return. Do not claim O(n) for the full list. For huge `n`, interviews may ask for a streaming iterator or "count only," which is a different product.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Null input** → empty list (or throw; say which).
* **Empty string** → one empty string in the list is a natural base case.
* **Single character** → list of size 1.
* **Two characters** → two strings; good manual check.
* **Length 0 vs null** → do not treat them the same without saying so.

Common mistakes:

1. **Forgetting to undo.** If you leave `used[i] = true` or leave a char in the builder, later branches miss characters or grow forever.
2. **Mutating a shared `StringBuilder` when storing.** Always `path.toString()` (a new `String`) before `result.add`.
3. **Assuming sorted input or sorted output.** Neither is required unless asked.
4. **Using this code on strings with duplicate letters.** You will emit duplicate permutations. That is 8.8's job.
5. **Nested loops hard-coded for fixed n.** Collapses when the interviewer changes the length.
6. **Building `n!` lists in your head for complexity and then saying O(n²).** Count leaves first, then cost per leaf.

Quick self-check: for `"ab"`, expect exactly `["ab", "ba"]` (order free). For `"abc"`, expect size `6` and no repeated strings.

---

## 7. Explain to a friend recap

Permutations without dups, interview version:

1. Characters are unique, so every full path through the choice tree is a distinct string.
2. There are `n!` of them.
3. Build a path. At each step pick an **unused** character, recurse, then **undo**.
4. When path length hits `n`, store a copy of the path.
5. `used[]` + `StringBuilder`, or in-place swaps on a char array: same tree.
6. Time O(n · n!), space dominated by the output list.

If you can draw the six leaves for `"abc"`, write the choose-recurse-undo loop without forgetting the undo, and name the factorial size, you own problem 8.7.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Towers of Hanoi](/blog/en/ctci-8-6-towers-of-hanoi)
* Next: [Permutations with Dups](/blog/en/ctci-8-8-permutations-with-dups)