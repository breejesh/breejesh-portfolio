---
title: "Power Set: All Subsets via Recursion and Bit Masks (Java)"
description: "CTCI-style problem 8.4 for beginners: return every subset of a set, including empty and full. Recursive build from smaller power sets, optional bit-mask enumeration, and Java code."
date: "2025-12-13"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-4-power-set.webp
previewImage: /assets/images/ctci-8-4-power-set.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 8.4 for beginners: return every subset of a set, including empty and full. Recursive build from smaller power sets, optional bit-mask enumeration, and Java code.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You have a bag of distinct stickers: `{A, B, C}`. How many different bags can you make if each sticker is either in or out? Empty bag counts. Full bag counts. Pairs count. That list of bags is the **power set**: every subset of the original set.

This post is original teaching for beginners in **Java**. Same problem family as classic interview recursion warmups, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8, recursion and dynamic programming, problem 8.4.

---

## 1. Everyday analogy

Picture a sandwich shop with three toppings: lettuce, tomato, cheese. Each topping is a yes or no choice. Order at the counter:

* no toppings
* only lettuce
* only tomato
* only cheese
* lettuce + tomato
* lettuce + cheese
* tomato + cheese
* all three

That is `2 × 2 × 2 = 8` orders. Same count as the power set of a 3-element set: **2^n** subsets for **n** elements.

You can grow the menu recursively. With zero toppings you only have the empty order. Add cheese: every old order stays, and you also get a copy of each old order with cheese on top. Add tomato the same way. Add lettuce the same way. That is the recursive build. Bit masks do the same job with a loop over numbers `0` through `2^n - 1`, where each bit says "include this topping."

---

## 2. Plain problem statement

**Input:** a set of distinct elements. In code we usually take a `List` or array of unique values (e.g. characters or integers).

**Output:** a collection of all subsets. Order of subsets usually does not matter. Order inside a subset can follow input order for stable demos.

**Must include:**

* the empty subset `{}`
* the full set itself
* every proper subset in between

**Example:**

```
Input:  {1, 2, 3}

Power set (8 subsets):
  {}
  {1}
  {2}
  {3}
  {1, 2}
  {1, 3}
  {2, 3}
  {1, 2, 3}
```

**Clarify in the interview:**

* Elements unique? (Yes for classic power set. Duplicates need a different problem.)
* Return type: `List<List<T>>` is common in Java.
* Mutating caller lists? Prefer defensive copies of each subset when you store it.
* n small? Output size is **2^n**. For n = 20 you already have about a million subsets. Say that out loud.

---

## 3. Think first

### Count first

| n | Number of subsets |
| --- | --- |
| 0 | 1 (`{}` only) |
| 1 | 2 |
| 2 | 4 |
| 3 | 8 |
| n | 2^n |

You cannot do better than O(2^n · poly(n)) time if you must list every subset. Space for the answer is the same order of magnitude.

### Recursive idea (build from n-1)

Let `P(S)` be the power set of `S`.

1. If `S` is empty, `P(S) = { {} }`.
2. Otherwise pick one element `e` and let `rest = S without e`.
3. Compute `P(rest)`.
4. For each subset `sub` in `P(rest)`, keep `sub` as-is, and also make `sub ∪ {e}`.

Every subset either contains `e` or does not. Those two families cover the power set with no overlap.

```
P({1,2}) with e=2, rest={1}:
  P(rest) = { {}, {1} }
  without 2:  {}, {1}
  with 2:     {2}, {1,2}
  result:     {}, {1}, {2}, {1,2}
```

### Index recursion (include / exclude)

Same math, different code shape: walk indices `0 .. n-1` with a current path.

* At index `i`, branch **exclude** element `i`, then branch **include** element `i` (push, recurse, pop).
* When `i == n`, copy the current path into the answer.

This is classic backtracking. Interviewers often prefer it because the call tree is easy to draw.

### Bit mask idea

There are exactly `2^n` integers from `0` to `2^n - 1`. For mask `m`, bit `j` decides whether element `j` is in the subset:

