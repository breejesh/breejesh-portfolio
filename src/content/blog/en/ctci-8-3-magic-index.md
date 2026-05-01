---
title: "Magic Index: Find i Where A[i] Equals i (Java)"
description: "CTCI-style problem 8.3 for beginners: in a sorted array find an index i with A[i] == i. Distinct values get a binary search. Duplicates need both sides with narrowed bounds."
date: "2026-05-01"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-3-magic-index.webp
previewImage: /assets/images/ctci-8-3-magic-index.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 8.3 for beginners: in a sorted array find an index i with A[i] == i. Distinct values get a binary search. Duplicates need both sides with narrowed bounds.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

Hotel rooms sit in a row numbered 0, 1, 2, ... The guest list is sorted by room preference number. A **magic index** is a room where the guest number matches the room number: `A[i] == i`. You want any such room, or proof that none exists, without scanning every door when you can avoid it.

This post is original teaching for beginners in **Java**. Same problem family as classic "fixed point in a sorted array" interviews, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8 (recursion and dynamic programming) continues here after the grid walk.

---

## 1. Everyday analogy

Think of lockers painted with numbers 0 through 6. Inside each locker you drop a slip with an integer. The slips are already in **sorted** order left to right.

| Index (locker) | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Value (slip) | -1 | 0 | 1 | 3 | 5 | 7 | 9 |

Locker 3 holds slip 3. That is a magic index. Locker 4 holds 5, not 4.

If every slip is **unique**, the sorted line has a clean shape: once values climb above their index and keep rising at least as fast as the indices, the match cannot hide further right. That is why binary search works.

If slips can **repeat**, the line can wobble. Value 2 might sit at index 1 and again later. You cannot always throw away a whole half, but you can still skip ranges that are impossible for a fixed point.

---

## 2. Plain problem statement

**Input:** a sorted array of integers `A` (non-decreasing). Classic warm-up assumes **distinct** values. The follow-up allows **duplicates**.

**Output:** some index `i` with `A[i] == i`, or a sentinel (here `-1`) if none exists.

**Examples (distinct):**

| Array | Magic index | Why |
| --- | --- | --- |
| `{-1, 0, 1, 3, 5, 7, 9}` | `3` | `A[3] == 3` |
| `{0, 2, 3, 4, 5}` | `0` | first cell matches |
| `{1, 2, 3, 4}` | none | every value is strictly above its index |
| `{-10, -5, 2, 5}` | `2` | only mid match |

**Example with duplicates:**

```
A = {-10, -5, 2, 2, 2, 3, 4, 7, 9, 12, 13}
```

Index 7 works (`A[7] == 7`). Depending on mid choices you might also hit other fixed points if they exist; returning any one is enough for this problem.

**Clarify in the interview:**

* Sorted ascending? (Yes.)
* Distinct or not? (Ask. Start distinct, then handle dups.)
* Any magic index or the leftmost? (Any is fine unless they say otherwise.)
* Empty array? Return `-1`.
* Negative values allowed? Yes. Indices stay non-negative, so a negative value can never match its index.

---

## 3. Think first

### Brute force

Walk `i` from 0 to `n - 1`. If `A[i] == i`, return `i`. Time O(n), space O(1). Fine for small n. Interviews want the sorted structure used.

### Distinct values: binary search on the fixed-point gap

Look at mid. Compare `A[mid]` with `mid`.

* **Equal:** done. Return `mid`.
* **`A[mid] > mid`:** for every `j > mid`, sorted + distinct means `A[j] >= A[mid] + (j - mid) > mid + (j - mid) = j`. So `A[j] > j` forever on the right. Search **left** only: `0 .. mid - 1`.
* **`A[mid] < mid`:** for every `j < mid`, `A[j] <= A[mid] - (mid - j) < mid - (mid - j) = j`. So `A[j] < j` forever on the left. Search **right** only: `mid + 1 .. n - 1`.

That is ordinary binary search with a custom compare (`value - index` crosses zero). Recursion depth O(log n).

### Duplicates: both sides, but narrowed

The "distinct" jump fails when values can stay flat. Example:

```
index: 0  1  2  3  4  5
value: 1  1  1  3  5  6
```

At mid 2, `A[2] == 1 < 2`. With the distinct rule you would only search right and miss nothing here, but other shapes break the one-side discard. Safer rule when dups are allowed:

1. Check mid. If match, return it.
2. Search left on a **tight** range: from `start` to `Math.min(mid - 1, A[mid])`.
3. If left fails, search right from `Math.max(mid + 1, A[mid])` to `end`.

Why the min/max?

* A magic index `k` on the left must satisfy `k <= mid - 1` and `A[k] == k`. Sorted order forces `A[k] <= A[mid]`, so `k <= A[mid]`. Upper bound for left is `min(mid - 1, A[mid])`.
* On the right, `k >= mid + 1` and `k == A[k] >= A[mid]`, so lower bound is `max(mid + 1, A[mid])`.

Worst case still O(n) if many duplicates force both branches often. Average case is much better than pure scan when the array is mostly strict. You still use the sorted order instead of ignoring it.

### Recursion vs iteration

Distinct case maps cleanly to a loop (same as binary search). Duplicate case is easier recursive: try left, then right. Stack is O(log n) in balanced splits, up to O(n) in ugly cases. Interviewers usually accept the recursive form.

---

## 4. Java solution

### Distinct integers

```java
/**
 * Magic index for a sorted array of distinct ints.
 * Returns some i with A[i] == i, or -1 if none.
 */
public static int magicIndexDistinct(int[] a) {
    if (a == null || a.length == 0) {
        return -1;
    }
    return magicIndexDistinct(a, 0, a.length - 1);
}

private static int magicIndexDistinct(int[] a, int lo, int hi) {
    if (lo > hi) {
        return -1;
    }
    int mid = lo + (hi - lo) / 2;
    int val = a[mid];
    if (val == mid) {
        return mid;
    }
    if (val > mid) {
        // fixed point, if any, is strictly left
        return magicIndexDistinct(a, lo, mid - 1);
    }
    // val < mid: search right
    return magicIndexDistinct(a, mid + 1, hi);
}
```

Iterative twin (same logic):

```java
public static int magicIndexDistinctIter(int[] a) {
    if (a == null || a.length == 0) {
        return -1;
    }
    int lo = 0;
    int hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int val = a[mid];
        if (val == mid) {
            return mid;
        }
        if (val > mid) {
            hi = mid - 1;
        } else {
            lo = mid + 1;
        }
    }
    return -1;
}
```

### With duplicates (narrowed ranges)

```java
/**
 * Magic index when the sorted array may contain duplicates.
 * Still returns any match, or -1.
 */
public static int magicIndex(int[] a) {
    if (a == null || a.length == 0) {
        return -1;
    }
    return magicIndex(a, 0, a.length - 1);
}

private static int magicIndex(int[] a, int lo, int hi) {
    if (lo > hi) {
        return -1;
    }
    int mid = lo + (hi - lo) / 2;
    int val = a[mid];
    if (val == mid) {
        return mid;
    }

    // Left: only indices that can still equal their value
    int leftHi = Math.min(mid - 1, val);
    int left = magicIndex(a, lo, leftHi);
    if (left >= 0) {
        return left;
    }

    // Right: skip indices that cannot match
    int rightLo = Math.max(mid + 1, val);
    return magicIndex(a, rightLo, hi);
}
```

Prefer the **distinct** method when the interviewer guarantees uniqueness (clearer story, true O(log n)). Switch to the general method when they mention duplicates or "non-decreasing."

---

## 5. Walk through

### Distinct: `{-1, 0, 1, 3, 5, 7, 9}`

| lo | hi | mid | A[mid] | Action |
| --- | --- | --- | --- | --- |
| 0 | 6 | 3 | 3 | equal, return 3 |

One hit. Lucky mid, but the same rules find it from other starts too.

### Distinct miss: `{1, 2, 3, 4}`

| lo | hi | mid | A[mid] | Action |
| --- | --- | --- | --- | --- |
| 0 | 3 | 1 | 2 | 2 > 1, go left |
| 0 | 0 | 0 | 1 | 1 > 0, go left |
| 0 | -1 | | | empty, return -1 |