```
n = 3, elements [a, b, c]
mask 0 = 000 -> {}
mask 1 = 001 -> {a}
mask 2 = 010 -> {b}
mask 3 = 011 -> {a,b}
mask 4 = 100 -> {c}
...
mask 7 = 111 -> {a,b,c}
```

No recursion stack. Great second approach after the recursive one.

### What not to do

* Nested loops only for fixed n (hard-codes depth).
* Mutating one shared list into the answer without copying (every stored subset ends up the same).
* Forgetting the empty set (or forgetting the full set).
* Using a set-of-sets without a clear element type / hash story when a list-of-lists is enough for the interview.

---

## 4. Java solution

### 4.1 Recursive build from smaller power sets

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Power set by growing from P(rest).
 * Each new element doubles the number of subsets.
 */
public class PowerSetRecursive {

    public static List<List<Integer>> powerSet(List<Integer> set) {
        List<List<Integer>> result = new ArrayList<>();
        if (set == null) {
            return result;
        }
        // start with the empty subset
        result.add(new ArrayList<>());

        for (int element : set) {
            // snapshot size: only clone subsets built so far
            int sizeBefore = result.size();
            for (int i = 0; i < sizeBefore; i++) {
                List<Integer> withElement = new ArrayList<>(result.get(i));
                withElement.add(element);
                result.add(withElement);
            }
        }
        return result;
    }

    public static void main(String[] args) {
        List<Integer> set = Arrays.asList(1, 2, 3);
        List<List<Integer>> all = powerSet(set);
        System.out.println(all.size()); // 8
        for (List<Integer> subset : all) {
            System.out.println(subset);
        }
    }
}
```

Walk-through for `{1, 2, 3}`:

| Step | Element added | Subsets after step |
| --- | --- | --- |
| start | - | `{}` |
| 1 | 1 | `{}`, `{1}` |
| 2 | 2 | `{}`, `{1}`, `{2}`, `{1,2}` |
| 3 | 3 | eight subsets: previous four plus each with 3 |

### 4.2 Backtracking include / exclude

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class PowerSetBacktrack {

    public static List<List<Integer>> powerSet(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        if (nums == null) {
            return result;
        }
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }

    private static void backtrack(
            int[] nums,
            int index,
            List<Integer> path,
            List<List<Integer>> result) {
        if (index == nums.length) {
            // must copy: path is reused on the way back
            result.add(new ArrayList<>(path));
            return;
        }

        // exclude nums[index]
        backtrack(nums, index + 1, path, result);

        // include nums[index]
        path.add(nums[index]);
        backtrack(nums, index + 1, path, result);
        path.remove(path.size() - 1); // pop
    }

    public static void main(String[] args) {
        List<List<Integer>> all = powerSet(new int[] {1, 2, 3});
        System.out.println(all.size()); // 8
        for (List<Integer> subset : all) {
            System.out.println(subset);
        }
    }
}
```

Call tree for two elements `[a, b]`:

```
                    []
           /                  \
     exclude a              include a
          []                    [a]
       /      \              /       \
 exclude b  include b  exclude b  include b
    []        [b]         [a]       [a,b]
```

Four leaves, four subsets. Same pattern scales to n.

### 4.3 Optional bit mask enumeration

```java
import java.util.ArrayList;
import java.util.List;

public class PowerSetBitMask {

    public static List<List<Integer>> powerSet(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        if (nums == null) {
            return result;
        }
        int n = nums.length;
        // 1 << n is 2^n. For n >= 31 use care with int overflow.
        int total = 1 << n;

        for (int mask = 0; mask < total; mask++) {
            List<Integer> subset = new ArrayList<>();
            for (int j = 0; j < n; j++) {
                if ((mask & (1 << j)) != 0) {
                    subset.add(nums[j]);
                }
            }
            result.add(subset);
        }
        return result;
    }

    public static void main(String[] args) {
        List<List<Integer>> all = powerSet(new int[] {1, 2, 3});
        System.out.println(all.size()); // 8
        for (List<Integer> subset : all) {
            System.out.println(subset);
        }
    }
}
```

Mask demo for `[1, 2, 3]`:

| mask | binary | subset |
| --- | --- | --- |
| 0 | 000 | `{}` |
| 1 | 001 | `{1}` |
| 2 | 010 | `{2}` |
| 3 | 011 | `{1, 2}` |
| 4 | 100 | `{3}` |
| 5 | 101 | `{1, 3}` |
| 6 | 110 | `{2, 3}` |
| 7 | 111 | `{1, 2, 3}` |

Which version to lead with in an interview? Start with **include/exclude** or **grow from P(rest)**. Mention bit masks as a clean iterative alternative. All three produce the same 2^n subsets.

---

## 5. Complexity table

| Approach | Time | Extra space (beyond output) | Notes |
| --- | --- | --- | --- |
| Grow from P(rest) | O(n · 2^n) | O(1) beyond result growth | each of 2^n subsets copies up to n elements over time |
| Backtracking | O(n · 2^n) | O(n) recursion + path | 2^n leaves; copy path costs O(n) |
| Bit mask | O(n · 2^n) | O(1) beyond result | simple loops; watch `1 << n` for large n |
| Output size | - | O(n · 2^n) | cannot shrink if you list everything |

Interviewers want you to say **2^n subsets** before coding. If they ask "can we do better?", the answer is no for full enumeration; you can only generate subsets lazily or stop early under extra constraints.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty input:** return a list with one empty subset, not an empty list of subsets.
* **Null input:** empty result or treat as empty set. Pick one and say it.
* **Single element:** `{}` and `{x}` only.
* **Large n:** 2^20 is about 1e6; 2^30 does not fit casually. Mention memory and `1 << n` overflow for bit masks when n ≥ 31 (use `1L << n` or cap n).
* **Duplicate elements in input:** classic power set assumes unique. Duplicates need sorting + skip logic (subset II), different problem.
* **Shared mutable path:** forgetting `new ArrayList<>(path)` makes every stored subset identical.
* **Mutating `size` while iterating the growing list** without a snapshot: infinite loop or wrong doubling. Snapshot `sizeBefore` first.
* **Order requirements:** if the interviewer wants subsets sorted or lexicographic, sort each subset or generate in a fixed index order and sort the outer list at the end.

Common mistakes:

1. **Missing empty subset.** Base case wrong.
2. **No copy on store.** All answers alias one list.
3. **Hard-coded nested loops** for n = 3 only.
4. **`1 << n` for n = 31** overflows int (sign bit). Talk about limits.
5. **Treating power set as permutations.** Order inside a subset does not create new subsets; `{1,2}` and `{2,1}` are the same set.

Minimal smoke idea:

```java
List<List<Integer>> p0 = PowerSetRecursive.powerSet(List.of());
assert p0.size() == 1 && p0.get(0).isEmpty();

List<List<Integer>> p1 = PowerSetRecursive.powerSet(List.of(7));
assert p1.size() == 2;

List<List<Integer>> p3 = PowerSetBitMask.powerSet(new int[] {1, 2, 3});
assert p3.size() == 8;
```

---

## 7. Explain to a friend recap

Power set in interview language:

1. A set of n distinct items has **2^n** subsets: every item is in or out.
2. Always include `{}` and the full set.
3. **Recursive grow:** start with `{ {} }`. For each new element, clone every current subset and add the element to the clone.
4. **Backtrack:** at each index, branch exclude then include; copy the path at the leaves.
5. **Bit mask:** for mask `0 .. 2^n - 1`, include element `j` when bit `j` is set.
6. Time and output space are both **Θ(n · 2^n)** in the usual list-everything formulation.
7. Copy subsets when you store them. Do not alias a shared path list.

If you can draw the include/exclude tree for `{1,2}`, double subsets when adding a third element, and write either recursion or a bit-mask loop without shared-list bugs, you own problem 8.4.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Magic Index](/blog/en/ctci-8-3-magic-index)
* Next: [Recursive Multiply](/blog/en/ctci-8-5-recursive-multiply)