Every value sits above its index; the search correctly empties.

### Duplicates: `{-10, -5, 2, 2, 2, 3, 4, 7, 9, 12, 13}`

Suppose mid lands on index 5 (`A[5] == 3`).

* Not equal.
* Left high = `min(4, 3) = 3`. Search `0..3`.
* Inside that range you may not hit 7; left returns -1.
* Right low = `max(6, 3) = 6`. Search `6..10`.
* Mid of that might be 8 (`A[8] == 9 > 8`) or 7 (`A[7] == 7`). When mid is 7, return 7.

The narrowed bounds skip index 5 itself (already checked) and can skip some dead cells when `val` and `mid` disagree a lot.

### Sanity checks in code

```java
int[] distinct = {-1, 0, 1, 3, 5, 7, 9};
assert magicIndexDistinct(distinct) == 3;

int[] none = {1, 2, 3, 4};
assert magicIndexDistinct(none) == -1;

int[] dups = {-10, -5, 2, 2, 2, 3, 4, 7, 9, 12, 13};
int m = magicIndex(dups);
assert m >= 0 && dups[m] == m;

assert magicIndex(new int[]{}) == -1;
assert magicIndex(null) == -1;
assert magicIndex(new int[]{0}) == 0;
assert magicIndex(new int[]{1}) == -1;
```

---

## 6. Complexity, edges, interview tips

| Topic | Distinct | With duplicates |
| --- | --- | --- |
| Time | O(log n) | O(log n) best, O(n) worst |
| Extra space | O(log n) recursion or O(1) iterative | O(log n) to O(n) stack |
| Sorted required | yes | yes (non-decreasing) |
| Negatives | fine; only non-neg indices can match | same |

**Edges:**

* Empty / null → `-1`.
* Single element `{0}` → `0`; `{5}` → `-1`.
* Magic at ends: index 0 or `n - 1`.
* All negatives: no magic index (values never catch a non-negative index).
* Flat array of the same value `v`: only index `v` can work, and only if `0 <= v < n` and `A[v] == v`.

**Common bugs:**

1. Using the distinct one-side rule after the interviewer allowed duplicates.
2. Forgetting to check `A[mid] == mid` before branching.
3. Off-by-one on `lo`/`hi` (`mid - 1` / `mid + 1`).
4. Searching full `0..mid-1` and `mid+1..n-1` on dups without the `min`/`max` skip (still correct, just slower; mention the optimization).
5. Returning boolean only when the prompt asked for the index.
6. Integer overflow on `(lo + hi) / 2` in fixed-width languages; prefer `lo + (hi - lo) / 2`.

**How to talk it:**

1. Restate: "Find i with A[i] == i in a sorted array."
2. Brute O(n), then "sorted + distinct implies one-sided binary search."
3. Prove the side discard with the distinct + sorted argument in one sentence each.
4. Code the distinct version cleanly.
5. Follow-up: "With dups, search both sides but clip with min(mid-1, A[mid]) and max(mid+1, A[mid])."

---

## 7. Explain to a friend recap

Magic Index asks for a fixed point in a sorted array: index equals value.

1. Brute force is a straight loop. Use it only if n is tiny or the array is unsorted.
2. **Distinct + sorted:** compare mid to `A[mid]`. Too high means only left can work. Too low means only right. That is binary search on the gap.
3. **Duplicates:** check mid, then recurse left up to `min(mid - 1, A[mid])`, then right from `max(mid + 1, A[mid])`. Sorted order still kills impossible index bands.
4. Return any matching index, or `-1`. Negatives never match a valid index.
5. Distinct path is O(log n). Dup path can degrade to O(n); say that out loud.

If you can walk `{-1,0,1,3,5,7,9}` to index 3, and explain why dups need both sides with clipped bounds, you own problem 8.3. Next is building every subset of a set.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Robot in a Grid](/blog/en/ctci-8-2-robot-in-a-grid)
* Next: [Power Set](/blog/en/ctci-8-4-power-set)